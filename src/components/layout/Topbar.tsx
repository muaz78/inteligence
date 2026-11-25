import React from 'react';
import { Bell, Settings, Flame, Trophy, Coins, Sparkles, LogOut, LogIn } from 'lucide-react';
import type { PlayerProfile, NavigationTab } from '../../types/game';
import { AnimeAvatar } from '../common/AnimeAvatar';
import { SoundToggle } from '../common/SoundToggle';
import { sounds } from '../../utils/soundEffects';

interface TopbarProps {
  player: PlayerProfile;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onNavigate: (tab: NavigationTab) => void;
  onOpenRaqeInspector?: () => void;
  isRealAuthenticatedUser?: boolean;
  onAuthAction?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  player,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenSettings,
  onNavigate,
  onOpenRaqeInspector,
  isRealAuthenticatedUser = false,
  onAuthAction,
}) => {
  const handleProfileClick = () => {
    sounds.playClick();
    onNavigate('profile');
  };

  const handleRankClick = () => {
    sounds.playClick();
    onNavigate('ranked');
  };

  return (
    <header className="h-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Season Indicator & Player Level Bar */}
      <div className="flex items-center space-x-3 sm:space-x-6">
        {/* Season Pill */}
        <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/80 px-3 py-1.5 rounded-2xl shadow-sm">
          <Trophy className="w-4 h-4 text-blue-600" />
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold uppercase text-blue-700 tracking-wider font-tech">
              {player.seasonName}
            </span>
            <span className="text-[9px] text-slate-500 font-bold">
              {player.seasonDaysLeft} days remaining
            </span>
          </div>
        </div>

        {/* Player Level XP Meter (hidden on small mobile) */}
        <div
          onClick={handleProfileClick}
          className="hidden md:flex items-center space-x-3 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/60 px-3.5 py-1.5 rounded-2xl cursor-pointer transition-colors"
          title="Click to view Career Profile"
        >
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-xs font-black font-tech shadow-sm">
            {player.level}
          </div>
          <div className="flex flex-col min-w-[90px]">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
              <span>XP Level</span>
              <span className="text-blue-600">{player.currentXp}/{player.nextLevelXp}</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-0.5">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${(player.currentXp / player.nextLevelXp) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Center/Right: Currencies & Status Indicators */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Rush Points (RP) Badge */}
        <button
          onClick={handleRankClick}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 via-white to-blue-50 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-2xl shadow-sm transition-all group cursor-pointer"
          title="Ranked Points (RP)"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 group-hover:scale-125 transition-transform" />
          <span className="text-xs font-black text-slate-700 font-tech">
            {player.rankPoints} <span className="text-blue-600">RP</span>
          </span>
          <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-1.5 py-0.2 rounded-md">
            {player.rankTier} {player.rankDivision}
          </span>
        </button>

        {/* Rush Tokens */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-amber-50/80 border border-amber-200/80 px-2.5 py-1.5 rounded-2xl text-xs font-bold text-amber-800">
          <Coins className="w-4 h-4 text-amber-500" />
          <span className="font-tech font-black text-sm">{player.rushTokens.toLocaleString()}</span>
        </div>

        {/* Daily Streak Indicator */}
        <div
          onClick={() => onNavigate('daily')}
          className="flex items-center space-x-1 bg-orange-50/80 hover:bg-orange-100/80 border border-orange-200/80 px-2.5 py-1.5 rounded-2xl text-xs font-bold text-orange-700 cursor-pointer transition-colors"
          title="Daily Challenge Streak"
        >
          <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
          <span className="font-tech font-black">{player.currentStreak}D</span>
        </div>

        {/* Sound FX Toggle */}
        <SoundToggle />

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              sounds.playClick();
              onOpenNotifications();
            }}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute 1 top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>

        {/* RAQE Inspector Dev Pill */}
        {onOpenRaqeInspector && (
          <button
            onClick={() => {
              sounds.playClick();
              onOpenRaqeInspector();
            }}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/80 px-2.5 py-1.5 rounded-2xl text-xs font-black font-tech text-blue-700 transition-all shadow-sm cursor-pointer"
            title="Inspect Rank-Aware Adaptive Question Engine (RAQE)"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span className="hidden sm:inline">RAQE</span>
          </button>
        )}

        {/* Settings Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onOpenSettings();
          }}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Game Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Player Avatar Profile Preview */}
        <div
          onClick={handleProfileClick}
          className="flex items-center space-x-2.5 pl-1.5 sm:pl-2.5 border-l border-slate-200 cursor-pointer group"
          title="View Profile"
        >
          <AnimeAvatar
            seed={player.avatarSeed}
            size="sm"
            rankTier={player.rankTier}
            status="online"
          />
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors font-tech tracking-wide truncate max-w-[110px]">
              {player.username}
            </span>
            <span className="text-[10px] text-slate-400 font-bold font-mono truncate max-w-[110px]">
              {player.publicPlayerId}
            </span>
          </div>
        </div>

        {/* Auth Action: Sign Out (when authenticated) or Sign In (when in Offline Preview) */}
        {onAuthAction && (
          <button
            onClick={() => {
              sounds.playClick();
              onAuthAction();
            }}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-black font-tech uppercase transition-colors cursor-pointer ${
              isRealAuthenticatedUser
                ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200'
                : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200'
            }`}
            title={isRealAuthenticatedUser ? 'Sign Out' : 'Preview Mode — Sign In with Supabase'}
          >
            {isRealAuthenticatedUser ? (
              <LogOut className="w-4 h-4" />
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign In</span>
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
