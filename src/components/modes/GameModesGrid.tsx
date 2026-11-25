import React from 'react';
import type { GameModeInfo } from '../../types/game';
import { GameModeCard } from './GameModeCard';
import { Sparkles } from 'lucide-react';

interface GameModesGridProps {
  modes: GameModeInfo[];
  onSelectMode: (mode: GameModeInfo) => void;
}

export const GameModesGrid: React.FC<GameModesGridProps> = ({ modes, onSelectMode }) => {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-tech uppercase tracking-wide">
              Game Modes
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Select a battle arena to queue or challenge players
          </p>
        </div>

        <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-tech">
          5 MODES AVAILABLE
        </span>
      </div>

      {/* Grid: 2 columns on tablet, 3 on desktop, 1 on small mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modes.map((mode) => (
          <GameModeCard 
            key={mode.id} 
            mode={mode} 
            onSelect={onSelectMode} 
          />
        ))}
      </div>
    </div>
  );
};
