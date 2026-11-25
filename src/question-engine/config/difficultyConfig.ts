// Centralized Difficulty Configuration & MMR Adjuster for CountryRush
import type { QuestionDifficulty, DifficultyDistribution, RankDefinition } from '../../types/question';

export interface DifficultyLevelInfo {
  level: QuestionDifficulty;
  name: string;
  label: string;
  description: string;
  badgeColor: string;
  expectedAvgAccuracy: string;
  expectedAvgTimeSec: number;
  baseScoreReward: number;
}

export const DIFFICULTY_LEVELS: Record<QuestionDifficulty, DifficultyLevelInfo> = {
  D1: {
    level: 'D1',
    name: 'Easy',
    label: 'D1 — Easy',
    description: 'Prominent world nations, iconic global capitals, household automotive brands, world-famous landmarks.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    expectedAvgAccuracy: '80% - 95%',
    expectedAvgTimeSec: 2.5,
    baseScoreReward: 100,
  },
  D2: {
    level: 'D2',
    name: 'Normal',
    label: 'D2 — Normal',
    description: 'Major regional cities, well-known aircraft types, familiar national tech giants, celebrated natural wonders.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    expectedAvgAccuracy: '65% - 80%',
    expectedAvgTimeSec: 3.5,
    baseScoreReward: 150,
  },
  D3: {
    level: 'D3',
    name: 'Medium',
    label: 'D3 — Medium',
    description: 'Secondary cities, niche vehicle manufacturers, regional airlines, disputed borders, and sub-national geography.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    expectedAvgAccuracy: '50% - 65%',
    expectedAvgTimeSec: 4.8,
    baseScoreReward: 220,
  },
  D4: {
    level: 'D4',
    name: 'Hard',
    label: 'D4 — Hard',
    description: 'Obscure villages, specialized defense aircraft, historic legacy brands, remote island territories, and biome enclaves.',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
    expectedAvgAccuracy: '35% - 50%',
    expectedAvgTimeSec: 6.2,
    baseScoreReward: 320,
  },
  D5: {
    level: 'D5',
    name: 'Expert',
    label: 'D5 — Expert',
    description: 'Micro-villages, rare industrial manufacturers, historic forgotten airfields, archipelago enclaves, ultra-subtle clues.',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    expectedAvgAccuracy: '15% - 35%',
    expectedAvgTimeSec: 7.5,
    baseScoreReward: 450,
  },
};

// Configurable MMR adjustment sensitivity
export interface MmrTuningConfig {
  maxShiftPercentage: number; // Maximum % that can be shifted by MMR deviation (e.g. 10%)
  mmrDeviationCap: number;    // MMR gap that triggers maximum shift (e.g. 150 MMR)
  clampWithinRankBounds: boolean;
}

export const DEFAULT_MMR_TUNING: MmrTuningConfig = {
  maxShiftPercentage: 12,
  mmrDeviationCap: 150,
  clampWithinRankBounds: true,
};

/**
 * Calculates the final MMR-adjusted difficulty distribution for a match.
 * 
 * Rules:
 * 1. The rank sets the baseline distribution and strict allowed difficulties.
 * 2. If MMR is above targetMMR, weight shifts toward the higher allowed difficulties.
 * 3. If MMR is below targetMMR, weight shifts toward lower allowed difficulties.
 * 4. Never introduces difficulty outside of rankDefinition.allowedDifficulties.
 * 5. Guarantees percentages sum to exactly 100%.
 */
export function calculateAdjustedDistribution(
  rank: RankDefinition,
  playerMmr: number,
  tuning: MmrTuningConfig = DEFAULT_MMR_TUNING
): DifficultyDistribution {
  const allowed = rank.allowedDifficulties;
  const mmrDelta = playerMmr - rank.targetMMR;

  // Normalized shift factor: -1.0 to +1.0
  const normalizedDelta = Math.max(-1, Math.min(1, mmrDelta / tuning.mmrDeviationCap));
  const shiftAmount = Math.round(normalizedDelta * tuning.maxShiftPercentage);

  // Start with a clone of base distribution
  const adjusted: DifficultyDistribution = { ...rank.baseDistribution };

  if (shiftAmount !== 0 && allowed.length >= 2) {
    if (shiftAmount > 0) {
      // Shift from the lowest allowed difficulty to the highest allowed difficulty
      const lowestAllowed = allowed[0];
      const highestAllowed = allowed[allowed.length - 1];

      const actualShift = Math.min(shiftAmount, adjusted[lowestAllowed]);
      adjusted[lowestAllowed] -= actualShift;
      adjusted[highestAllowed] += actualShift;
    } else {
      // Shift from highest allowed difficulty to lowest allowed
      const lowestAllowed = allowed[0];
      const highestAllowed = allowed[allowed.length - 1];

      const actualShift = Math.min(Math.abs(shiftAmount), adjusted[highestAllowed]);
      adjusted[highestAllowed] -= actualShift;
      adjusted[lowestAllowed] += actualShift;
    }
  }

  // Strict clamp: enforce 0% for non-allowed difficulties
  const allDifficulties: QuestionDifficulty[] = ['D1', 'D2', 'D3', 'D4', 'D5'];
  allDifficulties.forEach((d) => {
    if (!allowed.includes(d)) {
      adjusted[d] = 0;
    }
  });

  // Normalize so total is exactly 100%
  const total = Object.values(adjusted).reduce((a, b) => a + b, 0);
  if (total !== 100 && total > 0) {
    const diff = 100 - total;
    // Add discrepancy to the most prominent allowed difficulty
    const primaryAllowed = allowed[Math.floor(allowed.length / 2)];
    adjusted[primaryAllowed] += diff;
  }

  return adjusted;
}
