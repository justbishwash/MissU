// Server-side notification dispatch via Supabase Edge Function
// Falls back to direct DB insert (Phase 1 behavior) if function is not deployed

import { supabase } from '../lib/supabase';

export async function dispatchNotification({ receiverId, type = 'miss', urgent = false }) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { error: 'Not authenticated' };

    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: { receiver_id: receiverId, type, urgent },
    });

    if (error) {
      // Edge function not deployed yet — fall back to direct DB insert (Phase 1 path)
      return await fallbackInsert({ receiverId, type });
    }
    return { data };
  } catch (err) {
    console.warn('Edge function unavailable, using fallback:', err);
    return await fallbackInsert({ receiverId, type });
  }
}

async function fallbackInsert({ receiverId, type }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No user' };

  const messages = {
    miss: '❤️ Someone misses you badly right now...',
    thinking: '💭 Someone is thinking about you again.',
    hug: '🫂 Your human needs affection.',
    sleepy: '😴 Your person is sleepy and wishes you were here.',
    angry: '😤 Someone is a little upset...',
    love_attack: '💘 LOVE ATTACK!',
    attention: '🚨 Your partner needs your attention RIGHT NOW!',
  };

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      type,
      message: messages[type] || messages.miss,
    })
    .select()
    .single();

  return { data, error };
}
