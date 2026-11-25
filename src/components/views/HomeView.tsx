import React from 'react';
import { HeroSection } from '../hero/HeroSection';
import { GameModesGrid } from '../modes/GameModesGrid';
import type { GameModeInfo, PlayerProfile, DailyChallengeInfo } from '../../types/game';
import { PhaserCanvas } from '../../game/PhaserCanvas';
import { Flame, ArrowRight, Sparkles, Layers } from 'lucide-react';
import { Button } from '../common/Button';
import { sounds } from '../../utils/soundEffects';

interface HomeViewProps {
  player: PlayerProfile;
  modes: GameModeInfo[];
  dailyChallenge: DailyChallengeInfo;
  onSelectMode: (mode: GameModeInfo) => void;
  onNavigateToDaily: () => void;
  onNavigateToRanked: () => void;
  onNavigateToQuickPlay: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  player,
  modes,
  dailyChallenge,
  onSelectMode,
  onNavigateToDaily,
  onNavigateToRanked,
  onNavigateToQuickPlay,
}) => {
  return (
    <div className="space-y-8">
      {/* Hero Welcome Section */}
      <HeroSection 
        onPlayRanked={onNavigateToRanked}
        onQuickPlay={onNavigateToQuickPlay}
        onDailyChallenge={onNavigateToDaily}
      />

      {/* Daily Challenge Promo Strip */}
      <div className="rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 p-0.5 shadow-md">
        <div className="bg-white rounded-[23px] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
              <Flame className="w-6 h-6 fill-orange-500" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider font-tech bg-orange-50 px-2 py-0.5 rounded-md">
                  Active Sprint • Ends in {dailyChallenge.endsInHours}h
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {dailyChallenge.multiplier} Multiplier
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-slate-800 font-tech uppercase tracking-wide">
                {dailyChallenge.title}
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                {dailyChallenge.description}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0 w-full sm:w-auto justify-end">
            <div className="text-right hidden md:block">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Today's Streak
              </span>
              <span className="text-sm font-black text-orange-600 font-tech">
                🔥 {dailyChallenge.todayStreak} Days (+{dailyChallenge.rpReward} RP)
              </span>
            </div>

            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                sounds.playClick();
                onNavigateToDaily();
              }}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
              className="font-tech font-extrabold uppercase shadow-sm"
            >
              PLAY CHALLENGE
            </Button>
          </div>
        </div>
      </div>

      {/* Game Mode Cards Grid */}
      <GameModesGrid 
        modes={modes} 
        onSelectMode={onSelectMode} 
      />

      {/* Phaser 3 Interactive Radar Arena Canvas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-xl font-black text-slate-800 font-tech uppercase tracking-wide">
              Phaser 3 Game Engine Arena
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
            Interactive Coordinates Sandbox
          </span>
        </div>

        <div className="h-[360px] w-full">
          <PhaserCanvas />
        </div>
      </div>
    </div>
  );
};
