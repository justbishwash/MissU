import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  lastSentAt: null,
  cooldownActive: false,

  COOLDOWN_MS: 5000, // 5 second anti-spam cooldown

  sendMissYou: async (senderId, receiverId, type = 'miss') => {
    const { lastSentAt, COOLDOWN_MS } = get();
    
    // Anti-spam cooldown
    if (lastSentAt && Date.now() - lastSentAt < COOLDOWN_MS) {
      set({ cooldownActive: true });
      return { error: 'Please wait before sending again' };
    }

    const messages = {
      miss: '❤️ Someone misses you badly right now...',
      thinking: '💭 Someone is thinking about you again.',
      hug: '🫂 Your human needs affection.',
      sleepy: '😴 Your person is sleepy and wishes you were here.',
      angry: '😤 Someone is a little upset... go check on them.',
      love_attack: '💘 LOVE ATTACK! You are being bombarded with love!',
      attention: '🚨 Your partner needs your attention RIGHT NOW!',
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        type,
        message: messages[type] || messages.miss,
      })
      .select()
      .single();

    if (!error) {
      set({ lastSentAt: Date.now(), cooldownActive: false });
      
      // Also insert mood record
      await supabase.from('moods').insert({
        sender_id: senderId,
        receiver_id: receiverId,
        mood_type: type === 'attention' ? 'miss' : type,
      });
    }

    return { data, error };
  },

  fetchNotifications: async (userId) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('receiver_id', userId)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (data) {
      const unreadCount = data.filter((n) => !n.opened).length;
      set({ notifications: data, unreadCount });
    }
  },

  markAsRead: async (notificationId) => {
    await supabase
      .from('notifications')
      .update({ opened: true })
      .eq('id', notificationId);

    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, opened: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  getStats: async (userId) => {
    const { data: sent } = await supabase
      .from('notifications')
      .select('type', { count: 'exact' })
      .eq('sender_id', userId);

    const { data: received } = await supabase
      .from('notifications')
      .select('type', { count: 'exact' })
      .eq('receiver_id', userId);

    return { totalSent: sent?.length || 0, totalReceived: received?.length || 0 };
  },
}));
