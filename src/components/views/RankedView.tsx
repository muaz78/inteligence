import React, { useState } from 'react';
import { Trophy, Swords, Users, Shield, ArrowUpRight, Flame, Sparkles, CheckCircle2, Sliders, Cpu, Compass, Info, Check } from 'lucide-react';
import type { PlayerProfile, RankTier, MatchHistoryItem } from '../../types/game';
import { RankBadge } from '../common/RankBadge';
import { Button } from '../common/Button';
import { sounds } from '../../utils/soundEffects';

interface RankedViewProps {
  player: PlayerProfile;
  matchHistory: MatchHistoryItem[];
  onQueueRanked: (modeType: '1v1' | '2v2') => void;
}

export const RankedView: React.FC<RankedViewProps> = ({
  player,
  matchHistory,
  onQueueRanked,
}) => {
  const [selectedQueue, setSelectedQueue] = useState<'1v1' | '2v2'>('1v1');
  const [inspectedTier, setInspectedTier] = useState<RankTier>(player.rankTier);

  const rankTiers: {
    tier: RankTier;
    name: string;
    rpThreshold: string;
    color: string;
    diffBand: string;
    distribution: { d1: number; d2: number; d3: number; d4: number; d5: number };
  }[] = [
      { tier: 'Bronze', name: 'Bronze', rpThreshold: '0 - 499 RP', color: 'text-amber-700', diffBand: 'D1 – D3', distribution: { d1: 50, d2: 40, d3: 10, d4: 0, d5: 0 } },
      { tier: 'Silver', name: 'Silver', rpThreshold: '500 - 999 RP', color: 'text-slate-500', diffBand: 'D1 – D4', distribution: { d1: 25, d2: 45, d3: 25, d4: 5, d5: 0 } },
      { tier: 'Gold', name: 'Gold', rpThreshold: '1,000 - 1,399 RP', color: 'text-amber-500', diffBand: 'D1 – D4', distribution: { d1: 10, d2: 35, d3: 40, d4: 15, d5: 0 } },
      { tier: 'Platinum', name: 'Platinum', rpThreshold: '1,400 - 1,799 RP', color: 'text-cyan-600', diffBand: 'D1 – D5', distribution: { d1: 5, d2: 20, d3: 40, d4: 30, d5: 5 } },
      { tier: 'Diamond', name: 'Diamond', rpThreshold: '1,800 - 2,199 RP', color: 'text-blue-600', diffBand: 'D2 – D5', distribution: { d1: 0, d2: 10, d3: 30, d4: 45, d5: 15 } },
      { tier: 'Master', name: 'Master', rpThreshold: '2,200 - 2,599 RP', color: 'text-purple-600', diffBand: 'D2 – D5', distribution: { d1: 0, d2: 5, d3: 20, d4: 45, d5: 30 } },
      { tier: 'Elite', name: 'Elite Grandmaster', rpThreshold: '2,600+ RP', color: 'text-pink-600', diffBand: 'D3 – D5', distribution: { d1: 0, d2: 0, d3: 10, d4: 40, d5: 50 } },
    ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase font-tech tracking-wider">
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Competitive Ranked Arena • Season 1</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-tech uppercase tracking-wide">
              Continental League Ladder
            </h1>
            <p className="text-sm text-blue-100 font-medium">
              Battle the highest caliber cartographers. Win to climb tier divisions from Bronze to Elite.
            </p>
          </div>

          {/* Current Rank Showcase Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-3xl flex items-center space-x-4 shrink-0">
            <RankBadge tier={player.rankTier} division={player.rankDivision} size="lg" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black uppercase font-tech tracking-wide">
                  {player.rankTier} {player.rankDivision}
                </span>
                <span className="text-[10px] bg-amber-400 text-slate-900 font-black px-2 py-0.5 rounded-full font-tech">
                  TOP 4.2%
                </span>
              </div>
              <div className="text-sm font-bold text-blue-100 mt-1">
                <span className="text-2xl font-black font-tech text-white">{player.rankPoints}</span> / 2,000 RP
              </div>
              <div className="w-48 bg-black/30 h-1.5 rounded-full overflow-hidden mt-1.5 mb-1">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (player.rankPoints / 2000) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-blue-200 block">
                Peak: {player.peakRankPoints} RP • Win Rate: {player.winRate}% • MMR: {player.mmr || 1880}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Mode Selector: 1v1 vs 2v2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ranked 1v1 Card */}
        <div
          onClick={() => {
            sounds.playHover();
            setSelectedQueue('1v1');
          }}
          className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden ${selectedQueue === '1v1'
            ? 'bg-blue-50/50 border-blue-500 shadow-card-hover'
            : 'bg-white border-slate-200 hover:border-blue-200'
            }`}
        >
          {selectedQueue === '1v1' && (
            <div className="absolute top-4 right-4">
              <span className="text-xs font-black bg-blue-600 text-white px-2.5 py-1 rounded-full font-tech uppercase tracking-wider">
                SELECTED QUEUE
              </span>
            </div>
          )}

          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 font-tech uppercase">
                Ranked 1v1 Duel
              </h3>
              <span className="text-xs font-bold text-blue-600 font-tech">
                SOLO COMPETITIVE • HIGH STAKES
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">
            Head-to-head match over 8 high-speed country guessing rounds. Speed bonus multiplier applies to answers submitted under 2.0s.
          </p>

          <div className="mb-4 inline-flex items-center space-x-1.5 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-xl text-[10px] font-bold text-blue-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-tech uppercase">Live Queue: ~4s wait • 840 Cartographers</span>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => onQueueRanked('1v1')}
            icon={<Swords className="w-5 h-5" />}
            className="w-full shadow-glow-blue"
          >
            QUEUE RANKED 1v1 (+25 RP)
          </Button>
        </div>

        {/* Ranked 2v2 Card */}
        <div
          onClick={() => {
            sounds.playHover();
            setSelectedQueue('2v2');
          }}
          className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden ${selectedQueue === '2v2'
            ? 'bg-purple-50/50 border-purple-500 shadow-card-hover'
            : 'bg-white border-slate-200 hover:border-purple-200'
            }`}
        >
          {selectedQueue === '2v2' && (
            <div className="absolute top-4 right-4">
              <span className="text-xs font-black bg-purple-600 text-white px-2.5 py-1 rounded-full font-tech uppercase tracking-wider">
                SELECTED QUEUE
              </span>
            </div>
          )}

          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 font-tech uppercase">
                Ranked 2v2 Duo
              </h3>
              <span className="text-xs font-bold text-purple-600 font-tech">
                DUO QUEUE • SHARED SYNERGY
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">
            Queue with a party friend or match with a random partner. Combine geography clues to dominate opposing duos.
          </p>

          <div className="mb-4 inline-flex items-center space-x-1.5 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-xl text-[10px] font-bold text-purple-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-tech uppercase">Duo Queue: ~7s wait • 620 Cartographers</span>
          </div>

          <Button
            variant="violet"
            size="lg"
            onClick={() => onQueueRanked('2v2')}
            icon={<Users className="w-5 h-5" />}
            className="w-full shadow-glow-violet"
          >
            QUEUE RANKED 2v2 (DUO RP)
          </Button>
        </div>
      </div>

      {/* Complete 7-Tier Rank Showcase (Strict Requirement) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-tech uppercase tracking-wide">
                Division Tier Crests
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Official CountryRush competitive rank progression badges
            </p>
          </div>
          <span className="text-xs font-black text-slate-400 font-tech uppercase">
            7 Tiers • 3 Divisions Each
          </span>
        </div>

        {/* 7 Tiers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {rankTiers.map((r) => {
            const isCurrent = player.rankTier === r.tier;
            const isInspected = inspectedTier === r.tier;
            return (
              <div
                key={r.tier}
                onClick={() => {
                  sounds.playClick();
                  setInspectedTier(r.tier);
                }}
                className={`p-4 rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer ${isInspected
                  ? 'bg-blue-50/90 border-2 border-blue-500 shadow-md ring-2 ring-blue-400/20'
                  : isCurrent
                    ? 'bg-blue-50/40 border border-blue-300'
                    : 'bg-slate-50/60 border border-slate-100 hover:bg-slate-100/60'
                  }`}
              >
                <RankBadge tier={r.tier} size="md" />
                <h4 className={`text-sm font-black font-tech uppercase mt-2.5 ${r.color}`}>
                  {r.name}
                </h4>
                <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                  {r.rpThreshold}
                </span>

                <span className="mt-1 text-[9px] font-black uppercase font-tech text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                  {r.diffBand}
                </span>

                {isCurrent && (
                  <span className="mt-2 text-[9px] font-black uppercase font-tech bg-blue-600 text-white px-2 py-0.5 rounded-full">
                    Current Rank
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RAQE Competitive Fairness & Question Engine Breakdown */}
      {(() => {
        const activeTier = rankTiers.find((t) => t.tier === inspectedTier) || rankTiers[4];
        return (
          <div className="bg-white rounded-3xl border border-blue-200/80 p-6 sm:p-8 shadow-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-tech uppercase tracking-wide">
                    RAQE Question Calibration • {activeTier.name} Tier
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Rank-Aware Adaptive Question Engine baseline difficulty calibration & fairness guarantees
                </p>
              </div>

              <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200/80 px-3.5 py-1.5 rounded-2xl">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-black text-blue-700 font-tech uppercase">
                  MMR-Governed Skill Skewing Active
                </span>
              </div>
            </div>

            {/* Three Pillars: RP vs MMR vs Difficulty Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 font-tech block mb-1">
                  Pillar 1: Visible RP
                </span>
                <h4 className="text-sm font-black text-slate-800 font-tech uppercase mb-1">
                  Competitive Progression
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Rush Points (RP) represent season ladder standing and visible badge achievements. RP is rewarded for victories and speed.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/70">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 font-tech block mb-1">
                  Pillar 2: Hidden MMR
                </span>
                <h4 className="text-sm font-black text-slate-800 font-tech uppercase mb-1">
                  Estimated Skill Calibration
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Matchmaking Rating (MMR) evaluates true player skill and fine-tunes difficulty weights strictly inside the rank-permitted pool.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/70">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 font-tech block mb-1">
                  Pillar 3: Strict Difficulty Bounds
                </span>
                <h4 className="text-sm font-black text-slate-800 font-tech uppercase mb-1">
                  Competitive Integrity
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  MMR cannot bypass rank ceilings or floors. A Bronze match will never contain D4 or D5 questions regardless of player win streak.
                </p>
              </div>
            </div>

            {/* Baseline Difficulty Distribution for Inspected Tier */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase font-tech text-slate-700">
                  {activeTier.name} Baseline Difficulty Weights (D1–D5)
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  Allowed Range: {activeTier.diffBand}
                </span>
              </div>

              {/* Progress Distribution Bar */}
              <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden flex mb-3 shadow-inner">
                {activeTier.distribution.d1 > 0 && (
                  <div
                    style={{ width: `${activeTier.distribution.d1}%` }}
                    className="bg-emerald-500 h-full transition-all"
                    title={`D1 Easy: ${activeTier.distribution.d1}%`}
                  />
                )}
                {activeTier.distribution.d2 > 0 && (
                  <div
                    style={{ width: `${activeTier.distribution.d2}%` }}
                    className="bg-teal-500 h-full transition-all"
                    title={`D2 Normal: ${activeTier.distribution.d2}%`}
                  />
                )}
                {activeTier.distribution.d3 > 0 && (
                  <div
                    style={{ width: `${activeTier.distribution.d3}%` }}
                    className="bg-blue-500 h-full transition-all"
                    title={`D3 Medium: ${activeTier.distribution.d3}%`}
                  />
                )}
                {activeTier.distribution.d4 > 0 && (
                  <div
                    style={{ width: `${activeTier.distribution.d4}%` }}
                    className="bg-amber-500 h-full transition-all"
                    title={`D4 Hard: ${activeTier.distribution.d4}%`}
                  />
                )}
                {activeTier.distribution.d5 > 0 && (
                  <div
                    style={{ width: `${activeTier.distribution.d5}%` }}
                    className="bg-rose-500 h-full transition-all"
                    title={`D5 Expert: ${activeTier.distribution.d5}%`}
                  />
                )}
              </div>

              {/* 5 Difficulty Breakdown Pills */}
              <div className="grid grid-cols-5 gap-2 text-center text-xs font-tech font-black">
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-emerald-600 block">D1 Easy</span>
                  <span className="text-slate-800 text-sm">{activeTier.distribution.d1}%</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-teal-600 block">D2 Normal</span>
                  <span className="text-slate-800 text-sm">{activeTier.distribution.d2}%</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-blue-600 block">D3 Medium</span>
                  <span className="text-slate-800 text-sm">{activeTier.distribution.d3}%</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-amber-600 block">D4 Hard</span>
                  <span className="text-slate-800 text-sm">{activeTier.distribution.d4}%</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-rose-600 block">D5 Expert</span>
                  <span className="text-slate-800 text-sm">{activeTier.distribution.d5}%</span>
                </div>
              </div>
            </div>

            {/* Category Rotation & Fairness Guardrails */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-600">
              <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center space-x-3">
                <Compass className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <span className="text-slate-900 font-black font-tech block uppercase">10 Verified Categories</span>
                  <span className="text-slate-500 text-[11px]">Automotive, Aviation, Cities, Tech, Brands, Nature, etc.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center space-x-3">
                <Shield className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <span className="text-slate-900 font-black font-tech block uppercase">Anti-Clumping Rule</span>
                  <span className="text-slate-500 text-[11px]">Max 2 per category per match; zero consecutive repeats</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-slate-900 font-black font-tech block uppercase">Anti-Repeat Memory</span>
                  <span className="text-slate-500 text-[11px]">10-match exclusion buffer ensures unique rounds</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Match History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card">
        <h3 className="text-lg font-black text-slate-800 font-tech uppercase tracking-wide mb-4 flex items-center space-x-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Recent Ranked Match History</span>
        </h3>

        {matchHistory.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500 font-medium">
            No ranked matches recorded on this account yet. Authoritative online ranked matches unlock in future phases.
          </div>
        ) : (
          <div className="space-y-2.5">
            {matchHistory.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200/70 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center space-x-3.5">
                  <span
                    className={`text-xs font-black font-tech px-2.5 py-1 rounded-xl uppercase ${item.result === 'VICTORY'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                  >
                    {item.result}
                  </span>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-black text-slate-800 font-tech">
                        vs {item.opponent.username}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        ({item.score})
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {item.mode} • Accuracy {item.accuracy}% • {item.timeAgo}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`text-sm font-black font-tech ${item.rpDelta > 0 ? 'text-emerald-600' : 'text-rose-500'
                      }`}
                  >
                    {item.rpDelta > 0 ? `+${item.rpDelta}` : item.rpDelta} RP
                  </span>
                  <RankBadge tier={item.opponent.rankTier} division={item.opponent.rankDivision} size="xs" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
