import React, { useState } from 'react';
import { Award, Search, Trophy, Globe, Users, Flame, ChevronRight } from 'lucide-react';
import type { LeaderboardPlayer } from '../../types/game';
import { AnimeAvatar } from '../common/AnimeAvatar';
import { RankBadge } from '../common/RankBadge';
import { sounds } from '../../utils/soundEffects';

interface LeaderboardViewProps {
  players: LeaderboardPlayer[];
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ players }) => {
  const [tab, setTab] = useState<'global' | 'friends' | 'regional'>('global');
  const [search, setSearch] = useState('');

  const filtered = players.filter((p) => 
    p.username.toLowerCase().includes(search.toLowerCase()) ||
    p.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase font-tech tracking-wider">
            <Award className="w-4 h-4 text-amber-300" />
            <span>Official Global Standings • Season 1</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-tech uppercase tracking-wide">
            Hall of Cartographers
          </h1>
          <p className="text-sm text-blue-100 font-medium">
            Top competitive geography contenders ranked by Rush Points (RP) across all global server clusters.
          </p>
        </div>
      </div>

      {/* Leaderboard Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-8">
        {/* Controls: Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex space-x-2 w-full sm:w-auto bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => { sounds.playHover(); setTab('global'); }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black uppercase font-tech transition-all cursor-pointer ${
                tab === 'global' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Global Top 100
            </button>
            <button
              onClick={() => { sounds.playHover(); setTab('friends'); }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black uppercase font-tech transition-all cursor-pointer ${
                tab === 'friends' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Friends
            </button>
            <button
              onClick={() => { sounds.playHover(); setTab('regional'); }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black uppercase font-tech transition-all cursor-pointer ${
                tab === 'regional' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Asia & Pacific
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search players or countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {/* Players List Table */}
        <div className="divide-y divide-slate-100">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 py-3 text-[11px] font-black uppercase font-tech text-slate-400 tracking-wider">
            <span className="col-span-1 text-center">Rank</span>
            <span className="col-span-5 sm:col-span-4">Player</span>
            <span className="col-span-2 hidden sm:block">Country</span>
            <span className="col-span-3 sm:col-span-2 text-center">Tier</span>
            <span className="col-span-3 text-right">RP & Win Rate</span>
          </div>

          {filtered.map((p) => {
            const isTop3 = p.position <= 3;
            return (
              <div
                key={p.id}
                className={`grid grid-cols-12 gap-3 py-3.5 items-center hover:bg-slate-50/80 rounded-2xl transition-colors px-2 ${
                  p.username === 'Aoi_Valkyrie' ? 'bg-blue-50/50 border border-blue-200' : ''
                }`}
              >
                {/* Position */}
                <div className="col-span-1 flex items-center justify-center">
                  <span 
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black font-tech text-sm ${
                      p.position === 1 ? 'bg-amber-400 text-slate-900 shadow-sm' :
                      p.position === 2 ? 'bg-slate-300 text-slate-800' :
                      p.position === 3 ? 'bg-amber-700 text-white' :
                      'text-slate-400 font-bold'
                    }`}
                  >
                    {p.position}
                  </span>
                </div>

                {/* Player Profile */}
                <div className="col-span-5 sm:col-span-4 flex items-center space-x-3 min-w-0">
                  <AnimeAvatar seed={p.avatarSeed} size="sm" rankTier={p.rankTier} />
                  <div className="truncate">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-black text-slate-800 font-tech truncate">
                        {p.username}
                      </span>
                      {p.username === 'Aoi_Valkyrie' && (
                        <span className="text-[9px] bg-blue-600 text-white font-black px-1.5 py-0.2 rounded font-tech">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">
                      #{p.tag}
                    </span>
                  </div>
                </div>

                {/* Country */}
                <div className="col-span-2 hidden sm:flex items-center space-x-1.5 text-xs font-bold text-slate-600">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>{p.country}</span>
                </div>

                {/* Rank Badge */}
                <div className="col-span-3 sm:col-span-2 flex items-center justify-center space-x-1.5">
                  <RankBadge tier={p.rankTier} division={p.rankDivision} size="xs" />
                  <span className="text-xs font-black uppercase font-tech text-slate-700 hidden md:inline">
                    {p.rankTier} {p.rankDivision}
                  </span>
                </div>

                {/* RP & Win Rate */}
                <div className="col-span-3 text-right">
                  <div className="text-sm font-black font-tech text-blue-600">
                    {p.rankPoints.toLocaleString()} RP
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">
                    {p.wins}W • <span className="text-emerald-600">{p.winRate}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
