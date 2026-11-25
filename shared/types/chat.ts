// Shared In-Game Chat Types for CountryRush
// Foundation for Phase 7 (In-Game Chat & Bot Chat).

export type ChatChannel = 'match_all' | 'match_team' | 'lobby_party';

export type ChatSenderType = 'player' | 'bot' | 'system';

export type ChatModerationStatus = 'approved' | 'flagged' | 'blocked';

export interface ChatMessage {
  id: string;
  matchId: string;
  channel: ChatChannel;
  senderId: string;
  senderUsername: string;
  senderType: ChatSenderType;
  senderAvatarSeed?: string;
  content: string;
  presetEmoteId?: string;
  timestampMs: number;
  moderationStatus?: ChatModerationStatus;
}

export interface SendChatMessageRequest {
  matchId: string;
  channel: ChatChannel;
  content: string;
  presetEmoteId?: string;
}
