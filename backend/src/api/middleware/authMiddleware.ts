// Authentication Middleware for Cloudflare Workers Endpoints
import type { WorkerEnv } from '../../config/env';
import { authVerifier, type VerifiedAuthIdentity } from '../../auth/supabaseAuthVerifier';

export interface AuthenticatedRequestContext {
  identity: VerifiedAuthIdentity;
  rawToken: string;
}

export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return null;
  }
  return token.trim();
}

export async function authenticateRequest(
  request: Request,
  env: WorkerEnv
): Promise<AuthenticatedRequestContext> {
  const token = extractBearerToken(request);
  if (!token) {
    throw new AuthError('Missing or invalid Authorization Bearer header.');
  }

  const identity = await authVerifier.verifySupabaseAccessToken(token, env);
  return { identity, rawToken: token };
}

export class AuthError extends Error {
  public readonly statusCode = 401;

  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
