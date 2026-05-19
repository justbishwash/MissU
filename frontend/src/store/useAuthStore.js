import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      session: null,
      loading: true,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setSession: (session) => set({ session }),
      setLoading: (loading) => set({ loading }),

      initialize: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            set({ session, user: session.user });
            await get().fetchProfile(session.user.id);
          }
        } catch (error) {
          console.error('Auth init error:', error);
        } finally {
          set({ loading: false });
        }
      },

      fetchProfile: async (userId) => {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        if (data) set({ profile: data });
        return data;
      },

      signInWithOtp: async (email) => {
        const { error } = await supabase.auth.signInWithOtp({ email });
        return { error };
      },

      signInWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        });
        return { error };
      },

      signInAnonymously: async () => {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (data?.session) {
          set({ session: data.session, user: data.session.user });
        }
        return { data, error };
      },

      createProfile: async ({ nickname, avatarUrl }) => {
        const user = get().user;
        if (!user) return { error: 'No user' };

        const { data, error } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            nickname,
            avatar_url: avatarUrl || null,
          })
          .select()
          .single();

        if (data) set({ profile: data });
        return { data, error };
      },

      updateLocation: async (latitude, longitude) => {
        const user = get().user;
        if (!user) return;

        await supabase
          .from('users')
          .update({ latitude, longitude, is_online: true })
          .eq('id', user.id);
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null, session: null });
      },
    }),
    {
      name: 'missu-auth',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);
