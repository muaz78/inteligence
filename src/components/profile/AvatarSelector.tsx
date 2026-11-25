import React from 'react';
import { Check } from 'lucide-react';
import { AVATAR_CATALOG } from '../../../shared/constants/avatars';
import { AnimeAvatar } from '../common/AnimeAvatar';
import { sounds } from '../../utils/soundEffects';

interface AvatarSelectorProps {
  selectedAvatarId: string;
  onSelect: (avatarId: string) => void;
  compact?: boolean;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedAvatarId,
  onSelect,
  compact = false,
}) => {
  return (
    <div className={`grid ${compact ? 'grid-cols-4 gap-2.5' : 'grid-cols-2 sm:grid-cols-4 gap-3'}`}>
      {AVATAR_CATALOG.map((avatar) => {
        const isSelected = selectedAvatarId === avatar.id;
        return (
          <button
            key={avatar.id}
            type="button"
            onClick={() => {
              sounds.playClick();
              onSelect(avatar.id);
            }}
            onMouseEnter={() => sounds.playHover()}
            className={`relative p-2.5 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center ${
              isSelected
                ? 'bg-blue-50/90 border-blue-600 shadow-md ring-2 ring-blue-400/20'
                : 'bg-slate-50/70 border-slate-200 hover:border-blue-300 hover:bg-white'
            }`}
          >
            {isSelected && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Check className="w-2.5 h-2.5" />
              </span>
            )}

            <AnimeAvatar
              seed={avatar.id}
              size={compact ? 'sm' : 'md'}
              hasBorder={isSelected}
              rankTier={isSelected ? 'Diamond' : undefined}
            />

            <span className="text-xs font-black text-slate-800 font-tech uppercase mt-1.5 leading-none">
              {avatar.label}
            </span>
            {!compact && (
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate max-w-full">
                {avatar.archetype}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
