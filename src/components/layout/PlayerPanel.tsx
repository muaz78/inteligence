import React from 'react';
import { Trophy, Zap, Target, ArrowUpRight, ShieldCheck, Flame, Clock } from 'lucide-react';
import type { PlayerProfile } from '../../types/game';
import { AnimeAvatar } from '../common/AnimeAvatar';
import { RankBadge } from '../common/RankBadge';
import { sounds } from '../../utils/soundEffects';

interface PlayerPanelProps {
  player: PlayerProfile;
  onViewCareer: () => void;
}

export const PlayerPanel: React.FC<PlayerPanelProps> = ({
  player,
  onViewCareer,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-5 relative overflow-hidden">
      {/* Subtle background accent glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-blue-100/40 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

      {/* Header Profile Summary */}
      <div className="flex items-center space-x-4 pb-4 border-b border-slate-100 relative">
        <AnimeAvatar 
          seed={player.avatarSeed} 
          size="lg" 
          rankTier={player.rankTier}
          status="online"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className="text-lg font-black text-slate-800 tracking-wide font-tech truncate">
              {player.username}
            </h4>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded font-mono">
              {player.publicPlayerId}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-blue-600 font-bold mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="truncate">{player.title}</span>
          </div>

          {/* Level Badge & XP */}
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-[11px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-tech">
              LVL {player.level}
            </span>
            <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full"
                style={{ width: `${(player.currentXp / player.nextLevelXp) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Competitive Rank Showcase */}
      <div className="my-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white border border-blue-100/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <RankBadge 
            tier={player.rankTier} 
            division={player.rankDivision} 
            size="md" 
          />
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-black text-slate-800 font-tech uppercase tracking-wide">
                {player.rankTier} {player.rankDivision}
              </span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.2 rounded">
                Top 4.2%
              </span>
            </div>
            <div className="text-xs font-bold text-slate-500 mt-0.5">
              <span className="text-blue-600 font-black">{player.rankPoints}</span> RP •{' '}
              <span className="text-indigo-600 font-bold">MMR {player.mmr}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Key Match Stats */}
      <div className="grid grid-cols-2 gap-2.5 my-3">
        {/* Wins */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-bold">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Total Wins</span>
          </div>
          <span className="text-lg font-black text-slate-800 font-tech mt-1">
            {player.wins} <span className="text-xs font-semibold text-slate-400">({player.losses}L)</span>
          </span>
        </div>

        {/* Win Rate */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-bold">
            <Target className="w-3.5 h-3.5 text-emerald-500" />
            <span>Win Rate</span>
          </div>
          <span className="text-lg font-black text-emerald-600 font-tech mt-1">
            {player.winRate}%
          </span>
        </div>

        {/* Current / Best Streak */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-bold">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Streak</span>
          </div>
          <span className="text-lg font-black text-orange-500 font-tech mt-1">
            {player.currentStreak}W <span className="text-xs font-semibold text-slate-400">(Best: {player.bestStreak})</span>
          </span>
        </div>

        {/* Avg Response Time */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>Avg Speed</span>
          </div>
          <span className="text-lg font-black text-blue-600 font-tech mt-1">
            {(player.avgResponseTimeMs / 1000).toFixed(2)}s
          </span>
        </div>
      </div>

      {/* Best Continent Bar Preview */}
      <div className="mt-3 p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
        <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-1.5">
          <span className="flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Strongest Map: {player.favoriteContinent}</span>
          </span>
          <span className="text-emerald-600 font-black">94%</span>
        </div>
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div className="bg-emerald-500 h-full rounded-full w-[94%]" />
        </div>
      </div>

      {/* View Full Career Button */}
      <button
        onClick={() => {
          sounds.playClick();
          onViewCareer();
        }}
        className="mt-4 w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-xs font-black tracking-wide uppercase font-tech flex items-center justify-center space-x-1.5 transition-colors cursor-pointer group"
      >
        <span>View Full Career & Badges</span>
        <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>
    </div>
  );
};
