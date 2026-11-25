// Worker-Side Matchmaking Coordinator Service (Phases 4 & 5 Active)
// Validates HTTP matchmaking requests, resolves player rank/MMR strictly server-side
// from Supabase PostgreSQL, coordinates MatchmakingQueueDO, and mints HMAC WebSocket tickets.

import type {
  CancelMatchmakingApiResponse,
  JoinMatchmakingApiResponse,
  MatchMetadataApiResponse,
  MatchmakingStatusApiResponse,
} from '../../../shared/protocol/api';
import type {
  MatchFoundPayload,
  MatchmakingFallbackConfig,
  MatchmakingRegion,
  MatchmakingRequest,
  MatchmakingTicket,
  QueueTicketResponse,
} from '../../../shared/types/matchmaking';
import { GAME_RULES } from '../../../shared/constants/gameRules';
import type { WorkerEnv } from '../config/env';
import { getBotFallbackDelayMs } from '../config/env';
import { authVerifier } from '../auth/supabaseAuthVerifier';
import { playerRepository } from '../db/playerRepository';
import { matchRepository } from '../db/matchRepository';
import type { DoTicketResult } from '../durable-objects/MatchmakingQueueDO';

export const DEFAULT_MATCHMAKING_CONFIG: MatchmakingFallbackConfig = {
  fallbackDelayMs: GAME_RULES.MATCHMAKING_AI_FALLBACK_MS, // 20,000 ms (20s)
  initialMmrWindow: GAME_RULES.MATCHMAKING_MMR_INITIAL_WINDOW, // 120
  expandedMmrWindow: GAME_RULES.MATCHMAKING_MMR_EXPANDED_WINDOW, // 300
  expandAfterMs: 10_000, // 10s
};

const QUEUE_COORDINATOR_DO_NAME = 'queue-coordinator-v1';

const ALLOWED_MODES: ReadonlyArray<MatchmakingRequest['mode']> = [
  'ranked_1v1',
  'ranked_2v2',
  'quickplay',
];

const ALLOWED_REGIONS: ReadonlyArray<MatchmakingRegion> = [
  'global',
  'eu_west',
  'us_east',
  'ap_northeast',
];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class MatchmakingValidationError extends Error {
  public readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'MatchmakingValidationError';
  }
}

export class MatchmakingForbiddenError extends Error {
  public readonly statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = 'MatchmakingForbiddenError';
  }
}

export class MatchmakingNotFoundError extends Error {
  public readonly statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'MatchmakingNotFoundError';
  }
}

export class MatchmakingConflictError extends Error {
  public readonly statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = 'MatchmakingConflictError';
  }
}

export class MatchmakingServiceUnavailableError extends Error {
  public readonly statusCode = 503;
  constructor(message: string) {
    super(message);
    this.name = 'MatchmakingServiceUnavailableError';
  }
}

function sanitizeTicketForClient(
  ticket: MatchmakingTicket
): Omit<MatchmakingTicket, 'authUserId' | 'playerId'> {
  const { authUserId: _authUserId, playerId: _playerId, ...safeTicket } = ticket;
  return safeTicket;
}

function throwFromDoFailure(result: DoTicketResult): never {
  const msg = result.message || 'Matchmaking operation failed.';
  switch (result.code) {
    case 'FORBIDDEN':
      throw new MatchmakingForbiddenError(msg);
    case 'NOT_FOUND':
      throw new MatchmakingNotFoundError(msg);
    case 'CONFLICT':
      throw new MatchmakingConflictError(msg);
    case 'BAD_REQUEST':
      throw new MatchmakingValidationError(msg);
    default:
      throw new Error(msg);
  }
}

function validateJoinInput(rawBody: Record<string, unknown>): {
  mode: MatchmakingRequest['mode'];
  region: MatchmakingRegion;
} {
  const mode = typeof rawBody.mode === 'string' ? rawBody.mode.trim() : '';
  if (!ALLOWED_MODES.includes(mode as MatchmakingRequest['mode'])) {
    throw new MatchmakingValidationError(
      `Unsupported matchmaking mode. Expected one of: ${ALLOWED_MODES.join(', ')}.`
    );
  }

  const rawRegion =
    rawBody.region === undefined ? 'global' : typeof rawBody.region === 'string' ? rawBody.region.trim() : '';
  if (!ALLOWED_REGIONS.includes(rawRegion as MatchmakingRegion)) {
    throw new MatchmakingValidationError(
      `Unsupported matchmaking region. Expected one of: ${ALLOWED_REGIONS.join(', ')}.`
    );
  }

  return {
    mode: mode as MatchmakingRequest['mode'],
    region: rawRegion as MatchmakingRegion,
  };
}

function assertQueueBindingsConfigured(env: WorkerEnv): void {
  if (!env.MATCHMAKING_QUEUE || !env.MATCH_ROOM) {
    throw new MatchmakingServiceUnavailableError(
      'Multiplayer Durable Object bindings are not configured on this server.'
    );
  }
  if (!env.INTERNAL_WS_TICKET_SECRET?.trim()) {
    throw new MatchmakingServiceUnavailableError(
      'Server WebSocket ticket signing secret is not configured.'
    );
  }
}

function getQueueStub(env: WorkerEnv) {
  const doId = env.MATCHMAKING_QUEUE.idFromName(QUEUE_COORDINATOR_DO_NAME);
  return env.MATCHMAKING_QUEUE.get(doId);
}

async function mintMatchFoundPayload(
  ticket: MatchmakingTicket,
  playerId: string,
  env: WorkerEnv
): Promise<MatchFoundPayload | undefined> {
  if (ticket.status !== 'match_found' || !ticket.matchedSummary || !ticket.myParticipantId) {
    return undefined;
  }

  const wsJoinTicket = await authVerifier.signWsJoinTicket(
    {
      matchId: ticket.matchedSummary.matchId,
      playerId,
      participantId: ticket.myParticipantId,
    },
    env
  );

  return {
    ...ticket.matchedSummary,
    myParticipantId: ticket.myParticipantId,
    wsJoinTicket,
  };
}

export class WorkerMatchmakingService {
  public async joinQueue(
    authUserId: string,
    rawBody: Record<string, unknown>,
    env: WorkerEnv
  ): Promise<JoinMatchmakingApiResponse> {
    assertQueueBindingsConfigured(env);
    const { mode, region } = validateJoinInput(rawBody);

    // Always resolve profile, rank, and hidden MMR strictly server-side from Supabase
    const profile = await playerRepository.ensureProfileForAuthUser(env, authUserId);

    const queueStub = getQueueStub(env);
    const doResp = await queueStub.fetch('https://matchmaking-queue.internal/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: profile.id,
        authUserId,
        publicPlayerId: profile.publicPlayerId,
        username: profile.username,
        tag: profile.tag,
        avatarSeed: profile.avatarSeed,
        countryCode: profile.countryCode,
        mode,
        region,
        rankTier: profile.rankTier,
        rankDivision: profile.rankDivision,
        rankPoints: profile.rankPoints,
        mmr: profile.mmr,
      }),
    });

    const result = (await doResp.json()) as DoTicketResult;
    if (!result.ok || !result.ticket) {
      throwFromDoFailure(result);
    }

    const ticket = result.ticket;
    const matchFound = await mintMatchFoundPayload(ticket, profile.id, env);
    const remainingMs = Math.max(0, ticket.botFallbackDeadlineMs - Date.now());
    const fallbackSec = Math.ceil(getBotFallbackDelayMs(env) / 1000);

    const queueTicketResponse: QueueTicketResponse = {
      ticket: sanitizeTicketForClient(ticket),
      estimatedWaitSec:
        ticket.status === 'match_found' ? 0 : Math.min(fallbackSec, Math.max(1, Math.ceil(remainingMs / 1000))),
      queueDepthHint: result.queueDepthHint,
      matchFound,
    };

    return { ticket: queueTicketResponse };
  }

  public async getStatus(
    authUserId: string,
    ticketId: string | null,
    env: WorkerEnv
  ): Promise<MatchmakingStatusApiResponse> {
    assertQueueBindingsConfigured(env);

    if (ticketId && !UUID_REGEX.test(ticketId)) {
      throw new MatchmakingValidationError('Invalid matchmaking ticket ID format.');
    }

    const profile = await playerRepository.ensureProfileForAuthUser(env, authUserId);
    const queueStub = getQueueStub(env);
    const doResp = await queueStub.fetch('https://matchmaking-queue.internal/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: profile.id,
        ticketId: ticketId || null,
      }),
    });

    const result = (await doResp.json()) as DoTicketResult;
    if (!result.ok || !result.ticket) {
      throwFromDoFailure(result);
    }

    const ticket = result.ticket;
    const matchFound = await mintMatchFoundPayload(ticket, profile.id, env);

    return {
      ticket: sanitizeTicketForClient(ticket),
      matchFound,
    };
  }

  public async cancelQueue(
    authUserId: string,
    rawBody: Record<string, unknown>,
    env: WorkerEnv
  ): Promise<CancelMatchmakingApiResponse> {
    assertQueueBindingsConfigured(env);

    const ticketId = typeof rawBody.ticketId === 'string' ? rawBody.ticketId.trim() : '';
    if (!ticketId || !UUID_REGEX.test(ticketId)) {
      throw new MatchmakingValidationError('A valid UUID ticketId is required to cancel matchmaking.');
    }

    const profile = await playerRepository.ensureProfileForAuthUser(env, authUserId);
    const queueStub = getQueueStub(env);
    const doResp = await queueStub.fetch('https://matchmaking-queue.internal/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: profile.id,
        ticketId,
      }),
    });

    const result = (await doResp.json()) as DoTicketResult;
    if (!result.ok) {
      throwFromDoFailure(result);
    }

    return {
      cancelled: Boolean(result.cancelled),
      ticketId: result.ticketId || ticketId,
      status: result.status || 'cancelled',
    };
  }

  public async getMatchMetadata(
    authUserId: string,
    matchId: string,
    env: WorkerEnv
  ): Promise<MatchMetadataApiResponse> {
    assertQueueBindingsConfigured(env);

    if (!UUID_REGEX.test(matchId)) {
      throw new MatchmakingValidationError('Invalid matchId UUID format.');
    }

    const profile = await playerRepository.ensureProfileForAuthUser(env, authUserId);
    const record = await matchRepository.getMatchWithRoster(env, matchId);
    if (!record) {
      throw new MatchmakingNotFoundError('Match was not found.');
    }

    const myParticipantRow = record.participants.find(
      (p) => p.participant_type === 'human' && p.player_id === profile.id
    );
    if (!myParticipantRow) {
      throw new MatchmakingForbiddenError('You are not a participant in this match.');
    }

    const participantId = myParticipantRow.participant_slot_id || myParticipantRow.id;
    const wsJoinTicket = await authVerifier.signWsJoinTicket(
      {
        matchId: record.match.id,
        playerId: profile.id,
        participantId,
      },
      env
    );

    return {
      match: record.match,
      wsEndpointPath: `/api/v1/ws/match/${record.match.id}`,
      wsJoinTicket,
    };
  }
}

export const matchmakingService = new WorkerMatchmakingService();
