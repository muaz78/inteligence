// CountryRush Server-Side Player & Profile PostgreSQL Repository (Phase 2)
// Enforces server-controlled initial defaults, strict allowlisted updates,
// case-insensitive username uniqueness, and sanitized PublicPlayerProfile projections.

import type {
  PlayerProfile,
  PublicPlayerProfile,
  PermittedProfileUpdate,
  RankTier,
  RankDivision,
} from '../../../shared/types/player';
import { INITIAL_PLAYER_PROFILE_CONFIG } from '../../../shared/constants/profileDefaults';
import {
  validateAvatarSelection,
  validateUsername,
} from '../../../shared/validation/profileValidation';
import type { WorkerEnv } from '../config/env';
import { supabaseAdminFetch, SupabaseAdminError } from './supabaseClient';

interface DbProfileRow {
  id: string;
  auth_user_id: string;
  public_player_id: string;
  username: string;
  tag: string;
  title: string;
  avatar_seed: string;
  country_code: string | null;
  level: number;
  current_xp: number;
  rush_tokens: number;
  star_gems: number;
  favorite_continent: string;
  profile_setup_completed: boolean;
  created_at: string;
  updated_at: string;
  player_ratings?: DbRatingsRow | DbRatingsRow[] | null;
}

interface DbRatingsRow {
  player_id: string;
  season_id: string;
  rank_tier: RankTier;
  rank_division: RankDivision | null;
  rank_points: number;
  peak_rank_points: number;
  mmr: number;
  wins: number;
  losses: number;
  current_streak: number;
  best_streak: number;
  avg_response_time_ms: number;
}

interface DbPublicProfileRow {
  public_player_id: string;
  username: string;
  tag: string;
  title: string;
  avatar_seed: string;
  country_code: string | null;
  level: number;
  favorite_continent: string;
  created_at: string;
  rank_tier: RankTier;
  rank_division: RankDivision | null;
  rank_points: number;
  wins: number;
  losses: number;
  current_streak: number;
  best_streak: number;
  season_id: string;
}

export class ProfileValidationError extends Error {
  public readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ProfileValidationError';
  }
}

export class ProfileConflictError extends Error {
  public readonly statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = 'ProfileConflictError';
  }
}

export class ForbiddenProfileFieldError extends Error {
  public readonly statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenProfileFieldError';
  }
}

const PROTECTED_INPUT_KEYS = new Set([
  'id',
  'authUserId',
  'auth_user_id',
  'publicPlayerId',
  'public_player_id',
  'rankTier',
  'rank_tier',
  'rankDivision',
  'rank_division',
  'rankPoints',
  'rank_points',
  'rp',
  'mmr',
  'peakRankPoints',
  'wins',
  'losses',
  'winRate',
  'level',
  'currentXp',
  'rushTokens',
  'starGems',
  'title',
  'profileSetupCompleted',
]);

function mapDbRowToPlayerProfile(row: DbProfileRow): PlayerProfile {
  const ratings = Array.isArray(row.player_ratings)
    ? row.player_ratings[0]
    : row.player_ratings;

  const wins = ratings?.wins ?? 0;
  const losses = ratings?.losses ?? 0;
  const totalGames = wins + losses;
  const winRate = totalGames > 0 ? Number(((wins / totalGames) * 100).toFixed(1)) : 0;

  return {
    id: row.id,
    publicPlayerId: row.public_player_id,
    authUserId: row.auth_user_id,
    username: row.username,
    tag: row.tag,
    title: row.title,
    avatarSeed: row.avatar_seed,
    countryCode: row.country_code ?? undefined,
    level: row.level,
    currentXp: row.current_xp,
    nextLevelXp: row.level * INITIAL_PLAYER_PROFILE_CONFIG.xpPerLevelBase,
    rankTier: ratings?.rank_tier ?? INITIAL_PLAYER_PROFILE_CONFIG.initialRankTier,
    rankDivision: ratings?.rank_division ?? INITIAL_PLAYER_PROFILE_CONFIG.initialRankDivision,
    rankPoints: ratings?.rank_points ?? INITIAL_PLAYER_PROFILE_CONFIG.initialRankPoints,
    mmr: ratings?.mmr ?? INITIAL_PLAYER_PROFILE_CONFIG.initialMMR,
    peakRankPoints: ratings?.peak_rank_points ?? INITIAL_PLAYER_PROFILE_CONFIG.initialRankPoints,
    wins,
    losses,
    winRate,
    currentStreak: ratings?.current_streak ?? 0,
    bestStreak: ratings?.best_streak ?? 0,
    favoriteContinent: row.favorite_continent,
    avgResponseTimeMs: ratings?.avg_response_time_ms ?? 0,
    rushTokens: row.rush_tokens,
    starGems: row.star_gems,
    seasonName: INITIAL_PLAYER_PROFILE_CONFIG.currentSeasonName,
    seasonDaysLeft: INITIAL_PLAYER_PROFILE_CONFIG.seasonDaysRemaining,
    profileSetupCompleted: row.profile_setup_completed,
    isSimulated: false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    continentMastery: [],
    achievements: [],
  };
}

export class SupabasePlayerRepository {
  public async getProfileByAuthUserId(env: WorkerEnv, authUserId: string): Promise<PlayerProfile | null> {
    const query =
      `profiles?auth_user_id=eq.${encodeURIComponent(authUserId)}` +
      `&select=*,player_ratings(*)&limit=1`;

    const rows = await supabaseAdminFetch<DbProfileRow[]>(env, query, { method: 'GET' });
    if (!rows || rows.length === 0) return null;
    return mapDbRowToPlayerProfile(rows[0]);
  }

  public async getPublicProfileByPlayerId(
    env: WorkerEnv,
    publicPlayerId: string
  ): Promise<PublicPlayerProfile | null> {
    const query =
      `public_player_profiles?public_player_id=eq.${encodeURIComponent(publicPlayerId.trim().toUpperCase())}&limit=1`;

    const rows = await supabaseAdminFetch<DbPublicProfileRow[]>(env, query, { method: 'GET' });
    if (!rows || rows.length === 0) return null;
    const row = rows[0];
    const totalGames = row.wins + row.losses;

    return {
      publicPlayerId: row.public_player_id,
      username: row.username,
      tag: row.tag,
      title: row.title,
      avatarSeed: row.avatar_seed,
      countryCode: row.country_code ?? undefined,
      level: row.level,
      rankTier: row.rank_tier,
      rankDivision: row.rank_division ?? undefined,
      rankPoints: row.rank_points,
      wins: row.wins,
      losses: row.losses,
      winRate: totalGames > 0 ? Number(((row.wins / totalGames) * 100).toFixed(1)) : 0,
      currentStreak: row.current_streak,
      bestStreak: row.best_streak,
      favoriteContinent: row.favorite_continent,
      seasonName: INITIAL_PLAYER_PROFILE_CONFIG.currentSeasonName,
      createdAt: row.created_at,
    };
  }

  public async checkUsernameAvailable(
    env: WorkerEnv,
    rawUsername: string,
    excludeAuthUserId?: string
  ): Promise<{ available: boolean; normalized: string; reason?: string }> {
    const check = validateUsername(rawUsername);
    if (!check.valid || !check.normalized) {
      return { available: false, normalized: rawUsername.trim(), reason: check.error };
    }

    const escapedLike = check.normalized.replace(/[%_]/g, '\\$&');
    let query = `profiles?username=ilike.${encodeURIComponent(escapedLike)}&select=auth_user_id,username`;
    if (excludeAuthUserId) {
      query += `&auth_user_id=neq.${encodeURIComponent(excludeAuthUserId)}`;
    }

    const existing = await supabaseAdminFetch<{ auth_user_id: string; username: string }[]>(env, query, {
      method: 'GET',
    });
    const exactConflict = existing.some(
      (row) => row.username.toLowerCase() === check.normalized!.toLowerCase()
    );
    if (exactConflict) {
      return {
        available: false,
        normalized: check.normalized,
        reason: 'That username is already taken by another player.',
      };
    }

    return { available: true, normalized: check.normalized };
  }

  /**
   * Provisions a profile row for an authenticated user if missing (fallback if auth trigger didn't run).
   * Always applies server-authoritative Bronze III / 0 RP / 400 MMR initial configuration.
   */
  public async ensureProfileForAuthUser(env: WorkerEnv, authUserId: string): Promise<PlayerProfile> {
    const existing = await this.getProfileByAuthUserId(env, authUserId);
    if (existing) return existing;

    const fallbackSuffix = authUserId.replace(/-/g, '').slice(0, 8);
    const fallbackUsername = `Agent_${fallbackSuffix}`;

    const createdRows = await supabaseAdminFetch<DbProfileRow[]>(env, 'profiles', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        auth_user_id: authUserId,
        username: fallbackUsername,
        tag: INITIAL_PLAYER_PROFILE_CONFIG.defaultTag,
        title: INITIAL_PLAYER_PROFILE_CONFIG.defaultTitle,
        avatar_seed: INITIAL_PLAYER_PROFILE_CONFIG.defaultAvatarId,
        level: INITIAL_PLAYER_PROFILE_CONFIG.initialLevel,
        current_xp: INITIAL_PLAYER_PROFILE_CONFIG.initialXp,
        rush_tokens: INITIAL_PLAYER_PROFILE_CONFIG.initialRushTokens,
        star_gems: INITIAL_PLAYER_PROFILE_CONFIG.initialStarGems,
        favorite_continent: INITIAL_PLAYER_PROFILE_CONFIG.defaultFavoriteContinent,
        profile_setup_completed: false,
      }),
    });

    const profileRow = createdRows[0];
    await supabaseAdminFetch(env, 'player_ratings', {
      method: 'POST',
      body: JSON.stringify({
        player_id: profileRow.id,
        season_id: INITIAL_PLAYER_PROFILE_CONFIG.currentSeasonId,
        rank_tier: INITIAL_PLAYER_PROFILE_CONFIG.initialRankTier,
        rank_division: INITIAL_PLAYER_PROFILE_CONFIG.initialRankDivision,
        rank_points: INITIAL_PLAYER_PROFILE_CONFIG.initialRankPoints,
        peak_rank_points: INITIAL_PLAYER_PROFILE_CONFIG.initialRankPoints,
        mmr: INITIAL_PLAYER_PROFILE_CONFIG.initialMMR,
        mmr_uncertainty: INITIAL_PLAYER_PROFILE_CONFIG.initialMmrUncertainty,
      }),
    });

    const hydrated = await this.getProfileByAuthUserId(env, authUserId);
    if (!hydrated) {
      throw new SupabaseAdminError('Profile created but failed to retrieve hydrated row.', 500);
    }
    return hydrated;
  }

  public async updatePermittedProfileFields(
    env: WorkerEnv,
    authUserId: string,
    rawBody: Record<string, unknown>,
    markSetupCompleted = false
  ): Promise<PlayerProfile> {
    for (const key of Object.keys(rawBody)) {
      if (PROTECTED_INPUT_KEYS.has(key)) {
        throw new ForbiddenProfileFieldError(
          `Field "${key}" is server-authoritative and cannot be modified by clients.`
        );
      }
    }

    const patch: Record<string, unknown> = {};
    const body = rawBody as PermittedProfileUpdate;

    if (body.username !== undefined) {
      const check = await this.checkUsernameAvailable(env, String(body.username), authUserId);
      if (!check.available) {
        if (check.reason?.includes('already taken')) {
          throw new ProfileConflictError(check.reason);
        }
        throw new ProfileValidationError(check.reason || 'Invalid username.');
      }
      patch.username = check.normalized;
    }

    if (body.avatarSeed !== undefined) {
      const avatarCheck = validateAvatarSelection(String(body.avatarSeed));
      if (!avatarCheck.valid || !avatarCheck.normalized) {
        throw new ProfileValidationError(avatarCheck.error || 'Invalid avatar ID.');
      }
      patch.avatar_seed = avatarCheck.normalized;
    }

    if (body.favoriteContinent !== undefined) {
      const continent = String(body.favoriteContinent).trim();
      if (continent.length < 2 || continent.length > 40) {
        throw new ProfileValidationError('Favorite continent must be between 2 and 40 characters.');
      }
      patch.favorite_continent = continent;
    }

    if (body.countryCode !== undefined) {
      const cc = String(body.countryCode).trim().toUpperCase();
      if (cc !== '' && !/^[A-Z]{2}$/.test(cc)) {
        throw new ProfileValidationError('Country code must be a valid 2-letter ISO code.');
      }
      patch.country_code = cc || null;
    }

    if (markSetupCompleted) {
      if (!patch.username || !patch.avatar_seed) {
        throw new ProfileValidationError('Username and avatar selection are required to finish setup.');
      }
      patch.profile_setup_completed = true;
    }

    if (Object.keys(patch).length === 0) {
      throw new ProfileValidationError('No permitted profile fields provided.');
    }

    try {
      await supabaseAdminFetch(
        env,
        `profiles?auth_user_id=eq.${encodeURIComponent(authUserId)}`,
        {
          method: 'PATCH',
          body: JSON.stringify(patch),
        }
      );
    } catch (err) {
      if (err instanceof SupabaseAdminError && err.pgCode === '23505') {
        throw new ProfileConflictError('That username is already taken.');
      }
      throw err;
    }

    const updated = await this.getProfileByAuthUserId(env, authUserId);
    if (!updated) {
      throw new SupabaseAdminError('Updated profile not found.', 404);
    }
    return updated;
  }
}

export const playerRepository = new SupabasePlayerRepository();
