// Server-Side Supabase PostgreSQL Admin Client (Cloudflare Workers Native Fetch)
// CRITICAL SECURITY BOUNDARY:
// Only runs inside Cloudflare Workers & Durable Objects.
// Consumes SUPABASE_SERVICE_ROLE_KEY from Worker secrets; NEVER import in `src/`.

import type { WorkerEnv } from '../config/env';

export interface SupabaseAdminConfig {
  supabaseUrl: string;
  serviceRoleKey: string;
}

export class SupabaseAdminError extends Error {
  public readonly status: number;
  public readonly pgCode?: string;

  constructor(message: string, status = 500, pgCode?: string) {
    super(message);
    this.name = 'SupabaseAdminError';
    this.status = status;
    this.pgCode = pgCode;
  }
}

export function assertServerRuntime(): void {
  const g = globalThis as { window?: unknown; document?: unknown };
  if (typeof g.window !== 'undefined' && typeof g.document !== 'undefined') {
    throw new Error('SECURITY VIOLATION: Server Supabase admin client cannot run in browser.');
  }
}

export function resolveSupabaseAdminConfig(env: WorkerEnv): SupabaseAdminConfig {
  assertServerRuntime();

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new SupabaseAdminError(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Worker secrets.',
      503
    );
  }

  return {
    supabaseUrl: env.SUPABASE_URL.replace(/\/+$/, ''),
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

/**
 * Executes an authenticated PostgREST request against Supabase using the server-only service role key.
 */
export async function supabaseAdminFetch<T>(
  env: WorkerEnv,
  restPath: string,
  init: RequestInit = {}
): Promise<T> {
  const cfg = resolveSupabaseAdminConfig(env);
  const headers = new Headers(init.headers);
  headers.set('apikey', cfg.serviceRoleKey);
  headers.set('Authorization', `Bearer ${cfg.serviceRoleKey}`);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${cfg.supabaseUrl}/rest/v1/${restPath.replace(/^\/+/, '')}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `Database request failed (${response.status})`;
    let pgCode: string | undefined;
    try {
      const errBody = (await response.json()) as { message?: string; code?: string };
      if (errBody.message) message = errBody.message;
      if (errBody.code) pgCode = errBody.code;
    } catch {
      // keep fallback message
    }
    throw new SupabaseAdminError(message, response.status, pgCode);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const rawText = await response.text();
  if (!rawText || !rawText.trim()) {
    return undefined as T;
  }

  return JSON.parse(rawText) as T;
}
