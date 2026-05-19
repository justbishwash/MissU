-- Migration 005: Fix RLS recursion that caused "permission denied for table couples"
--
-- Symptom: uploading an avatar triggered "permission denied for table couples".
-- The avatar upload itself only touches storage + public.users. But the
-- "Users can view partner profile" SELECT policy on public.users contains a
-- subquery against public.couples. When PostgREST returns the updated row,
-- it re-evaluates SELECT policies; the subquery against couples could hit
-- a permission/recursion edge case.
--
-- Fix: replace the recursive subqueries with SECURITY DEFINER helper
-- functions. Those functions run as the table owner, sidestep RLS, and
-- can be called safely from any policy.
--
-- Run in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run.

-- ============================================
-- HELPER 1: is the given user_id my partner?
-- ============================================
CREATE OR REPLACE FUNCTION public.is_partner_of(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.couples
    WHERE is_active = TRUE
      AND (
        (user1_id = auth.uid() AND user2_id = _user_id) OR
        (user2_id = auth.uid() AND user1_id = _user_id)
      )
  );
$$;

-- ============================================
-- HELPER 2: am I in this couple?
-- ============================================
CREATE OR REPLACE FUNCTION public.is_in_couple(_couple_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.couples
    WHERE id = _couple_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
  );
$$;

-- Allow these helpers to be called by any signed-in role
GRANT EXECUTE ON FUNCTION public.is_partner_of(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_in_couple(UUID)  TO anon, authenticated;

-- ============================================
-- USERS — replace the recursive SELECT policy
-- ============================================
DROP POLICY IF EXISTS "Users can view partner profile" ON public.users;

CREATE POLICY "Users can view partner profile" ON public.users
  FOR SELECT USING (public.is_partner_of(id));

-- ============================================
-- STREAKS — replace the recursive policies
-- ============================================
DROP POLICY IF EXISTS "Users can view own streaks" ON public.streaks;
DROP POLICY IF EXISTS "Users can update own streaks" ON public.streaks;
DROP POLICY IF EXISTS "Users can insert streaks" ON public.streaks;

CREATE POLICY "Users can view own streaks" ON public.streaks
  FOR SELECT USING (public.is_in_couple(couple_id));

CREATE POLICY "Users can update own streaks" ON public.streaks
  FOR UPDATE USING (public.is_in_couple(couple_id));

CREATE POLICY "Users can insert streaks" ON public.streaks
  FOR INSERT WITH CHECK (public.is_in_couple(couple_id));

-- ============================================
-- MEMORIES (from migration 002) — replace the recursive policies
-- ============================================
DROP POLICY IF EXISTS "Couple can view own memories" ON public.memories;
DROP POLICY IF EXISTS "Couple can insert memories" ON public.memories;
DROP POLICY IF EXISTS "Couple can delete own memories" ON public.memories;

CREATE POLICY "Couple can view own memories" ON public.memories
  FOR SELECT USING (public.is_in_couple(couple_id));

CREATE POLICY "Couple can insert memories" ON public.memories
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND public.is_in_couple(couple_id)
  );

CREATE POLICY "Couple can delete own memories" ON public.memories
  FOR DELETE USING (public.is_in_couple(couple_id));

-- ============================================
-- THEME UNLOCKS (from migration 002) — same fix
-- ============================================
DROP POLICY IF EXISTS "Couple can view unlocks" ON public.theme_unlocks;
DROP POLICY IF EXISTS "Couple can insert unlocks" ON public.theme_unlocks;

CREATE POLICY "Couple can view unlocks" ON public.theme_unlocks
  FOR SELECT USING (public.is_in_couple(couple_id));

CREATE POLICY "Couple can insert unlocks" ON public.theme_unlocks
  FOR INSERT WITH CHECK (public.is_in_couple(couple_id));

-- ============================================
-- MILESTONES (from migration 003) — same fix
-- ============================================
DROP POLICY IF EXISTS "Couple can view milestones" ON public.milestones;
DROP POLICY IF EXISTS "Couple can insert milestones" ON public.milestones;

CREATE POLICY "Couple can view milestones" ON public.milestones
  FOR SELECT USING (public.is_in_couple(couple_id));

CREATE POLICY "Couple can insert milestones" ON public.milestones
  FOR INSERT WITH CHECK (public.is_in_couple(couple_id));

-- ============================================
-- DEFENSIVE GRANTs in case any of these were dropped
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.couples         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.moods           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.streaks         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invite_codes    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memories        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.theme_unlocks   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.milestones      TO authenticated;
