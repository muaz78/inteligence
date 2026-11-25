// CountryRush — Rank-Aware Adaptive Question Engine (RAQE)
// 13-Step Modular Question Selection Engine
import type { 
  QuestionMetadata, 
  MatchSelectionConfig, 
  GeneratedMatchSequence,
  QuestionDifficulty,
  QuestionCategory,
  DifficultyDistribution,
} from '../../types/question';
import { calculateMatchRankAnchor, getRankDefinition } from '../config/rankConfig';
import { calculateAdjustedDistribution } from '../config/difficultyConfig';
import { generateCategoryPlan } from '../config/categoryConfig';
import { filterVerifiedQuestions } from '../validation/questionValidator';
import { antiRepeatManager } from '../antiRepeat/antiRepeatManager';
import { MOCK_QUESTION_POOL } from '../data/mockQuestionPool';

export interface SelectionEngineOptions {
  customPool?: QuestionMetadata[];
  customSeed?: string;
}

/**
 * Executes the complete 13-step RAQE sequence to generate a fair, rank-calibrated, locked match sequence.
 */
export function generateMatchQuestionSequence(
  config: MatchSelectionConfig,
  options: SelectionEngineOptions = {}
): GeneratedMatchSequence {
  // Step 1: Read the match configuration
  const totalRounds = config.totalRounds || 8;
  const matchId = config.matchId || `match_${Date.now()}`;
  const seed = options.customSeed || `seed_${Math.random().toString(36).substring(2, 9)}`;

  // Step 2: Determine the rank anchor
  const primaryAnchor = getRankDefinition(config.primaryRankTier, config.primaryRankDivision);
  const avgMMR = config.playerMMRs && config.playerMMRs.length > 0
    ? Math.round(config.playerMMRs.reduce((a, b) => a + b, 0) / config.playerMMRs.length)
    : primaryAnchor.targetMMR;

  const { anchorRank } = calculateMatchRankAnchor([
    { tier: config.primaryRankTier, division: config.primaryRankDivision, mmr: avgMMR },
  ]);

  // Step 3 & 4: Determine difficulty distribution and apply MMR adjustment
  const targetDistribution: DifficultyDistribution = calculateAdjustedDistribution(
    anchorRank,
    avgMMR
  );

  // Step 5: Create category rotation plan
  const categoryPlan = generateCategoryPlan(totalRounds, config.categoryBlacklist);

  // Step 6: Retrieve eligible questions and filter verified questions (Quality Control)
  const rawPool = options.customPool || MOCK_QUESTION_POOL;
  const { verifiedPool, rejectedCount } = filterVerifiedQuestions(rawPool);

  // Step 7 & 8: Exclude questions in current match & apply recent-question exclusion (Anti-repeat)
  const selectedInThisMatch = new Set<string>();
  const recentExclusions = new Set<string>(config.recentQuestionIds || antiRepeatManager.getRecentHistory());

  const { pool: eligiblePool, penalizedIds, fallbackTriggered } = antiRepeatManager.filterEligiblePool(
    verifiedPool,
    selectedInThisMatch,
    recentExclusions
  );

  // Map out target count of questions per difficulty level for this match
  const difficultyQuotas = calculateDifficultyQuotas(totalRounds, targetDistribution, anchorRank.allowedDifficulties);

  const selectedQuestions: QuestionMetadata[] = [];
  const categoryBreakdown: Record<QuestionCategory, number> = {
    automotive: 0,
    aviation: 0,
    cities: 0,
    villages: 0,
    technology: 0,
    brands: 0,
    landmarks: 0,
    nature: 0,
    geography: 0,
    culture: 0,
  };

  const actualDistribution: Record<QuestionDifficulty, number> = {
    D1: 0,
    D2: 0,
    D3: 0,
    D4: 0,
    D5: 0,
  };

  // Step 9, 10 & 11: Step-by-step selection applying category plan, difficulty quotas, balance rules, and weighted pick
  for (let roundIdx = 0; roundIdx < totalRounds; roundIdx++) {
    const plannedCategory = categoryPlan[roundIdx];
    const targetDifficulty = determineTargetDifficultyForRound(roundIdx, difficultyQuotas, actualDistribution);

    // Filter available candidates
    let candidates = eligiblePool.filter((q) => !selectedInThisMatch.has(q.id));

    // Try matching both category and difficulty
    let matched = candidates.filter((q) => q.category === plannedCategory && q.difficulty === targetDifficulty);

    // Fallback 1: match category with any allowed difficulty
    if (matched.length === 0) {
      matched = candidates.filter(
        (q) => q.category === plannedCategory && anchorRank.allowedDifficulties.includes(q.difficulty)
      );
    }

    // Fallback 2: match difficulty with any unselected category
    if (matched.length === 0) {
      matched = candidates.filter((q) => q.difficulty === targetDifficulty);
    }

    // Fallback 3: any allowed difficulty
    if (matched.length === 0) {
      matched = candidates.filter((q) => anchorRank.allowedDifficulties.includes(q.difficulty));
    }

    // Absolute fallback: any question in pool not already used in this match
    if (matched.length === 0) {
      matched = verifiedPool.filter((q) => !selectedInThisMatch.has(q.id));
    }

    if (matched.length === 0) {
      // Pool completely exhausted
      break;
    }

    // Step 10: Configured weighted random selection
    const chosen = pickWeightedQuestion(matched, penalizedIds);

    selectedInThisMatch.add(chosen.id);
    selectedQuestions.push(chosen);
    categoryBreakdown[chosen.category] = (categoryBreakdown[chosen.category] || 0) + 1;
    actualDistribution[chosen.difficulty] = (actualDistribution[chosen.difficulty] || 0) + 1;
  }

  // Step 12 & 13: Generate sequence and lock for match fairness
  const sequence: GeneratedMatchSequence = {
    matchId,
    lockedAtTimestamp: Date.now(),
    seed,
    rankAnchor: anchorRank.displayName,
    targetDistribution,
    actualDistribution,
    categoryBreakdown,
    questions: selectedQuestions,
    validationReport: {
      totalEvaluated: rawPool.length,
      passedVerification: verifiedPool.length,
      antiRepeatFilteredCount: recentExclusions.size,
      repetitionPenaltyApplied: fallbackTriggered,
    },
  };

  return sequence;
}

/**
 * Calculates how many questions of each difficulty level should be in a match of N rounds.
 */
function calculateDifficultyQuotas(
  rounds: number,
  dist: DifficultyDistribution,
  allowed: QuestionDifficulty[]
): Record<QuestionDifficulty, number> {
  const quotas: Record<QuestionDifficulty, number> = { D1: 0, D2: 0, D3: 0, D4: 0, D5: 0 };
  let allocated = 0;

  allowed.forEach((d) => {
    const count = Math.round((dist[d] / 100) * rounds);
    quotas[d] = count;
    allocated += count;
  });

  // Adjust for rounding variance
  if (allocated !== rounds && allowed.length > 0) {
    const diff = rounds - allocated;
    const prominent = allowed[Math.floor(allowed.length / 2)];
    quotas[prominent] = Math.max(0, quotas[prominent] + diff);
  }

  return quotas;
}

/**
 * Determines which difficulty quota is most urgently needed for the current round.
 */
function determineTargetDifficultyForRound(
  roundIdx: number,
  quotas: Record<QuestionDifficulty, number>,
  actual: Record<QuestionDifficulty, number>
): QuestionDifficulty {
  const difficulties: QuestionDifficulty[] = ['D1', 'D2', 'D3', 'D4', 'D5'];
  let maxDeficit = -999;
  let target: QuestionDifficulty = 'D3';

  difficulties.forEach((d) => {
    const needed = quotas[d] || 0;
    const current = actual[d] || 0;
    const deficit = needed - current;
    if (deficit > maxDeficit) {
      maxDeficit = deficit;
      target = d;
    }
  });

  return target;
}

/**
 * Selects a question using weighted random selection (accounting for anti-repeat penalty decays).
 */
function pickWeightedQuestion(
  candidates: QuestionMetadata[],
  penalizedIds: Set<string>
): QuestionMetadata {
  if (candidates.length === 1) return candidates[0];

  const weights = candidates.map((q) => {
    let w = 1.0;
    if (penalizedIds.has(q.id)) {
      w *= 0.2; // Repetition penalty
    }
    return w;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let randomVal = Math.random() * totalWeight;

  for (let i = 0; i < candidates.length; i++) {
    randomVal -= weights[i];
    if (randomVal <= 0) {
      return candidates[i];
    }
  }

  return candidates[0];
}
