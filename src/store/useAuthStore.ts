import { create } from 'zustand';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { syncPushTokenForUser } from '../lib/notifications';
import type { Database } from '../types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// Supabase's own error strings are written for developers (e.g. its rate-limit
// message reads "For security purposes, you can only request this after 46
// seconds."), not for a checkout/login screen. Known cases get friendlier
// copy; anything unrecognized still falls through to the raw message rather
// than risk hiding a real, useful error behind a generic one.
function friendlyAuthError(message: string): string {
  if (/security purposes|only request this after/i.test(message)) {
    return "You're trying too often — please wait a moment and try again.";
  }
  return message;
}

interface AuthState {
  session: Session | null;
  profile: ProfileRow | null;
  isLoading: boolean;
  initialize: () => () => void;
  fetchProfile: (userId: string) => Promise<void>;
  sendCode: (email: string) => Promise<{ error: string | null }>;
  verifyCode: (
    email: string,
    code: string,
  ) => Promise<{ error: string | null; needsProfile: boolean }>;
  completeProfile: (
    fullName: string,
    dateOfBirth?: string | null,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: string | null }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: true,

  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, isLoading: false });
      if (session) get().fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
      if (session) {
        get().fetchProfile(session.user.id);
      } else {
        set({ profile: null });
      }
    });

    // Pick up role / partner-approval changes made elsewhere (e.g. admin approves
    // an application) whenever the app returns to the foreground.
    const appStateSub = AppState.addEventListener('change', (state) => {
      const userId = get().session?.user.id;
      if (state === 'active' && userId) get().fetchProfile(userId);
    });

    return () => {
      subscription.unsubscribe();
      appStateSub.remove();
    };
  },

  fetchProfile: async (userId) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      set({ profile: data });
    } else if (error) {
      // The profile row may not exist yet if this races the on_auth_user_created
      // DB trigger right after signup — retry once after a short delay instead
      // of leaving `profile` stuck at null with no indication anything failed.
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const retry = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (retry.data) set({ profile: retry.data });
    }
    syncPushTokenForUser(userId).catch(() => {});
  },

  // Passwordless email code; creates the account on first use.
  sendCode: async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    return { error: error ? friendlyAuthError(error.message) : null };
  },

  verifyCode: async (email, code) => {
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    if (error || !data.user) {
      return { error: error ? friendlyAuthError(error.message) : 'Could not verify the code.', needsProfile: false };
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', data.user.id)
      .single();
    return { error: null, needsProfile: !profile?.full_name?.trim() };
  },

  completeProfile: async (fullName, dateOfBirth) => {
    const userId = get().session?.user.id;
    if (!userId) return { error: 'You are signed out. Please log in again.' };
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, ...(dateOfBirth ? { date_of_birth: dateOfBirth } : {}) })
      .eq('id', userId);
    if (error) return { error: error.message };
    await get().fetchProfile(userId);
    return { error: null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },

  deleteAccount: async () => {
    const { data, error } = await supabase.functions.invoke('delete-account');
    if (error) return { error: friendlyAuthError(error.message) };
    if (data?.error) return { error: data.error as string };
    await supabase.auth.signOut();
    set({ session: null, profile: null });
    return { error: null };
  },
}));
