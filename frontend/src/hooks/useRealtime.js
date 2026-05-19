import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useNotificationStore } from '../store/useNotificationStore';
import { useCoupleStore } from '../store/useCoupleStore';
import { playSound, triggerHaptic } from '../lib/sounds';
import { useSettingsStore } from '../store/useSettingsStore';

export function useRealtime(userId) {
  const channelRef = useRef(null);
  const { fetchNotifications } = useNotificationStore();
  const { fetchPartner, partner } = useCoupleStore();
  const { sound, vibration } = useSettingsStore();

  useEffect(() => {
    if (!userId) return;

    // Subscribe to new notifications for this user
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          // New notification received!
          if (sound) playSound('receive');
          if (vibration) triggerHaptic('miss');
          fetchNotifications(userId);
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Subscribe to partner presence changes
    if (partner?.id) {
      const presenceChannel = supabase
        .channel('partner-presence')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${partner.id}`,
          },
          () => {
            fetchPartner(partner.id);
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
        presenceChannel.unsubscribe();
      };
    }

    return () => {
      channel.unsubscribe();
    };
  }, [userId, partner?.id, sound, vibration, fetchNotifications, fetchPartner]);
}
