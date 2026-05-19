-- Phase 2: Memories table + storage bucket
-- Run this in Supabase SQL Editor

-- ============================================
-- MEMORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'voice', 'note', 'anniversary')),
  title TEXT,
  body TEXT,
  media_url TEXT,
  memory_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_couple ON public.memories(couple_id, memory_date DESC);

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- RLS: only couple members can view/insert/delete their memories
CREATE POLICY "Couple can view own memories" ON public.memories
  FOR SELECT USING (
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE (user1_id = auth.uid() OR user2_id = auth.uid()) AND is_active = TRUE
    )
  );

CREATE POLICY "Couple can insert memories" ON public.memories
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE (user1_id = auth.uid() OR user2_id = auth.uid()) AND is_active = TRUE
    )
  );

CREATE POLICY "Couple can delete own memories" ON public.memories
  FOR DELETE USING (
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE (user1_id = auth.uid() OR user2_id = auth.uid()) AND is_active = TRUE
    )
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.memories;

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Create the bucket via Supabase Dashboard OR run:
INSERT INTO storage.buckets (id, name, public)
VALUES ('memories', 'memories', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: only couple members can upload, anyone with URL can view (public bucket)
CREATE POLICY "Authenticated users can upload memories" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'memories');

CREATE POLICY "Anyone can view memories" ON storage.objects
  FOR SELECT USING (bucket_id = 'memories');

CREATE POLICY "Owner can delete memories" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- THEME UNLOCKS (per-couple)
-- ============================================
CREATE TABLE IF NOT EXISTS public.theme_unlocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  theme_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(couple_id, theme_id)
);

ALTER TABLE public.theme_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple can view unlocks" ON public.theme_unlocks
  FOR SELECT USING (
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

CREATE POLICY "Couple can insert unlocks" ON public.theme_unlocks
  FOR INSERT WITH CHECK (
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
