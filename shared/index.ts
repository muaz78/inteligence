// CountryRush Shared Contracts Barrel Export
// Environment-agnostic pure TypeScript types, protocols, validation, and constants.

export type * from './types/player';
export type * from './types/question';
export type * from './types/bot';
export type * from './types/chat';
export type * from './types/match';
export type * from './types/matchmaking';
export type * from './protocol/websocket';
export type * from './protocol/api';
export type { AvatarDefinition, AllowedAvatarId } from './constants/avatars';
export type { InitialPlayerProfileConfig } from './constants/profileDefaults';
export type { ValidationResult } from './validation/profileValidation';

export { WS_CLOSE_CODES } from './protocol/websocket';
export { GAME_RULES, RATE_LIMIT_POLICIES } from './constants/gameRules';
export {
  AVATAR_CATALOG,
  ALLOWED_AVATAR_IDS,
  DEFAULT_AVATAR_ID,
  isValidAvatarId,
  resolveAvatarDefinition,
} from './constants/avatars';
export { INITIAL_PLAYER_PROFILE_CONFIG } from './constants/profileDefaults';
export {
  USERNAME_RULES,
  PASSWORD_RULES,
  validateEmail,
  validatePassword,
  validateUsername,
  validateAvatarSelection,
} from './validation/profileValidation';
