// Cloudflare Workers HTTP & WebSocket Upgrade API Router (Phases 2, 3, 4 & 5 Active)
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  HealthCheckPayload,
  MyProfileApiResponse,
  PublicProfileApiResponse,
  UsernameAvailabilityResponse,
} from '../../../shared/protocol/api';
import type { WorkerEnv } from '../config/env';
import { PhaseNotImplementedError } from '../config/env';
import { buildCorsHeaders } from './middleware/cors';
import { authenticateRequest, AuthError } from './middleware/authMiddleware';
import { API_RATE_POLICIES, defaultRateLimiter } from './middleware/rateLimiter';
import { authVerifier } from '../auth/supabaseAuthVerifier';
import {
  playerRepository,
  ForbiddenProfileFieldError,
  ProfileConflictError,
  ProfileValidationError,
} from '../db/playerRepository';
import { SupabaseAdminError } from '../db/supabaseClient';
import {
  matchmakingService,
  MatchmakingConflictError,
  MatchmakingForbiddenError,
  MatchmakingNotFoundError,
  MatchmakingServiceUnavailableError,
  MatchmakingValidationError,
} from '../matchmaking/matchmakingService';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonSuccess<T>(
  data: T,
  request: Request,
  env: WorkerEnv,
  requestId: string,
  status = 200
): Response {
  const body: ApiSuccessResponse<T> = {
    ok: true,
    data,
    serverTimeMs: Date.now(),
    requestId,
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...buildCorsHeaders(request, env),
    },
  });
}

function jsonError(
  code: ApiErrorResponse['error']['code'],
  message: string,
  status: number,
  request: Request,
  env: WorkerEnv,
  requestId: string,
  extra?: Partial<ApiErrorResponse['error']>
): Response {
  const body: ApiErrorResponse = {
    ok: false,
    error: {
      code,
      message,
      ...extra,
    },
    serverTimeMs: Date.now(),
    requestId,
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...buildCorsHeaders(request, env),
    },
  });
}

function getClientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown_ip';
}

async function parseJsonObjectBody(request: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ProfileValidationError('Invalid JSON request payload.');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ProfileValidationError('Expected a JSON object body.');
  }
  return body as Record<string, unknown>;
}

export async function routeApiRequest(
  request: Request,
  env: WorkerEnv,
  requestId: string
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();

  // Edge API rate limiting guard
  const rateDecision = await defaultRateLimiter.check(
    getClientIp(request),
    API_RATE_POLICIES.GENERAL_API
  );
  if (!rateDecision.allowed) {
    return jsonError('RATE_LIMITED', 'Too many requests. Please slow down.', 429, request, env, requestId, {
      retryAfterSec: rateDecision.retryAfterSec,
    });
  }

  try {
    // 1. Operational Health & Binding Diagnostics
    if (method === 'GET' && path === '/api/health') {
      const payload: HealthCheckPayload = {
        service: 'countryrush-api',
        environment: env.ENVIRONMENT || 'development',
        phase: 'phase-3-4-5-matchmaking',
        bindingsConfigured: {
          matchRoomDO: Boolean(env.MATCH_ROOM),
          matchmakingQueueDO: Boolean(env.MATCHMAKING_QUEUE),
          supabaseUrl: Boolean(env.SUPABASE_URL),
        },
      };
      return jsonSuccess(payload, request, env, requestId, 200);
    }

    // 2. Phase 2: Username Availability Check
    if (method === 'GET' && path === '/api/v1/profile/check-username') {
      const rawUsername = url.searchParams.get('username') || '';
      const result = await playerRepository.checkUsernameAvailable(env, rawUsername);
      const response: UsernameAvailabilityResponse = {
        username: result.normalized,
        available: result.available,
        reason: result.reason,
      };
      return jsonSuccess(response, request, env, requestId, 200);
    }

    // 3. Phase 2: Get Authenticated Player's Own Profile (auto-ensures default profile row if needed)
    if (method === 'GET' && path === '/api/v1/profile/me') {
      const auth = await authenticateRequest(request, env);
      const profile = await playerRepository.ensureProfileForAuthUser(env, auth.identity.authUserId);
      const response: MyProfileApiResponse = { profile };
      return jsonSuccess(response, request, env, requestId, 200);
    }

    // 4. Phase 2: Complete Initial Profile Setup (Username + Allowlisted Avatar)
    if (method === 'POST' && path === '/api/v1/profile/setup') {
      const auth = await authenticateRequest(request, env);
      const rawBody = await parseJsonObjectBody(request);
      await playerRepository.ensureProfileForAuthUser(env, auth.identity.authUserId);
      const profile = await playerRepository.updatePermittedProfileFields(
        env,
        auth.identity.authUserId,
        rawBody,
        true
      );
      const response: MyProfileApiResponse = { profile };
      return jsonSuccess(response, request, env, requestId, 200);
    }

    // 5. Phase 2: Update Permitted Profile Fields Only (Protected rank/RP/MMR blocked!)
    if (method === 'PATCH' && path === '/api/v1/profile/me') {
      const auth = await authenticateRequest(request, env);
      const rawBody = await parseJsonObjectBody(request);
      const profile = await playerRepository.updatePermittedProfileFields(
        env,
        auth.identity.authUserId,
        rawBody,
        false
      );
      const response: MyProfileApiResponse = { profile };
      return jsonSuccess(response, request, env, requestId, 200);
    }

    // 6. Phase 2: Safe Public Player Profile Lookup by Public Player ID (e.g. /api/v1/profiles/CR-1A2B3C4D)
    if (method === 'GET' && path.startsWith('/api/v1/profiles/')) {
      const publicPlayerId = decodeURIComponent(path.replace('/api/v1/profiles/', '').trim());
      if (!publicPlayerId || !/^CR-[A-Za-z0-9]{6,10}$/.test(publicPlayerId)) {
        return jsonError('BAD_REQUEST', 'Invalid Public Player ID format.', 400, request, env, requestId);
      }

      const publicProfile = await playerRepository.getPublicProfileByPlayerId(env, publicPlayerId);
      if (!publicProfile) {
        return jsonError('NOT_FOUND', 'Player profile not found.', 404, request, env, requestId);
      }

      const response: PublicProfileApiResponse = { profile: publicProfile };
      return jsonSuccess(response, request, env, requestId, 200);
    }

    // 7. Phases 4 & 5: Real Multiplayer Matchmaking & 20s AI Fallback Routes
    if (method === 'POST' && path === '/api/v1/matchmaking/join') {
      const auth = await authenticateRequest(request, env);
      const joinLimit = await defaultRateLimiter.check(
        auth.identity.authUserId,
        API_RATE_POLICIES.MATCHMAKING_JOIN
      );
      if (!joinLimit.allowed) {
        return jsonError(
          'RATE_LIMITED',
          'Too many matchmaking join attempts. Please wait a moment.',
          429,
          request,
          env,
          requestId,
          { retryAfterSec: joinLimit.retryAfterSec }
        );
      }

      const rawBody = await parseJsonObjectBody(request);
      const response = await matchmakingService.joinQueue(auth.identity.authUserId, rawBody, env);
      return jsonSuccess(response, request, env, requestId, 200);
    }

    if (method === 'GET' && path === '/api/v1/matchmaking/status') {
      const auth = await authenticateRequest(request, env);
      const statusLimit = await defaultRateLimiter.check(
        auth.identity.authUserId,
        API_RATE_POLICIES.MATCHMAKING_STATUS
      );
      if (!statusLimit.allowed) {
        return jsonError(
          'RATE_LIMITED',
          'Matchmaking status polled too frequently.',
          429,
          request,
          env,
          requestId,
          { retryAfterSec: statusLimit.retryAfterSec }
        );
      }

      const ticketId = url.searchParams.get('ticketId');
      const response = await matchmakingService.getStatus(auth.identity.authUserId, ticketId, env);
      return jsonSuccess(response, request, env, requestId, 200);
    }

    if (method === 'POST' && path === '/api/v1/matchmaking/cancel') {
      const auth = await authenticateRequest(request, env);
      const cancelLimit = await defaultRateLimiter.check(
        auth.identity.authUserId,
        API_RATE_POLICIES.MATCHMAKING_CANCEL
      );
      if (!cancelLimit.allowed) {
        return jsonError(
          'RATE_LIMITED',
          'Too many cancel requests. Please wait a moment.',
          429,
          request,
          env,
          requestId,
          { retryAfterSec: cancelLimit.retryAfterSec }
        );
      }

      const rawBody = await parseJsonObjectBody(request);
      const response = await matchmakingService.cancelQueue(auth.identity.authUserId, rawBody, env);
      return jsonSuccess(response, request, env, requestId, 200);
    }

    // 8. Phase 3: Authenticated WebSocket Match Room Upgrade Route (HMAC ticket verified at edge + inside DO)
    if (path.startsWith('/api/v1/ws/match/') && method === 'GET') {
      const upgradeHeader = request.headers.get('Upgrade');
      if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
        return jsonError('BAD_REQUEST', 'Expected Upgrade: websocket header.', 426, request, env, requestId);
      }

      const matchId = decodeURIComponent(path.replace('/api/v1/ws/match/', '').trim());
      if (!matchId || !UUID_REGEX.test(matchId)) {
        return jsonError('BAD_REQUEST', 'Invalid matchId in WebSocket path.', 400, request, env, requestId);
      }

      const wsTicket = url.searchParams.get('token') || '';
      if (!wsTicket) {
        return jsonError('UNAUTHORIZED', 'Missing WebSocket join ticket.', 401, request, env, requestId);
      }

      try {
        await authVerifier.verifyWsJoinTicket(wsTicket, matchId, env);
      } catch (err) {
        return jsonError(
          'UNAUTHORIZED',
          err instanceof Error ? err.message : 'Invalid WebSocket join ticket.',
          401,
          request,
          env,
          requestId
        );
      }

      if (!env.MATCH_ROOM) {
        return jsonError('INTERNAL_ERROR', 'MatchRoomDO binding unavailable.', 503, request, env, requestId);
      }

      const roomId = env.MATCH_ROOM.idFromName(matchId);
      const stub = env.MATCH_ROOM.get(roomId);
      return stub.fetch(request);
    }

    // 9. Match Metadata & Post-Match Result Routes
    if (path.startsWith('/api/v1/matches/') && method === 'GET') {
      const subPath = path.replace('/api/v1/matches/', '').trim();
      if (subPath.endsWith('/result')) {
        await authenticateRequest(request, env);
        throw new PhaseNotImplementedError('Post-match statistics & RP calculation', 'Phase 6');
      }

      const matchId = decodeURIComponent(subPath);
      if (!matchId || matchId.includes('/') || !UUID_REGEX.test(matchId)) {
        return jsonError('BAD_REQUEST', 'Invalid matchId parameter.', 400, request, env, requestId);
      }

      const auth = await authenticateRequest(request, env);
      const response = await matchmakingService.getMatchMetadata(
        auth.identity.authUserId,
        matchId,
        env
      );
      return jsonSuccess(response, request, env, requestId, 200);
    }

    if (path === '/api/v1/leaderboard' && method === 'GET') {
      throw new PhaseNotImplementedError('Server-backed seasonal leaderboard', 'Phase 8');
    }

    return jsonError('NOT_FOUND', `Route not found: ${method} ${path}`, 404, request, env, requestId);
  } catch (err) {
    if (err instanceof AuthError) {
      return jsonError('UNAUTHORIZED', err.message, 401, request, env, requestId);
    }
    if (err instanceof ForbiddenProfileFieldError || err instanceof MatchmakingForbiddenError) {
      return jsonError('FORBIDDEN', err.message, 403, request, env, requestId);
    }
    if (err instanceof ProfileValidationError || err instanceof MatchmakingValidationError) {
      return jsonError('VALIDATION_ERROR', err.message, 400, request, env, requestId);
    }
    if (err instanceof MatchmakingNotFoundError) {
      return jsonError('NOT_FOUND', err.message, 404, request, env, requestId);
    }
    if (err instanceof ProfileConflictError || err instanceof MatchmakingConflictError) {
      return jsonError('CONFLICT', err.message, 409, request, env, requestId);
    }
    if (err instanceof MatchmakingServiceUnavailableError) {
      return jsonError('INTERNAL_ERROR', err.message, 503, request, env, requestId);
    }
    if (err instanceof SupabaseAdminError) {
      return jsonError('INTERNAL_ERROR', err.message, err.status >= 400 ? err.status : 500, request, env, requestId);
    }
    if (err instanceof PhaseNotImplementedError) {
      return jsonError('NOT_IMPLEMENTED_IN_PHASE_1', err.message, 501, request, env, requestId, {
        phaseHint: err.phase,
      });
    }
    return jsonError('INTERNAL_ERROR', 'Unexpected server error.', 500, request, env, requestId);
  }
}
