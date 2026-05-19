import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const MILESTONE_META = {
  streak_7:    { emoji: '🔥', title: '7 Day Streak!', body: 'A whole week of love. Keep it burning!', confetti: 'big' },
  streak_14:   { emoji: '⭐', title: '14 Day Streak!', body: 'Two weeks of being thought of every day.', confetti: 'big' },
  streak_30:   { emoji: '💎', title: '30 Day Streak!', body: 'A month of unbroken affection.', confetti: 'mega' },
  streak_100:  { emoji: '👑', title: '100 Day Streak!', body: 'Royalty-level love streak. Wow.', confetti: 'mega' },
  days_30:     { emoji: '💕', title: '1 Month Together', body: 'Look how far you\'ve come.', confetti: 'normal' },
  days_100:    { emoji: '🌸', title: '100 Days Together!', body: 'Hundred days of being each other\'s person.', confetti: 'big' },
  days_365:    { emoji: '🎂', title: '1 Year Anniversary!', body: 'A whole year. You\'re home.', confetti: 'mega' },
  anniversary: { emoji: '🎉', title: 'Anniversary Today!', body: 'Today is your anniversary 💍', confetti: 'mega' },
  first_paired:{ emoji: '💑', title: 'You\'re Connected!', body: 'Welcome to MissU. Press the button to send your first miss.', confetti: 'big' },
};

export const useMilestonesStore = create((set, get) => ({
  pending: [],   // milestone types waiting to be celebrated
  current: null, // currently displayed milestone

  checkPending: async (coupleId) => {
    if (!coupleId) return [];
    const { data, error } = await supabase.rpc('pending_milestones', { p_couple_id: coupleId });
    if (error) return [];
    const pending = (data || []).map((r) => r.milestone_type);
    set({ pending });
    return pending;
  },

  /** Mark milestone as displayed (server-side) and pop from queue */
  acknowledge: async (coupleId, type) => {
    if (!coupleId || !type) return;
    await supabase.from('milestones').insert({ couple_id: coupleId, type });
    set((s) => ({
      pending: s.pending.filter((t) => t !== type),
      current: null,
    }));
  },

  showNext: () => {
    const next = get().pending[0];
    if (next) set({ current: next });
  },

  dismiss: () => set({ current: null }),
}));
