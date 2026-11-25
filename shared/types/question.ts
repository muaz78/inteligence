// Shared Question, Answer, Difficulty, and RAQE Types for CountryRush
// Critically separates ServerQuestionRecord (authoritative answer key)
// from ClientQuestionPayload (sanitized projection without answer key).

import type { RankTier, RankDivision } from './player';

export type QuestionDifficulty = 'D1' | 'D2' | 'D3' | 'D4' | 'D5';

export type QuestionCategory =
  | 'automotive'
  | 'aviation'
  | 'cities'
  | 'villages'
  | 'technology'
  | 'brands'
  | 'landmarks'
  | 'nature'
  | 'geography'
  | 'culture';

export type QuestionFormat =
  | 'image'
  | 'silhouette'
  | 'clue'
  | 'progressive_reveal'
  | 'standard_choice';

export interface QuestionStatistics {
  totalAttempts: number;
  correctCount: number;
  correctRate: number; // 0.0 - 1.0
  avgResponseTimeMs: number;
  lastUsedTimestamp?: number;
  difficultyRatingSample?: number;
}

export interface QuestionMediaRef {
  type:
    | 'flag'
    | 'landmark_icon'
    | 'vehicle_silhouette'
    | 'aircraft_crest'
    | 'brand_mark'
    | 'nature_feature'
    | 'photo';
  displayKey: string;
  caption?: string;
  assetUrl?: string;
  source?: string;
  license?: string;
  attribution?: string;
}

/**
 * Full QuestionMetadata used by the local frontend RAQE preview & prototype.
 */
export interface QuestionMetadata {
  id: string;
  category: QuestionCategory;
  format: QuestionFormat;
  prompt: string;
  correctCountry: string;
  countryCode?: string;
  options: [string, string, string, string];
  difficulty: QuestionDifficulty;
  verified: boolean;
  mediaRef?: QuestionMediaRef;
  hints?: string[];
  stats: QuestionStatistics;
  tags: string[];
  lastUsedTimestamp?: number;
}

/**
 * Authoritative Server Question Record stored in Supabase PostgreSQL
 * and held inside the Cloudflare Durable Object. NEVER transmitted directly
 * to connected WebSocket clients while a round is active.
 */
export interface ServerQuestionRecord extends QuestionMetadata {
  correctOptionIndex: 0 | 1 | 2 | 3;
  updatedAt?: string;
}

/**
 * Sanitized Question Payload transmitted by the Durable Object to clients
 * at the start of a round. Omits `correctCountry`, `countryCode`, and `correctOptionIndex`.
 */
export interface ClientQuestionPayload {
  id: string;
  roundNumber: number;
  category: QuestionCategory;
  format: QuestionFormat;
  prompt: string;
  options: [string, string, string, string];
  difficulty: QuestionDifficulty;
  mediaRef?: QuestionMediaRef;
  hintsCount: number;
  tags: string[];
}

/**
 * Answer submission sent from client to authoritative Durable Object via WebSocket.
 */
export interface QuestionAnswerSubmission {
  matchId: string;
  roundNumber: number;
  questionId: string;
  selectedOptionIndex: 0 | 1 | 2 | 3;
  selectedCountry: string;
  clientSubmittedAtMs?: number; // Informational only; server clock is authoritative
}

/**
 * Authoritative server-side answer validation outcome returned when a round ends or locks.
 */
export interface QuestionAnswerValidation {
  participantId: string;
  questionId: string;
  roundNumber: number;
  selectedOptionIndex: number | null;
  isCorrect: boolean;
  correctOptionIndex: 0 | 1 | 2 | 3;
  correctCountry: string;
  responseTimeMs: number;
  basePoints: number;
  speedBonus: number;
  streakBonus: number;
  totalPointsAwarded: number;
  serverValidatedAtMs: number;
}

export type DifficultyDistribution = Record<QuestionDifficulty, number>;

export interface RankDefinition {
  tier: RankTier;
  division?: RankDivision;
  displayName: string;
  minRP: number;
  maxRP: number;
  targetMMR: number;
  minMMR: number;
  maxMMR: number;
  allowedDifficulties: QuestionDifficulty[];
  baseDistribution: DifficultyDistribution;
}

export interface CategoryDefinition {
  id: QuestionCategory;
  displayName: string;
  shortLabel: string;
  iconName: string;
  description: string;
  weight: number;
  cooldownRounds: number;
  maxPerMatch: number;
}

export interface MatchSelectionConfig {
  matchId: string;
  mode: '1v1' | '2v2' | 'quickplay' | 'daily' | 'custom';
  totalRounds: number;
  primaryRankTier: RankTier;
  primaryRankDivision?: RankDivision;
  playerMMRs: number[];
  recentQuestionIds?: string[];
  allowRepeatsIfExhausted?: boolean;
  categoryBlacklist?: QuestionCategory[];
}

export interface QuestionValidationResult {
  isValid: boolean;
  questionId: string;
  errors: string[];
  warnings: string[];
}

export interface GeneratedMatchSequence {
  matchId: string;
  lockedAtTimestamp: number;
  seed: string;
  rankAnchor: string;
  targetDistribution: DifficultyDistribution;
  actualDistribution: Record<QuestionDifficulty, number>;
  categoryBreakdown: Record<QuestionCategory, number>;
  questions: QuestionMetadata[];
  validationReport: {
    totalEvaluated: number;
    passedVerification: number;
    antiRepeatFilteredCount: number;
    repetitionPenaltyApplied: boolean;
  };
}

export interface CalibrationCandidate {
  questionId: string;
  currentDifficulty: QuestionDifficulty;
  suggestedDifficulty: QuestionDifficulty;
  sampleSize: number;
  confidenceScore: number;
  reason: string;
}
