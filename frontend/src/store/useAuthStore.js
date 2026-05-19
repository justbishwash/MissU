import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

let authStateSubscribed = false; // guard so we never double-subscribe

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

          // Subscribe exactly once, even if initialize() is called multiple times
          // (StrictMode in dev can double-invoke effects).
          if (!authStateSubscribed) {
            authStateSubscribed = true;
            supabase.auth.onAuthStateChange(async (_event, newSession) => {
              if (newSession?.user) {
                set({ session: newSession, user: newSession.user });
                await get().ensureProfile(newSession.user);
              } else {
                set({ session: null, user: null, profile: null });
              }
            });
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
          .maybeSingle();
        if (data) set({ profile: data });
        return data;
      },

      /**
       * Ensures a row exists in public.users for this auth user.
       * Critical because pairing's invite_codes table has a FK to users.id.
       */
      ensureProfile: async (authUser) => {
        if (!authUser?.id) return null;

        // 1. Try to read the profile (the DB trigger from migration 004
        //    should have already created it on signup).
        const { data: existing, error: readError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (readError) {
          console.error('[ensureProfile] read failed:', readError);
        }
        if (existing) {
          set({ profile: existing });
          return existing;
        }

        // 2. No row yet — fall back to a client-side upsert. This works as
        //    long as the RLS INSERT policy is in place. If migration 004 IS
        //    deployed, this path should rarely fire.
        const fallbackNickname =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split('@')[0] ||
          'You';

        const { data: created, error: writeError } = await supabase
          .from('users')
          .upsert(
            {
              id: authUser.id,
              nickname: fallbackNickname.slice(0, 20),
              avatar_url: authUser.user_metadata?.avatar_url || null,
            },
            { onConflict: 'id' }
          )
          .select()
          .maybeSingle();

        if (writeError) {
          // Most common cause: migration 004 not run AND RLS insert policy
          // not in place. Log loudly so it's visible in the browser console.
          console.error(
            '[ensureProfile] upsert failed — run backend/migrations/004_auto_profile_trigger.sql in Supabase. Error:',
            writeError
          );
          return null;
        }
        if (created) {
          set({ profile: created });
          return created;
        }
        return null;
      },

      signInWithOtp: async (email) => {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        return { error };
      },

      // Kept for future use, not exposed in the UI
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
          .maybeSingle();

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
