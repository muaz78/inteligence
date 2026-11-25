// Shared Bot Profile and AI Fallback Types for CountryRush
// Foundation for Phase 5 (20s AI Fallback Matchmaking) & Phase 7 (Bot Chat).

import type { RankTier, RankDivision } from './player';

export type BotDifficultyTier = 'casual' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'elite';

export type BotPersonality = 'analytical' | 'aggressive' | 'friendly' | 'quiet' | 'tactical';

export interface BotSkillProfile {
  targetAccuracyRate: number; // e.g. 0.78 for Diamond bot
  minReactionTimeMs: number;
  maxReactionTimeMs: number;
  hintUsageProbability: number;
  mistakeVariance: number;
}

export interface BotProfile {
  botId: string;
  username: string;
  tag: string;
  avatarSeed: string;
  countryCode: string;
  rankTier: RankTier;
  rankDivision?: RankDivision;
  simulatedRP: number;
  simulatedMMR: number;
  difficultyTier: BotDifficultyTier;
  personality: BotPersonality;
  skillProfile: BotSkillProfile;
  chatEnabled: boolean;
}

export interface BotScheduledAction {
  botId: string;
  roundNumber: number;
  scheduledAtMs: number;
  willAnswerCorrectly: boolean;
  chosenOptionIndex: 0 | 1 | 2 | 3;
}
