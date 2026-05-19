-- Migration 009: Make pairing tolerant of pre-existing couple rows.
--
-- Reported: receiver gets
--   "duplicate key value violates unique constraint couples_user1_id_user2_id_key"
-- when redeeming an invite code.
--
-- Root cause: an earlier failed attempt (RLS error, FK violation, etc) left
-- behind a couples row for this pair — possibly with is_active=FALSE (from
-- a prior disconnect) or even is_active=TRUE that wasn't returned by the
-- RPC's "already paired" check (e.g. timing edge case, stale realtime state).
-- The unique constraint (user1_id, user2_id) then blocks the new INSERT.
--
-- Fix: replace the RPC's INSERT with INSERT ... ON CONFLICT, so an existing
-- row is REACTIVATED instead of failing. Also clear any anniversary fields
-- on reactivation so they re-prompt for first-met-date.
--
-- This migration is idempotent — safe to re-run.

CREATE OR REPLACE FUNCTION public.redeem_invite_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_invite RECORD;
  v_couple RECORD;
  v_existing RECORD;
  v_user1 UUID;
  v_user2 UUID;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'not_signed_in', 'error_message', 'Please sign in first.');
  END IF;

  -- Make sure the caller has a profile row
  INSERT INTO public.users (id) VALUES (v_uid) ON CONFLICT (id) DO NOTHING;

  -- Already paired (active)? Return existing couple.
  SELECT * INTO v_existing
  FROM public.couples
  WHERE is_active = TRUE
    AND (user1_id = v_uid OR user2_id = v_uid)
  LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('ok', true, 'couple_id', v_existing.id, 'already_paired', true);
  END IF;

  -- Lock the invite row
  SELECT * INTO v_invite
  FROM public.invite_codes
  WHERE code = p_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'invalid_code', 'error_message', 'That code doesn''t exist.');
  END IF;

  IF v_invite.is_used THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'code_used', 'error_message', 'That code has already been used.');
  END IF;

  IF v_invite.expires_at < NOW() THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'code_expired', 'error_message', 'That code has expired. Ask for a new one.');
  END IF;

  IF v_invite.creator_id = v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'self_pair', 'error_message', 'You can''t pair with yourself.');
  END IF;

  -- Make sure the creator's profile row exists too
  INSERT INTO public.users (id) VALUES (v_invite.creator_id) ON CONFLICT (id) DO NOTHING;

  -- Deterministic ordering for the unique constraint
  v_user1 := LEAST(v_invite.creator_id, v_uid);
  v_user2 := GREATEST(v_invite.creator_id, v_uid);

  -- KEY FIX: ON CONFLICT — if a couple row already exists for this pair (e.g.
  -- from a previous disconnect or partial failure), reactivate it instead of
  -- erroring. This is the "duplicate key" bug fix.
  INSERT INTO public.couples (user1_id, user2_id, is_active)
  VALUES (v_user1, v_user2, TRUE)
  ON CONFLICT (user1_id, user2_id)
  DO UPDATE SET
    is_active = TRUE,
    paired_at = NOW(),
    -- Wipe stale anniversary so we re-prompt the first-met date for the new
    -- pairing (users may have changed their mind since the previous pairing).
    anniversary_at = NULL,
    anniversary_date = NULL
  RETURNING * INTO v_couple;

  -- Streak row (idempotent)
  INSERT INTO public.streaks (couple_id) VALUES (v_couple.id)
  ON CONFLICT (couple_id) DO UPDATE SET
    current_streak = 0,
    last_interaction_date = CURRENT_DATE;

  -- Burn the invite
  UPDATE public.invite_codes
  SET is_used = TRUE, used_by = v_uid
  WHERE id = v_invite.id;

  RETURN jsonb_build_object('ok', true, 'couple_id', v_couple.id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'ok', false,
    'error_code', 'unexpected',
    'error_message', SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_invite_code(TEXT) TO authenticated;

-- ============================================
-- One-shot cleanup: remove the FirstMet localStorage skip flag from couples
-- that just got reactivated, so users see the prompt again. (Frontend uses
-- couple.id as the localStorage key — we can't clear localStorage from SQL
-- but we cleared anniversary_* above which is the data the prompt checks,
-- so this is already handled.)
-- ============================================
