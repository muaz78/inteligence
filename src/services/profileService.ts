// CountryRush Frontend Player Profile Service (Phase 2)
// Integrates real Supabase PostgreSQL profiles + RLS-enforced updates,
// and delegates seamlessly to Cloudflare Worker API when VITE_ENABLE_BACKEND=true.

import type {
  PlayerProfile,
  PublicPlayerProfile,
  PermittedProfileUpdate,
  RankTier,
  RankDivision,
} from '../../shared/types/player';
import type { CompleteProfileSetupRequest, UsernameAvailabilityResponse } from '../../shared/protocol/api';
import { INITIAL_PLAYER_PROFILE_CONFIG } from '../../shared/constants/profileDefaults';
import { validateAvatarSelection, validateUsername } from '../../shared/validation/profileValidation';
import { isBackendConfigured } from '../config/env';
import { getSupabaseClient } from '../lib/supabase';
import { apiClient, ApiClientError } from './apiClient';

interface SupabaseProfileJoinRow {
  id: string;
  public_player_id: string;
  auth_user_id: string;
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
  player_ratings?:
    | {
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
    | Array<{
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
      }>
    | null;
}

export class ProfileServiceError extends Error {
  public readonly code: string;

  constructor(message: string, code = 'PROFILE_ERROR') {
    super(message);
    this.name = 'ProfileServiceError';
    this.code = code;
  }
}

function mapSupabaseRowToPlayerProfile(row: SupabaseProfileJoinRow): PlayerProfile {
  const rating = Array.isArray(row.player_ratings) ? row.player_ratings[0] : row.player_ratings;
  const wins = rating?.wins ?? 0;
  const losses = rating?.losses ?? 0;
  const total = wins + losses;

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
    rankTier: rating?.rank_tier ?? INITIAL_PLAYER_PROFILE_CONFIG.initialRankTier,
    rankDivision: rating?.rank_division ?? INITIAL_PLAYER_PROFILE_CONFIG.initialRankDivision,
    rankPoints: rating?.rank_points ?? INITIAL_PLAYER_PROFILE_CONFIG.initialRankPoints,
    mmr: rating?.mmr ?? INITIAL_PLAYER_PROFILE_CONFIG.initialMMR,
    peakRankPoints: rating?.peak_rank_points ?? INITIAL_PLAYER_PROFILE_CONFIG.initialRankPoints,
    wins,
    losses,
    winRate: total > 0 ? Number(((wins / total) * 100).toFixed(1)) : 0,
    currentStreak: rating?.current_streak ?? 0,
    bestStreak: rating?.best_streak ?? 0,
    favoriteContinent: row.favorite_continent,
    avgResponseTimeMs: rating?.avg_response_time_ms ?? 0,
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

function translateDbError(err: { code?: string; message?: string }): ProfileServiceError {
  if (err.code === '23505' || err.message?.toLowerCase().includes('duplicate key')) {
    return new ProfileServiceError('That username is already taken by another player.', 'DUPLICATE_USERNAME');
  }
  if (err.code === '42501') {
    return new ProfileServiceError('Protected competitive profile fields cannot be altered.', 'FORBIDDEN');
  }
  if (err.code === 'PGRST116') {
    return new ProfileServiceError('Player profile not found in database.', 'NOT_FOUND');
  }
  return new ProfileServiceError(err.message || 'Unable to sync profile with Supabase.', 'PROFILE_SYNC_FAILED');
}

class CountryRushProfileService {
  public async checkUsernameAvailable(username: string): Promise<UsernameAvailabilityResponse> {
    const check = validateUsername(username);
    if (!check.valid || !check.normalized) {
      return { username: username.trim(), available: false, reason: check.error };
    }

    if (isBackendConfigured()) {
      return apiClient.checkUsernameAvailable(check.normalized);
    }

    const client = getSupabaseClient();
    if (!client) {
      return { username: check.normalized, available: false, reason: 'Supabase client unavailable.' };
    }

    const { data, error } = await client.rpc('check_username_available', {
      p_username: check.normalized,
    });

    if (error) {
      throw translateDbError(error);
    }

    const res = data as { username?: string; available?: boolean; reason?: string | null };
    return {
      username: res.username || check.normalized,
      available: Boolean(res.available),
      reason: res.reason ?? undefined,
    };
  }

  public async getMyProfile(authUserId: string): Promise<PlayerProfile | null> {
    if (isBackendConfigured()) {
      try {
        const res = await apiClient.getMyProfile();
        return res.profile;
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 401) {
          throw new ProfileServiceError('Session unauthorized.', 'UNAUTHORIZED');
        }
        throw err;
      }
    }

    const client = getSupabaseClient();
    if (!client) {
      throw new ProfileServiceError('Supabase configuration is unavailable.', 'NOT_CONFIGURED');
    }

    const { data, error } = await client
      .from('profiles')
      .select('*, player_ratings(*)')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (error) {
      throw translateDbError(error);
    }
    if (!data) {
      return null;
    }

    return mapSupabaseRowToPlayerProfile(data as unknown as SupabaseProfileJoinRow);
  }

  public async completeProfileSetup(
    authUserId: string,
    payload: CompleteProfileSetupRequest
  ): Promise<PlayerProfile> {
    const usernameCheck = validateUsername(payload.username);
    if (!usernameCheck.valid || !usernameCheck.normalized) {
      throw new ProfileServiceError(usernameCheck.error || 'Invalid username.', 'VALIDATION_ERROR');
    }

    const avatarCheck = validateAvatarSelection(payload.avatarSeed);
    if (!avatarCheck.valid || !avatarCheck.normalized) {
      throw new ProfileServiceError(avatarCheck.error || 'Invalid avatar ID.', 'VALIDATION_ERROR');
    }

    if (isBackendConfigured()) {
      const res = await apiClient.completeProfileSetup({
        ...payload,
        username: usernameCheck.normalized,
        avatarSeed: avatarCheck.normalized,
      });
      return res.profile;
    }

    const client = getSupabaseClient();
    if (!client) {
      throw new ProfileServiceError('Supabase configuration is unavailable.', 'NOT_CONFIGURED');
    }

    const { error } = await client.rpc('complete_player_profile_setup', {
      p_username: usernameCheck.normalized,
      p_avatar_seed: avatarCheck.normalized,
      p_country_code: payload.countryCode?.trim().toUpperCase() || null,
      p_favorite_continent: payload.favoriteContinent?.trim() || null,
    });

    if (error) {
      throw translateDbError(error);
    }

    const hydrated = await this.getMyProfile(authUserId);
    if (!hydrated) {
      throw new ProfileServiceError('Profile setup completed, but failed to load profile.', 'NOT_FOUND');
    }
    return hydrated;
  }

  public async updatePermittedProfile(
    authUserId: string,
    patch: PermittedProfileUpdate
  ): Promise<PlayerProfile> {
    const sanitized: PermittedProfileUpdate = {};

    if (patch.username !== undefined) {
      const check = validateUsername(patch.username);
      if (!check.valid || !check.normalized) {
        throw new ProfileServiceError(check.error || 'Invalid username.', 'VALIDATION_ERROR');
      }
      sanitized.username = check.normalized;
    }

    if (patch.avatarSeed !== undefined) {
      const avatarCheck = validateAvatarSelection(patch.avatarSeed);
      if (!avatarCheck.valid || !avatarCheck.normalized) {
        throw new ProfileServiceError(avatarCheck.error || 'Invalid avatar identifier.', 'VALIDATION_ERROR');
      }
      sanitized.avatarSeed = avatarCheck.normalized;
    }

    if (patch.favoriteContinent !== undefined) {
      const c = patch.favoriteContinent.trim();
      if (c.length < 2 || c.length > 40) {
        throw new ProfileServiceError('Favorite continent must be 2-40 characters.', 'VALIDATION_ERROR');
      }
      sanitized.favoriteContinent = c;
    }

    if (patch.countryCode !== undefined) {
      const cc = patch.countryCode.trim().toUpperCase();
      if (cc !== '' && !/^[A-Z]{2}$/.test(cc)) {
        throw new ProfileServiceError('Country code must be 2 letters (e.g., JP, US, SE).', 'VALIDATION_ERROR');
      }
      sanitized.countryCode = cc;
    }

    if (isBackendConfigured()) {
      const res = await apiClient.updateMyProfile(sanitized);
      return res.profile;
    }

    const client = getSupabaseClient();
    if (!client) {
      throw new ProfileServiceError('Supabase configuration is unavailable.', 'NOT_CONFIGURED');
    }

    const dbPatch: Record<string, string | null> = {};
    if (sanitized.username !== undefined) dbPatch.username = sanitized.username;
    if (sanitized.avatarSeed !== undefined) dbPatch.avatar_seed = sanitized.avatarSeed;
    if (sanitized.favoriteContinent !== undefined) dbPatch.favorite_continent = sanitized.favoriteContinent;
    if (sanitized.countryCode !== undefined) dbPatch.country_code = sanitized.countryCode || null;

    const { error } = await client
      .from('profiles')
      .update(dbPatch)
      .eq('auth_user_id', authUserId);

    if (error) {
      throw translateDbError(error);
    }

    const hydrated = await this.getMyProfile(authUserId);
    if (!hydrated) {
      throw new ProfileServiceError('Profile updated, but failed to retrieve updated data.', 'NOT_FOUND');
    }
    return hydrated;
  }

  public async getPublicProfile(publicPlayerId: string): Promise<PublicPlayerProfile | null> {
    if (isBackendConfigured()) {
      const res = await apiClient.getPublicProfile(publicPlayerId);
      return res.profile;
    }

    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from('public_player_profiles')
      .select('*')
      .eq('public_player_id', publicPlayerId.trim().toUpperCase())
      .maybeSingle();

    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    const wins = Number(row.wins ?? 0);
    const losses = Number(row.losses ?? 0);
    const total = wins + losses;

    return {
      publicPlayerId: String(row.public_player_id),
      username: String(row.username),
      tag: String(row.tag),
      title: String(row.title),
      avatarSeed: String(row.avatar_seed),
      countryCode: row.country_code ? String(row.country_code) : undefined,
      level: Number(row.level ?? 1),
      rankTier: String(row.rank_tier ?? 'Bronze') as RankTier,
      rankDivision: row.rank_division ? (String(row.rank_division) as RankDivision) : undefined,
      rankPoints: Number(row.rank_points ?? 0),
      wins,
      losses,
      winRate: total > 0 ? Number(((wins / total) * 100).toFixed(1)) : 0,
      currentStreak: Number(row.current_streak ?? 0),
      bestStreak: Number(row.best_streak ?? 0),
      favoriteContinent: String(row.favorite_continent ?? 'Global'),
      seasonName: INITIAL_PLAYER_PROFILE_CONFIG.currentSeasonName,
      createdAt: row.created_at ? String(row.created_at) : undefined,
    };
  }
}

export const profileService = new CountryRushProfileService();
