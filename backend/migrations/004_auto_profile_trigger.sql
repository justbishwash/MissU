-- Migration 004: Auto-create public.users row whenever a new auth.users row appears.
--
-- Why: the client-side ensureProfile() upsert can race with auth state, get
-- blocked by RLS edge cases, or fail silently if the session token isn't yet
-- attached when the upsert is sent. The recommended Supabase pattern is to
-- mirror auth.users -> public.users via a trigger that runs as the table owner,
-- bypassing RLS entirely. This guarantees every signed-up user has a profile row.
--
-- Run in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run.

-- ============================================
-- Function: handle_new_user
-- ============================================
-- Runs as SECURITY DEFINER so it can insert into public.users even when the
-- caller is the auth admin (which doesn't have an auth.uid()). It reads
-- nickname / avatar_url from the new auth user's metadata, with sensible
-- fallbacks to the email prefix.

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

  -- Use INSERT ... ON CONFLICT so re-running the trigger (or the rare race
  -- where the client also calls ensureProfile) is idempotent.
  INSERT INTO public.users (id, nickname, avatar_url)
  VALUES (NEW.id, LEFT(v_nickname, 20), v_avatar)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ============================================
-- Trigger: on_auth_user_created
-- ============================================
-- Fires AFTER INSERT on auth.users. Drop-and-recreate so this migration is
-- safely re-runnable.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Backfill: create profile rows for any existing auth users that don't have one
-- ============================================
-- Useful for accounts created before this migration was applied (i.e. users
-- whose ensureProfile() upsert failed silently).
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
