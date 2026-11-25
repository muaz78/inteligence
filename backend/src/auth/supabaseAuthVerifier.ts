// Server-Side Supabase Authentication & WebSocket Ticket Verification (Phase 2 & 3)
// Uses Cloudflare Workers native WebCrypto for HS256 JWT validation & HMAC-SHA256 WS tickets,
// plus official Supabase Auth `/auth/v1/user` verification for asymmetric/ES256/RS256 tokens.
// CRITICAL SECURITY RULE: Never accept unverified user IDs, roles, or ranks from client requests.

import type { WorkerEnv } from '../config/env';

export interface VerifiedAuthIdentity {
  authUserId: string; // Verified `sub` claim from Supabase JWT
  email?: string;
  role: 'authenticated';
  issuedAtSec: number;
  expiresAtSec: number;
}

export interface WsJoinTicketClaims {
  matchId: string;
  playerId: string;
  participantId: string;
  issuedAtMs: number;
  expiresAtMs: number;
  jti: string;
}

export interface SignWsJoinTicketInput {
  matchId: string;
  playerId: string;
  participantId: string;
  ttlMs?: number;
}

export interface AuthVerifierContract {
  verifySupabaseAccessToken(token: string, env: WorkerEnv): Promise<VerifiedAuthIdentity>;
  signWsJoinTicket(input: SignWsJoinTicketInput, env: WorkerEnv): Promise<string>;
  verifyWsJoinTicket(ticket: string, expectedMatchId: string, env: WorkerEnv): Promise<WsJoinTicketClaims>;
}

interface JwtHeader {
  alg?: string;
  typ?: string;
}

interface SupabaseJwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
}

interface RawWsTicketPayload {
  typ?: string;
  v?: number;
  matchId?: string;
  playerId?: string;
  participantId?: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

const DEFAULT_WS_TICKET_TTL_MS = 120_000;
const MIN_WS_TICKET_TTL_MS = 15_000;
const MAX_WS_TICKET_TTL_MS = 300_000;

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padded =
    base64Url.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((base64Url.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodeBase64UrlJson<T>(segment: string): T {
  const bytes = base64UrlToUint8Array(segment);
  const decoded = new TextDecoder().decode(bytes);
  return JSON.parse(decoded) as T;
}

async function importHmacKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(secret);
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  );
}

async function signHs256Signature(signingInput: string, secret: string): Promise<string> {
  const cryptoKey = await importHmacKey(secret, 'sign');
  const dataBytes = new TextEncoder().encode(signingInput);
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, dataBytes);
  return uint8ArrayToBase64Url(new Uint8Array(signatureBuffer));
}

async function verifyHs256Signature(
  signingInput: string,
  signatureB64Url: string,
  secret: string
): Promise<boolean> {
  const cryptoKey = await importHmacKey(secret, 'verify');
  const sigBytes = base64UrlToUint8Array(signatureB64Url);
  const dataBytes = new TextEncoder().encode(signingInput);
  return crypto.subtle.verify('HMAC', cryptoKey, sigBytes, dataBytes);
}

export class SupabaseAuthVerifier implements AuthVerifierContract {
  public async verifySupabaseAccessToken(token: string, env: WorkerEnv): Promise<VerifiedAuthIdentity> {
    if (!token || token.trim().length < 20) {
      throw new Error('Malformed or missing Bearer access token.');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format.');
    }

    const [encodedHeader, encodedPayload, encodedSig] = parts;
    let header: JwtHeader;
    let claims: SupabaseJwtPayload;
    try {
      header = decodeBase64UrlJson<JwtHeader>(encodedHeader);
      claims = decodeBase64UrlJson<SupabaseJwtPayload>(encodedPayload);
    } catch {
      throw new Error('Invalid JWT encoding.');
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (!claims.sub || typeof claims.sub !== 'string') {
      throw new Error('Token missing subject claim.');
    }
    if (typeof claims.exp !== 'number' || claims.exp <= nowSec) {
      throw new Error('Authentication session expired. Please log in again.');
    }
    if (claims.role && claims.role !== 'authenticated') {
      throw new Error('Insufficient token role.');
    }

    // Path A: Cryptographic HS256 verification using optional server-only SUPABASE_JWT_SECRET
    if (header.alg === 'HS256' && env.SUPABASE_JWT_SECRET) {
      const validSig = await verifyHs256Signature(
        `${encodedHeader}.${encodedPayload}`,
        encodedSig,
        env.SUPABASE_JWT_SECRET
      );
      if (!validSig) {
        throw new Error('Invalid JWT signature.');
      }

      return {
        authUserId: claims.sub,
        email: typeof claims.email === 'string' ? claims.email : undefined,
        role: 'authenticated',
        issuedAtSec: claims.iat || nowSec,
        expiresAtSec: claims.exp,
      };
    }

    // Path B: Official Supabase Auth API verification (supports RS256/ES256 JWKS keys seamlessly)
    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      const baseUrl = env.SUPABASE_URL.replace(/\/+$/, '');
      const resp = await fetch(`${baseUrl}/auth/v1/user`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        },
      });

      if (!resp.ok) {
        throw new Error('Supabase Auth token verification rejected.');
      }

      const userData = (await resp.json()) as { id?: string; email?: string; role?: string };
      if (!userData.id || userData.id !== claims.sub) {
        throw new Error('Token subject mismatch during auth verification.');
      }

      return {
        authUserId: userData.id,
        email: userData.email,
        role: 'authenticated',
        issuedAtSec: claims.iat || nowSec,
        expiresAtSec: claims.exp,
      };
    }

    throw new Error('Server Supabase authentication secrets are not configured.');
  }

  public async signWsJoinTicket(input: SignWsJoinTicketInput, env: WorkerEnv): Promise<string> {
    const secret = env.INTERNAL_WS_TICKET_SECRET?.trim();
    if (!secret) {
      throw new Error('Server WebSocket ticket secret (INTERNAL_WS_TICKET_SECRET) is not configured.');
    }
    if (!input.matchId || !input.playerId || !input.participantId) {
      throw new Error('Cannot sign WebSocket join ticket without matchId, playerId, and participantId.');
    }

    const nowMs = Date.now();
    const ttl = Math.min(
      Math.max(input.ttlMs ?? DEFAULT_WS_TICKET_TTL_MS, MIN_WS_TICKET_TTL_MS),
      MAX_WS_TICKET_TTL_MS
    );

    const payload: RawWsTicketPayload = {
      typ: 'cr_ws_ticket',
      v: 1,
      matchId: input.matchId,
      playerId: input.playerId,
      participantId: input.participantId,
      iat: nowMs,
      exp: nowMs + ttl,
      jti: crypto.randomUUID(),
    };

    const encodedPayload = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
    const encodedSig = await signHs256Signature(encodedPayload, secret);
    return `${encodedPayload}.${encodedSig}`;
  }

  public async verifyWsJoinTicket(
    ticket: string,
    expectedMatchId: string,
    env: WorkerEnv
  ): Promise<WsJoinTicketClaims> {
    if (!ticket || typeof ticket !== 'string') {
      throw new Error('Missing WebSocket join ticket.');
    }
    const secret = env.INTERNAL_WS_TICKET_SECRET?.trim();
    if (!secret) {
      throw new Error('Server WebSocket ticket secret is not configured.');
    }

    const parts = ticket.trim().split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error('Malformed WebSocket join ticket.');
    }

    const [encodedPayload, encodedSig] = parts;
    let validSignature = false;
    try {
      validSignature = await verifyHs256Signature(encodedPayload, encodedSig, secret);
    } catch {
      validSignature = false;
    }

    if (!validSignature) {
      throw new Error('Invalid WebSocket join ticket signature.');
    }

    let parsed: RawWsTicketPayload;
    try {
      parsed = decodeBase64UrlJson<RawWsTicketPayload>(encodedPayload);
    } catch {
      throw new Error('Invalid WebSocket join ticket payload encoding.');
    }

    if (
      parsed.typ !== 'cr_ws_ticket' ||
      parsed.v !== 1 ||
      !parsed.matchId ||
      !parsed.playerId ||
      !parsed.participantId ||
      !parsed.jti ||
      typeof parsed.iat !== 'number' ||
      typeof parsed.exp !== 'number'
    ) {
      throw new Error('Invalid WebSocket join ticket claims.');
    }

    if (parsed.matchId !== expectedMatchId) {
      throw new Error('WebSocket join ticket does not match target match.');
    }

    const nowMs = Date.now();
    if (nowMs >= parsed.exp) {
      throw new Error('WebSocket join ticket expired.');
    }
    if (parsed.iat > nowMs + 10_000) {
      throw new Error('WebSocket join ticket issued timestamp invalid.');
    }

    return {
      matchId: parsed.matchId,
      playerId: parsed.playerId,
      participantId: parsed.participantId,
      issuedAtMs: parsed.iat,
      expiresAtMs: parsed.exp,
      jti: parsed.jti,
    };
  }
}

export const authVerifier: AuthVerifierContract = new SupabaseAuthVerifier();
