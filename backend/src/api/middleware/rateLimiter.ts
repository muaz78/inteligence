// CountryRush Rate Limiting Architecture (HTTP API & WebSocket Flood Protection)
// Phase 1 establishes contracts and policies; Phase 3 connects edge KV / Durable Object buckets.

import { RATE_LIMIT_POLICIES } from '../../../../shared/constants/gameRules';

export interface RateLimitPolicy {
  keyPrefix: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  resetAtMs: number;
  retryAfterSec?: number;
}

export interface RateLimiterContract {
  check(identifier: string, policy: RateLimitPolicy, nowMs?: number): Promise<RateLimitDecision>;
}

export const API_RATE_POLICIES = {
  GENERAL_API: {
    keyPrefix: 'rl:api',
    limit: RATE_LIMIT_POLICIES.HTTP_API_RPM,
    windowMs: 60_000,
  },
  MATCHMAKING_JOIN: {
    keyPrefix: 'rl:mm_join',
    limit: RATE_LIMIT_POLICIES.MATCHMAKING_JOIN_RPM,
    windowMs: 60_000,
  },
  MATCHMAKING_STATUS: {
    keyPrefix: 'rl:mm_status',
    limit: 90,
    windowMs: 60_000,
  },
  MATCHMAKING_CANCEL: {
    keyPrefix: 'rl:mm_cancel',
    limit: 20,
    windowMs: 60_000,
  },
  WS_INBOUND_FRAME: {
    keyPrefix: 'rl:ws_msg',
    limit: RATE_LIMIT_POLICIES.WS_MESSAGES_PER_10_SEC,
    windowMs: 10_000,
  },
  CHAT_SEND: {
    keyPrefix: 'rl:chat',
    limit: RATE_LIMIT_POLICIES.CHAT_MESSAGES_PER_10_SEC,
    windowMs: 10_000,
  },
} as const;

/**
 * Per-isolate / per-Durable-Object in-memory sliding window guard.
 * Note: Inside Cloudflare Durable Objects, single-instance in-memory tracking
 * is strongly consistent for all WebSocket connections inside that match room.
 * For edge Workers across POPs, Phase 3 will pair this with Cloudflare Rate Limiting bindings.
 */
export class TokenWindowRateLimiter implements RateLimiterContract {
  private buckets = new Map<string, { count: number; windowStartMs: number }>();

  public async check(
    identifier: string,
    policy: RateLimitPolicy,
    nowMs: number = Date.now()
  ): Promise<RateLimitDecision> {
    const key = `${policy.keyPrefix}:${identifier}`;
    const existing = this.buckets.get(key);

    if (!existing || nowMs - existing.windowStartMs >= policy.windowMs) {
      this.buckets.set(key, { count: 1, windowStartMs: nowMs });
      return {
        allowed: true,
        remaining: Math.max(0, policy.limit - 1),
        resetAtMs: nowMs + policy.windowMs,
      };
    }

    if (existing.count >= policy.limit) {
      const retryAfterMs = Math.max(0, existing.windowStartMs + policy.windowMs - nowMs);
      return {
        allowed: false,
        remaining: 0,
        resetAtMs: existing.windowStartMs + policy.windowMs,
        retryAfterSec: Math.ceil(retryAfterMs / 1000),
      };
    }

    existing.count += 1;
    return {
      allowed: true,
      remaining: Math.max(0, policy.limit - existing.count),
      resetAtMs: existing.windowStartMs + policy.windowMs,
    };
  }
}

export const defaultRateLimiter = new TokenWindowRateLimiter();
