-- Phase 3: Avatars bucket, milestone tracking, anniversary helpers, mute prefs
-- Run in Supabase SQL Editor

-- ============================================
-- AVATARS STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view avatars (public bucket); only auth users can upload to their own folder
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Owner can update avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner can delete avatars" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- MILESTONES — track which celebrations have been shown
-- ============================================
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('streak_7', 'streak_14', 'streak_30', 'streak_100',
                                      'days_30', 'days_100', 'days_365',
                                      'anniversary', 'first_paired')),
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(couple_id, type)
);

CREATE INDEX IF NOT EXISTS idx_milestones_couple ON public.milestones(couple_id);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple can view milestones" ON public.milestones
  FOR SELECT USING (
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

CREATE POLICY "Couple can insert milestones" ON public.milestones
  FOR INSERT WITH CHECK (
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.milestones;

-- ============================================
-- PER-USER MUTE PREFERENCES (per mood)
-- ============================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS muted_until TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS muted_moods TEXT[] DEFAULT '{}';

-- ============================================
-- ANNIVERSARY DATE alias / convenience
-- ============================================
-- already on couples.anniversary_date

-- ============================================
-- TYPING INDICATOR — uses Realtime broadcast, no persistent table needed
-- ============================================
-- Frontend handles via channel.send({ type: 'broadcast', event: 'typing', ... })

-- ============================================
-- HELPER: detect new milestones for a couple
-- ============================================
CREATE OR REPLACE FUNCTION pending_milestones(p_couple_id UUID)
RETURNS TABLE(milestone_type TEXT) AS $$
DECLARE
  v_streak INTEGER;
  v_days INTEGER;
BEGIN
  -- Get current streak + days together
  SELECT s.current_streak,
         GREATEST(0, EXTRACT(DAY FROM NOW() - c.paired_at))::INTEGER
  INTO v_streak, v_days
  FROM public.couples c
  LEFT JOIN public.streaks s ON s.couple_id = c.id
  WHERE c.id = p_couple_id;

  IF v_streak >= 7  AND NOT EXISTS (SELECT 1 FROM public.milestones WHERE couple_id = p_couple_id AND type = 'streak_7')   THEN milestone_type := 'streak_7'; RETURN NEXT; END IF;
  IF v_streak >= 14 AND NOT EXISTS (SELECT 1 FROM public.milestones WHERE couple_id = p_couple_id AND type = 'streak_14')  THEN milestone_type := 'streak_14'; RETURN NEXT; END IF;
  IF v_streak >= 30 AND NOT EXISTS (SELECT 1 FROM public.milestones WHERE couple_id = p_couple_id AND type = 'streak_30')  THEN milestone_type := 'streak_30'; RETURN NEXT; END IF;
  IF v_streak >= 100 AND NOT EXISTS (SELECT 1 FROM public.milestones WHERE couple_id = p_couple_id AND type = 'streak_100') THEN milestone_type := 'streak_100'; RETURN NEXT; END IF;
  IF v_days >= 30 AND NOT EXISTS (SELECT 1 FROM public.milestones WHERE couple_id = p_couple_id AND type = 'days_30') THEN milestone_type := 'days_30'; RETURN NEXT; END IF;
  IF v_days >= 100 AND NOT EXISTS (SELECT 1 FROM public.milestones WHERE couple_id = p_couple_id AND type = 'days_100') THEN milestone_type := 'days_100'; RETURN NEXT; END IF;
  IF v_days >= 365 AND NOT EXISTS (SELECT 1 FROM public.milestones WHERE couple_id = p_couple_id AND type = 'days_365') THEN milestone_type := 'days_365'; RETURN NEXT; END IF;
  RETURN;
END;
$$ LANGUAGE plpgsql;
