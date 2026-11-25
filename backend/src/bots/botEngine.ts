// AI Fallback & Bot Opponent Engine (Phase 5 Active)
// Generates transparently labeled, MMR-calibrated AI bot profiles whenever matchmaking
// reaches the 20-second (20,000 ms) fallback threshold without enough human opponents.
// Bots never impersonate humans (`participantType: 'bot'`, explicit AI identity/tag)
// and AI-fallback matches never grant or deduct ranked RP/MMR (`isRated: false`).

import type { RankTier, RankDivision } from '../../../shared/types/player';
import type {
  BotDifficultyTier,
  BotPersonality,
  BotProfile,
  BotScheduledAction,
  BotSkillProfile,
} from '../../../shared/types/bot';
import type { ServerQuestionRecord } from '../../../shared/types/question';
import { ALLOWED_AVATAR_IDS } from '../../../shared/constants/avatars';

export interface BotEngineContract {
  createMatchedBotProfile(targetTier: RankTier, targetDivision?: RankDivision, targetMMR?: number): BotProfile;
  createBotsForMatchFill(params: {
    count: number;
    targetTier: RankTier;
    targetDivision?: RankDivision;
    targetMMR: number;
    excludeAvatarSeeds?: string[];
  }): BotProfile[];
  scheduleRoundBotAction(
    bot: BotProfile,
    question: ServerQuestionRecord,
    roundNumber: number,
    roundStartedAtMs: number
  ): BotScheduledAction;
}

interface BotRosterTemplate {
  baseName: string;
  countryCode: string;
  personality: BotPersonality;
  preferredAvatarSeed: string;
}

const BOT_ROSTER_TEMPLATES: readonly BotRosterTemplate[] = [
  { baseName: 'AtlasBot', countryCode: 'CH', personality: 'analytical', preferredAvatarSeed: 'kaito_tactician' },
  { baseName: 'MeridianAI', countryCode: 'JP', personality: 'tactical', preferredAvatarSeed: 'aoi_valkyrie' },
  { baseName: 'ChronoGeoAI', countryCode: 'DE', personality: 'analytical', preferredAvatarSeed: 'haru_alpine' },
  { baseName: 'HorizonBot', countryCode: 'CA', personality: 'friendly', preferredAvatarSeed: 'neon_horizon' },
  { baseName: 'AstraBot', countryCode: 'SE', personality: 'aggressive', preferredAvatarSeed: 'sakura_blitz' },
  { baseName: 'CompassAI', countryCode: 'NO', personality: 'quiet', preferredAvatarSeed: 'ren_kyoto' },
  { baseName: 'ValkyrieAI', countryCode: 'FR', personality: 'tactical', preferredAvatarSeed: 'sora_apex' },
  { baseName: 'ZenithBot', countryCode: 'KR', personality: 'aggressive', preferredAvatarSeed: 'zenith_striker' },
] as const;

const SKILL_PROFILES_BY_TIER: Record<BotDifficultyTier, BotSkillProfile> = {
  casual: {
    targetAccuracyRate: 0.48,
    minReactionTimeMs: 3600,
    maxReactionTimeMs: 7400,
    hintUsageProbability: 0.25,
    mistakeVariance: 0.14,
  },
  silver: {
    targetAccuracyRate: 0.56,
    minReactionTimeMs: 3200,
    maxReactionTimeMs: 6800,
    hintUsageProbability: 0.2,
    mistakeVariance: 0.12,
  },
  gold: {
    targetAccuracyRate: 0.64,
    minReactionTimeMs: 2800,
    maxReactionTimeMs: 6200,
    hintUsageProbability: 0.16,
    mistakeVariance: 0.1,
  },
  platinum: {
    targetAccuracyRate: 0.72,
    minReactionTimeMs: 2400,
    maxReactionTimeMs: 5600,
    hintUsageProbability: 0.12,
    mistakeVariance: 0.08,
  },
  diamond: {
    targetAccuracyRate: 0.79,
    minReactionTimeMs: 2100,
    maxReactionTimeMs: 5000,
    hintUsageProbability: 0.09,
    mistakeVariance: 0.06,
  },
  master: {
    targetAccuracyRate: 0.85,
    minReactionTimeMs: 1850,
    maxReactionTimeMs: 4400,
    hintUsageProbability: 0.06,
    mistakeVariance: 0.05,
  },
  elite: {
    targetAccuracyRate: 0.9,
    minReactionTimeMs: 1600,
    maxReactionTimeMs: 3900,
    hintUsageProbability: 0.04,
    mistakeVariance: 0.04,
  },
};

function resolveDifficultyTier(rankTier: RankTier, targetMMR: number): BotDifficultyTier {
  if (rankTier === 'Elite' || targetMMR >= 2200) return 'elite';
  if (rankTier === 'Master' || targetMMR >= 1950) return 'master';
  if (rankTier === 'Diamond' || targetMMR >= 1700) return 'diamond';
  if (rankTier === 'Platinum' || targetMMR >= 1450) return 'platinum';
  if (rankTier === 'Gold' || targetMMR >= 1200) return 'gold';
  if (rankTier === 'Silver' || targetMMR >= 950) return 'silver';
  return 'casual';
}

function estimateBaselineRpForRank(tier: RankTier, division?: RankDivision): number {
  const baseByTier: Record<RankTier, number> = {
    Bronze: 120,
    Silver: 380,
    Gold: 720,
    Platinum: 1120,
    Diamond: 1580,
    Master: 2150,
    Elite: 2650,
  };
  const divisionBoost =
    division === 'I' ? 160 : division === 'II' ? 85 : division === 'III' ? 20 : 0;
  return baseByTier[tier] + divisionBoost;
}

function pickRandomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export class CountryRushBotEngine implements BotEngineContract {
  public createMatchedBotProfile(
    targetTier: RankTier,
    targetDivision?: RankDivision,
    targetMMR = 1000
  ): BotProfile {
    return this.buildBotProfile({
      template: pickRandomItem(BOT_ROSTER_TEMPLATES),
      targetTier,
      targetDivision,
      targetMMR,
      slotSuffix: 1,
      usedAvatars: new Set<string>(),
    });
  }

  public createBotsForMatchFill(params: {
    count: number;
    targetTier: RankTier;
    targetDivision?: RankDivision;
    targetMMR: number;
    excludeAvatarSeeds?: string[];
  }): BotProfile[] {
    const count = Math.max(0, Math.min(params.count, 3));
    if (count === 0) return [];

    const shuffled = [...BOT_ROSTER_TEMPLATES].sort(() => Math.random() - 0.5);
    const usedAvatars = new Set<string>(params.excludeAvatarSeeds ?? []);
    const bots: BotProfile[] = [];

    for (let i = 0; i < count; i++) {
      const template = shuffled[i % shuffled.length];
      const bot = this.buildBotProfile({
        template,
        targetTier: params.targetTier,
        targetDivision: params.targetDivision,
        targetMMR: params.targetMMR,
        slotSuffix: i + 1,
        usedAvatars,
      });
      usedAvatars.add(bot.avatarSeed);
      bots.push(bot);
    }

    return bots;
  }

  public scheduleRoundBotAction(
    bot: BotProfile,
    question: ServerQuestionRecord,
    roundNumber: number,
    roundStartedAtMs: number
  ): BotScheduledAction {
    const { minReactionTimeMs, maxReactionTimeMs, targetAccuracyRate, mistakeVariance } =
      bot.skillProfile;

    const jitter = (Math.random() * 2 - 1) * mistakeVariance;
    const effectiveAccuracy = Math.min(0.95, Math.max(0.25, targetAccuracyRate + jitter));
    const willAnswerCorrectly = Math.random() <= effectiveAccuracy;

    const delayMs = Math.round(
      minReactionTimeMs + Math.random() * Math.max(250, maxReactionTimeMs - minReactionTimeMs)
    );

    const wrongIndices: Array<0 | 1 | 2 | 3> = ([0, 1, 2, 3] as const).filter(
      (idx) => idx !== question.correctOptionIndex
    );

    const chosenOptionIndex: 0 | 1 | 2 | 3 = willAnswerCorrectly
      ? question.correctOptionIndex
      : wrongIndices[Math.floor(Math.random() * wrongIndices.length)] ?? 0;

    return {
      botId: bot.botId,
      roundNumber,
      scheduledAtMs: roundStartedAtMs + delayMs,
      willAnswerCorrectly,
      chosenOptionIndex,
    };
  }

  private buildBotProfile(params: {
    template: BotRosterTemplate;
    targetTier: RankTier;
    targetDivision?: RankDivision;
    targetMMR: number;
    slotSuffix: number;
    usedAvatars: Set<string>;
  }): BotProfile {
    const difficultyTier = resolveDifficultyTier(params.targetTier, params.targetMMR);
    const skill = SKILL_PROFILES_BY_TIER[difficultyTier];

    const mmrOffset = Math.round((Math.random() * 2 - 1) * 40);
    const simulatedMMR = Math.max(400, Math.round(params.targetMMR + mmrOffset));
    const simulatedRP = Math.max(
      0,
      estimateBaselineRpForRank(params.targetTier, params.targetDivision) + Math.round(mmrOffset * 0.6)
    );

    let avatarSeed = params.template.preferredAvatarSeed;
    if (params.usedAvatars.has(avatarSeed)) {
      const availableAvatar = ALLOWED_AVATAR_IDS.find((id) => !params.usedAvatars.has(id));
      avatarSeed = availableAvatar || ALLOWED_AVATAR_IDS[params.slotSuffix % ALLOWED_AVATAR_IDS.length];
    }

    const shortCode = crypto.randomUUID().slice(0, 4).toUpperCase();
    const botId = `bot_${difficultyTier}_${crypto.randomUUID().slice(0, 8)}`;

    return {
      botId,
      username: `${params.template.baseName}-${shortCode.slice(0, 2)}`,
      tag: 'AI',
      avatarSeed,
      countryCode: params.template.countryCode,
      rankTier: params.targetTier,
      rankDivision: params.targetTier === 'Master' || params.targetTier === 'Elite'
        ? undefined
        : params.targetDivision,
      simulatedRP,
      simulatedMMR,
      difficultyTier,
      personality: params.template.personality,
      skillProfile: { ...skill },
      chatEnabled: true,
    };
  }
}

export const botEngine: BotEngineContract = new CountryRushBotEngine();
