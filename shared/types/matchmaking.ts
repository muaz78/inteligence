// Shared Matchmaking Request, Ticket, and Queue Status Types for CountryRush
// Real Matchmaking (Phase 4) & 20-Second AI Fallback (Phase 5).

import type { RankTier, RankDivision } from './player';
import type { MatchMode, ParticipantType, TeamId } from './match';

export type MatchmakingRegion = 'global' | 'eu_west' | 'us_east' | 'ap_northeast';

export type MatchmakingStatus =
  | 'queued'
  | 'expanding_mmr'
  | 'ai_fallback_pending'
  | 'match_found'
  | 'cancelled'
  | 'expired';

export interface MatchmakingRequest {
  mode: Extract<MatchMode, 'ranked_1v1' | 'ranked_2v2' | 'quickplay'>;
  region: MatchmakingRegion;
  partyMemberIds?: string[]; // Reserved for future duo party support
  clientRequestedAtMs?: number;
}

export interface MatchedParticipantSummary {
  participantId: string;
  publicPlayerId?: string;
  participantType: ParticipantType;
  teamId: TeamId;
  username: string;
  tag: string;
  avatarSeed: string;
  countryCode?: string;
  rankTier: RankTier;
  rankDivision?: RankDivision;
  rankPoints: number;
  isBot: boolean;
}

export interface MatchFoundPayload {
  matchId: string;
  wsEndpointPath: string;
  wsJoinTicket: string;
  mode: MatchMode;
  region: MatchmakingRegion;
  rankAnchor: string;
  includesBotOpponent: boolean;
  isRated: boolean;
  foundAtMs: number;
  myParticipantId: string;
  participants: MatchedParticipantSummary[];
}

/**
 * Authoritative matchmaking ticket stored inside Cloudflare MatchmakingQueueDO storage.
 * Player identity, rank, RP, and MMR are always resolved server-side from Supabase.
 */
export interface MatchmakingTicket {
  ticketId: string;
  playerId: string;        // Internal profiles.id UUID (server-side)
  authUserId: string;      // Verified Supabase auth.users.id
  publicPlayerId: string;  // CR-XXXXXXXX
  username: string;
  tag: string;
  avatarSeed: string;
  countryCode?: string;
  mode: MatchmakingRequest['mode'];
  region: MatchmakingRegion;
  rankTier: RankTier;
  rankDivision?: RankDivision;
  rankPoints: number;
  mmr: number;
  mmrToleranceRange: number;
  partyId?: string;
  status: MatchmakingStatus;
  enqueuedAtMs: number;
  expandedAtMs?: number;
  botFallbackDeadlineMs: number; // Strictly enqueuedAtMs + 20_000
  lastPolledAtMs: number;
  matchedMatchId?: string;
  matchedSummary?: Omit<MatchFoundPayload, 'wsJoinTicket' | 'myParticipantId'>;
  myParticipantId?: string;
}

export interface MatchmakingFallbackConfig {
  fallbackDelayMs: number; // 20,000 ms (20 seconds)
  initialMmrWindow: number; // 120 MMR
  expandedMmrWindow: number; // 300 MMR
  expandAfterMs: number; // 10,000 ms (10 seconds)
}

export interface QueueTicketResponse {
  ticket: Omit<MatchmakingTicket, 'authUserId' | 'playerId'>;
  estimatedWaitSec: number;
  queueDepthHint?: number;
  matchFound?: MatchFoundPayload;
}
