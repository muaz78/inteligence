// Official Supabase Browser Client Singleton for CountryRush (Phase 2)
// Uses strictly public VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
// Protected by PostgreSQL Row Level Security (RLS).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { FRONTEND_ENV, isSupabaseConfigured } from '../config/env';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(FRONTEND_ENV.supabaseUrl, FRONTEND_ENV.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'countryrush.supabase.auth.token',
      },
    });
  }

  return cachedClient;
}
