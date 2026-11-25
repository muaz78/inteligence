// Shared Match, Participant, Score, State, and Result Types for CountryRush
// Server-authoritative state (held by Durable Objects) vs sanitized ClientMatchState.

import type { RankTier, RankDivision } from './player';
import type {
  ClientQuestionPayload,
  ServerQuestionRecord,
  QuestionAnswerValidation,
  DifficultyDistribution,
  QuestionDifficulty,
} from './question';
import type { BotProfile } from './bot';
import type { ChatMessage } from './chat';

// Re-export RpProgression / MmrAdjustment or keep local imports clean
export type { RankTier, RankDivision };

export type MatchMode = 'ranked_1v1' | 'ranked_2v2' | 'quickplay' | 'daily' | 'custom';

export type MatchStatus =
  | 'initializing'
  | 'waiting_for_players'
  | 'starting'
  | 'in_progress'
  | 'round_intermission'
  | 'completed'
  | 'abandoned';

export type MatchPhase =
  | 'lobby_sync'
  | 'countdown'
  | 'question_active'
  | 'round_reveal'
  | 'match_summary';

export type TeamId = 'team_alpha' | 'team_beta' | 'solo';

export type ParticipantType = 'human' | 'bot';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export interface ScoreBreakdown {
  basePoints: number;
  speedBonus: number;
  streakMultiplier: number;
  hintPenalty: number;
  totalAwarded: number;
}

export interface ParticipantScore {
  participantId: string;
  totalScore: number;
  currentStreak: number;
  maxStreak: number;
  correctCount: number;
  answeredCount: number;
  totalResponseTimeMs: number;
}

export interface MatchParticipant {
  participantId: string;
  playerId: string; // Supabase profile ID or Bot ID
  participantType: ParticipantType;
  teamId: TeamId;
  username: string;
  tag: string;
  avatarSeed: string;
  countryCode?: string;
  rankTier: RankTier;
  rankDivision?: RankDivision;
  rankPoints: number;
  mmr: number; // Server-side matchmaking anchor; omitted/masked if needed
  connectionStatus: ConnectionStatus;
  hasAnsweredCurrentRound: boolean;
  lastAnswerTimeMs?: number;
  score: ParticipantScore;
  botProfileId?: string;
}

export interface RoundState {
  roundNumber: number;
  totalRounds: number;
  questionId: string;
  startedAtMs: number;
  endsAtMs: number;
  durationSec: number;
  hintsRevealedByParticipant: Record<string, number>;
  submissionsByParticipant: Record<
    string,
    {
      selectedOptionIndex: number;
      submittedAtMs: number;
      responseTimeMs: number;
    }
  >;
  outcomesByParticipant?: Record<string, QuestionAnswerValidation>;
}

export interface MatchConfig {
  mode: MatchMode;
  totalRounds: number;
  roundDurationSec: number;
  intermissionDurationSec: number;
  isRanked: boolean;
  isRated: boolean; // False when quickplay OR when AI fallback bot participates in prototype phase
  hasBotFallback: boolean;
  rankAnchor: string;
  targetDistribution?: DifficultyDistribution;
}

export interface Match {
  id: string;
  mode: MatchMode;
  status: MatchStatus;
  region?: string;
  config: MatchConfig;
  participantIds: string[];
  createdAtMs: number;
  startedAtMs?: number;
  endedAtMs?: number;
}

/**
 * Full Authoritative Server-Side Match State stored inside Cloudflare Durable Object.
 * Contains hidden ServerQuestionRecord[] (with answer keys), bot schedules, and anti-cheat clocks.
 * NEVER serialized directly over WebSockets to browsers.
 */
export interface AuthoritativeMatchState {
  matchId: string;
  durableObjectId: string;
  status: MatchStatus;
  phase: MatchPhase;
  config: MatchConfig;
  participants: Record<string, MatchParticipant>;
  botProfiles: Record<string, BotProfile>;
  questionSequence: ServerQuestionRecord[];
  sequenceSeed: string;
  currentRoundNumber: number;
  currentRound: RoundState | null;
  completedRounds: RoundState[];
  chatLog: ChatMessage[];
  createdAtMs: number;
  phaseEndsAtMs: number;
  version: number; // Monotonic state version for sync validation
}

/**
 * Sanitized Client Match State projected by the server and sent over WebSocket.
 * Strips all future questions and strips answer keys from the active round question.
 */
export interface ClientMatchState {
  matchId: string;
  status: MatchStatus;
  phase: MatchPhase;
  config: MatchConfig;
  participants: MatchParticipant[];
  currentRoundNumber: number;
  totalRounds: number;
  activeQuestion: ClientQuestionPayload | null;
  roundStartedAtMs: number | null;
  roundEndsAtMs: number | null;
  serverNowMs: number;
  lastRoundOutcomes?: Record<string, QuestionAnswerValidation>;
  revealedHintsForMe?: string[];
  version: number;
}

export interface ParticipantMatchResult {
  participantId: string;
  playerId: string;
  participantType: ParticipantType;
  teamId: TeamId;
  username: string;
  avatarSeed: string;
  isWinner: boolean;
  finalScore: number;
  accuracyPercent: number;
  correctCount: number;
  totalRounds: number;
  maxStreak: number;
  avgResponseTimeMs: number;
  rpBefore: number;
  rpAfter: number;
  rpDelta: number;
  mmrBefore: number;
  mmrAfter: number;
  mmrDelta: number;
  xpAwarded: number;
  rushTokensAwarded: number;
}

export interface MatchResult {
  matchId: string;
  mode: MatchMode;
  winningTeam: TeamId | 'draw';
  durationMs: number;
  completedAtMs: number;
  participantResults: ParticipantMatchResult[];
  difficultySummary: Record<QuestionDifficulty, number>;
}
