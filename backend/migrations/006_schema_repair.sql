-- Migration 006: Idempotent schema repair
--
-- Reported: users table only had `id`, `nickname`, `created_at` columns —
-- meaning migrations 001 / 003 didn't fully apply (probably an early DROP
-- POLICY error stopped the transaction, leaving columns missing).
--
-- This migration uses ADD COLUMN IF NOT EXISTS / etc, so it's safe to run
-- on any state and will bring the schema up to current.
--
-- Run in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run.

-- ============================================
-- USERS — ensure every expected column exists
-- ============================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url           TEXT,
  ADD COLUMN IF NOT EXISTS onesignal_player_id  TEXT,
  ADD COLUMN IF NOT EXISTS latitude             DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude            DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS last_seen            TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS is_online            BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS battery_level        INTEGER,
  ADD COLUMN IF NOT EXISTS location_mode        TEXT DEFAULT 'precise',
  ADD COLUMN IF NOT EXISTS muted_until          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS muted_moods          TEXT[] DEFAULT '{}';

-- Make sure nickname has a default so the trigger never fails on NULL
ALTER TABLE public.users
  ALTER COLUMN nickname SET DEFAULT '';

-- Add CHECK constraint for location_mode if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_location_mode_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_location_mode_check
      CHECK (location_mode IN ('precise', 'approximate', 'hidden'));
  END IF;
END $$;

-- ============================================
-- COUPLES — ensure invite_code + is_active columns
-- ============================================
ALTER TABLE public.couples
  ADD COLUMN IF NOT EXISTS invite_code  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS is_active    BOOLEAN DEFAULT TRUE;

-- ============================================
-- INVITE_CODES — ensure all columns
-- ============================================
ALTER TABLE public.invite_codes
  ADD COLUMN IF NOT EXISTS used_by      UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS is_used      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS expires_at   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours');

-- ============================================
-- Re-run idempotent grants (in case migration 005 was skipped)
-- ============================================
GRANT USAGE ON SCHEMA public TO authenticated, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.users           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.couples         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.moods           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.streaks         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invite_codes    TO authenticated;

-- These tables only exist if migrations 002/003 ran. Wrap in DO block so
-- this migration succeeds even if those tables aren't there yet.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'memories') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.memories TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'theme_unlocks') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.theme_unlocks TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'milestones') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.milestones TO authenticated';
  END IF;
END $$;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- Re-run the auto-profile trigger so existing auth.users are backfilled
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nickname TEXT;
  v_avatar TEXT;
BEGIN
  v_nickname := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'nickname',
    SPLIT_PART(NEW.email, '@', 1),
    'You'
  );
  v_avatar := NEW.raw_user_meta_data->>'avatar_url';

  INSERT INTO public.users (id, nickname, avatar_url)
  VALUES (NEW.id, LEFT(v_nickname, 20), v_avatar)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill any existing auth users that don't have a profile row
INSERT INTO public.users (id, nickname, avatar_url)
SELECT
  au.id,
  LEFT(
    COALESCE(
      au.raw_user_meta_data->>'full_name',
      au.raw_user_meta_data->>'name',
      au.raw_user_meta_data->>'nickname',
      SPLIT_PART(au.email, '@', 1),
      'You'
    ),
    20
  ),
  au.raw_user_meta_data->>'avatar_url'
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;

-- For existing rows that have a blank nickname, backfill from email
UPDATE public.users u
SET nickname = LEFT(
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    SPLIT_PART(au.email, '@', 1),
    'You'
  ),
  20
)
FROM auth.users au
WHERE u.id = au.id
  AND (u.nickname IS NULL OR u.nickname = '' OR u.nickname = 'You');
