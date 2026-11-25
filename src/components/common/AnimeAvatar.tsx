import React, { useId } from 'react';
import type { FriendStatus, RankTier } from '../../types/game';
import { resolveAvatarDefinition } from '../../../shared/constants/avatars';

interface AnimeAvatarProps {
  seed: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: FriendStatus;
  rankTier?: RankTier;
  hasBorder?: boolean;
  className?: string;
}

export const AnimeAvatar: React.FC<AnimeAvatarProps> = ({
  seed,
  size = 'md',
  status,
  rankTier,
  hasBorder = true,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const sizeMap = {
    xs: { dim: 32, badge: 8, ring: 'ring-1' },
    sm: { dim: 42, badge: 10, ring: 'ring-2' },
    md: { dim: 54, badge: 12, ring: 'ring-2' },
    lg: { dim: 68, badge: 14, ring: 'ring-2' },
    xl: { dim: 88, badge: 16, ring: 'ring-3' },
    '2xl': { dim: 112, badge: 18, ring: 'ring-4' },
  };

  const { dim, badge } = sizeMap[size];
  const p = resolveAvatarDefinition(seed);

  const getRankRing = () => {
    if (!rankTier) return 'border-slate-200';
    switch (rankTier) {
      case 'Bronze': return 'border-[#C97A44] shadow-[0_0_12px_rgba(201,122,68,0.35)]';
      case 'Silver': return 'border-slate-300 shadow-[0_0_12px_rgba(148,163,184,0.4)]';
      case 'Gold': return 'border-[#F59E0B] shadow-[0_0_14px_rgba(245,158,11,0.45)]';
      case 'Platinum': return 'border-[#06B6D4] shadow-[0_0_14px_rgba(6,182,212,0.45)]';
      case 'Diamond': return 'border-[#3B82F6] shadow-[0_0_16px_rgba(59,130,246,0.55)]';
      case 'Master': return 'border-[#8B5CF6] shadow-[0_0_18px_rgba(139,92,246,0.6)]';
      case 'Elite': return 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.7)] ring-2 ring-pink-500/40';
      default: return 'border-blue-500';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'bg-emerald-500 ring-white';
      case 'in_match': return 'bg-blue-600 ring-white animate-pulse';
      case 'away': return 'bg-amber-400 ring-white';
      case 'offline': return 'bg-slate-400 ring-white';
      default: return null;
    }
  };

  return (
    <div className={`relative inline-block select-none shrink-0 ${className}`}>
      <div
        className={`relative overflow-hidden rounded-2xl transition-transform duration-200 group-hover:scale-105 ${
          hasBorder ? `border-[2.5px] ${getRankRing()}` : ''
        }`}
        style={{ width: dim, height: dim }}
      >
        <svg viewBox="0 0 120 120" width="100%" height="100%" className="w-full h-full object-cover">
          <defs>
            <linearGradient id={`bg-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={p.bgGradient[0]} />
              <stop offset="100%" stopColor={p.bgGradient[1]} />
            </linearGradient>
            <linearGradient id={`hair-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={p.hairHighlight} />
              <stop offset="100%" stopColor={p.hairColor} />
            </linearGradient>
            <linearGradient id={`jacket-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={p.jacketColor} />
              <stop offset="100%" stopColor="#0B1120" />
            </linearGradient>
          </defs>

          <rect width="120" height="120" fill={`url(#bg-${uid})`} />

          {/* Anime Speed Arcs */}
          <path d="M10 20 Q60 -5 110 30" fill="none" stroke="#FFFFFF" strokeWidth="3" opacity="0.5" />
          <path d="M15 110 Q60 125 105 100" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.4" />

          {/* Esports Jacket Collar / Shoulders */}
          <path d="M15 120 Q60 90 105 120 L115 120 L5 120 Z" fill={`url(#jacket-${uid})`} />
          <path d="M42 98 L50 120 L70 120 L78 98 Z" fill="#FFFFFF" opacity="0.9" />
          <path d="M30 105 L45 120" stroke={p.jacketAccent} strokeWidth="3" strokeLinecap="round" />
          <path d="M90 105 L75 120" stroke={p.jacketAccent} strokeWidth="3" strokeLinecap="round" />

          {/* Neck & Head */}
          <path d="M50 82 L70 82 L68 98 L52 98 Z" fill={p.skinColor} />
          <ellipse cx="60" cy="62" rx="28" ry="30" fill={p.skinColor} />
          <ellipse cx="32" cy="64" rx="4" ry="7" fill={p.skinColor} />
          <ellipse cx="88" cy="64" rx="4" ry="7" fill={p.skinColor} />

          {/* Esports Headset */}
          <path d="M30 50 Q60 16 90 50" fill="none" stroke={p.headsetColor} strokeWidth="6" strokeLinecap="round" />
          <circle cx="31" cy="56" r="8" fill={p.jacketColor} stroke={p.headsetColor} strokeWidth="2.5" />
          <circle cx="89" cy="56" r="8" fill={p.jacketColor} stroke={p.headsetColor} strokeWidth="2.5" />
          <path d="M31 58 Q42 75 52 74" fill="none" stroke={p.headsetColor} strokeWidth="2" strokeLinecap="round" />
          <circle cx="53" cy="74" r="2.5" fill={p.jacketAccent} />

          {/* Anime Eyes */}
          <g>
            <path d="M42 56 Q49 53 54 58" fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="48" cy="62" rx="4.5" ry="6" fill={p.eyeColor} />
            <circle cx="46.5" cy="60" r="1.8" fill="#FFFFFF" />
            <circle cx="49" cy="64" r="0.9" fill="#FFFFFF" />

            <path d="M66 58 Q71 53 78 56" fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="72" cy="62" rx="4.5" ry="6" fill={p.eyeColor} />
            <circle cx="70.5" cy="60" r="1.8" fill="#FFFFFF" />
            <circle cx="73" cy="64" r="0.9" fill="#FFFFFF" />
          </g>

          {/* Nose & Expression */}
          <path d="M59 66 L60 69" stroke="#E29578" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M55 74 Q60 78 66 73" fill="none" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />

          {/* Anime Hair */}
          <g fill={`url(#hair-${uid})`}>
            <path d="M32 45 Q26 20 54 18 Q74 14 88 40 Q76 34 65 35 Q50 32 32 45 Z" />
            <polygon points="36,44 44,56 47,46" />
            <polygon points="45,46 54,60 58,45" />
            <polygon points="56,45 66,58 70,44" />
            <polygon points="68,44 78,54 82,42" />
            <polygon points="32,46 25,62 34,58" />
            <polygon points="88,46 95,62 86,58" />
          </g>

          <rect x="38" y="66" width="6" height="2" rx="1" fill="#FF8A8A" opacity="0.6" />
          <rect x="76" y="66" width="6" height="2" rx="1" fill="#FF8A8A" opacity="0.6" />
        </svg>
      </div>

      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 shadow-sm ${getStatusColor()}`}
          style={{ width: badge, height: badge }}
          title={status}
        />
      )}
    </div>
  );
};
