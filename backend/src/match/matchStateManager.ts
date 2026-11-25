// Authoritative Server-Side Match State Manager & Projection Sanitizer
// Ensures clients NEVER receive hidden answer keys or future round questions.

import type {
  AuthoritativeMatchState,
  ClientMatchState,
  ScoreBreakdown,
} from '../../../shared/types/match';
import type {
  ClientQuestionPayload,
  QuestionAnswerSubmission,
  QuestionAnswerValidation,
  ServerQuestionRecord,
} from '../../../shared/types/question';
import { GAME_RULES } from '../../../shared/constants/gameRules';

/**
 * Strips sensitive answer keys (`correctCountry`, `correctOptionIndex`) from a ServerQuestionRecord
 * before transmitting the active round question to browsers over WebSocket.
 */
export function sanitizeQuestionForClient(
  question: ServerQuestionRecord,
  roundNumber: number
): ClientQuestionPayload {
  return {
    id: question.id,
    roundNumber,
    category: question.category,
    format: question.format,
    prompt: question.prompt,
    options: question.options,
    difficulty: question.difficulty,
    mediaRef: question.mediaRef,
    hintsCount: question.hints ? question.hints.length : 0,
    tags: question.tags,
  };
}

/**
 * Projects full Durable Object `AuthoritativeMatchState` into sanitized `ClientMatchState`.
 */
export function projectClientMatchState(
  authState: AuthoritativeMatchState,
  recipientParticipantId: string,
  serverNowMs: number = Date.now()
): ClientMatchState {
  const activeQuestionRecord =
    authState.currentRoundNumber >= 1 &&
    authState.currentRoundNumber <= authState.questionSequence.length
      ? authState.questionSequence[authState.currentRoundNumber - 1]
      : null;

  const activeQuestion =
    authState.phase === 'question_active' && activeQuestionRecord
      ? sanitizeQuestionForClient(activeQuestionRecord, authState.currentRoundNumber)
      : null;

  const revealedCount =
    authState.currentRound?.hintsRevealedByParticipant[recipientParticipantId] ?? 0;

  const revealedHintsForMe =
    activeQuestionRecord?.hints && revealedCount > 0
      ? activeQuestionRecord.hints.slice(0, revealedCount)
      : undefined;

  return {
    matchId: authState.matchId,
    status: authState.status,
    phase: authState.phase,
    config: authState.config,
    participants: Object.values(authState.participants),
    currentRoundNumber: authState.currentRoundNumber,
    totalRounds: authState.config.totalRounds,
    activeQuestion,
    roundStartedAtMs: authState.currentRound?.startedAtMs ?? null,
    roundEndsAtMs: authState.currentRound?.endsAtMs ?? null,
    serverNowMs,
    lastRoundOutcomes: authState.currentRound?.outcomesByParticipant,
    revealedHintsForMe,
    version: authState.version,
  };
}

/**
 * Pure server-side authoritative score calculator using shared rules.
 * Client clocks are ignored; `responseTimeMs` is computed from DO `round.startedAtMs`.
 */
export function calculateAuthoritativeScore(params: {
  isCorrect: boolean;
  responseTimeMs: number;
  currentStreak: number;
  hintsRevealedCount: number;
}): ScoreBreakdown {
  if (!params.isCorrect) {
    return {
      basePoints: 0,
      speedBonus: 0,
      streakMultiplier: 1.0,
      hintPenalty: 0,
      totalAwarded: 0,
    };
  }

  const basePoints = GAME_RULES.BASE_CORRECT_POINTS;
  let speedBonus = 0;
  if (params.responseTimeMs <= GAME_RULES.FAST_SPEED_THRESHOLD_MS) {
    speedBonus = GAME_RULES.FAST_SPEED_BONUS_POINTS;
  } else if (params.responseTimeMs <= GAME_RULES.MEDIUM_SPEED_THRESHOLD_MS) {
    speedBonus = GAME_RULES.MEDIUM_SPEED_BONUS_POINTS;
  }

  const streakMultiplier = Math.min(
    1.0 + params.currentStreak * GAME_RULES.STREAK_STEP_MULTIPLIER,
    GAME_RULES.MAX_STREAK_MULTIPLIER
  );

  const hintPenalty = params.hintsRevealedCount * GAME_RULES.HINT_PENALTY_POINTS;
  const rawAwarded = Math.round((basePoints + speedBonus) * streakMultiplier) - hintPenalty;

  return {
    basePoints,
    speedBonus,
    streakMultiplier,
    hintPenalty,
    totalAwarded: Math.max(0, rawAwarded),
  };
}

export interface MatchStateManagerContract {
  validateSubmission(
    state: AuthoritativeMatchState,
    participantId: string,
    submission: QuestionAnswerSubmission,
    serverNowMs: number
  ): { valid: boolean; reason?: string };
  computeRoundOutcomes(
    state: AuthoritativeMatchState,
    serverNowMs: number
  ): Record<string, QuestionAnswerValidation>;
}
