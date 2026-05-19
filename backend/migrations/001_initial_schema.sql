-- MissU Database Schema
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  onesignal_player_id TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_online BOOLEAN DEFAULT FALSE,
  battery_level INTEGER,
  location_mode TEXT DEFAULT 'precise' CHECK (location_mode IN ('precise', 'approximate', 'hidden')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COUPLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  paired_at TIMESTAMPTZ DEFAULT NOW(),
  anniversary_date DATE,
  invite_code TEXT UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user1_id, user2_id)
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'miss' CHECK (type IN ('miss', 'thinking', 'hug', 'sleepy', 'angry', 'love_attack', 'attention')),
  message TEXT,
  opened BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MOODS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.moods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mood_type TEXT NOT NULL CHECK (mood_type IN ('miss', 'thinking', 'hug', 'sleepy', 'angry', 'love_attack')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STREAKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_interaction_date DATE DEFAULT CURRENT_DATE
);

-- ============================================
-- INVITE CODES TABLE (for pairing)
-- ============================================
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  used_by UUID REFERENCES public.users(id),
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- USERS policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view partner profile" ON public.users
  FOR SELECT USING (
    id IN (
      SELECT user2_id FROM public.couples WHERE user1_id = auth.uid() AND is_active = TRUE
      UNION
      SELECT user1_id FROM public.couples WHERE user2_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- COUPLES policies
CREATE POLICY "Users can view own couples" ON public.couples
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create couples" ON public.couples
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update own couples" ON public.couples
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- NOTIFICATIONS policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = receiver_id);

-- MOODS policies
CREATE POLICY "Users can view own moods" ON public.moods
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send moods" ON public.moods
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- STREAKS policies
CREATE POLICY "Users can view own streaks" ON public.streaks
  FOR SELECT USING (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own streaks" ON public.streaks
  FOR UPDATE USING (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert streaks" ON public.streaks
  FOR INSERT WITH CHECK (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- INVITE CODES policies
CREATE POLICY "Users can view own invite codes" ON public.invite_codes
  FOR SELECT USING (auth.uid() = creator_id OR is_used = FALSE);

CREATE POLICY "Users can create invite codes" ON public.invite_codes
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can use invite codes" ON public.invite_codes
  FOR UPDATE USING (is_used = FALSE AND expires_at > NOW());

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.moods;
ALTER PUBLICATION supabase_realtime ADD TABLE public.streaks;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to generate 6-digit invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM public.invite_codes WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to update streak
CREATE OR REPLACE FUNCTION update_streak(p_couple_id UUID)
RETURNS VOID AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  SELECT last_interaction_date, current_streak, longest_streak
  INTO v_last_date, v_current_streak, v_longest_streak
  FROM public.streaks WHERE couple_id = p_couple_id;

  IF v_last_date IS NULL THEN
    INSERT INTO public.streaks (couple_id, current_streak, longest_streak, last_interaction_date)
    VALUES (p_couple_id, 1, 1, CURRENT_DATE);
  ELSIF v_last_date = CURRENT_DATE THEN
    -- Already counted today
    RETURN;
  ELSIF v_last_date = CURRENT_DATE - 1 THEN
    -- Consecutive day
    v_current_streak := v_current_streak + 1;
    IF v_current_streak > v_longest_streak THEN
      v_longest_streak := v_current_streak;
    END IF;
    UPDATE public.streaks 
    SET current_streak = v_current_streak, longest_streak = v_longest_streak, last_interaction_date = CURRENT_DATE
    WHERE couple_id = p_couple_id;
  ELSE
    -- Streak broken
    UPDATE public.streaks 
    SET current_streak = 1, last_interaction_date = CURRENT_DATE
    WHERE couple_id = p_couple_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Auto-update last_seen on user activity
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_seen
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_last_seen();
