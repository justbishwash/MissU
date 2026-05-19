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
            await get().ensureProfile(session.user);
          }

          // Stay subscribed so OTP/OAuth callbacks update auth state immediately
          supabase.auth.onAuthStateChange(async (_event, newSession) => {
            if (newSession?.user) {
              set({ session: newSession, user: newSession.user });
              await get().ensureProfile(newSession.user);
            } else {
              set({ session: null, user: null, profile: null });
            }
          });
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

      /**
       * Ensures a row exists in public.users for this auth user.
       * Critical because pairing's invite_codes table has a FK to users.id.
       * Without this, OTP / Google sign-ins never get a profile row created
       * (the legacy createProfile() was only called from the Guest flow).
       */
      ensureProfile: async (authUser) => {
        if (!authUser?.id) return null;

        // Try to fetch existing profile first
        const { data: existing } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (existing) {
          set({ profile: existing });
          return existing;
        }

        // No profile yet — auto-create one with a sensible default nickname.
        // User can rename in Settings.
        const fallbackNickname =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split('@')[0] ||
          'You';

        const { data: created, error } = await supabase
          .from('users')
          .upsert({
            id: authUser.id,
            nickname: fallbackNickname.slice(0, 20),
            avatar_url: authUser.user_metadata?.avatar_url || null,
          })
          .select()
          .single();

        if (error) {
          console.error('Failed to ensure profile:', error);
          return null;
        }
        set({ profile: created });
        return created;
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
