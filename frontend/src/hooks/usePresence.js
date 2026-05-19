import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Real-time partner presence using Supabase Presence channel.
 * Tracks both partners on a shared "couple:{coupleId}" channel and exposes:
 *  - partnerOnline (boolean)
 *  - partnerTyping (boolean) — derived from broadcast events
 *  - sendTyping(isTyping) — broadcasts typing state
 */
export function usePresence({ coupleId, userId, partnerId }) {
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!coupleId || !userId) return;

    const channel = supabase.channel(`couple:${coupleId}`, {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Partner is online if their userId appears in the presence map
        const online = !!(partnerId && state[partnerId]);
        setPartnerOnline(online);
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.from === partnerId) {
          setPartnerTyping(payload.payload?.typing === true);
          // Auto-clear after 4s in case the "stop" event is missed
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 4000);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
            user_id: userId,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      clearTimeout(typingTimeoutRef.current);
      channel.unsubscribe();
    };
  }, [coupleId, userId, partnerId]);

  const sendTyping = (isTyping) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { from: userId, typing: isTyping },
    });
  };

  return { partnerOnline, partnerTyping, sendTyping };
}
