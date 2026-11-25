// Strict Origin-Allowlist CORS & HTTP Security Headers Helper
import type { WorkerEnv } from '../../config/env';

const DEFAULT_DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

export function parseAllowedOrigins(env: WorkerEnv): string[] {
  if (!env.ALLOWED_ORIGINS) return DEFAULT_DEV_ORIGINS;
  return env.ALLOWED_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

export function buildCorsHeaders(request: Request, env: WorkerEnv): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const allowed = parseAllowedOrigins(env);
  const isAllowed = allowed.includes(origin) || (env.ENVIRONMENT === 'development' && origin === '');

  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    Vary: 'Origin',
  };

  if (isAllowed && origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PATCH, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Request-Id';
    headers['Access-Control-Max-Age'] = '86400';
  }

  return headers;
}

export function handleCorsPreflight(request: Request, env: WorkerEnv): Response {
  return new Response(null, {
    status: 204,
    headers: buildCorsHeaders(request, env),
  });
}
