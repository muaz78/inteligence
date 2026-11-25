// Shared Player, Rank, MMR, and Progression Types for CountryRush
// Single source of truth consumed by Frontend (src/) and Backend (backend/).

export type RankTier =
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Diamond'
  | 'Master'
  | 'Elite';

export type RankDivision = 'III' | 'II' | 'I';

export interface RankInfo {
  tier: RankTier;
  division?: RankDivision;
  displayName: string;
}

export interface MmrRating {
  value: number;
  uncertainty: number; // Volatility / confidence factor for rating systems
  peakValue: number;
  lastUpdatedAt?: string;
}

export interface MmrBand {
  tier: RankTier;
  division?: RankDivision;
  minMMR: number;
  targetMMR: number;
  maxMMR: number;
}

export interface MmrAdjustment {
  previousMMR: number;
  newMMR: number;
  delta: number;
  matchId: string;
}

export type RpDeltaReason =
  | 'ranked_win'
  | 'ranked_loss'
  | 'speed_bonus'
  | 'streak_bonus'
  | 'promotion_protection'
  | 'season_decay';

export interface RpProgression {
  rankPoints: number;
  peakRankPoints: number;
  rankTier: RankTier;
  rankDivision?: RankDivision;
  delta?: number;
  reason?: RpDeltaReason;
}

export interface SeasonProgression {
  seasonId: string;
  seasonName: string;
  daysRemaining: number;
  rankTier: RankTier;
  rankDivision?: RankDivision;
  rankPoints: number;
  peakRankPoints: number;
}

export interface ContinentMastery {
  continent: string;
  accuracy: number;
  gamesPlayed: number;
  fastestMs: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

/**
 * Core authenticated account identity (mapped from Supabase Auth + profiles table).
 */
export interface Player {
  id: string;
  publicPlayerId: string; // Public display ID e.g. CR-A7F92B1C (never internal UUID)
  authUserId?: string;    // Supabase auth.users.id (private server/owner reference)
  username: string;
  tag: string;
  avatarSeed: string;
  countryCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Public-facing player profile safe to serve for any Player ID lookup.
 * Intentionally omits authUserId, internal currency balances, and hidden MMR.
 */
export interface PublicPlayerProfile {
  publicPlayerId: string;
  username: string;
  tag: string;
  title: string;
  avatarSeed: string;
  countryCode?: string;
  level: number;
  rankTier: RankTier;
  rankDivision?: RankDivision;
  rankPoints: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  favoriteContinent: string;
  seasonName: string;
  createdAt?: string;
}

/**
 * Strictly allowlisted profile fields an authenticated player may modify directly.
 * Protected fields (rankTier, rankDivision, rankPoints, mmr, wins, losses, level, etc.)
 * are NEVER included here and are blocked at both API and PostgreSQL RLS layers.
 */
export interface PermittedProfileUpdate {
  username?: string;
  avatarSeed?: string;
  favoriteContinent?: string;
  countryCode?: string;
}

/**
 * Public/compact player summary safe for lobbies, leaderboards, and match cards.
 */
export interface PlayerSummary {
  id: string;
  publicPlayerId?: string;
  username: string;
  tag: string;
  avatarSeed: string;
  rankTier: RankTier;
  rankDivision?: RankDivision;
  rankPoints: number;
  level: number;
}

/**
 * Full player competitive career profile.
 * Note: mmr is estimated skill; rp is visible seasonal progression.
 */
export interface PlayerProfile extends Player {
  title: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  rankTier: RankTier;
  rankDivision?: RankDivision;
  rankPoints: number; // Visible Ranked Progression (RP)
  mmr: number;        // Hidden Skill Rating (MMR) for matchmaking & RAQE tuning
  peakRankPoints: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  favoriteContinent: string;
  avgResponseTimeMs: number;
  rushTokens: number;
  starGems: number;
  seasonName: string;
  seasonDaysLeft: number;
  profileSetupCompleted?: boolean;
  isSimulated?: boolean;
  continentMastery: ContinentMastery[];
  achievements: Achievement[];
}

export type FriendStatus = 'online' | 'in_match' | 'away' | 'offline';

export interface Friend {
  id: string;
  username: string;
  tag: string;
  avatarSeed: string;
  rankTier: RankTier;
  rankDivision?: RankDivision;
  status: FriendStatus;
  activityText: string;
  isPartyMember?: boolean;
  invited?: boolean;
}

export interface LeaderboardPlayer {
  position: number;
  id: string;
  username: string;
  tag: string;
  avatarSeed: string;
  country: string;
  countryCode: string;
  rankTier: RankTier;
  rankDivision?: RankDivision;
  rankPoints: number;
  mmr?: number;
  wins: number;
  winRate: number;
  streak: number;
}
