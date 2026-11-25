import React from 'react';
import type { RankTier, RankDivision } from '../../types/game';

interface RankBadgeProps {
  tier: RankTier;
  division?: RankDivision;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
}

export const RankBadge: React.FC<RankBadgeProps> = ({
  tier,
  division,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const sizeMap = {
    xs: { px: 28, text: 'text-[9px]' },
    sm: { px: 38, text: 'text-[11px]' },
    md: { px: 52, text: 'text-xs' },
    lg: { px: 72, text: 'text-sm' },
    xl: { px: 96, text: 'text-base' },
  };

  const { px } = sizeMap[size];

  // Specific color themes per tier
  const tierConfig: Record<RankTier, {
    primaryGrad: [string, string];
    secondaryGrad: [string, string];
    accentColor: string;
    glowColor: string;
    wingColor: string;
    textColor: string;
    borderStroke: string;
  }> = {
    Bronze: {
      primaryGrad: ['#C97A44', '#7D4420'],
      secondaryGrad: ['#F3A66B', '#A75A2A'],
      accentColor: '#FFC89E',
      glowColor: 'rgba(201, 122, 68, 0.4)',
      wingColor: '#8C4D25',
      textColor: '#A75A2A',
      borderStroke: '#E59B63',
    },
    Silver: {
      primaryGrad: ['#CFD8DC', '#78909C'],
      secondaryGrad: ['#ECEFF1', '#90A4AE'],
      accentColor: '#FFFFFF',
      glowColor: 'rgba(176, 190, 197, 0.45)',
      wingColor: '#607D8B',
      textColor: '#607D8B',
      borderStroke: '#CFD8DC',
    },
    Gold: {
      primaryGrad: ['#F59E0B', '#B45309'],
      secondaryGrad: ['#FDE68A', '#F59E0B'],
      accentColor: '#FFFBEB',
      glowColor: 'rgba(245, 158, 11, 0.5)',
      wingColor: '#D97706',
      textColor: '#D97706',
      borderStroke: '#FCD34D',
    },
    Platinum: {
      primaryGrad: ['#06B6D4', '#0E7490'],
      secondaryGrad: ['#A5F3FC', '#0891B2'],
      accentColor: '#E0F2FE',
      glowColor: 'rgba(6, 182, 212, 0.5)',
      wingColor: '#0891B2',
      textColor: '#0891B2',
      borderStroke: '#67E8F9',
    },
    Diamond: {
      primaryGrad: ['#3B82F6', '#1D4ED8'],
      secondaryGrad: ['#93C5FD', '#2563EB'],
      accentColor: '#DBEAFE',
      glowColor: 'rgba(59, 130, 246, 0.6)',
      wingColor: '#1E40AF',
      textColor: '#2563EB',
      borderStroke: '#60A5FA',
    },
    Master: {
      primaryGrad: ['#8B5CF6', '#5B21B6'],
      secondaryGrad: ['#C4B5FD', '#7C3AED'],
      accentColor: '#EDE9FE',
      glowColor: 'rgba(139, 92, 246, 0.65)',
      wingColor: '#6D28D9',
      textColor: '#7C3AED',
      borderStroke: '#A78BFA',
    },
    Elite: {
      primaryGrad: ['#EC4899', '#3B82F6'],
      secondaryGrad: ['#FDE047', '#EC4899'],
      accentColor: '#FFFFFF',
      glowColor: 'rgba(236, 72, 153, 0.7)',
      wingColor: '#8B5CF6',
      textColor: '#EC4899',
      borderStroke: '#F472B6',
    },
  };

  const config = tierConfig[tier];
  const uniqueId = `rank-${tier}-${size}-${Math.random().toString(36).substring(2, 6)}`;

  return (
    <div className={`inline-flex flex-col items-center select-none group ${className}`}>
      <div 
        className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
        style={{ width: px, height: px }}
      >
        <svg 
          viewBox="0 0 100 100" 
          width={px} 
          height={px} 
          className="overflow-visible drop-shadow-md"
        >
          <defs>
            <linearGradient id={`${uniqueId}-grad1`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={config.primaryGrad[0]} />
              <stop offset="100%" stopColor={config.primaryGrad[1]} />
            </linearGradient>
            <linearGradient id={`${uniqueId}-grad2`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={config.secondaryGrad[0]} />
              <stop offset="100%" stopColor={config.secondaryGrad[1]} />
            </linearGradient>
            <linearGradient id={`${uniqueId}-metal`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
            </linearGradient>
            <filter id={`${uniqueId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Aura / Glow */}
          <circle cx="50" cy="50" r="38" fill={config.glowColor} filter={`url(#${uniqueId}-glow)`} opacity="0.35" />

          {/* Tier Specific Shapes & Wings */}
          {tier === 'Bronze' && (
            <g>
              {/* Bronze Armor Wings */}
              <path d="M22 45 L8 36 L16 56 L30 54 Z" fill={`url(#${uniqueId}-grad1)`} stroke={config.borderStroke} strokeWidth="1.5" />
              <path d="M78 45 L92 36 L84 56 L70 54 Z" fill={`url(#${uniqueId}-grad1)`} stroke={config.borderStroke} strokeWidth="1.5" />
              {/* Shield Base */}
              <polygon points="50,15 78,28 72,70 50,88 28,70 22,28" fill={`url(#${uniqueId}-grad1)`} stroke={config.borderStroke} strokeWidth="2.5" />
              {/* Inner Shield */}
              <polygon points="50,22 70,33 66,65 50,80 34,65 30,33" fill={`url(#${uniqueId}-grad2)`} />
              {/* Center Emblem / Compass */}
              <polygon points="50,32 58,50 50,45 42,50" fill={config.accentColor} />
              <polygon points="50,68 58,50 50,55 42,50" fill={config.primaryGrad[1]} />
            </g>
          )}

          {tier === 'Silver' && (
            <g>
              {/* Silver Sharp Falcon Wings */}
              <path d="M25 40 L6 26 L14 46 L8 58 L28 52 Z" fill={`url(#${uniqueId}-grad1)`} stroke="#ECEFF1" strokeWidth="1.5" />
              <path d="M75 40 L94 26 L86 46 L92 58 L72 52 Z" fill={`url(#${uniqueId}-grad1)`} stroke="#ECEFF1" strokeWidth="1.5" />
              {/* Diamond Hex Shield */}
              <polygon points="50,12 80,30 80,68 50,88 20,68 20,30" fill={`url(#${uniqueId}-grad1)`} stroke="#FFFFFF" strokeWidth="2" />
              <polygon points="50,20 72,35 72,64 50,80 28,64 28,35" fill={`url(#${uniqueId}-grad2)`} />
              {/* Center Chevron */}
              <path d="M50 30 L64 45 L50 64 L36 45 Z" fill="#FFFFFF" opacity="0.9" />
              <circle cx="50" cy="48" r="5" fill="#607D8B" />
            </g>
          )}

          {tier === 'Gold' && (
            <g>
              {/* Majestic Golden Crest & Laurels */}
              <path d="M20 38 L4 18 L16 42 L6 55 L25 56 Z" fill={`url(#${uniqueId}-grad1)`} stroke="#FDE68A" strokeWidth="1.5" />
              <path d="M80 38 L96 18 L84 42 L94 55 L75 56 Z" fill={`url(#${uniqueId}-grad1)`} stroke="#FDE68A" strokeWidth="1.5" />
              {/* Golden Crown Points at Top */}
              <polygon points="40,16 50,6 60,16 50,22" fill="#FDE68A" />
              {/* Main Shield */}
              <polygon points="50,14 82,30 76,72 50,92 24,72 18,30" fill={`url(#${uniqueId}-grad1)`} stroke="#FEF3C7" strokeWidth="2.5" />
              <polygon points="50,22 74,35 70,68 50,84 30,68 26,35" fill={`url(#${uniqueId}-grad2)`} />
              {/* Radiant Star Core */}
              <polygon points="50,30 54,44 68,48 56,56 60,70 50,60 40,70 44,56 32,48 46,44" fill="#FFFFFF" />
            </g>
          )}

          {tier === 'Platinum' && (
            <g>
              {/* Crystalline Cyan Blades */}
              <path d="M22 36 L2 14 L12 42 L4 64 L26 56 Z" fill={`url(#${uniqueId}-grad1)`} stroke="#67E8F9" strokeWidth="1.5" />
              <path d="M78 36 L98 14 L88 42 L96 64 L74 56 Z" fill={`url(#${uniqueId}-grad1)`} stroke="#67E8F9" strokeWidth="1.5" />
              {/* Angular Tech Shield */}
              <polygon points="50,10 84,26 80,74 50,94 20,74 16,26" fill={`url(#${uniqueId}-grad1)`} stroke="#A5F3FC" strokeWidth="2.5" />
              <polygon points="50,18 76,32 72,70 50,86 28,70 24,32" fill={`url(#${uniqueId}-grad2)`} />
              {/* Center Dual Rhombus */}
              <polygon points="50,26 68,48 50,72 32,48" fill="#FFFFFF" opacity="0.95" />
              <polygon points="50,36 60,48 50,62 40,48" fill={`url(#${uniqueId}-grad1)`} />
            </g>
          )}

          {tier === 'Diamond' && (
            <g>
              {/* Azure Esports Diamond Wings */}
              <path d="M24 35 L0 8 L12 40 L2 66 L26 56 Z" fill={`url(#${uniqueId}-grad1)`} stroke="#93C5FD" strokeWidth="2" />
              <path d="M76 35 L100 8 L88 40 L98 66 L74 56 Z" fill={`url(#${uniqueId}-grad1)`} stroke="#93C5FD" strokeWidth="2" />
              {/* Upper Spire */}
              <polygon points="50,4 62,20 38,20" fill="#93C5FD" />
              {/* Multi-Faceted Diamond Shield */}
              <polygon points="50,10 86,28 78,76 50,95 22,76 14,28" fill={`url(#${uniqueId}-grad1)`} stroke="#BFDBFE" strokeWidth="2.5" />
              <polygon points="50,18 78,34 72,70 50,86 28,70 22,34" fill={`url(#${uniqueId}-grad2)`} />
              {/* Diamond Gem Facets */}
              <polygon points="50,26 68,42 50,74 32,42" fill="#FFFFFF" />
              <polygon points="50,34 62,45 50,66 38,45" fill="#3B82F6" />
              <polygon points="50,26 50,74 32,42" fill="#E0F2FE" opacity="0.6" />
              <circle cx="50" cy="48" r="4" fill="#FFFFFF" />
            </g>
          )}

          {tier === 'Master' && (
            <g>
              {/* Grand Imperial Violet Wings */}
              <path d="M22 34 L-2 4 L10 38 L-4 68 L24 58 Z" fill={`url(#${uniqueId}-grad1)`} stroke="#C4B5FD" strokeWidth="2" />
              <path d="M78 34 L102 4 L90 38 L104 68 L76 58 Z" fill={`url(#${uniqueId}-grad1)`} stroke="#C4B5FD" strokeWidth="2" />
              {/* Master Crown */}
              <polygon points="32,18 40,8 50,16 60,8 68,18 50,24" fill="#FDE047" stroke="#F59E0B" strokeWidth="1.5" />
              {/* Core Shield */}
              <polygon points="50,12 86,28 80,76 50,96 20,76 14,28" fill={`url(#${uniqueId}-grad1)`} stroke="#DDD6FE" strokeWidth="2.5" />
              <polygon points="50,20 78,34 74,70 50,87 26,70 22,34" fill={`url(#${uniqueId}-grad2)`} />
              {/* Glowing Master Star & Amethyst */}
              <polygon points="50,28 55,42 70,45 58,55 62,70 50,60 38,70 42,55 30,45 45,42" fill="#FFFFFF" />
              <circle cx="50" cy="51" r="5" fill="#7C3AED" />
            </g>
          )}

          {tier === 'Elite' && (
            <g>
              {/* Transcendent Cosmic Wings with Golden Trim */}
              <path d="M20 32 L-4 -2 L8 36 L-6 66 L24 58 Z" fill="#3B82F6" stroke="#FDE047" strokeWidth="2" />
              <path d="M80 32 L104 -2 L92 36 L106 66 L76 58 Z" fill="#3B82F6" stroke="#FDE047" strokeWidth="2" />
              {/* Floating Laurels */}
              <path d="M14 24 Q30 8 46 12" fill="none" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
              <path d="M86 24 Q70 8 54 12" fill="none" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
              {/* Elite Sovereign Crown */}
              <polygon points="28,16 38,4 50,14 62,4 72,16 50,22" fill="#FDE047" stroke="#FFF" strokeWidth="1.5" />
              {/* Core Prism Shield */}
              <polygon points="50,10 88,26 80,78 50,98 20,78 12,26" fill={`url(#${uniqueId}-grad1)`} stroke="#FDE047" strokeWidth="3" />
              <polygon points="50,18 80,32 74,72 50,89 26,72 20,32" fill={`url(#${uniqueId}-grad2)`} />
              {/* Central Cosmic Star */}
              <polygon points="50,24 56,40 74,44 60,56 64,74 50,64 36,74 40,56 26,44 44,40" fill="#FFFFFF" filter={`url(#${uniqueId}-glow)`} />
              <circle cx="50" cy="52" r="6" fill="#F59E0B" />
            </g>
          )}

          {/* Division Numerals / Stars overlay */}
          {division && (
            <g transform="translate(0, 16)">
              <rect x="36" y="58" width="28" height="15" rx="4" fill="#1E293B" opacity="0.85" />
              <text 
                x="50" 
                y="69" 
                textAnchor="middle" 
                fill="#FFFFFF" 
                fontSize="11" 
                fontWeight="900" 
                fontFamily="'Rajdhani', sans-serif"
                letterSpacing="1"
              >
                {division}
              </text>
            </g>
          )}
        </svg>
      </div>

      {showLabel && (
        <div className="mt-1 flex items-center space-x-1">
          <span 
            className={`font-black uppercase tracking-wider ${sizeMap[size].text}`}
            style={{ color: config.textColor }}
          >
            {tier} {division || ''}
          </span>
        </div>
      )}
    </div>
  );
};
