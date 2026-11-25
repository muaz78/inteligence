// CountryRush Database Repository Contracts (Supabase PostgreSQL)
// Defines clean domain persistence boundaries for Phases 2, 4, 6, and 8.

import type { PlayerProfile, LeaderboardPlayer, RankTier, RankDivision } from '../../../shared/types/player';
import type { ServerQuestionRecord, QuestionCategory, QuestionDifficulty } from '../../../shared/types/question';
import type { Match, MatchResult } from '../../../shared/types/match';

export interface PlayerRepositoryContract {
  getProfileByAuthUserId(authUserId: string): Promise<PlayerProfile | null>;
  getProfileByPlayerId(playerId: string): Promise<PlayerProfile | null>;
  ensureProfileForAuthUser(authUserId: string, defaultUsername: string): Promise<PlayerProfile>;
  updateCompetitiveRatings(params: {
    playerId: string;
    newRP: number;
    newMMR: number;
    newTier: RankTier;
    newDivision?: RankDivision;
    won: boolean;
  }): Promise<void>;
}

export interface QuestionRepositoryContract {
  fetchVerifiedQuestions(filters?: {
    allowedDifficulties?: QuestionDifficulty[];
    categories?: QuestionCategory[];
    excludeIds?: string[];
    limit?: number;
  }): Promise<ServerQuestionRecord[]>;
  recordQuestionTelemetry(params: {
    questionId: string;
    wasCorrect: boolean;
    responseTimeMs: number;
  }): Promise<void>;
}

export interface AntiRepeatRepositoryContract {
  getRecentQuestionIds(playerIds: string[], limit?: number): Promise<string[]>;
  recordMatchQuestionHistory(matchId: string, playerIds: string[], questionIds: string[]): Promise<void>;
}

export interface MatchRepositoryContract {
  createMatchRecord(match: Match): Promise<void>;
  saveMatchResult(result: MatchResult): Promise<void>;
  getMatchById(matchId: string): Promise<Match | null>;
  isPlayerMatchParticipant(matchId: string, playerId: string): Promise<boolean>;
}

export interface LeaderboardRepositoryContract {
  getTopPlayers(seasonId: string, limit?: number, offset?: number): Promise<LeaderboardPlayer[]>;
}
