// CountryRush Frontend Authentication Service (Phase 2: Official Supabase Auth)
// Never stores passwords locally or creates manual JWTs.
// Delegates credential validation, password hashing, and session tokens to Supabase Auth.

import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import {
  validateAvatarSelection,
  validateEmail,
  validatePassword,
  validateUsername,
} from '../../shared/validation/profileValidation';
import { isSupabaseConfigured } from '../config/env';
import { getSupabaseClient } from '../lib/supabase';

export interface AuthSession {
  userId: string;
  accessToken: string;
  expiresAtMs: number;
  email?: string;
}

export interface SignUpParams {
  email: string;
  password: string;
  username: string;
  avatarSeed: string;
}

export interface SignUpResult {
  session: AuthSession | null;
  user: User | null;
  emailVerificationRequired: boolean;
}

export class AuthServiceError extends Error {
  public readonly code: string;

  constructor(message: string, code = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthServiceError';
    this.code = code;
  }
}

function mapSupabaseSession(session: Session | null): AuthSession | null {
  if (!session || !session.user) return null;
  return {
    userId: session.user.id,
    accessToken: session.access_token,
    expiresAtMs: (session.expires_at ?? 0) * 1000,
    email: session.user.email,
  };
}

function translateSupabaseAuthError(err: { message?: string; status?: number }): AuthServiceError {
  const raw = (err.message || '').toLowerCase();

  if (raw.includes('invalid login credentials')) {
    return new AuthServiceError('Incorrect email or password. Please check your credentials.', 'INVALID_CREDENTIALS');
  }
  if (raw.includes('email not confirmed')) {
    return new AuthServiceError(
      'Your email address has not been verified yet. Please check your inbox for the verification link.',
      'EMAIL_NOT_CONFIRMED'
    );
  }
  if (raw.includes('user already registered') || raw.includes('already been registered')) {
    return new AuthServiceError(
      'An account with this email already exists. Try signing in instead.',
      'EMAIL_ALREADY_REGISTERED'
    );
  }
  if (raw.includes('password should be at least')) {
    return new AuthServiceError('Password does not meet security length requirements.', 'WEAK_PASSWORD');
  }
  if (raw.includes('rate limit') || err.status === 429) {
    return new AuthServiceError(
      'Too many authentication attempts. Please wait a moment and try again.',
      'RATE_LIMITED'
    );
  }
  if (raw.includes('failed to fetch') || raw.includes('network')) {
    return new AuthServiceError(
      'Unable to reach Supabase authentication servers. Check your internet connection.',
      'NETWORK_ERROR'
    );
  }

  return new AuthServiceError(
    err.message || 'Authentication failed. Please try again.',
    'AUTH_FAILED'
  );
}

class SupabaseAuthService {
  public isConfigured(): boolean {
    return isSupabaseConfigured();
  }

  public async getSession(): Promise<AuthSession | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client.auth.getSession();
    if (error) {
      throw translateSupabaseAuthError(error);
    }
    return mapSupabaseSession(data.session);
  }

  public async getAccessToken(): Promise<string | null> {
    try {
      const session = await this.getSession();
      return session?.accessToken ?? null;
    } catch {
      return null;
    }
  }

  public onAuthStateChange(
    callback: (event: AuthChangeEvent, session: AuthSession | null) => void
  ): () => void {
    const client = getSupabaseClient();
    if (!client) {
      return () => undefined;
    }

    const { data } = client.auth.onAuthStateChange((event, session) => {
      callback(event, mapSupabaseSession(session));
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }

  public async signInWithEmail(rawEmail: string, password: string): Promise<AuthSession> {
    const emailCheck = validateEmail(rawEmail);
    if (!emailCheck.valid || !emailCheck.normalized) {
      throw new AuthServiceError(emailCheck.error || 'Invalid email address.', 'VALIDATION_ERROR');
    }
    if (!password) {
      throw new AuthServiceError('Password is required.', 'VALIDATION_ERROR');
    }

    const client = getSupabaseClient();
    if (!client) {
      throw new AuthServiceError('Supabase authentication is not configured yet.', 'NOT_CONFIGURED');
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: emailCheck.normalized,
      password,
    });

    if (error) {
      throw translateSupabaseAuthError(error);
    }

    const mapped = mapSupabaseSession(data.session);
    if (!mapped) {
      throw new AuthServiceError('Sign-in succeeded without an active session.', 'NO_SESSION');
    }
    return mapped;
  }

  public async signUpWithEmail(params: SignUpParams): Promise<SignUpResult> {
    const emailCheck = validateEmail(params.email);
    if (!emailCheck.valid || !emailCheck.normalized) {
      throw new AuthServiceError(emailCheck.error || 'Invalid email address.', 'VALIDATION_ERROR');
    }

    const passwordCheck = validatePassword(params.password);
    if (!passwordCheck.valid) {
      throw new AuthServiceError(passwordCheck.error || 'Invalid password.', 'VALIDATION_ERROR');
    }

    const usernameCheck = validateUsername(params.username);
    if (!usernameCheck.valid || !usernameCheck.normalized) {
      throw new AuthServiceError(usernameCheck.error || 'Invalid username.', 'VALIDATION_ERROR');
    }

    const avatarCheck = validateAvatarSelection(params.avatarSeed);
    if (!avatarCheck.valid || !avatarCheck.normalized) {
      throw new AuthServiceError(avatarCheck.error || 'Invalid avatar selection.', 'VALIDATION_ERROR');
    }

    const client = getSupabaseClient();
    if (!client) {
      throw new AuthServiceError('Supabase authentication is not configured yet.', 'NOT_CONFIGURED');
    }

    // Check username availability first so user gets immediate feedback before account creation
    try {
      const { data: availData } = await client.rpc('check_username_available', {
        p_username: usernameCheck.normalized,
      });
      if (availData && typeof availData === 'object' && 'available' in availData && availData.available === false) {
        const reason =
          'reason' in availData && typeof availData.reason === 'string'
            ? availData.reason
            : 'That username is already taken.';
        throw new AuthServiceError(reason, 'USERNAME_TAKEN');
      }
    } catch (rpcErr) {
      if (rpcErr instanceof AuthServiceError) throw rpcErr;
      // Non-fatal if RPC unavailable during custom setup; DB trigger still protects uniqueness safely
    }

    const { data, error } = await client.auth.signUp({
      email: emailCheck.normalized,
      password: params.password,
      options: {
        data: {
          username: usernameCheck.normalized,
          avatar_seed: avatarCheck.normalized,
        },
      },
    });

    if (error) {
      throw translateSupabaseAuthError(error);
    }

    // Detect duplicate email when Supabase email confirmation is enabled (returns empty identities)
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new AuthServiceError(
        'An account with this email already exists. Please sign in or check your inbox.',
        'EMAIL_ALREADY_REGISTERED'
      );
    }

    const mappedSession = mapSupabaseSession(data.session);
    return {
      session: mappedSession,
      user: data.user,
      emailVerificationRequired: Boolean(data.user && !mappedSession),
    };
  }

  public async signOut(): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const { error } = await client.auth.signOut();
    if (error) {
      throw translateSupabaseAuthError(error);
    }
  }
}

export const authService = new SupabaseAuthService();
