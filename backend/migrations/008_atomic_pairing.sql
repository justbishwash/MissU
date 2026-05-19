-- Migration 008: Atomic invite-code redemption + auth guards
--
-- Reported: receiver gets "Cannot connect with this code" error even when
-- the code is valid. Root causes in the existing client-side flow:
--   1. Marks the invite as used BEFORE inserting the couple. If the couple
--      insert fails for any reason (FK violation, RLS, race), the code is
--      burned forever.
--   2. If receiver's public.users row is missing (FK target), couples insert
--      throws a vague error.
--   3. Two clients clicking simultaneously can both pass the "is_used=false"
--      check before either marks it used → duplicate couples.
--
-- Fix: a SECURITY DEFINER SQL function that does it all atomically. The
-- entire operation is wrapped in a single transaction:
--   * locks the invite row (FOR UPDATE)
--   * verifies expiry, not-used, not self
--   * ensures public.users row exists for caller
--   * creates the couple
--   * creates the streak
--   * marks the invite used
--   * returns structured result { ok, couple_id, error_code, error_message }

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
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'not_signed_in', 'error_message', 'Please sign in first.');
  END IF;

  -- Make sure the caller has a profile row (the trigger from migration 004
  -- normally handles this, but be defensive).
  INSERT INTO public.users (id)
  VALUES (v_uid)
  ON CONFLICT (id) DO NOTHING;

  -- Already paired? Return existing couple instead of erroring.
  SELECT * INTO v_existing
  FROM public.couples
  WHERE is_active = TRUE
    AND (user1_id = v_uid OR user2_id = v_uid)
  LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('ok', true, 'couple_id', v_existing.id, 'already_paired', true);
  END IF;

  -- Lock the invite row to prevent races
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

  -- Make sure the CREATOR's public.users row exists too (safety net for
  -- accounts created before the auto-profile trigger was in place).
  INSERT INTO public.users (id)
  VALUES (v_invite.creator_id)
  ON CONFLICT (id) DO NOTHING;

  -- Create the couple. Lower id first as user1 to satisfy the unique constraint
  -- consistently regardless of which side initiates.
  INSERT INTO public.couples (user1_id, user2_id, is_active)
  VALUES (
    LEAST(v_invite.creator_id, v_uid),
    GREATEST(v_invite.creator_id, v_uid),
    TRUE
  )
  RETURNING * INTO v_couple;

  -- Streak row
  INSERT INTO public.streaks (couple_id) VALUES (v_couple.id)
  ON CONFLICT (couple_id) DO NOTHING;

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
