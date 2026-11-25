// CountryRush Frontend Runtime Environment Configuration
// STRICT SECURITY RULE:
// Only public VITE_* variables are allowed in browser bundles.
// NEVER expose SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET, or Cloudflare Worker secrets here.

export interface FrontendRuntimeConfig {
  enableWorkerApi: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string; // Accepts either VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY
  apiBaseUrl: string;
  wsBaseUrl: string;
}

const metaEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};

function readPublicEnv(key: string, fallback = ''): string {
  const value = metaEnv[key];
  return typeof value === 'string' ? value.trim() : fallback;
}

const publicSupabaseKey =
  readPublicEnv('VITE_SUPABASE_PUBLISHABLE_KEY') ||
  readPublicEnv('VITE_SUPABASE_ANON_KEY');

export const FRONTEND_ENV: FrontendRuntimeConfig = {
  enableWorkerApi: readPublicEnv('VITE_ENABLE_BACKEND', 'false') === 'true',
  supabaseUrl: readPublicEnv('VITE_SUPABASE_URL', ''),
  supabaseAnonKey: publicSupabaseKey,
  apiBaseUrl: readPublicEnv('VITE_API_BASE_URL', 'http://127.0.0.1:8787'),
  wsBaseUrl: readPublicEnv('VITE_WS_BASE_URL', 'ws://127.0.0.1:8787'),
};

export function isSupabaseConfigured(): boolean {
  return Boolean(FRONTEND_ENV.supabaseUrl && FRONTEND_ENV.supabaseAnonKey);
}

export function isBackendConfigured(): boolean {
  return Boolean(
    FRONTEND_ENV.enableWorkerApi &&
      FRONTEND_ENV.supabaseUrl &&
      FRONTEND_ENV.supabaseAnonKey &&
      FRONTEND_ENV.apiBaseUrl
  );
}
