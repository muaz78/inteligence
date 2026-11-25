// Shared HTTP/REST API Contracts for Cloudflare Workers Endpoints

import type {
  PlayerProfile,
  PublicPlayerProfile,
  PermittedProfileUpdate,
  LeaderboardPlayer,
} from '../types/player';
import type { Match, MatchResult } from '../types/match';
import type {
  MatchmakingRequest,
  QueueTicketResponse,
  MatchmakingTicket,
  MatchFoundPayload,
} from '../types/matchmaking';

export interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
  serverTimeMs: number;
  requestId: string;
}

export interface ApiErrorResponse {
  ok: false;
  error: {
    code:
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'BAD_REQUEST'
    | 'VALIDATION_ERROR'
    | 'CONFLICT'
    | 'RATE_LIMITED'
    | 'NOT_IMPLEMENTED_IN_PHASE_1'
    | 'INTERNAL_ERROR';
    message: string;
    phaseHint?: string;
    retryAfterSec?: number;
  };
  serverTimeMs: number;
  requestId: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface HealthCheckPayload {
  service: 'countryrush-api';
  environment: string;
  phase: 'phase-2-auth-profiles' | 'phase-3-4-5-matchmaking';
  bindingsConfigured: {
    matchRoomDO: boolean;
    matchmakingQueueDO: boolean;
    supabaseUrl: boolean;
  };
}

export type ProfileUpdateRequest = PermittedProfileUpdate;

export interface CompleteProfileSetupRequest {
  username: string;
  avatarSeed: string;
  countryCode?: string;
  favoriteContinent?: string;
}

export interface UsernameAvailabilityResponse {
  username: string;
  available: boolean;
  reason?: string;
}

export interface PublicProfileApiResponse {
  profile: PublicPlayerProfile;
}

export interface JoinMatchmakingApiResponse {
  ticket: QueueTicketResponse;
}

export interface MatchmakingStatusApiResponse {
  ticket: Omit<MatchmakingTicket, 'authUserId' | 'playerId'>;
  matchFound?: MatchFoundPayload;
}

export interface CancelMatchmakingApiResponse {
  cancelled: boolean;
  ticketId: string;
  status: MatchmakingTicket['status'];
}

export interface MatchMetadataApiResponse {
  match: Match;
  wsEndpointPath: string;
  wsJoinTicket: string;
}

export interface MatchResultApiResponse {
  result: MatchResult;
}

export interface LeaderboardApiResponse {
  players: LeaderboardPlayer[];
  totalCount: number;
  seasonName: string;
}

export interface MyProfileApiResponse {
  profile: PlayerProfile;
}

export type JoinMatchmakingPayload = MatchmakingRequest;
