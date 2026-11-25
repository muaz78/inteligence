// WebSocket Validation, Membership Guard, and Frame Dispatcher Foundation
import type { ClientToServerMessage, ServerToClientMessage, WsErrorCode } from '../../../shared/protocol/websocket';
import type { AuthoritativeMatchState } from '../../../shared/types/match';
import { API_RATE_POLICIES, defaultRateLimiter } from '../api/middleware/rateLimiter';

export function parseClientWsMessage(raw: string | ArrayBuffer): ClientToServerMessage | null {
  if (typeof raw !== 'string') return null;
  if (raw.length > 8_192) return null; // Reject oversized frames

  try {
    const parsed = JSON.parse(raw) as { type?: unknown };
    if (!parsed || typeof parsed !== 'object' || typeof parsed.type !== 'string') {
      return null;
    }

    switch (parsed.type) {
      case 'client:ping':
      case 'client:ready':
      case 'client:submit_answer':
      case 'client:request_hint':
      case 'client:send_chat':
      case 'client:request_resync':
        return parsed as ClientToServerMessage;
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function isMatchParticipant(state: AuthoritativeMatchState, playerId: string): boolean {
  return Object.values(state.participants).some(
    (p) => p.playerId === playerId && p.participantType === 'human'
  );
}

export async function checkWsInboundRateLimit(participantId: string): Promise<boolean> {
  const decision = await defaultRateLimiter.check(participantId, API_RATE_POLICIES.WS_INBOUND_FRAME);
  return decision.allowed;
}

export function buildWsErrorFrame(
  code: WsErrorCode,
  message: string,
  retryAfterMs?: number
): string {
  const frame: ServerToClientMessage = {
    type: 'server:error',
    code,
    message,
    retryAfterMs,
  };
  return JSON.stringify(frame);
}
