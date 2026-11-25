// In-Game Match Chat & Moderation Service Foundation (Phase 7 Target)
// Handles player chat validation, length/cooldown guards, moderation hooks, and bot chat reactions.

import type { ChatChannel, ChatMessage } from '../../../shared/types/chat';
import type { BotProfile } from '../../../shared/types/bot';
import { GAME_RULES } from '../../../shared/constants/gameRules';
import { PhaseNotImplementedError } from '../config/env';

export interface ChatValidationResult {
  allowed: boolean;
  sanitizedContent?: string;
  rejectReason?: string;
}

export interface ChatServiceContract {
  validateAndSanitizeMessage(rawContent: string): ChatValidationResult;
  createPlayerChatMessage(params: {
    matchId: string;
    channel: ChatChannel;
    senderId: string;
    senderUsername: string;
    senderAvatarSeed: string;
    content: string;
    presetEmoteId?: string;
  }): ChatMessage;
  maybeGenerateBotChatReaction(bot: BotProfile, trigger: 'match_start' | 'close_round' | 'match_end'): ChatMessage | null;
}

export class Phase1ChatService implements ChatServiceContract {
  public validateAndSanitizeMessage(rawContent: string): ChatValidationResult {
    const trimmed = rawContent.trim();
    if (!trimmed) {
      return { allowed: false, rejectReason: 'Empty message' };
    }
    if (trimmed.length > GAME_RULES.MAX_CHAT_MESSAGE_LENGTH) {
      return {
        allowed: false,
        rejectReason: `Message exceeds ${GAME_RULES.MAX_CHAT_MESSAGE_LENGTH} characters.`,
      };
    }
    return { allowed: true, sanitizedContent: trimmed };
  }

  public createPlayerChatMessage(): ChatMessage {
    throw new PhaseNotImplementedError('In-game real-time chat routing', 'Phase 7');
  }

  public maybeGenerateBotChatReaction(): ChatMessage | null {
    return null;
  }
}

export const chatService: ChatServiceContract = new Phase1ChatService();
