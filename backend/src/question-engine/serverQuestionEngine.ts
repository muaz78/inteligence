// Authoritative Server-Side RAQE Question Engine Foundation (Phase 6 Target)
// Keeps question selection, difficulty calibration, anti-repeat filtering,
// and correct answer verification strictly on the server (Cloudflare Workers / DO).

import type {
  MatchSelectionConfig,
  ServerQuestionRecord,
  DifficultyDistribution,
  QuestionCategory,
  QuestionDifficulty,
} from '../../../shared/types/question';
import { PhaseNotImplementedError } from '../config/env';

export interface ServerGeneratedMatchQuestions {
  matchId: string;
  seed: string;
  rankAnchor: string;
  targetDistribution: DifficultyDistribution;
  actualDistribution: Record<QuestionDifficulty, number>;
  categoryBreakdown: Record<QuestionCategory, number>;
  questions: ServerQuestionRecord[];
}

export interface ServerQuestionEngineContract {
  generateAuthoritativeMatchSequence(
    config: MatchSelectionConfig,
    participantIds: string[]
  ): Promise<ServerGeneratedMatchQuestions>;
}

export class Phase1ServerQuestionEngine implements ServerQuestionEngineContract {
  public async generateAuthoritativeMatchSequence(
    _config: MatchSelectionConfig,
    _participantIds: string[]
  ): Promise<ServerGeneratedMatchQuestions> {
    // Phase 6 TODO:
    // 1. Query verified ServerQuestionRecord rows from Supabase PostgreSQL via QuestionRepository.
    // 2. Query combined participant recent history via AntiRepeatRepository.
    // 3. Compute rank-anchor + MMR-adjusted distribution + anti-clumping category plan.
    // 4. Lock sequence inside MatchRoomDO storage without ever exposing correct answers to clients.
    throw new PhaseNotImplementedError('Server-authoritative RAQE sequence generation', 'Phase 6');
  }
}

export const serverQuestionEngine: ServerQuestionEngineContract = new Phase1ServerQuestionEngine();
