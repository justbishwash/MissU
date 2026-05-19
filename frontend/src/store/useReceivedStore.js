import { create } from 'zustand';
import { supabase } from '../lib/supabase';

/**
 * Manages the in-app "viral receive moment" overlay queue.
 * When a new notification arrives via realtime, we push it here and
 * the overlay renders a full-screen mood-aware celebration.
 */
export const useReceivedStore = create((set, get) => ({
  queue: [],     // notifications waiting to be shown
  current: null, // currently displayed
  inboxOpen: false,
  inbox: [],     // last 50 received notifications

  enqueue: (notification) => {
    set((s) => {
      // If nothing showing, show immediately
      if (!s.current) return { current: notification, queue: s.queue };
      // Otherwise queue it
      return { queue: [...s.queue, notification] };
    });
  },

  dismiss: () => {
    set((s) => {
      const [next, ...rest] = s.queue;
      return { current: next || null, queue: rest };
    });
  },

  fetchInbox: async (userId) => {
    if (!userId) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('receiver_id', userId)
      .order('sent_at', { ascending: false })
      .limit(50);
    if (data) set({ inbox: data });
  },

  markRead: async (id) => {
    await supabase.from('notifications').update({ opened: true }).eq('id', id);
    set((s) => ({
      inbox: s.inbox.map((n) => (n.id === id ? { ...n, opened: true } : n)),
    }));
  },

  setInboxOpen: (open) => set({ inboxOpen: open }),
}));
