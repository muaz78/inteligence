// Anti-Repeat Management System for CountryRush RAQE
import type { QuestionMetadata } from '../../types/question';

export interface AntiRepeatConfig {
  maxRecentHistorySize: number; // e.g. 30 questions
  penaltyWeightDecay: number;    // e.g. 0.2 multiplier if question was in recent history and must be reused
}

export const DEFAULT_ANTI_REPEAT_CONFIG: AntiRepeatConfig = {
  maxRecentHistorySize: 30,
  penaltyWeightDecay: 0.15,
};

class AntiRepeatService {
  private localPlayerHistory: string[] = []; // In-memory simulated question history

  /**
   * Records questions served in a completed match into the recent history buffer.
   */
  public recordServedQuestions(questionIds: string[]): void {
    this.localPlayerHistory = [...questionIds, ...this.localPlayerHistory].slice(
      0,
      DEFAULT_ANTI_REPEAT_CONFIG.maxRecentHistorySize
    );
  }

  /**
   * Retrieves the current simulated recent question history.
   */
  public getRecentHistory(): string[] {
    return [...this.localPlayerHistory];
  }

  /**
   * Merges recent history for simulated 2v2 matches across all 4 participants.
   */
  public combineParticipantHistories(histories: string[][]): string[] {
    const combined = new Set<string>();
    histories.forEach((h) => {
      h.forEach((qId) => combined.add(qId));
    });
    return Array.from(combined);
  }

  /**
   * Filters the question pool against current match exclusions and recent history.
   * If strictly excluding recent questions would leave the pool depleted,
   * applies a weighted repetition penalty instead of crashing.
   */
  public filterEligiblePool(
    candidates: QuestionMetadata[],
    currentMatchSelectedIds: Set<string>,
    recentExcludedIds: Set<string>
  ): {
    pool: QuestionMetadata[];
    penalizedIds: Set<string>;
    fallbackTriggered: boolean;
  } {
    // 1. Strict match-level uniqueness: NEVER repeat within the same match
    const matchUnique = candidates.filter((q) => !currentMatchSelectedIds.has(q.id));

    // 2. Strict recent-history exclusion
    const cleanPool = matchUnique.filter((q) => !recentExcludedIds.has(q.id));

    if (cleanPool.length > 0) {
      return {
        pool: cleanPool,
        penalizedIds: new Set<string>(),
        fallbackTriggered: false,
      };
    }

    // 3. Graceful Fallback: If clean pool is exhausted, allow match-unique questions with penalty
    return {
      pool: matchUnique,
      penalizedIds: new Set(recentExcludedIds),
      fallbackTriggered: true,
    };
  }

  /**
   * Clears the in-memory simulated recent history buffer.
   */
  public resetHistory(): void {
    this.localPlayerHistory = [];
  }
}

export const antiRepeatManager = new AntiRepeatService();
