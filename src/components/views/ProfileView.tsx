import React, { useState } from 'react';
import {
  Trophy,
  Shield,
  Clock,
  Award,
  CheckCircle,
  Flame,
  Pencil,
  LogOut,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import type { PlayerProfile, MatchHistoryItem } from '../../types/game';
import { AnimeAvatar } from '../common/AnimeAvatar';
import { RankBadge } from '../common/RankBadge';
import { Button } from '../common/Button';

interface ProfileViewProps {
  player: PlayerProfile;
  matchHistory: MatchHistoryItem[];
  onQueueRanked: () => void;
  isRealAuthenticatedUser?: boolean;
  userEmail?: string;
  onOpenEditProfile?: () => void;
  onSignOut?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  player,
  matchHistory: _matchHistory,
  onQueueRanked,
  isRealAuthenticatedUser = false,
  userEmail,
  onOpenEditProfile,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'mastery' | 'achievements'>('overview');

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Player Header Banner */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-card overflow-hidden">
        {/* Banner Cover Art */}
        <div className="h-36 sm:h-44 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 relative p-6 flex items-end">
          <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase text-white font-tech">
            Season 1 Competitor
          </div>
        </div>

        {/* Profile Card Body */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-14 sm:-mt-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-3 sm:space-y-0 sm:space-x-5">
            <AnimeAvatar 
              seed={player.avatarSeed} 
              size="2xl" 
              rankTier={player.rankTier}
              status="online"
              className="ring-4 ring-white shadow-xl"
            />
            <div className="mb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-tech uppercase tracking-wide">
                  {player.username}
                </h1>
                <span className="text-xs font-black font-mono text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                  {player.publicPlayerId}
                </span>
                {isRealAuthenticatedUser ? (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase font-tech bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Account</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase font-tech bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                    Offline Preview
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-blue-600 mt-1">
                <Shield className="w-4 h-4" />
                <span>{player.title}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">Level {player.level} Cartographer</span>
                {userEmail && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400 font-medium">{userEmail}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            {onOpenEditProfile && (
              <Button
                variant="outline"
                size="md"
                onClick={onOpenEditProfile}
                icon={<Pencil className="w-4 h-4" />}
                className="font-tech uppercase"
              >
                EDIT PROFILE
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={onQueueRanked}
              icon={<Trophy className="w-4 h-4" />}
              className="font-tech uppercase"
            >
              QUEUE RANKED 1v1
            </Button>
            {isRealAuthenticatedUser && onSignOut && (
              <Button
                variant="ghost"
                size="md"
                onClick={onSignOut}
                icon={<LogOut className="w-4 h-4 text-rose-500" />}
                className="text-rose-600 hover:bg-rose-50 font-tech uppercase"
              >
                SIGN OUT
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-6 px-6 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-xs font-black uppercase font-tech tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Career Overview
          </button>
          <button
            onClick={() => setActiveTab('mastery')}
            className={`py-3 text-xs font-black uppercase font-tech tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'mastery' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Continent Mastery ({player.continentMastery.length})
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`py-3 text-xs font-black uppercase font-tech tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'achievements' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Achievements ({player.achievements.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card">
              <span className="text-xs font-bold text-slate-400 flex items-center space-x-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Ranked Record</span>
              </span>
              <div className="text-2xl font-black text-slate-800 font-tech mt-2">
                {player.wins}W <span className="text-base text-slate-400 font-normal">/ {player.losses}L</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 mt-1 block">
                {player.winRate}% Win Rate
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card">
              <span className="text-xs font-bold text-slate-400 flex items-center space-x-1.5">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Rush Points & MMR</span>
              </span>
              <div className="text-2xl font-black text-blue-600 font-tech mt-2">
                {player.rankPoints} RP
              </div>
              <span className="text-xs font-bold text-slate-500 mt-1 block">
                Skill MMR: {player.mmr} • Peak: {player.peakRankPoints} RP
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card">
              <span className="text-xs font-bold text-slate-400 flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-purple-500" />
                <span>Avg Response</span>
              </span>
              <div className="text-2xl font-black text-slate-800 font-tech mt-2">
                {(player.avgResponseTimeMs / 1000).toFixed(2)}s
              </div>
              <span className="text-xs font-bold text-purple-600 mt-1 block">
                Top 3% Speed
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card">
              <span className="text-xs font-bold text-slate-400 flex items-center space-x-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Daily Streak</span>
              </span>
              <div className="text-2xl font-black text-orange-500 font-tech mt-2">
                {player.currentStreak} Days
              </div>
              <span className="text-xs font-bold text-slate-500 mt-1 block">
                Best: {player.bestStreak} Consecutive
              </span>
            </div>
          </div>

          {/* Rank Badge Showcase Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              <RankBadge tier={player.rankTier} division={player.rankDivision} size="xl" />
              <div>
                <span className="text-xs font-black uppercase text-blue-600 tracking-wider font-tech">
                  Active Competitive Rank
                </span>
                <h3 className="text-2xl font-black text-slate-800 font-tech uppercase">
                  {player.rankTier} {player.rankDivision ? `Division ${player.rankDivision}` : 'Tier'}
                </h3>
                <p className="text-xs text-slate-500 font-medium max-w-md mt-1">
                  Server-governed competitive rating ({player.mmr} MMR). Region Focus: <strong>{player.favoriteContinent}</strong>.
                </p>
              </div>
            </div>

            <div className="w-full sm:w-48 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Competitive Standing
              </span>
              <span className="text-lg font-black text-slate-800 font-tech block mt-1">
                {player.rankPoints} RP • {player.mmr} MMR
              </span>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(6, ((player.rankPoints % 166) / 166) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Continent Mastery */}
      {activeTab === 'mastery' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-card space-y-6">
          <div>
            <h3 className="text-xl font-black text-slate-800 font-tech uppercase tracking-wide">
              Continental Knowledge Radar
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Breakdown of accuracy and fastest response times by world geographic region
            </p>
          </div>

          {player.continentMastery.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
              <Compass className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-sm font-black text-slate-700 font-tech uppercase">
                No Ranked Telemetry Recorded Yet
              </h4>
              <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                Regional mastery statistics populate as competitive online matches are completed in upcoming multiplayer phases.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {player.continentMastery.map((cm) => (
                <div key={cm.continent} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-black text-slate-800 font-tech uppercase">
                        {cm.continent}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        ({cm.gamesPlayed} matches)
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-bold text-slate-500">
                        Best: <span className="text-blue-600 font-tech font-bold">{(cm.fastestMs / 1000).toFixed(2)}s</span>
                      </span>
                      <span className="text-base font-black text-emerald-600 font-tech">
                        {cm.accuracy}% Accuracy
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${cm.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Achievements */}
      {activeTab === 'achievements' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-card space-y-6">
          <div>
            <h3 className="text-xl font-black text-slate-800 font-tech uppercase tracking-wide">
              Career Achievements
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Milestones unlocked in CountryRush competitive play
            </p>
          </div>

          {player.achievements.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
              <Award className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-sm font-black text-slate-700 font-tech uppercase">
                Career Milestones Ready
              </h4>
              <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                Your verified profile is active. Career badges and ranked achievements will unlock once online matches launch.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {player.achievements.map((ach) => {
                const isDone = ach.progress >= ach.maxProgress;
                return (
                  <div
                    key={ach.id}
                    className={`p-4 rounded-2xl border flex items-start space-x-3.5 transition-all ${
                      isDone
                        ? 'bg-blue-50/60 border-blue-200'
                        : 'bg-slate-50 border-slate-200/80 opacity-80'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isDone ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isDone ? <CheckCircle className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-800 font-tech">
                          {ach.name}
                        </h4>
                        {isDone && (
                          <span className="text-[10px] font-black uppercase text-blue-600 font-tech bg-white px-2 py-0.5 rounded-md shadow-xs">
                            Unlocked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {ach.description}
                      </p>

                      <div className="mt-2.5 flex items-center space-x-2">
                        <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${(ach.progress / ach.maxProgress) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 font-tech">
                          {ach.progress}/{ach.maxProgress}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
