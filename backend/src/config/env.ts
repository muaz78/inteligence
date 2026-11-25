// CountryRush Backend Worker Environment Bindings & Secrets Contract
// All secrets MUST be provided at runtime via `wrangler secret put` or `backend/.dev.vars`.

import type { DurableObjectNamespace } from '../types/cloudflare';
import { GAME_RULES } from '../../../shared/constants/gameRules';

export interface WorkerEnv {
  // Cloudflare Durable Object Bindings
  MATCH_ROOM: DurableObjectNamespace;
  MATCHMAKING_QUEUE: DurableObjectNamespace;

  // Non-Secret Public Vars (from wrangler.toml [vars])
  ENVIRONMENT: string;
  ALLOWED_ORIGINS: string;
  BOT_FALLBACK_DELAY_MS?: string;

  // Server-Only Secrets (NEVER sent to browsers or frontend bundles)
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_JWT_SECRET?: string;
  INTERNAL_WS_TICKET_SECRET?: string;
}

export class PhaseNotImplementedError extends Error {
  public readonly phase: string;
  public readonly statusCode = 501;

  constructor(feature: string, phase: string) {
    super(`${feature} is scheduled for ${phase} and is intentionally stubbed in Phase 1.`);
    this.name = 'PhaseNotImplementedError';
    this.phase = phase;
  }
}

export function getBotFallbackDelayMs(env: WorkerEnv): number {
  const parsed = Number(env.BOT_FALLBACK_DELAY_MS);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.round(parsed);
  }
  return GAME_RULES.MATCHMAKING_AI_FALLBACK_MS;
}

export function validateWorkerEnv(env: WorkerEnv): {
  valid: boolean;
  missingSecrets: string[];
  missingBindings: string[];
} {
  const missingBindings: string[] = [];
  if (!env.MATCH_ROOM) missingBindings.push('MATCH_ROOM');
  if (!env.MATCHMAKING_QUEUE) missingBindings.push('MATCHMAKING_QUEUE');

  const missingSecrets: string[] = [];
  if (!env.SUPABASE_URL) missingSecrets.push('SUPABASE_URL');
  if (!env.SUPABASE_SERVICE_ROLE_KEY) missingSecrets.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!env.INTERNAL_WS_TICKET_SECRET) missingSecrets.push('INTERNAL_WS_TICKET_SECRET');
  // SUPABASE_JWT_SECRET is optional: when omitted, symmetric HS256 fast-path skips cleanly
  // and SupabaseAuthVerifier verifies via SUPABASE_URL + /auth/v1/user (supports ES256/RS256).

  return {
    valid: missingBindings.length === 0 && missingSecrets.length === 0,
    missingSecrets,
    missingBindings,
  };
}
