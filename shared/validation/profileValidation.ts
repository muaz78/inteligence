// Shared Authentication & Profile Input Validation for CountryRush
// Single validation contract enforced on both Frontend forms and Backend API endpoints.

import { isValidAvatarId } from '../constants/avatars';

export const USERNAME_RULES = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 20,
  PATTERN: /^[A-Za-z0-9][A-Za-z0-9_]{1,18}[A-Za-z0-9]$/,
} as const;

export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
} as const;

const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'moderator',
  'system',
  'countryrush',
  'support',
  'official',
  'staff',
  'root',
  'null',
  'undefined',
]);

export interface ValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}

export function validateEmail(raw: string): ValidationResult {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) {
    return { valid: false, error: 'Email address is required.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed) || trimmed.length > 254) {
    return { valid: false, error: 'Enter a valid email address.' };
  }
  return { valid: true, normalized: trimmed };
}

export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: 'Password is required.' };
  }
  if (password.length < PASSWORD_RULES.MIN_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${PASSWORD_RULES.MIN_LENGTH} characters long.`,
    };
  }
  if (password.length > PASSWORD_RULES.MAX_LENGTH) {
    return { valid: false, error: 'Password is too long.' };
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      valid: false,
      error: 'Password must include at least one letter and one number.',
    };
  }
  return { valid: true, normalized: password };
}

export function validateUsername(raw: string): ValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: false, error: 'Username is required.' };
  }
  if (trimmed.length < USERNAME_RULES.MIN_LENGTH || trimmed.length > USERNAME_RULES.MAX_LENGTH) {
    return {
      valid: false,
      error: `Username must be between ${USERNAME_RULES.MIN_LENGTH} and ${USERNAME_RULES.MAX_LENGTH} characters.`,
    };
  }
  if (/\s/.test(trimmed)) {
    return { valid: false, error: 'Username cannot contain spaces or whitespace.' };
  }
  if (/__/.test(trimmed)) {
    return { valid: false, error: 'Username cannot contain consecutive underscores.' };
  }
  if (!USERNAME_RULES.PATTERN.test(trimmed)) {
    return {
      valid: false,
      error: 'Use letters, numbers, and underscores only (must start and end with a letter or number).',
    };
  }
  if (RESERVED_USERNAMES.has(trimmed.toLowerCase())) {
    return { valid: false, error: 'That username is reserved. Please choose another.' };
  }
  return { valid: true, normalized: trimmed };
}

export function validateAvatarSelection(avatarId: string): ValidationResult {
  const trimmed = avatarId.trim();
  if (!isValidAvatarId(trimmed)) {
    return {
      valid: false,
      error: 'Selected avatar identifier is not part of the official CountryRush avatar roster.',
    };
  }
  return { valid: true, normalized: trimmed };
}
