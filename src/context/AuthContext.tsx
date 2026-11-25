// CountryRush Centralized Authentication & Player Profile Context (Phase 2)
// Manages explicit authentication and profile lifecycle states without auth loops or premature UI render:
//   - auth_loading
//   - logged_out
//   - profile_loading
//   - profile_setup_required
//   - profile_unavailable
//   - authenticated
//   - offline_preview (strictly explicit preview fallback when Supabase isn't configured or preview chosen)

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { PlayerProfile, PermittedProfileUpdate } from '../../shared/types/player';
import type { CompleteProfileSetupRequest } from '../../shared/protocol/api';
import { isSupabaseConfigured } from '../config/env';
import { mockCurrentUser } from '../data/mockData';
import {
  authService,
  type AuthSession,
  type SignUpParams,
  type SignUpResult,
} from '../services/authService';
import { profileService } from '../services/profileService';

export type AppAuthStatus =
  | 'auth_loading'
  | 'logged_out'
  | 'profile_loading'
  | 'profile_setup_required'
  | 'profile_unavailable'
  | 'authenticated'
  | 'offline_preview';

interface AuthContextValue {
  status: AppAuthStatus;
  supabaseConfigured: boolean;
  session: AuthSession | null;
  profile: PlayerProfile | null;
  activePlayer: PlayerProfile; // Authenticated Supabase profile OR explicit offline preview profile
  isRealAuthenticatedUser: boolean;
  errorMessage: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  completeProfileSetup: (payload: CompleteProfileSetupRequest) => Promise<void>;
  updateProfile: (patch: PermittedProfileUpdate) => Promise<void>;
  retryProfileLoad: () => Promise<void>;
  enterOfflinePreview: () => void;
  exitOfflinePreview: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabaseConfigured = isSupabaseConfigured();
  const [status, setStatus] = useState<AppAuthStatus>(() =>
    supabaseConfigured ? 'auth_loading' : 'logged_out'
  );
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadedUserIdRef = useRef<string | null>(null);
  const fetchSequenceRef = useRef(0);

  const loadProfileForUser = useCallback(async (authUserId: string) => {
    const seq = ++fetchSequenceRef.current;
    setStatus('profile_loading');
    setErrorMessage(null);

    try {
      const loaded = await profileService.getMyProfile(authUserId);
      if (seq !== fetchSequenceRef.current) return;

      if (!loaded) {
        loadedUserIdRef.current = authUserId;
        setProfile(null);
        setStatus('profile_unavailable');
        setErrorMessage(
          'Your player profile record could not be found. Ensure Supabase SQL migration 002 has been executed.'
        );
        return;
      }

      loadedUserIdRef.current = authUserId;
      setProfile(loaded);

      if (loaded.profileSetupCompleted === false) {
        setStatus('profile_setup_required');
      } else {
        setStatus('authenticated');
      }
    } catch (err) {
      if (seq !== fetchSequenceRef.current) return;
      const msg = err instanceof Error ? err.message : 'Unable to retrieve your player profile.';
      setProfile(null);
      setStatus('profile_unavailable');
      setErrorMessage(msg);
    }
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) {
      setStatus('logged_out');
      return;
    }

    let isMounted = true;

    const initSession = async () => {
      try {
        const initialSession = await authService.getSession();
        if (!isMounted) return;

        if (!initialSession) {
          loadedUserIdRef.current = null;
          setSession(null);
          setProfile(null);
          setStatus('logged_out');
          return;
        }

        setSession(initialSession);
        if (loadedUserIdRef.current !== initialSession.userId) {
          await loadProfileForUser(initialSession.userId);
        }
      } catch (err) {
        if (!isMounted) return;
        setSession(null);
        setProfile(null);
        setStatus('logged_out');
        setErrorMessage(err instanceof Error ? err.message : 'Failed to restore session.');
      }
    };

    void initSession();

    const unsubscribe = authService.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !nextSession) {
        loadedUserIdRef.current = null;
        setSession(null);
        setProfile(null);
        setStatus((prev) => (prev === 'offline_preview' ? 'offline_preview' : 'logged_out'));
        return;
      }

      setSession(nextSession);

      // Avoid refetching profile on background TOKEN_REFRESHED for same user
      if (event === 'TOKEN_REFRESHED' && loadedUserIdRef.current === nextSession.userId) {
        return;
      }

      if (loadedUserIdRef.current !== nextSession.userId) {
        void loadProfileForUser(nextSession.userId);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [supabaseConfigured, loadProfileForUser]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setErrorMessage(null);
      const nextSession = await authService.signInWithEmail(email, password);
      setSession(nextSession);
      loadedUserIdRef.current = null;
      await loadProfileForUser(nextSession.userId);
    },
    [loadProfileForUser]
  );

  const signUp = useCallback(
    async (params: SignUpParams): Promise<SignUpResult> => {
      setErrorMessage(null);
      const result = await authService.signUpWithEmail(params);
      if (result.session) {
        setSession(result.session);
        loadedUserIdRef.current = null;
        await loadProfileForUser(result.session.userId);
      }
      return result;
    },
    [loadProfileForUser]
  );

  const signOut = useCallback(async () => {
    setErrorMessage(null);
    await authService.signOut();
    loadedUserIdRef.current = null;
    setSession(null);
    setProfile(null);
    setStatus('logged_out');
  }, []);

  const completeProfileSetup = useCallback(
    async (payload: CompleteProfileSetupRequest) => {
      if (!session) {
        throw new Error('Must be signed in to complete profile setup.');
      }
      const updated = await profileService.completeProfileSetup(session.userId, payload);
      setProfile(updated);
      setStatus('authenticated');
    },
    [session]
  );

  const updateProfile = useCallback(
    async (patch: PermittedProfileUpdate) => {
      if (!session) {
        throw new Error('Must be signed in to update profile.');
      }
      const updated = await profileService.updatePermittedProfile(session.userId, patch);
      setProfile(updated);
    },
    [session]
  );

  const retryProfileLoad = useCallback(async () => {
    if (!session) {
      setStatus('logged_out');
      return;
    }
    loadedUserIdRef.current = null;
    await loadProfileForUser(session.userId);
  }, [session, loadProfileForUser]);

  const enterOfflinePreview = useCallback(() => {
    setErrorMessage(null);
    setStatus('offline_preview');
  }, []);

  const exitOfflinePreview = useCallback(() => {
    setErrorMessage(null);
    setStatus('logged_out');
  }, []);

  const isRealAuthenticatedUser = status === 'authenticated' && profile !== null;
  const activePlayer: PlayerProfile = profile ?? mockCurrentUser;

  return (
    <AuthContext.Provider
      value={{
        status,
        supabaseConfigured,
        session,
        profile,
        activePlayer,
        isRealAuthenticatedUser,
        errorMessage,
        signIn,
        signUp,
        signOut,
        completeProfileSetup,
        updateProfile,
        retryProfileLoad,
        enterOfflinePreview,
        exitOfflinePreview,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return ctx;
}
