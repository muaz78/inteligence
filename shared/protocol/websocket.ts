// Shared WebSocket Realtime Protocol Contracts for CountryRush
// Discriminated unions shared between Browser wsClient and Cloudflare MatchRoomDO.

import type { QuestionAnswerSubmission, QuestionAnswerValidation } from '../types/question';
import type { ClientMatchState, MatchResult, ParticipantScore } from '../types/match';
import type { ChatChannel, ChatMessage } from '../types/chat';

export const WS_CLOSE_CODES = {
  NORMAL: 1000,
  UNAUTHORIZED: 4001,
  FORBIDDEN_NOT_PARTICIPANT: 4003,
  MATCH_NOT_FOUND: 4004,
  RATE_LIMITED: 4029,
  MATCH_ENDED: 4010,
  INVALID_MESSAGE: 4002,
} as const;

export type WsCloseCode = (typeof WS_CLOSE_CODES)[keyof typeof WS_CLOSE_CODES];

export type WsErrorCode =
  | 'UNAUTHORIZED'
  | 'INVALID_PAYLOAD'
  | 'NOT_PARTICIPANT'
  | 'ROUND_CLOSED'
  | 'ALREADY_ANSWERED'
  | 'RATE_LIMITED'
  | 'HINT_UNAVAILABLE'
  | 'CHAT_BLOCKED'
  | 'INTERNAL_ERROR';

// ============================================================================
// CLIENT -> SERVER MESSAGES
// ============================================================================

export type ClientToServerMessage =
  | {
      type: 'client:ping';
      clientTimeMs: number;
    }
  | {
      type: 'client:ready';
      matchId: string;
    }
  | {
      type: 'client:submit_answer';
      payload: QuestionAnswerSubmission;
    }
  | {
      type: 'client:request_hint';
      matchId: string;
      roundNumber: number;
    }
  | {
      type: 'client:send_chat';
      matchId: string;
      channel: ChatChannel;
      content: string;
      presetEmoteId?: string;
    }
  | {
      type: 'client:request_resync';
      matchId: string;
      lastSeenVersion: number;
    };

// ============================================================================
// SERVER -> CLIENT MESSAGES
// ============================================================================

export type ServerToClientMessage =
  | {
      type: 'server:pong';
      clientTimeMs: number;
      serverNowMs: number;
    }
  | {
      type: 'server:connected';
      matchId: string;
      participantId: string;
      serverNowMs: number;
    }
  | {
      type: 'server:state_sync';
      state: ClientMatchState;
    }
  | {
      type: 'server:participant_status';
      matchId: string;
      participantId: string;
      connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
      hasAnsweredCurrentRound: boolean;
    }
  | {
      type: 'server:hint_revealed';
      matchId: string;
      roundNumber: number;
      hintIndex: number;
      hintText: string;
      penaltyApplied: number;
    }
  | {
      type: 'server:round_outcome';
      matchId: string;
      roundNumber: number;
      outcomes: QuestionAnswerValidation[];
      updatedScores: ParticipantScore[];
      nextRoundStartsAtMs: number | null;
    }
  | {
      type: 'server:chat_message';
      message: ChatMessage;
    }
  | {
      type: 'server:match_completed';
      result: MatchResult;
    }
  | {
      type: 'server:error';
      code: WsErrorCode;
      message: string;
      retryAfterMs?: number;
    };

export type WsEnvelope = ClientToServerMessage | ServerToClientMessage;
