// CountryRush Frontend Game Types
// Domain types are re-exported from ../../shared to maintain a single source of truth.
// Purely UI/view-specific types remain scoped to the frontend here.

export const GAME_VERSION = '1.0.0';

export type {
  RankTier,
  RankDivision,
  RankInfo,
  MmrRating,
  MmrBand,
  MmrAdjustment,
  RpDeltaReason,
  RpProgression,
  SeasonProgression,
  ContinentMastery,
  Achievement,
  Player,
  PlayerSummary,
  PlayerProfile,
  PublicPlayerProfile,
  PermittedProfileUpdate,
  FriendStatus,
  Friend,
  LeaderboardPlayer,
} from '../../shared/types/player';

export type {
  MatchMode,
  MatchStatus,
  MatchPhase,
  TeamId,
  ParticipantType,
  ConnectionStatus,
  MatchParticipant,
  ClientMatchState,
  MatchResult,
} from '../../shared/types/match';

import type { RankTier, RankDivision } from '../../shared/types/player';

export interface GameModeInfo {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  badgeColor: 'blue' | 'orange' | 'violet' | 'green' | 'amber';
  players: string;
  roundTime: string;
  isRanked: boolean;
  iconType: 'ranked-1v1' | 'ranked-2v2' | 'quickplay' | 'daily' | 'custom';
  accentGradient: string;
}

export interface DailyChallengeInfo {
  id: string;
  title: string;
  region: string;
  description: string;
  questionCount: number;
  timeLimitSeconds: number;
  multiplier: string;
  xpReward: number;
  rpReward: number;
  todayStreak: number;
  completedToday: boolean;
  endsInHours: number;
  topLeader: {
    username: string;
    score: number;
    timeSeconds: number;
  };
}

export interface NotificationItem {
  id: string;
  type: 'rank' | 'invite' | 'reward' | 'match';
  title: string;
  message: string;
  timeAgo: string;
  read: boolean;
}

export interface MatchHistoryItem {
  id: string;
  mode: string;
  result: 'VICTORY' | 'DEFEAT';
  score: string;
  opponent: {
    username: string;
    rankTier: RankTier;
    rankDivision: RankDivision;
    avatarSeed: string;
  };
  rpDelta: number;
  accuracy: number;
  timeAgo: string;
  mvp: boolean;
}

export type NavigationTab =
  | 'home'
  | 'ranked'
  | 'quickplay'
  | 'daily'
  | 'leaderboard'
  | 'profile'
  | 'friends'
  | 'settings';
