// Cloudflare Durable Object — Authoritative Multiplayer Matchmaking Queue (Phases 4 & 5)
// Uses strongly consistent Durable Object persistent storage (`this.state.storage`) and DO alarms:
// - Stores all active queue tickets cleanly in `this.state.storage` (never ephemeral JS memory Maps)
// - Enforces 1 active queue ticket per player across all modes and regions
// - Matches compatible humans within 120 MMR (0-10s), expands to 300 MMR after 10s
// - Pairs 1v1 / QuickPlay head-to-head and balances 2v2 teams by average MMR
// - Enforces strict 20-second (20,000 ms) AI fallback via Durable Object alarms & BotEngine
// - Provisions persistent MatchRoomDO state + PostgreSQL `matches` & `match_participants` rows

import type { DurableObjectState } from '../types/cloudflare';
import type { WorkerEnv } from '../config/env';
import { getBotFallbackDelayMs } from '../config/env';
import type {
  AuthoritativeMatchState,
  MatchMode,
  MatchParticipant,
  ParticipantScore,
  TeamId,
} from '../../../shared/types/match';
import type {
  MatchedParticipantSummary,
  MatchmakingRegion,
  MatchmakingRequest,
  MatchmakingTicket,
} from '../../../shared/types/matchmaking';
import type { BotProfile } from '../../../shared/types/bot';
import type { RankDivision, RankTier } from '../../../shared/types/player';
import { GAME_RULES } from '../../../shared/constants/gameRules';
import { botEngine } from '../bots/botEngine';
import { matchRepository } from '../db/matchRepository';

export interface EnqueueDoPayload {
  playerId: string;
  authUserId: string;
  publicPlayerId: string;
  username: string;
  tag: string;
  avatarSeed: string;
  countryCode?: string;
  mode: MatchmakingRequest['mode'];
  region: MatchmakingRegion;
  rankTier: RankTier;
  rankDivision?: RankDivision;
  rankPoints: number;
  mmr: number;
}

export interface StatusDoPayload {
  playerId: string;
  ticketId?: string | null;
}

export interface CancelDoPayload {
  playerId: string;
  ticketId: string;
}

export interface DoTicketResult {
  ok: boolean;
  code?: 'BAD_REQUEST' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_ERROR';
  message?: string;
  ticket?: MatchmakingTicket;
  deduplicated?: boolean;
  cancelled?: boolean;
  status?: MatchmakingTicket['status'];
  ticketId?: string;
  queueDepthHint?: number;
}

interface ProvisionSlotCandidate {
  kind: 'human' | 'bot';
  mmr: number;
  humanTicket?: MatchmakingTicket;
  botProfile?: BotProfile;
}

const ACTIVE_INDEX_KEY = 'index:active_tickets';
const TICKET_KEY_PREFIX = 'ticket:';
const PLAYER_ACTIVE_KEY_PREFIX = 'player_active:';
const PLAYER_LAST_TICKET_KEY_PREFIX = 'player_last:';

const EXPAND_AFTER_MS = 10_000;
const INITIAL_MMR_WINDOW = GAME_RULES.MATCHMAKING_MMR_INITIAL_WINDOW; // 120
const EXPANDED_MMR_WINDOW = GAME_RULES.MATCHMAKING_MMR_EXPANDED_WINDOW; // 300
const HARD_TICKET_TIMEOUT_MS = 120_000;
const COMPLETED_TICKET_RETENTION_MS = 15 * 60_000;
const RETRY_ALARM_MS = 2_000;

function ticketStorageKey(ticketId: string): string {
  return `${TICKET_KEY_PREFIX}${ticketId}`;
}

function playerActiveKey(playerId: string): string {
  return `${PLAYER_ACTIVE_KEY_PREFIX}${playerId}`;
}

function playerLastKey(playerId: string): string {
  return `${PLAYER_LAST_TICKET_KEY_PREFIX}${playerId}`;
}

function isWaitingStatus(status: MatchmakingTicket['status']): boolean {
  return status === 'queued' || status === 'expanding_mmr' || status === 'ai_fallback_pending';
}

function createZeroScore(participantId: string): ParticipantScore {
  return {
    participantId,
    totalScore: 0,
    currentStreak: 0,
    maxStreak: 0,
    correctCount: 0,
    answeredCount: 0,
    totalResponseTimeMs: 0,
  };
}

function inferTierFromMmr(mmr: number): { tier: RankTier; division?: RankDivision } {
  if (mmr >= 2200) return { tier: 'Elite' };
  if (mmr >= 1950) return { tier: 'Master' };
  if (mmr >= 1860) return { tier: 'Diamond', division: 'I' };
  if (mmr >= 1780) return { tier: 'Diamond', division: 'II' };
  if (mmr >= 1700) return { tier: 'Diamond', division: 'III' };
  if (mmr >= 1610) return { tier: 'Platinum', division: 'I' };
  if (mmr >= 1530) return { tier: 'Platinum', division: 'II' };
  if (mmr >= 1450) return { tier: 'Platinum', division: 'III' };
  if (mmr >= 1360) return { tier: 'Gold', division: 'I' };
  if (mmr >= 1280) return { tier: 'Gold', division: 'II' };
  if (mmr >= 1200) return { tier: 'Gold', division: 'III' };
  if (mmr >= 1110) return { tier: 'Silver', division: 'I' };
  if (mmr >= 1030) return { tier: 'Silver', division: 'II' };
  if (mmr >= 950) return { tier: 'Silver', division: 'III' };
  if (mmr >= 850) return { tier: 'Bronze', division: 'I' };
  if (mmr >= 720) return { tier: 'Bronze', division: 'II' };
  return { tier: 'Bronze', division: 'III' };
}

function computeRankAnchorLabel(humanTickets: MatchmakingTicket[]): string {
  const avgMmr = Math.round(
    humanTickets.reduce((sum, t) => sum + t.mmr, 0) / Math.max(1, humanTickets.length)
  );
  const { tier, division } = inferTierFromMmr(avgMmr);
  return division ? `${tier} ${division} · ${avgMmr} MMR` : `${tier} · ${avgMmr} MMR`;
}

function areTicketsMmrCompatible(a: MatchmakingTicket, b: MatchmakingTicket): boolean {
  if (a.playerId === b.playerId) return false;
  if (a.mode !== b.mode || a.region !== b.region) return false;
  const diff = Math.abs(a.mmr - b.mmr);
  return diff <= a.mmrToleranceRange && diff <= b.mmrToleranceRange;
}

/**
 * Splits 4 slots (`ranked_2v2`) into two balanced 2-player teams minimizing average MMR gap.
 * Ties slightly prefer keeping balanced human+bot pairs when 2 humans and 2 bots play.
 */
function balanceFourSlotsIntoTeams(
  slots: ProvisionSlotCandidate[]
): Array<{ candidate: ProvisionSlotCandidate; teamId: TeamId }> {
  const pairings: Array<[readonly [number, number], readonly [number, number]]> = [
    [[0, 1], [2, 3]],
    [[0, 2], [1, 3]],
    [[0, 3], [1, 2]],
  ];

  let bestScore = Number.POSITIVE_INFINITY;
  let bestPairing = pairings[0];

  for (const [alphaIdx, betaIdx] of pairings) {
    const avgAlpha = (slots[alphaIdx[0]].mmr + slots[alphaIdx[1]].mmr) / 2;
    const avgBeta = (slots[betaIdx[0]].mmr + slots[betaIdx[1]].mmr) / 2;
    const mmrDiff = Math.abs(avgAlpha - avgBeta);

    const alphaHumans =
      (slots[alphaIdx[0]].kind === 'human' ? 1 : 0) +
      (slots[alphaIdx[1]].kind === 'human' ? 1 : 0);
    const betaHumans =
      (slots[betaIdx[0]].kind === 'human' ? 1 : 0) +
      (slots[betaIdx[1]].kind === 'human' ? 1 : 0);
    const humanImbalancePenalty = Math.abs(alphaHumans - betaHumans) * 25;

    const score = mmrDiff + humanImbalancePenalty;
    if (score < bestScore) {
      bestScore = score;
      bestPairing = [alphaIdx, betaIdx];
    }
  }

  return [
    { candidate: slots[bestPairing[0][0]], teamId: 'team_alpha' },
    { candidate: slots[bestPairing[0][1]], teamId: 'team_alpha' },
    { candidate: slots[bestPairing[1][0]], teamId: 'team_beta' },
    { candidate: slots[bestPairing[1][1]], teamId: 'team_beta' },
  ];
}

function resolveTotalRoundsForMode(mode: MatchmakingRequest['mode']): number {
  if (mode === 'ranked_2v2') return GAME_RULES.DEFAULT_RANKED_2V2_ROUNDS;
  if (mode === 'quickplay') return GAME_RULES.DEFAULT_QUICKPLAY_ROUNDS;
  return GAME_RULES.DEFAULT_RANKED_1V1_ROUNDS;
}

export class MatchmakingQueueDO {
  private readonly state: DurableObjectState;
  private readonly env: WorkerEnv;

  constructor(state: DurableObjectState, env: WorkerEnv) {
    this.state = state;
    this.env = env;
  }

  public async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    if (method === 'POST' && url.pathname.endsWith('/enqueue')) {
      const payload = (await request.json()) as EnqueueDoPayload;
      const result = await this.handleEnqueue(payload);
      return this.jsonResponse(result);
    }

    if (method === 'POST' && url.pathname.endsWith('/status')) {
      const payload = (await request.json()) as StatusDoPayload;
      const result = await this.handleStatus(payload);
      return this.jsonResponse(result);
    }

    if (method === 'POST' && url.pathname.endsWith('/cancel')) {
      const payload = (await request.json()) as CancelDoPayload;
      const result = await this.handleCancel(payload);
      return this.jsonResponse(result);
    }

    return this.jsonResponse({
      ok: false,
      code: 'BAD_REQUEST',
      message: `Unsupported queue operation: ${method} ${url.pathname}`,
    });
  }

  public async alarm(): Promise<void> {
    await this.state.blockConcurrencyWhile(async () => {
      await this.reconcileQueueAndProvision(Date.now());
    });
  }

  private async handleEnqueue(payload: EnqueueDoPayload): Promise<DoTicketResult> {
    return this.state.blockConcurrencyWhile(async () => {
      const nowMs = Date.now();
      await this.reconcileQueueAndProvision(nowMs);

      const existingTicketId = await this.state.storage.get<string>(playerActiveKey(payload.playerId));
      if (existingTicketId) {
        const existing = await this.state.storage.get<MatchmakingTicket>(
          ticketStorageKey(existingTicketId)
        );
        if (existing && isWaitingStatus(existing.status)) {
          if (existing.mode === payload.mode && existing.region === payload.region) {
            return {
              ok: true,
              ticket: existing,
              deduplicated: true,
              queueDepthHint: await this.countPartitionDepth(existing.region, existing.mode),
            };
          }
          return {
            ok: false,
            code: 'CONFLICT',
            message: `You already have an active queue ticket (${existing.mode} · ${existing.region}). Cancel it before joining another queue.`,
          };
        }

        // Clear stale active pointer if ticket already completed/cancelled
        await this.state.storage.delete(playerActiveKey(payload.playerId));
      }

      const fallbackDelayMs = getBotFallbackDelayMs(this.env);
      const ticketId = crypto.randomUUID();
      const ticket: MatchmakingTicket = {
        ticketId,
        playerId: payload.playerId,
        authUserId: payload.authUserId,
        publicPlayerId: payload.publicPlayerId,
        username: payload.username,
        tag: payload.tag,
        avatarSeed: payload.avatarSeed,
        countryCode: payload.countryCode,
        mode: payload.mode,
        region: payload.region,
        rankTier: payload.rankTier,
        rankDivision: payload.rankDivision,
        rankPoints: payload.rankPoints,
        mmr: payload.mmr,
        mmrToleranceRange: INITIAL_MMR_WINDOW,
        status: 'queued',
        enqueuedAtMs: nowMs,
        botFallbackDeadlineMs: nowMs + fallbackDelayMs,
        lastPolledAtMs: nowMs,
      };

      const activeIds = await this.loadActiveIds();
      activeIds.push(ticketId);

      await this.state.storage.put({
        [ticketStorageKey(ticketId)]: ticket,
        [playerActiveKey(payload.playerId)]: ticketId,
        [playerLastKey(payload.playerId)]: ticketId,
        [ACTIVE_INDEX_KEY]: activeIds,
      });

      // Immediately attempt compatible human matching so instant pairs match without polling lag
      await this.reconcileQueueAndProvision(Date.now());

      const updatedTicket =
        (await this.state.storage.get<MatchmakingTicket>(ticketStorageKey(ticketId))) ?? ticket;

      return {
        ok: true,
        ticket: updatedTicket,
        deduplicated: false,
        queueDepthHint: await this.countPartitionDepth(payload.region, payload.mode),
      };
    });
  }

  private async handleStatus(payload: StatusDoPayload): Promise<DoTicketResult> {
    return this.state.blockConcurrencyWhile(async () => {
      const nowMs = Date.now();
      await this.reconcileQueueAndProvision(nowMs);

      let targetTicketId = payload.ticketId?.trim() || null;
      if (!targetTicketId) {
        targetTicketId =
          (await this.state.storage.get<string>(playerActiveKey(payload.playerId))) ??
          (await this.state.storage.get<string>(playerLastKey(payload.playerId))) ??
          null;
      }

      if (!targetTicketId) {
        return {
          ok: false,
          code: 'NOT_FOUND',
          message: 'No matchmaking ticket found for your account.',
        };
      }

      const ticket = await this.state.storage.get<MatchmakingTicket>(
        ticketStorageKey(targetTicketId)
      );
      if (!ticket) {
        return {
          ok: false,
          code: 'NOT_FOUND',
          message: 'Matchmaking ticket expired or does not exist.',
        };
      }

      if (ticket.playerId !== payload.playerId) {
        return {
          ok: false,
          code: 'FORBIDDEN',
          message: 'You do not own this matchmaking ticket.',
        };
      }

      ticket.lastPolledAtMs = nowMs;
      await this.state.storage.put(ticketStorageKey(ticket.ticketId), ticket);

      return {
        ok: true,
        ticket,
        queueDepthHint: await this.countPartitionDepth(ticket.region, ticket.mode),
      };
    });
  }

  private async handleCancel(payload: CancelDoPayload): Promise<DoTicketResult> {
    return this.state.blockConcurrencyWhile(async () => {
      const nowMs = Date.now();
      await this.reconcileQueueAndProvision(nowMs);

      const ticket = await this.state.storage.get<MatchmakingTicket>(
        ticketStorageKey(payload.ticketId)
      );
      if (!ticket) {
        return {
          ok: false,
          code: 'NOT_FOUND',
          message: 'Matchmaking ticket was not found or already expired.',
        };
      }

      if (ticket.playerId !== payload.playerId) {
        return {
          ok: false,
          code: 'FORBIDDEN',
          message: 'Cannot cancel a matchmaking ticket owned by another player.',
        };
      }

      // Safely handle cancel request if ticket already matched
      if (ticket.status === 'match_found') {
        return {
          ok: true,
          cancelled: false,
          ticketId: ticket.ticketId,
          status: 'match_found',
          ticket,
          message: 'Match was already found before cancellation.',
        };
      }

      if (ticket.status === 'cancelled' || ticket.status === 'expired') {
        await this.clearPlayerActiveIfMatching(ticket.playerId, ticket.ticketId);
        return {
          ok: true,
          cancelled: false,
          ticketId: ticket.ticketId,
          status: ticket.status,
          ticket,
        };
      }

      ticket.status = 'cancelled';
      ticket.lastPolledAtMs = nowMs;

      const activeIds = (await this.loadActiveIds()).filter((id) => id !== ticket.ticketId);
      await this.state.storage.put({
        [ticketStorageKey(ticket.ticketId)]: ticket,
        [ACTIVE_INDEX_KEY]: activeIds,
      });
      await this.clearPlayerActiveIfMatching(ticket.playerId, ticket.ticketId);
      await this.scheduleNextAlarmFromActive(nowMs);

      return {
        ok: true,
        cancelled: true,
        ticketId: ticket.ticketId,
        status: 'cancelled',
        ticket,
      };
    });
  }

  private async loadActiveIds(): Promise<string[]> {
    const stored = await this.state.storage.get<string[]>(ACTIVE_INDEX_KEY);
    if (!Array.isArray(stored)) return [];
    return Array.from(new Set(stored));
  }

  private async clearPlayerActiveIfMatching(playerId: string, ticketId: string): Promise<void> {
    const current = await this.state.storage.get<string>(playerActiveKey(playerId));
    if (current === ticketId) {
      await this.state.storage.delete(playerActiveKey(playerId));
    }
  }

  private async countPartitionDepth(
    region: MatchmakingRegion,
    mode: MatchmakingRequest['mode']
  ): Promise<number> {
    const activeIds = await this.loadActiveIds();
    if (activeIds.length === 0) return 0;

    const map = await this.state.storage.get<MatchmakingTicket>(activeIds.map(ticketStorageKey));
    let count = 0;
    for (const ticket of map.values()) {
      if (ticket && isWaitingStatus(ticket.status) && ticket.region === region && ticket.mode === mode) {
        count += 1;
      }
    }
    return count;
  }

  private async reconcileQueueAndProvision(nowMs: number): Promise<void> {
    const activeIds = await this.loadActiveIds();
    if (activeIds.length === 0) {
      await this.state.storage.deleteAlarm();
      return;
    }

    const ticketMap = await this.state.storage.get<MatchmakingTicket>(
      activeIds.map(ticketStorageKey)
    );
    const activeTickets: MatchmakingTicket[] = [];
    const dirtyWrites: Record<string, unknown> = {};

    for (const id of activeIds) {
      const ticket = ticketMap.get(ticketStorageKey(id));
      if (!ticket || !isWaitingStatus(ticket.status)) {
        continue;
      }

      // Hard safety expiry if provisioning failed continuously for >120s
      if (nowMs - ticket.enqueuedAtMs >= HARD_TICKET_TIMEOUT_MS) {
        ticket.status = 'expired';
        dirtyWrites[ticketStorageKey(ticket.ticketId)] = ticket;
        await this.clearPlayerActiveIfMatching(ticket.playerId, ticket.ticketId);
        continue;
      }

      // 10s MMR tolerance expansion (120 -> 300)
      if (
        ticket.status === 'queued' &&
        nowMs >= ticket.enqueuedAtMs + EXPAND_AFTER_MS
      ) {
        ticket.status = 'expanding_mmr';
        ticket.mmrToleranceRange = EXPANDED_MMR_WINDOW;
        ticket.expandedAtMs = ticket.expandedAtMs ?? nowMs;
        dirtyWrites[ticketStorageKey(ticket.ticketId)] = ticket;
      }

      activeTickets.push(ticket);
    }

    if (Object.keys(dirtyWrites).length > 0) {
      await this.state.storage.put(dirtyWrites);
    }

    // Partition active tickets by `${region}::${mode}` sorted FIFO by enqueuedAtMs
    const partitions = new Map<string, MatchmakingTicket[]>();
    for (const t of activeTickets) {
      const partitionKey = `${t.region}::${t.mode}`;
      const list = partitions.get(partitionKey) ?? [];
      list.push(t);
      partitions.set(partitionKey, list);
    }

    const matchedTicketIds = new Set<string>();
    const retryWaitTicketIds = new Set<string>();

    for (const bucket of partitions.values()) {
      bucket.sort((a, b) => a.enqueuedAtMs - b.enqueuedAtMs);

      const remaining = [...bucket];
      const sampleMode = remaining[0]?.mode;
      if (!sampleMode) continue;

      // 1. Human-to-Human Matching Pass
      if (sampleMode === 'ranked_1v1' || sampleMode === 'quickplay') {
        while (remaining.length >= 2) {
          const anchor = remaining[0];
          const partnerIdx = this.findBestCompatibleIndex(anchor, remaining, 1);
          if (partnerIdx === -1) {
            // Try matching later compatible pairs in the partition rather than head-of-line blocking
            let paired = false;
            for (let i = 1; i < remaining.length - 1; i++) {
              const pIdx = this.findBestCompatibleIndex(remaining[i], remaining, i + 1);
              if (pIdx !== -1) {
                const pB = remaining.splice(pIdx, 1)[0];
                const pA = remaining.splice(i, 1)[0];
                const ok = await this.provisionHeadToHeadMatch(pA, pB, null, nowMs);
                if (ok) {
                  matchedTicketIds.add(pA.ticketId);
                  matchedTicketIds.add(pB.ticketId);
                } else {
                  retryWaitTicketIds.add(pA.ticketId);
                  retryWaitTicketIds.add(pB.ticketId);
                }
                paired = true;
                break;
              }
            }
            if (!paired) break;
            continue;
          }

          const partner = remaining.splice(partnerIdx, 1)[0];
          const host = remaining.shift()!;
          const ok = await this.provisionHeadToHeadMatch(host, partner, null, nowMs);
          if (ok) {
            matchedTicketIds.add(host.ticketId);
            matchedTicketIds.add(partner.ticketId);
          } else {
            retryWaitTicketIds.add(host.ticketId);
            retryWaitTicketIds.add(partner.ticketId);
          }
        }
      } else if (sampleMode === 'ranked_2v2') {
        while (remaining.length >= 4) {
          const quartetIndices = this.findCompatibleFourIndices(remaining);
          if (!quartetIndices) break;

          const picked = quartetIndices.map((idx) => remaining[idx]);
          // Remove highest indices first so lower indices remain valid
          const descIndices = [...quartetIndices].sort((a, b) => b - a);
          for (const idx of descIndices) {
            remaining.splice(idx, 1);
          }

          const ok = await this.provisionTwoVsTwoMatch(picked, nowMs);
          if (ok) {
            picked.forEach((t) => matchedTicketIds.add(t.ticketId));
          } else {
            picked.forEach((t) => retryWaitTicketIds.add(t.ticketId));
          }
        }
      }

      // 2. 20-Second AI Fallback Pass for Unmatched Remaining Tickets
      while (remaining.length > 0) {
        // Find oldest ticket whose fallback deadline has expired
        const overdueIdx = remaining.findIndex((t) => nowMs >= t.botFallbackDeadlineMs);
        if (overdueIdx === -1) break;

        if (sampleMode === 'ranked_1v1' || sampleMode === 'quickplay') {
          const ticket = remaining.splice(overdueIdx, 1)[0];
          if (ticket.status !== 'ai_fallback_pending') {
            ticket.status = 'ai_fallback_pending';
            await this.state.storage.put(ticketStorageKey(ticket.ticketId), ticket);
          }

          const bot = botEngine.createBotsForMatchFill({
            count: 1,
            targetTier: ticket.rankTier,
            targetDivision: ticket.rankDivision,
            targetMMR: ticket.mmr,
            excludeAvatarSeeds: [ticket.avatarSeed],
          })[0];

          const ok = await this.provisionHeadToHeadMatch(ticket, null, bot, nowMs);
          if (ok) {
            matchedTicketIds.add(ticket.ticketId);
          } else {
            retryWaitTicketIds.add(ticket.ticketId);
          }
        } else if (sampleMode === 'ranked_2v2') {
          const anchor = remaining.splice(overdueIdx, 1)[0];
          const coHumans: MatchmakingTicket[] = [anchor];

          // Gather up to 3 additional compatible humans waiting in this 2v2 partition
          const compatibleOthers: number[] = [];
          for (let i = 0; i < remaining.length && coHumans.length + compatibleOthers.length < 3; i++) {
            const cand = remaining[i];
            const allMatch =
              coHumans.every((h) => areTicketsMmrCompatible(h, cand)) &&
              compatibleOthers.every((idx) => areTicketsMmrCompatible(remaining[idx], cand));
            if (allMatch) {
              compatibleOthers.push(i);
            }
          }
          for (let k = compatibleOthers.length - 1; k >= 0; k--) {
            const idx = compatibleOthers[k];
            coHumans.push(remaining.splice(idx, 1)[0]);
          }

          for (const h of coHumans) {
            if (h.status !== 'ai_fallback_pending') {
              h.status = 'ai_fallback_pending';
              await this.state.storage.put(ticketStorageKey(h.ticketId), h);
            }
          }

          const ok = await this.provisionTwoVsTwoMatch(coHumans, nowMs);
          if (ok) {
            coHumans.forEach((t) => matchedTicketIds.add(t.ticketId));
          } else {
            coHumans.forEach((t) => retryWaitTicketIds.add(t.ticketId));
          }
        }
      }
    }

    const stillActive = activeTickets.filter((t) => !matchedTicketIds.has(t.ticketId));
    await this.state.storage.put(
      ACTIVE_INDEX_KEY,
      stillActive.map((t) => t.ticketId)
    );

    await this.pruneAncientCompletedTickets(nowMs);
    await this.scheduleNextAlarmFromTickets(stillActive, retryWaitTicketIds, nowMs);
  }

  private findBestCompatibleIndex(
    anchor: MatchmakingTicket,
    list: MatchmakingTicket[],
    startIdx: number
  ): number {
    let bestIdx = -1;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (let i = startIdx; i < list.length; i++) {
      const candidate = list[i];
      if (!areTicketsMmrCompatible(anchor, candidate)) continue;
      const diff = Math.abs(anchor.mmr - candidate.mmr);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  private findCompatibleFourIndices(list: MatchmakingTicket[]): number[] | null {
    for (let i = 0; i < list.length - 3; i++) {
      const group: number[] = [i];
      for (let j = i + 1; j < list.length && group.length < 4; j++) {
        const candidate = list[j];
        const compatibleWithAll = group.every((gIdx) =>
          areTicketsMmrCompatible(list[gIdx], candidate)
        );
        if (compatibleWithAll) {
          group.push(j);
        }
      }
      if (group.length === 4) {
        return group;
      }
    }
    return null;
  }

  private async provisionHeadToHeadMatch(
    humanA: MatchmakingTicket,
    humanB: MatchmakingTicket | null,
    botB: BotProfile | null,
    nowMs: number
  ): Promise<boolean> {
    const assignedSlots: Array<{ candidate: ProvisionSlotCandidate; teamId: TeamId }> = [
      {
        candidate: { kind: 'human', mmr: humanA.mmr, humanTicket: humanA },
        teamId: 'team_alpha',
      },
      humanB
        ? {
          candidate: { kind: 'human', mmr: humanB.mmr, humanTicket: humanB },
          teamId: 'team_beta',
        }
        : {
          candidate: {
            kind: 'bot',
            mmr: botB!.simulatedMMR,
            botProfile: botB!,
          },
          teamId: 'team_beta',
        },
    ];

    return this.persistAndFinalizeProvisionedMatch({
      mode: humanA.mode,
      region: humanA.region,
      assignedSlots,
      nowMs,
    });
  }

  private async provisionTwoVsTwoMatch(
    humanTickets: MatchmakingTicket[],
    nowMs: number
  ): Promise<boolean> {
    const botsNeeded = Math.max(0, 4 - humanTickets.length);
    const avgHumanMmr = Math.round(
      humanTickets.reduce((sum, t) => sum + t.mmr, 0) / Math.max(1, humanTickets.length)
    );
    const anchorRank = inferTierFromMmr(avgHumanMmr);

    const bots = botEngine.createBotsForMatchFill({
      count: botsNeeded,
      targetTier: humanTickets[0]?.rankTier || anchorRank.tier,
      targetDivision: humanTickets[0]?.rankDivision ?? anchorRank.division,
      targetMMR: avgHumanMmr,
      excludeAvatarSeeds: humanTickets.map((t) => t.avatarSeed),
    });

    const slots: ProvisionSlotCandidate[] = [
      ...humanTickets.map((t) => ({ kind: 'human' as const, mmr: t.mmr, humanTicket: t })),
      ...bots.map((b) => ({ kind: 'bot' as const, mmr: b.simulatedMMR, botProfile: b })),
    ];

    const assignedSlots = balanceFourSlotsIntoTeams(slots);

    return this.persistAndFinalizeProvisionedMatch({
      mode: 'ranked_2v2',
      region: humanTickets[0].region,
      assignedSlots,
      nowMs,
    });
  }

  private async persistAndFinalizeProvisionedMatch(params: {
    mode: MatchmakingRequest['mode'];
    region: MatchmakingRegion;
    assignedSlots: Array<{ candidate: ProvisionSlotCandidate; teamId: TeamId }>;
    nowMs: number;
  }): Promise<boolean> {
    const humanTickets = params.assignedSlots
      .map((s) => s.candidate.humanTicket)
      .filter((t): t is MatchmakingTicket => Boolean(t));

    if (humanTickets.length === 0) return false;

    const matchId = crypto.randomUUID();
    const roomId = this.env.MATCH_ROOM.idFromName(matchId);
    const durableObjectId = roomId.toString();

    const bots: BotProfile[] = [];
    const participants: MatchParticipant[] = [];
    const botProfilesMap: Record<string, BotProfile> = {};
    const participantIdByTicketId = new Map<string, string>();
    const participantSummaries: MatchedParticipantSummary[] = [];

    for (const slot of params.assignedSlots) {
      if (slot.candidate.kind === 'human' && slot.candidate.humanTicket) {
        const t = slot.candidate.humanTicket;
        const participantId = `p_${crypto.randomUUID().slice(0, 8)}`;
        participantIdByTicketId.set(t.ticketId, participantId);

        participants.push({
          participantId,
          playerId: t.playerId,
          participantType: 'human',
          teamId: slot.teamId,
          username: t.username,
          tag: t.tag,
          avatarSeed: t.avatarSeed,
          countryCode: t.countryCode,
          rankTier: t.rankTier,
          rankDivision: t.rankDivision,
          rankPoints: t.rankPoints,
          mmr: t.mmr,
          connectionStatus: 'reconnecting',
          hasAnsweredCurrentRound: false,
          score: createZeroScore(participantId),
        });

        participantSummaries.push({
          participantId,
          publicPlayerId: t.publicPlayerId,
          participantType: 'human',
          teamId: slot.teamId,
          username: t.username,
          tag: t.tag,
          avatarSeed: t.avatarSeed,
          countryCode: t.countryCode,
          rankTier: t.rankTier,
          rankDivision: t.rankDivision,
          rankPoints: t.rankPoints,
          isBot: false,
        });
      } else if (slot.candidate.kind === 'bot' && slot.candidate.botProfile) {
        const b = slot.candidate.botProfile;
        bots.push(b);
        botProfilesMap[b.botId] = b;

        const participantId = `b_${crypto.randomUUID().slice(0, 8)}`;
        participants.push({
          participantId,
          playerId: b.botId,
          participantType: 'bot',
          teamId: slot.teamId,
          username: b.username,
          tag: b.tag,
          avatarSeed: b.avatarSeed,
          countryCode: b.countryCode,
          rankTier: b.rankTier,
          rankDivision: b.rankDivision,
          rankPoints: b.simulatedRP,
          mmr: b.simulatedMMR,
          connectionStatus: 'connected',
          hasAnsweredCurrentRound: false,
          score: createZeroScore(participantId),
          botProfileId: b.botId,
        });

        participantSummaries.push({
          participantId,
          participantType: 'bot',
          teamId: slot.teamId,
          username: b.username,
          tag: b.tag,
          avatarSeed: b.avatarSeed,
          countryCode: b.countryCode,
          rankTier: b.rankTier,
          rankDivision: b.rankDivision,
          rankPoints: b.simulatedRP,
          isBot: true,
        });
      }
    }

    const hasBotFallback = bots.length > 0;
    const isRanked = params.mode === 'ranked_1v1' || params.mode === 'ranked_2v2';
    // AI fallback matches MUST NOT grant/deduct ranked RP or MMR during prototype phase
    const isRated = isRanked && !hasBotFallback;
    const totalRounds = resolveTotalRoundsForMode(params.mode);
    const rankAnchor = computeRankAnchorLabel(humanTickets);

    const participantsRecord: Record<string, MatchParticipant> = {};
    for (const p of participants) {
      participantsRecord[p.participantId] = p;
    }

    const authState: AuthoritativeMatchState = {
      matchId,
      durableObjectId,
      status: 'waiting_for_players',
      phase: 'lobby_sync',
      config: {
        mode: params.mode,
        totalRounds,
        roundDurationSec: GAME_RULES.ROUND_DURATION_SEC,
        intermissionDurationSec: GAME_RULES.INTERMISSION_DURATION_SEC,
        isRanked,
        isRated,
        hasBotFallback,
        rankAnchor,
      },
      participants: participantsRecord,
      botProfiles: botProfilesMap,
      questionSequence: [],
      sequenceSeed: crypto.randomUUID(),
      currentRoundNumber: 0,
      currentRound: null,
      completedRounds: [],
      chatLog: [],
      createdAtMs: nowMs,
      phaseEndsAtMs: nowMs + 60_000,
      version: 1,
    };

    const roomStub = this.env.MATCH_ROOM.get(roomId);
    try {
      const initResp = await roomStub.fetch('https://match-room.internal/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: authState }),
      });
      if (!initResp.ok) {
        const text = await initResp.text();
        console.error('MatchRoomDO /init failed:', initResp.status, text);
        return false;
      }

      await matchRepository.createProvisionedMatch(this.env, {
        matchId,
        durableObjectId,
        mode: params.mode as MatchMode,
        region: params.region,
        status: 'waiting_for_players',
        rankAnchor,
        totalRounds,
        hasBotFallback,
        isRated,
        participants,
      });
    } catch (err) {
      console.error('Match provisioning failed, rolling back MatchRoomDO:', err);
      try {
        await roomStub.fetch('https://match-room.internal/abort', { method: 'POST' });
      } catch {
        // Best-effort DO rollback
      }
      return false;
    }

    const summaryBase = {
      matchId,
      wsEndpointPath: `/api/v1/ws/match/${matchId}`,
      mode: params.mode,
      region: params.region,
      rankAnchor,
      includesBotOpponent: hasBotFallback,
      isRated,
      foundAtMs: nowMs,
      participants: participantSummaries,
    };

    const ticketUpdates: Record<string, MatchmakingTicket> = {};
    for (const ticket of humanTickets) {
      ticket.status = 'match_found';
      ticket.matchedMatchId = matchId;
      ticket.myParticipantId = participantIdByTicketId.get(ticket.ticketId);
      ticket.matchedSummary = summaryBase;
      ticketUpdates[ticketStorageKey(ticket.ticketId)] = ticket;
      await this.clearPlayerActiveIfMatching(ticket.playerId, ticket.ticketId);
    }

    await this.state.storage.put(ticketUpdates);
    return true;
  }

  private async scheduleNextAlarmFromActive(nowMs: number): Promise<void> {
    const activeIds = await this.loadActiveIds();
    if (activeIds.length === 0) {
      await this.state.storage.deleteAlarm();
      return;
    }
    const ticketMap = await this.state.storage.get<MatchmakingTicket>(
      activeIds.map(ticketStorageKey)
    );
    const activeTickets: MatchmakingTicket[] = [];
    for (const t of ticketMap.values()) {
      if (t && isWaitingStatus(t.status)) {
        activeTickets.push(t);
      }
    }
    await this.scheduleNextAlarmFromTickets(activeTickets, new Set<string>(), nowMs);
  }

  private async scheduleNextAlarmFromTickets(
    activeTickets: MatchmakingTicket[],
    retryWaitTicketIds: Set<string>,
    nowMs: number
  ): Promise<void> {
    if (activeTickets.length === 0) {
      await this.state.storage.deleteAlarm();
      return;
    }

    let nextAlarmAt = Number.POSITIVE_INFINITY;
    for (const t of activeTickets) {
      if (t.status === 'queued') {
        const expandAt = t.enqueuedAtMs + EXPAND_AFTER_MS;
        if (expandAt < nextAlarmAt) nextAlarmAt = expandAt;
      }
      if (t.botFallbackDeadlineMs < nextAlarmAt) {
        nextAlarmAt = t.botFallbackDeadlineMs;
      }
      if (t.status === 'ai_fallback_pending' || retryWaitTicketIds.has(t.ticketId)) {
        const retryAt = nowMs + RETRY_ALARM_MS;
        if (retryAt < nextAlarmAt) nextAlarmAt = retryAt;
      }
    }

    if (Number.isFinite(nextAlarmAt)) {
      await this.state.storage.setAlarm(Math.max(nowMs + 250, nextAlarmAt));
    }
  }

  private async pruneAncientCompletedTickets(nowMs: number): Promise<void> {
    const stored = await this.state.storage.list<MatchmakingTicket>({
      prefix: TICKET_KEY_PREFIX,
      limit: 64,
    });
    const keysToDelete: string[] = [];
    for (const [key, ticket] of stored.entries()) {
      if (
        !isWaitingStatus(ticket.status) &&
        nowMs - ticket.lastPolledAtMs > COMPLETED_TICKET_RETENTION_MS
      ) {
        keysToDelete.push(key);
      }
    }
    if (keysToDelete.length > 0) {
      await this.state.storage.delete(keysToDelete);
    }
  }

  private jsonResponse(payload: DoTicketResult): Response {
    const statusMap: Record<NonNullable<DoTicketResult['code']>, number> = {
      BAD_REQUEST: 400,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      CONFLICT: 409,
      INTERNAL_ERROR: 500,
    };
    const status = payload.ok ? 200 : statusMap[payload.code ?? 'INTERNAL_ERROR'] ?? 500;
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
