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
      .maybeSingle();

    if (data) {
      set({ couple: data, isPaired: true });
      const partnerId = data.user1_id === userId ? data.user2_id : data.user1_id;
      await get().fetchPartner(partnerId);
      await get().fetchStreak(data.id);
    } else {
      set({ couple: null, partner: null, streak: null, isPaired: false });
    }
    set({ loading: false });
    return data;
  },

  fetchPartner: async (partnerId) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', partnerId)
      .maybeSingle();
    if (data) set({ partner: data });
    return data;
  },

  fetchStreak: async (coupleId) => {
    const { data } = await supabase
      .from('streaks')
      .select('*')
      .eq('couple_id', coupleId)
      .maybeSingle();
    if (data) set({ streak: data });
    return data;
  },

  generateInviteCode: async (userId) => {
    if (!userId) return { error: 'Not signed in' };

    // Belt-and-braces: ensure user row exists before invite_codes insert
    // (FK target). The auto-profile trigger from migration 004 normally
    // handles this.
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    if (!profile) {
      await supabase.from('users').upsert({ id: userId });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const { data, error } = await supabase
      .from('invite_codes')
      .insert({ code, creator_id: userId })
      .select()
      .single();

    if (error) {
      console.error('generateInviteCode failed:', error);
      return { error: error.message };
    }

    if (data) set({ inviteCode: data.code });
    return { code: data?.code };
  },

  /**
   * Redeems an invite code via the atomic redeem_invite_code() SQL function
   * (migration 008). Falls back to the old client-side flow if the RPC isn't
   * deployed yet.
   */
  useInviteCode: async (code, userId) => {
    if (!code) return { error: 'Please enter a code' };

    // Try the atomic RPC first
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'redeem_invite_code',
      { p_code: code }
    );

    if (!rpcError && rpcResult) {
      if (!rpcResult.ok) {
        return { error: rpcResult.error_message || 'Could not connect with this code.' };
      }
      // Success — fetch the new couple and partner
      await get().fetchCouple(userId);
      return { ok: true, coupleId: rpcResult.couple_id };
    }

    // RPC missing → fallback to client-side flow (Phase-3 logic, kept for safety)
    if (rpcError) {
      console.warn('redeem_invite_code RPC unavailable, falling back:', rpcError.message);
    }

    const { data: invite } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', code)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (!invite) return { error: 'That code is invalid or expired.' };
    if (invite.creator_id === userId) return { error: 'You can\'t pair with yourself.' };

    // Make sure both user rows exist before inserting couple (FK)
    await supabase.from('users').upsert({ id: userId });

    const u1 = invite.creator_id < userId ? invite.creator_id : userId;
    const u2 = invite.creator_id < userId ? userId : invite.creator_id;

    // Use upsert so a pre-existing (possibly inactive) couple row gets
    // reactivated instead of triggering a unique-constraint violation.
    // This mirrors the migration-009 RPC behavior for clients on the
    // client-side fallback path.
    const { data: couple, error: coupleErr } = await supabase
      .from('couples')
      .upsert(
        {
          user1_id: u1,
          user2_id: u2,
          is_active: true,
          paired_at: new Date().toISOString(),
        },
        { onConflict: 'user1_id,user2_id' }
      )
      .select()
      .single();

    if (coupleErr) {
      console.error('couple upsert failed:', coupleErr);
      return { error: coupleErr.message || 'Could not create couple.' };
    }

    // ONLY mark code used after successful couple insert/upsert
    await supabase
      .from('invite_codes')
      .update({ is_used: true, used_by: userId })
      .eq('id', invite.id);

    // Streak row — upsert so it works for reactivated couples
    await supabase
      .from('streaks')
      .upsert({ couple_id: couple.id }, { onConflict: 'couple_id' });

    await get().fetchCouple(userId);
    return { ok: true, coupleId: couple.id };
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
