// Centralized Category Configuration & Rotation Constraints for CountryRush
import type { QuestionCategory, CategoryDefinition } from '../../types/question';

export const ALL_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'automotive',
    displayName: 'Cars & Automotive',
    shortLabel: 'Cars',
    iconName: 'Car',
    description: 'Automotive manufacturers, iconic rally machines, national supercars, and assembly hubs.',
    weight: 12,
    cooldownRounds: 2,
    maxPerMatch: 2,
  },
  {
    id: 'aviation',
    displayName: 'Aircraft & Aviation',
    shortLabel: 'Aviation',
    iconName: 'Plane',
    description: 'Commercial flag carriers, aerospace champions, regional airframes, and famous test airfields.',
    weight: 11,
    cooldownRounds: 2,
    maxPerMatch: 2,
  },
  {
    id: 'cities',
    displayName: 'Cities & Metropolises',
    shortLabel: 'Cities',
    iconName: 'Building2',
    description: 'Urban capitals, coastal port hubs, historic city-states, and skyline identifiers.',
    weight: 14,
    cooldownRounds: 2,
    maxPerMatch: 2,
  },
  {
    id: 'villages',
    displayName: 'Villages & Rural Locations',
    shortLabel: 'Villages',
    iconName: 'Home',
    description: 'Idyllic alpine hamlets, historic medieval villages, remote farming settlements, and enclaves.',
    weight: 10,
    cooldownRounds: 2,
    maxPerMatch: 2,
  },
  {
    id: 'technology',
    displayName: 'Technology & Innovations',
    shortLabel: 'Tech',
    iconName: 'Cpu',
    description: 'Semiconductor powerhouses, space agencies, software pioneers, and high-tech infrastructure.',
    weight: 11,
    cooldownRounds: 2,
    maxPerMatch: 2,
  },
  {
    id: 'brands',
    displayName: 'Brands & Industry',
    shortLabel: 'Brands',
    iconName: 'Tag',
    description: 'Global luxury maisons, electronics titans, retail powerhouses, and historic trade companies.',
    weight: 10,
    cooldownRounds: 2,
    maxPerMatch: 2,
  },
  {
    id: 'landmarks',
    displayName: 'Landmarks & Architecture',
    shortLabel: 'Landmarks',
    iconName: 'Landmark',
    description: 'Ancient monuments, futuristic bridges, gothic cathedrals, and UNESCO heritage wonders.',
    weight: 13,
    cooldownRounds: 2,
    maxPerMatch: 2,
  },
  {
    id: 'nature',
    displayName: 'Nature & Landscapes',
    shortLabel: 'Nature',
    iconName: 'Trees',
    description: 'Glaciers, volcanic calderas, tropical archipelago reefs, fjord systems, and wildlife reserves.',
    weight: 11,
    cooldownRounds: 2,
    maxPerMatch: 2,
  },
  {
    id: 'geography',
    displayName: 'Geography & Borders',
    shortLabel: 'Geography',
    iconName: 'Compass',
    description: 'Disputed borders, tripoints, exclaves, strategic straits, and continental extremes.',
    weight: 14,
    cooldownRounds: 2,
    maxPerMatch: 2,
  },
  {
    id: 'culture',
    displayName: 'Culture & Traditions',
    shortLabel: 'Culture',
    iconName: 'Palette',
    description: 'National instruments, gastronomy traditions, folk festivals, and historic sports.',
    weight: 8,
    cooldownRounds: 3,
    maxPerMatch: 1,
  },
];

export function getCategoryDefinition(id: QuestionCategory): CategoryDefinition {
  return (
    ALL_CATEGORIES.find((c) => c.id === id) || {
      id,
      displayName: id.charAt(0).toUpperCase() + id.slice(1),
      shortLabel: id,
      iconName: 'Globe',
      description: 'General geography category',
      weight: 10,
      cooldownRounds: 2,
      maxPerMatch: 2,
    }
  );
}

/**
 * Creates an intelligent, randomized category rotation sequence for a match.
 * Prevents consecutive duplicates and enforces variety across categories.
 */
export function generateCategoryPlan(
  roundsCount: number,
  blacklist: QuestionCategory[] = []
): QuestionCategory[] {
  const eligibleCategories = ALL_CATEGORIES.filter((c) => !blacklist.includes(c.id));
  if (eligibleCategories.length === 0) return ['geography'];

  const plan: QuestionCategory[] = [];
  const categoryCounts: Record<string, number> = {};

  // Shuffle categories using Fisher-Yates
  const pool = [...eligibleCategories];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  let poolIdx = 0;

  for (let r = 0; r < roundsCount; r++) {
    // Look for next category that is not the same as the previous round
    const prevCategory = plan[r - 1];
    let candidate = pool[poolIdx % pool.length].id;

    // Avoid immediate back-to-back same category if possible
    if (candidate === prevCategory && eligibleCategories.length > 1) {
      poolIdx++;
      candidate = pool[poolIdx % pool.length].id;
    }

    // Check match cap
    const currentCount = categoryCounts[candidate] || 0;
    const catDef = getCategoryDefinition(candidate);
    if (currentCount >= catDef.maxPerMatch && eligibleCategories.length > plan.length) {
      // Find an unused category
      const unused = eligibleCategories.find((c) => (categoryCounts[c.id] || 0) < c.maxPerMatch);
      if (unused) {
        candidate = unused.id;
      }
    }

    plan.push(candidate);
    categoryCounts[candidate] = (categoryCounts[candidate] || 0) + 1;
    poolIdx++;
  }

  return plan;
}
