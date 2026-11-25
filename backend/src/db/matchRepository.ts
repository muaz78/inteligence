// CountryRush Server-Side Match & Match Participant Repository (Phases 3, 4 & 5)
// Uses strictly server-side Supabase service-role credentials to persist provisioned
// matches and verify participant membership.

import type { Match, MatchParticipant } from '../../../shared/types/match';
import type { MatchedParticipantSummary } from '../../../shared/types/matchmaking';
import type { WorkerEnv } from '../config/env';
import { supabaseAdminFetch } from './supabaseClient';

interface DbMatchRow {
  id: string;
  durable_object_id: string;
  mode: Match['mode'];
  status: Match['status'];
  region: string;
  rank_anchor: string;
  total_rounds: number;
  has_bot_fallback: boolean;
  is_rated: boolean;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

interface DbMatchParticipantRow {
  id: string;
  match_id: string;
  player_id: string | null;
  bot_id: string | null;
  participant_type: 'human' | 'bot';
  team_id: MatchParticipant['teamId'];
  participant_slot_id: string | null;
  display_username: string | null;
  avatar_seed: string | null;
  rank_tier: MatchParticipant['rankTier'] | null;
  rank_division: MatchParticipant['rankDivision'] | null;
  rank_points_snapshot: number | null;
}

export class SupabaseMatchRepository {
  /**
   * Persists a newly provisioned match and its full human/bot participant roster.
   */
  public async createProvisionedMatch(
    env: WorkerEnv,
    params: {
      matchId: string;
      durableObjectId: string;
      mode: Match['mode'];
      region: string;
      status: Match['status'];
      rankAnchor: string;
      totalRounds: number;
      hasBotFallback: boolean;
      isRated: boolean;
      participants: MatchParticipant[];
    }
  ): Promise<void> {
    await supabaseAdminFetch(env, 'matches', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        id: params.matchId,
        durable_object_id: params.durableObjectId,
        mode: params.mode,
        status: params.status,
        region: params.region,
        rank_anchor: params.rankAnchor,
        total_rounds: params.totalRounds,
        has_bot_fallback: params.hasBotFallback,
        is_rated: params.isRated,
      }),
    });

    const participantRows = params.participants.map((p) => ({
      match_id: params.matchId,
      player_id: p.participantType === 'human' ? p.playerId : null,
      bot_id: p.participantType === 'bot' ? (p.botProfileId || p.playerId) : null,
      participant_type: p.participantType,
      team_id: p.teamId,
      participant_slot_id: p.participantId,
      display_username: p.username,
      avatar_seed: p.avatarSeed,
      rank_tier: p.rankTier,
      rank_division: p.rankDivision ?? null,
      rank_points_snapshot: p.rankPoints,
      rp_before: p.participantType === 'human' ? p.rankPoints : null,
      mmr_before: p.participantType === 'human' ? p.mmr : null,
    }));

    try {
      await supabaseAdminFetch(env, 'match_participants', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(participantRows),
      });
    } catch (err) {
      // Best-effort cleanup of parent match row so partial state does not linger
      await supabaseAdminFetch(env, `matches?id=eq.${encodeURIComponent(params.matchId)}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' },
      }).catch(() => undefined);
      throw err;
    }
  }

  public async getMatchWithRoster(
    env: WorkerEnv,
    matchId: string
  ): Promise<{
    match: Match;
    participants: DbMatchParticipantRow[];
  } | null> {
    const matches = await supabaseAdminFetch<DbMatchRow[]>(
      env,
      `matches?id=eq.${encodeURIComponent(matchId)}&limit=1`,
      { method: 'GET' }
    );
    if (!matches || matches.length === 0) return null;

    const row = matches[0];
    const participants = await supabaseAdminFetch<DbMatchParticipantRow[]>(
      env,
      `match_participants?match_id=eq.${encodeURIComponent(matchId)}`,
      { method: 'GET' }
    );

    const match: Match = {
      id: row.id,
      mode: row.mode,
      status: row.status,
      region: row.region,
      config: {
        mode: row.mode,
        totalRounds: row.total_rounds,
        roundDurationSec: 10,
        intermissionDurationSec: 3,
        isRanked: row.mode === 'ranked_1v1' || row.mode === 'ranked_2v2',
        isRated: row.is_rated,
        hasBotFallback: row.has_bot_fallback,
        rankAnchor: row.rank_anchor,
      },
      participantIds: participants.map((p) => p.participant_slot_id || p.id),
      createdAtMs: Date.parse(row.created_at) || Date.now(),
      startedAtMs: row.started_at ? Date.parse(row.started_at) : undefined,
      endedAtMs: row.ended_at ? Date.parse(row.ended_at) : undefined,
    };

    return { match, participants };
  }

  public toPublicParticipantSummary(row: DbMatchParticipantRow): MatchedParticipantSummary {
    return {
      participantId: row.participant_slot_id || row.id,
      participantType: row.participant_type,
      teamId: row.team_id,
      username: row.display_username || (row.participant_type === 'bot' ? 'AI Competitor' : 'Player'),
      tag: row.participant_type === 'bot' ? 'AI' : 'GLB1',
      avatarSeed: row.avatar_seed || 'aoi_valkyrie',
      rankTier: row.rank_tier || 'Bronze',
      rankDivision: row.rank_division ?? undefined,
      rankPoints: row.rank_points_snapshot ?? 0,
      isBot: row.participant_type === 'bot',
    };
  }
}

export const matchRepository = new SupabaseMatchRepository();
