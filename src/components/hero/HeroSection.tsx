import React from 'react';
import { Play, Zap, Shield, Sparkles, Activity, Compass, Users } from 'lucide-react';
import { AnimeMascot } from './AnimeMascot';
import { Button } from '../common/Button';

interface HeroSectionProps {
  onPlayRanked: () => void;
  onQuickPlay: () => void;
  onDailyChallenge: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onPlayRanked,
  onQuickPlay,
  onDailyChallenge,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/30 border border-blue-100/80 shadow-card p-6 md:p-8 lg:p-10 mb-8">
      {/* Decorative Anime Background Accents */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-orange-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-violet-400/10 rounded-full blur-2xl pointer-events-none" />
      
      {/* Subtle Japanese Esports Kanji Watermark */}
      <div className="absolute right-12 top-6 text-7xl md:text-8xl font-black text-blue-900/[0.03] select-none pointer-events-none font-tech tracking-widest">
        世界最速
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Branding, Tagline, Call to Action */}
        <div className="lg:col-span-7 flex flex-col items-start space-y-5">
          {/* Top Live Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/95 backdrop-blur-sm border border-blue-200/80 px-3.5 py-1.5 rounded-full shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-black uppercase text-slate-700 tracking-wider font-tech flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>1,842 Cartographers Battling Live</span>
            </span>
            <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-md">
              Tokyo 24ms
            </span>
          </div>

          {/* Main Title & Brand */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-orange-500 tracking-widest uppercase font-tech bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200">
                Official Season 1 Lobby
              </span>
              <span className="text-xs font-bold text-slate-400 font-tech">
                • カントリーラッシュ
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 font-tech uppercase leading-none">
              COUNTRY<span className="text-blue-600">RUSH</span>
            </h1>

            <p className="text-lg sm:text-xl font-bold text-slate-600 font-sans tracking-tight pt-1">
              Guess the country. <span className="text-blue-600 font-black">Beat everyone.</span>
            </p>
          </div>

          {/* Subtitle Description */}
          <p className="text-sm text-slate-500 max-w-xl leading-relaxed font-medium">
            Test your lightning-fast geography reflexes in competitive head-to-head duels.
            Identify flags, country silhouettes, borders, and capital coordinates in real-time esports showdowns.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2 w-full sm:w-auto">
            {/* Prominent Play Ranked Button */}
            <Button
              variant="primary"
              size="xl"
              onClick={onPlayRanked}
              icon={<Play className="w-5 h-5 fill-white" />}
              pulseGlow
              className="w-full sm:w-auto shadow-glow-blue"
            >
              PLAY RANKED 1v1
            </Button>

            {/* Secondary Quick Play Button */}
            <Button
              variant="secondary"
              size="lg"
              onClick={onQuickPlay}
              icon={<Zap className="w-5 h-5 fill-white" />}
              className="w-full sm:w-auto shadow-glow-orange font-tech font-extrabold uppercase"
            >
              QUICK CASUAL
            </Button>

            {/* Daily Sprint Button */}
            <Button
              variant="outline"
              size="lg"
              onClick={onDailyChallenge}
              icon={<Compass className="w-4 h-4 text-blue-600" />}
              className="w-full sm:w-auto font-tech font-bold"
            >
              DAILY SPRINT
            </Button>
          </div>

          {/* Feature Highlights Pills */}
          <div className="grid grid-cols-3 gap-3 pt-3 w-full max-w-lg border-t border-slate-100">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
              <Shield className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Real Photo Quests</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
              <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
              <span>RAQE Fair Play</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
              <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Instant Match (~4s)</span>
            </div>
          </div>

          {/* Pro Keyboard Tip */}
          <div className="hidden sm:inline-flex items-center space-x-2 bg-blue-50/70 border border-blue-100 px-3 py-1 rounded-xl text-[11px] font-bold text-blue-700">
            <span className="font-tech uppercase font-black bg-blue-600 text-white px-1.5 py-0.2 rounded text-[9px]">Hotkeys</span>
            <span>Press keys 1-4 or A-D during arena duels to lock in answers instantly!</span>
          </div>
        </div>

        {/* Right Column: Original Anime Mascot Character Illustration */}
        <div className="lg:col-span-5 flex items-center justify-center lg:justify-end relative">
          <AnimeMascot />
        </div>
      </div>
    </div>
  );
};
