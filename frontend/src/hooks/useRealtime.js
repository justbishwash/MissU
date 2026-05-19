import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useNotificationStore } from '../store/useNotificationStore';
import { useCoupleStore } from '../store/useCoupleStore';
import { useReceivedStore } from '../store/useReceivedStore';

/**
 * Subscribes the active user to:
 *   1. New incoming notifications -> enqueues full-screen overlay
 *   2. Partner profile updates    -> refreshes location/avatar/etc
 *
 * Sound + haptic playback now lives in ReceivedNotificationOverlay so the
 * mood-specific sound/haptic plays in sync with the visual.
 */
export function useRealtime(userId) {
  const channelRef = useRef(null);
  const { fetchNotifications } = useNotificationStore();
  const { fetchPartner, partner } = useCoupleStore();
  const { enqueue } = useReceivedStore();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          // Trigger the viral receive moment overlay
          enqueue(payload.new);
          // Keep the legacy notification list fresh
          fetchNotifications(userId);
        }
      )
      .subscribe();

    channelRef.current = channel;

    let presenceChannel;
    if (partner?.id) {
      presenceChannel = supabase
        .channel(`partner-profile:${partner.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${partner.id}`,
          },
          () => fetchPartner(partner.id)
        )
        .subscribe();
    }

    return () => {
      channel.unsubscribe();
      presenceChannel?.unsubscribe();
    };
  }, [userId, partner?.id, fetchNotifications, fetchPartner, enqueue]);
}
