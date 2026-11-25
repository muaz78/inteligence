// Centralized Allowlisted Avatar Registry for CountryRush
// Enforces deterministic, lightweight, anime-inspired esports avatar IDs.
// Prevents arbitrary external image URL injection into user profiles.

export interface AvatarDefinition {
  id: string;
  label: string;
  archetype: string;
  accentHex: string;
  hairColor: string;
  hairHighlight: string;
  skinColor: string;
  jacketColor: string;
  jacketAccent: string;
  eyeColor: string;
  headsetColor: string;
  bgGradient: [string, string];
}

export const AVATAR_CATALOG: readonly AvatarDefinition[] = [
  {
    id: 'aoi_valkyrie',
    label: 'Aoi',
    archetype: 'Valkyrie Tactician',
    accentHex: '#3478F6',
    hairColor: '#3B82F6',
    hairHighlight: '#93C5FD',
    skinColor: '#FFE7D6',
    jacketColor: '#1E293B',
    jacketAccent: '#FF9F43',
    eyeColor: '#2563EB',
    headsetColor: '#3478F6',
    bgGradient: ['#EBF3FF', '#C7D9FE'],
  },
  {
    id: 'kaito_tactician',
    label: 'Kaito',
    archetype: 'Shadow Strategist',
    accentHex: '#8B5CF6',
    hairColor: '#475569',
    hairHighlight: '#94A3B8',
    skinColor: '#FDE2D2',
    jacketColor: '#0F172A',
    jacketAccent: '#8B5CF6',
    eyeColor: '#7C3AED',
    headsetColor: '#8B5CF6',
    bgGradient: ['#F5F3FF', '#DDD6FE'],
  },
  {
    id: 'sakura_blitz',
    label: 'Sakura',
    archetype: 'Crimson Sprinter',
    accentHex: '#F43F5E',
    hairColor: '#F43F5E',
    hairHighlight: '#FDA4AF',
    skinColor: '#FFF1E8',
    jacketColor: '#FFFFFF',
    jacketAccent: '#F43F5E',
    eyeColor: '#E11D48',
    headsetColor: '#FB7185',
    bgGradient: ['#FFF1F2', '#FECDD3'],
  },
  {
    id: 'neon_horizon',
    label: 'Neon',
    archetype: 'Radar Navigator',
    accentHex: '#06B6D4',
    hairColor: '#06B6D4',
    hairHighlight: '#67E8F9',
    skinColor: '#FFE4D6',
    jacketColor: '#1E293B',
    jacketAccent: '#22D3EE',
    eyeColor: '#0891B2',
    headsetColor: '#06B6D4',
    bgGradient: ['#ECFEFF', '#CFFAFE'],
  },
  {
    id: 'zenith_striker',
    label: 'Zenith',
    archetype: 'Solar Champion',
    accentHex: '#F59E0B',
    hairColor: '#F59E0B',
    hairHighlight: '#FDE68A',
    skinColor: '#FFEAD9',
    jacketColor: '#0F172A',
    jacketAccent: '#E11D48',
    eyeColor: '#D97706',
    headsetColor: '#F59E0B',
    bgGradient: ['#FEF3C7', '#FDE68A'],
  },
  {
    id: 'ren_kyoto',
    label: 'Ren',
    archetype: 'Emerald Cartographer',
    accentHex: '#10B981',
    hairColor: '#0F766E',
    hairHighlight: '#5EEAD4',
    skinColor: '#FDE8DA',
    jacketColor: '#1E293B',
    jacketAccent: '#10B981',
    eyeColor: '#059669',
    headsetColor: '#14B8A6',
    bgGradient: ['#ECFDF5', '#A7F3D0'],
  },
  {
    id: 'haru_alpine',
    label: 'Haru',
    archetype: 'Glacier Scout',
    accentHex: '#0284C7',
    hairColor: '#E2E8F0',
    hairHighlight: '#FFFFFF',
    skinColor: '#FFF0E6',
    jacketColor: '#0C4A6E',
    jacketAccent: '#38BDF8',
    eyeColor: '#0284C7',
    headsetColor: '#38BDF8',
    bgGradient: ['#F0F9FF', '#BAE6FD'],
  },
  {
    id: 'sora_apex',
    label: 'Sora',
    archetype: 'Indigo Commander',
    accentHex: '#4F46E5',
    hairColor: '#312E81',
    hairHighlight: '#818CF8',
    skinColor: '#FFE6D5',
    jacketColor: '#1E1B4B',
    jacketAccent: '#FF9F43',
    eyeColor: '#4F46E5',
    headsetColor: '#6366F1',
    bgGradient: ['#EEF2FF', '#C7D2FE'],
  },
] as const;

export type AllowedAvatarId = (typeof AVATAR_CATALOG)[number]['id'];

export const ALLOWED_AVATAR_IDS: readonly string[] = AVATAR_CATALOG.map((a) => a.id);

export const DEFAULT_AVATAR_ID: AllowedAvatarId = 'aoi_valkyrie';

export function isValidAvatarId(id: string | undefined | null): boolean {
  if (!id || typeof id !== 'string') return false;
  return ALLOWED_AVATAR_IDS.includes(id.trim());
}

export function resolveAvatarDefinition(seedOrId: string | undefined | null): AvatarDefinition {
  if (seedOrId) {
    const exact = AVATAR_CATALOG.find((a) => a.id === seedOrId.trim());
    if (exact) return exact;

    // Deterministic legacy seed compatibility (for mock friends/leaderboard entries)
    const hash = seedOrId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return AVATAR_CATALOG[hash % AVATAR_CATALOG.length];
  }
  return AVATAR_CATALOG[0];
}
