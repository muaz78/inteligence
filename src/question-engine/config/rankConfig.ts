// Centralized Rank & MMR Configuration for CountryRush
import type { RankDefinition, QuestionDifficulty } from '../../types/question';
import type { RankTier, RankDivision } from '../../types/game';

export const ALL_RANK_DEFINITIONS: RankDefinition[] = [
  // BRONZE TIER (Base Difficulty: D1: 50%, D2: 40%, D3: 10%, D4: 0%, D5: 0%)
  {
    tier: 'Bronze',
    division: 'III',
    displayName: 'Bronze III',
    minRP: 0,
    maxRP: 165,
    targetMMR: 400,
    minMMR: 200,
    maxMMR: 500,
    allowedDifficulties: ['D1', 'D2', 'D3'],
    baseDistribution: { D1: 55, D2: 38, D3: 7, D4: 0, D5: 0 },
  },
  {
    tier: 'Bronze',
    division: 'II',
    displayName: 'Bronze II',
    minRP: 166,
    maxRP: 332,
    targetMMR: 475,
    minMMR: 350,
    maxMMR: 600,
    allowedDifficulties: ['D1', 'D2', 'D3'],
    baseDistribution: { D1: 50, D2: 40, D3: 10, D4: 0, D5: 0 },
  },
  {
    tier: 'Bronze',
    division: 'I',
    displayName: 'Bronze I',
    minRP: 333,
    maxRP: 499,
    targetMMR: 550,
    minMMR: 450,
    maxMMR: 700,
    allowedDifficulties: ['D1', 'D2', 'D3'],
    baseDistribution: { D1: 45, D2: 43, D3: 12, D4: 0, D5: 0 },
  },

  // SILVER TIER (Base Difficulty: D1: 25%, D2: 45%, D3: 25%, D4: 5%, D5: 0%)
  {
    tier: 'Silver',
    division: 'III',
    displayName: 'Silver III',
    minRP: 500,
    maxRP: 665,
    targetMMR: 700,
    minMMR: 550,
    maxMMR: 850,
    allowedDifficulties: ['D1', 'D2', 'D3', 'D4'],
    baseDistribution: { D1: 30, D2: 45, D3: 22, D4: 3, D5: 0 },
  },
  {
    tier: 'Silver',
    division: 'II',
    displayName: 'Silver II',
    minRP: 666,
    maxRP: 832,
    targetMMR: 800,
    minMMR: 680,
    maxMMR: 950,
    allowedDifficulties: ['D1', 'D2', 'D3', 'D4'],
    baseDistribution: { D1: 25, D2: 45, D3: 25, D4: 5, D5: 0 },
  },
  {
    tier: 'Silver',
    division: 'I',
    displayName: 'Silver I',
    minRP: 833,
    maxRP: 999,
    targetMMR: 900,
    minMMR: 780,
    maxMMR: 1050,
    allowedDifficulties: ['D1', 'D2', 'D3', 'D4'],
    baseDistribution: { D1: 20, D2: 46, D3: 27, D4: 7, D5: 0 },
  },

  // GOLD TIER (Base Difficulty: D1: 10%, D2: 35%, D3: 40%, D4: 15%, D5: 0%)
  {
    tier: 'Gold',
    division: 'III',
    displayName: 'Gold III',
    minRP: 1000,
    maxRP: 1132,
    targetMMR: 1100,
    minMMR: 950,
    maxMMR: 1250,
    allowedDifficulties: ['D1', 'D2', 'D3', 'D4'],
    baseDistribution: { D1: 14, D2: 38, D3: 36, D4: 12, D5: 0 },
  },
  {
    tier: 'Gold',
    division: 'II',
    displayName: 'Gold II',
    minRP: 1133,
    maxRP: 1265,
    targetMMR: 1200,
    minMMR: 1080,
    maxMMR: 1350,
    allowedDifficulties: ['D1', 'D2', 'D3', 'D4'],
    baseDistribution: { D1: 10, D2: 35, D3: 40, D4: 15, D5: 0 },
  },
  {
    tier: 'Gold',
    division: 'I',
    displayName: 'Gold I',
    minRP: 1266,
    maxRP: 1399,
    targetMMR: 1300,
    minMMR: 1180,
    maxMMR: 1450,
    allowedDifficulties: ['D1', 'D2', 'D3', 'D4'],
    baseDistribution: { D1: 7, D2: 32, D3: 43, D4: 18, D5: 0 },
  },

  // PLATINUM TIER (Base Difficulty: D1: 5%, D2: 20%, D3: 40%, D4: 30%, D5: 5%)
  {
    tier: 'Platinum',
    division: 'III',
    displayName: 'Platinum III',
    minRP: 1400,
    maxRP: 1532,
    targetMMR: 1450,
    minMMR: 1320,
    maxMMR: 1600,
    allowedDifficulties: ['D1', 'D2', 'D3', 'D4', 'D5'],
    baseDistribution: { D1: 7, D2: 23, D3: 42, D4: 25, D5: 3 },
  },
  {
    tier: 'Platinum',
    division: 'II',
    displayName: 'Platinum II',
    minRP: 1533,
    maxRP: 1665,
    targetMMR: 1550,
    minMMR: 1420,
    maxMMR: 1700,
    allowedDifficulties: ['D1', 'D2', 'D3', 'D4', 'D5'],
    baseDistribution: { D1: 5, D2: 20, D3: 40, D4: 30, D5: 5 },
  },
  {
    tier: 'Platinum',
    division: 'I',
    displayName: 'Platinum I',
    minRP: 1666,
    maxRP: 1799,
    targetMMR: 1650,
    minMMR: 1520,
    maxMMR: 1800,
    allowedDifficulties: ['D1', 'D2', 'D3', 'D4', 'D5'],
    baseDistribution: { D1: 3, D2: 17, D3: 38, D4: 34, D5: 8 },
  },

  // DIAMOND TIER (Base Difficulty: D1: 0%, D2: 10%, D3: 30%, D4: 45%, D5: 15%)
  {
    tier: 'Diamond',
    division: 'III',
    displayName: 'Diamond III',
    minRP: 1800,
    maxRP: 1932,
    targetMMR: 1850,
    minMMR: 1720,
    maxMMR: 1980,
    allowedDifficulties: ['D2', 'D3', 'D4', 'D5'],
    baseDistribution: { D1: 0, D2: 12, D3: 32, D4: 44, D5: 12 },
  },
  {
    tier: 'Diamond',
    division: 'II',
    displayName: 'Diamond II',
    minRP: 1933,
    maxRP: 2065,
    targetMMR: 1950,
    minMMR: 1820,
    maxMMR: 2080,
    allowedDifficulties: ['D2', 'D3', 'D4', 'D5'],
    baseDistribution: { D1: 0, D2: 10, D3: 30, D4: 45, D5: 15 },
  },
  {
    tier: 'Diamond',
    division: 'I',
    displayName: 'Diamond I',
    minRP: 2066,
    maxRP: 2199,
    targetMMR: 2050,
    minMMR: 1920,
    maxMMR: 2200,
    allowedDifficulties: ['D2', 'D3', 'D4', 'D5'],
    baseDistribution: { D1: 0, D2: 7, D3: 28, D4: 47, D5: 18 },
  },

  // MASTER TIER (Single Division, Base Difficulty: D1: 0%, D2: 5%, D3: 20%, D4: 45%, D5: 30%)
  {
    tier: 'Master',
    displayName: 'Master',
    minRP: 2200,
    maxRP: 2599,
    targetMMR: 2350,
    minMMR: 2150,
    maxMMR: 2550,
    allowedDifficulties: ['D2', 'D3', 'D4', 'D5'],
    baseDistribution: { D1: 0, D2: 5, D3: 20, D4: 45, D5: 30 },
  },

  // ELITE TIER (Single Division, Base Difficulty: D1: 0%, D2: 0%, D3: 10%, D4: 40%, D5: 50%)
  {
    tier: 'Elite',
    displayName: 'Elite Grandmaster',
    minRP: 2600,
    maxRP: 99999,
    targetMMR: 2750,
    minMMR: 2500,
    maxMMR: 3500,
    allowedDifficulties: ['D3', 'D4', 'D5'],
    baseDistribution: { D1: 0, D2: 0, D3: 10, D4: 40, D5: 50 },
  },
];

// Lookup by Tier & optional Division
export function getRankDefinition(tier: RankTier, division?: RankDivision): RankDefinition {
  if (tier === 'Master' || tier === 'Elite') {
    const found = ALL_RANK_DEFINITIONS.find((r) => r.tier === tier);
    return found || ALL_RANK_DEFINITIONS[ALL_RANK_DEFINITIONS.length - 1];
  }

  // Look for exact tier + division match
  const div = division || 'II';
  const found = ALL_RANK_DEFINITIONS.find((r) => r.tier === tier && r.division === div);
  if (found) return found;

  // Fallback to Tier default (Division II)
  return ALL_RANK_DEFINITIONS.find((r) => r.tier === tier) || ALL_RANK_DEFINITIONS[0];
}

// Find closest rank configuration from visible RP
export function findRankByRP(rp: number): RankDefinition {
  for (const rank of ALL_RANK_DEFINITIONS) {
    if (rp >= rank.minRP && rp <= rank.maxRP) {
      return rank;
    }
  }
  return rp > 2600 ? ALL_RANK_DEFINITIONS[ALL_RANK_DEFINITIONS.length - 1] : ALL_RANK_DEFINITIONS[0];
}

// Compute the Anchor Rank Definition for a match (supporting 1v1 and 2v2 participant averaging)
export function calculateMatchRankAnchor(
  playerTiers: { tier: RankTier; division?: RankDivision; mmr?: number }[]
): {
  anchorRank: RankDefinition;
  averageMMR: number;
  mmrDeltaFromTarget: number;
} {
  if (playerTiers.length === 0) {
    const fallback = getRankDefinition('Diamond', 'III');
    return { anchorRank: fallback, averageMMR: fallback.targetMMR, mmrDeltaFromTarget: 0 };
  }

  // Calculate average MMR
  const mmrs = playerTiers.map((p) => {
    if (p.mmr !== undefined && p.mmr > 0) return p.mmr;
    const def = getRankDefinition(p.tier, p.division);
    return def.targetMMR;
  });

  const averageMMR = Math.round(mmrs.reduce((a, b) => a + b, 0) / mmrs.length);

  // Find the primary anchor rank based on the highest-ranking player or average MMR
  const primary = playerTiers[0];
  const anchorRank = getRankDefinition(primary.tier, primary.division);
  const mmrDeltaFromTarget = averageMMR - anchorRank.targetMMR;

  return {
    anchorRank,
    averageMMR,
    mmrDeltaFromTarget,
  };
}
