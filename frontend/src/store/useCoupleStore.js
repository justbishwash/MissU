import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useCoupleStore = create((set, get) => ({
  partner: null,
  couple: null,
  streak: null,
  inviteCode: null,
  isPaired: false,
  loading: false,

  setPartner: (partner) => set({ partner }),
  setCouple: (couple) => set({ couple, isPaired: !!couple }),

  fetchCouple: async (userId) => {
    set({ loading: true });
    const { data } = await supabase
      .from('couples')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('is_active', true)
      .single();

    if (data) {
      set({ couple: data, isPaired: true });
      const partnerId = data.user1_id === userId ? data.user2_id : data.user1_id;
      await get().fetchPartner(partnerId);
      await get().fetchStreak(data.id);
    }
    set({ loading: false });
    return data;
  },

  fetchPartner: async (partnerId) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', partnerId)
      .single();
    if (data) set({ partner: data });
    return data;
  },

  fetchStreak: async (coupleId) => {
    const { data } = await supabase
      .from('streaks')
      .select('*')
      .eq('couple_id', coupleId)
      .single();
    if (data) set({ streak: data });
    return data;
  },

  generateInviteCode: async (userId) => {
    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    
    const { data, error } = await supabase
      .from('invite_codes')
      .insert({
        code,
        creator_id: userId,
      })
      .select()
      .single();

    if (data) set({ inviteCode: data.code });
    return { code: data?.code, error };
  },

  useInviteCode: async (code, userId) => {
    // Find the invite code
    const { data: invite } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', code)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!invite) return { error: 'Invalid or expired code' };
    if (invite.creator_id === userId) return { error: 'Cannot pair with yourself' };

    // Mark code as used
    await supabase
      .from('invite_codes')
      .update({ is_used: true, used_by: userId })
      .eq('id', invite.id);

    // Create couple
    const { data: couple, error } = await supabase
      .from('couples')
      .insert({
        user1_id: invite.creator_id,
        user2_id: userId,
      })
      .select()
      .single();

    if (couple) {
      set({ couple, isPaired: true });
      // Create streak record
      await supabase.from('streaks').insert({ couple_id: couple.id });
      await get().fetchPartner(invite.creator_id);
    }

    return { couple, error };
  },

  disconnect: async () => {
    const couple = get().couple;
    if (!couple) return;

    await supabase
      .from('couples')
      .update({ is_active: false })
      .eq('id', couple.id);

    set({ partner: null, couple: null, streak: null, isPaired: false });
  },
}));
