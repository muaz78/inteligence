import React from 'react';
import { Swords, Users, Zap, Flame, KeyRound, ArrowRight, Clock, UserCheck } from 'lucide-react';
import type { GameModeInfo } from '../../types/game';
import { sounds } from '../../utils/soundEffects';

interface GameModeCardProps {
  mode: GameModeInfo;
  onSelect: (mode: GameModeInfo) => void;
}

export const GameModeCard: React.FC<GameModeCardProps> = ({ mode, onSelect }) => {
  const getBadgeStyle = () => {
    switch (mode.badgeColor) {
      case 'blue': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'violet': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'orange': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'amber': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'green': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCardIcon = () => {
    switch (mode.iconType) {
      case 'ranked-1v1':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/30 group-hover:scale-110 transition-transform">
            <Swords className="w-6 h-6" />
          </div>
        );
      case 'ranked-2v2':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-purple-500/30 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
        );
      case 'quickplay':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/30 group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6" />
          </div>
        );
      case 'daily':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-rose-500/30 group-hover:scale-110 transition-transform">
            <Flame className="w-6 h-6 fill-white" />
          </div>
        );
      case 'custom':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform">
            <KeyRound className="w-6 h-6" />
          </div>
        );
    }
  };

  const getQueueStats = () => {
    switch (mode.iconType) {
      case 'ranked-1v1': return '840 queuing • ~4s wait';
      case 'ranked-2v2': return '620 queuing • ~7s wait';
      case 'quickplay': return '1,120 queuing • ~2s wait';
      case 'daily': return 'Active Sprint • 3x RP';
      case 'custom': return 'Code Rooms Available';
    }
  };

  const handleClick = () => {
    sounds.playClick();
    onSelect(mode);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => sounds.playHover()}
      className="group relative bg-white hover:bg-gradient-to-b hover:from-white hover:to-blue-50/30 rounded-3xl p-6 border border-slate-200/80 hover:border-blue-300 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Top Accent Gradient Line on Hover */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${mode.accentGradient} opacity-80 group-hover:h-2 transition-all`} />

      <div>
        {/* Card Header: Icon & Badge */}
        <div className="flex items-start justify-between mb-4">
          {getCardIcon()}
          <span className={`text-[11px] font-black uppercase font-tech px-2.5 py-1 rounded-full border ${getBadgeStyle()}`}>
            {mode.badge}
          </span>
        </div>

        {/* Title & Subtitle */}
        <div className="mb-2">
          <span className="text-[11px] font-extrabold text-blue-600 uppercase font-tech tracking-wider">
            {mode.subtitle}
          </span>
          <h3 className="text-xl font-black text-slate-800 font-tech uppercase tracking-wide group-hover:text-blue-600 transition-colors">
            {mode.title}
          </h3>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">
          {mode.description}
        </p>

        {/* Live Queue Activity Indicator */}
        <div className="mb-4 inline-flex items-center space-x-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl text-[10px] font-bold text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-tech uppercase">{getQueueStats()}</span>
        </div>
      </div>

      {/* Footer Info & Action */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3 text-[11px] font-bold text-slate-400">
          <span className="flex items-center space-x-1">
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>{mode.players}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{mode.roundTime}</span>
          </span>
        </div>

        <div className="flex items-center space-x-1 text-xs font-black text-blue-600 group-hover:translate-x-1 transition-transform font-tech">
          <span>SELECT</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
