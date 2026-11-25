// Centralized Initial Competitive Profile Defaults for CountryRush
// Used exclusively on the server / database trigger when provisioning new accounts.
// Prevents arbitrary client assignment of initial rank, RP, MMR, currency, or level.

import type { RankTier, RankDivision } from '../types/player';
import { DEFAULT_AVATAR_ID } from './avatars';

export interface InitialPlayerProfileConfig {
  defaultTag: string;
  defaultTitle: string;
  defaultAvatarId: string;
  initialLevel: number;
  initialXp: number;
  xpPerLevelBase: number;
  initialRankTier: RankTier;
  initialRankDivision: RankDivision;
  initialRankPoints: number;
  initialMMR: number;
  initialMmrUncertainty: number;
  initialRushTokens: number;
  initialStarGems: number;
  currentSeasonId: string;
  currentSeasonName: string;
  seasonDaysRemaining: number;
  defaultFavoriteContinent: string;
}

export const INITIAL_PLAYER_PROFILE_CONFIG: InitialPlayerProfileConfig = {
  defaultTag: 'GLB1',
  defaultTitle: 'Rookie Cartographer',
  defaultAvatarId: DEFAULT_AVATAR_ID,
  initialLevel: 1,
  initialXp: 0,
  xpPerLevelBase: 500,
  initialRankTier: 'Bronze',
  initialRankDivision: 'III',
  initialRankPoints: 0,
  initialMMR: 400, // Aligns directly with Bronze III targetMMR in rankConfig.ts
  initialMmrUncertainty: 50,
  initialRushTokens: 250,
  initialStarGems: 25,
  currentSeasonId: 'season_1',
  currentSeasonName: 'Season 1: Continental Clash',
  seasonDaysRemaining: 24,
  defaultFavoriteContinent: 'Global',
};
