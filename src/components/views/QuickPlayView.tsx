import React from 'react';
import { Zap, Flag, Building2, Map, Compass, Play, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';
import { sounds } from '../../utils/soundEffects';

interface QuickPlayViewProps {
  onLaunchQuickQueue: (modeName: string) => void;
}

export const QuickPlayView: React.FC<QuickPlayViewProps> = ({ onLaunchQuickQueue }) => {
  const quickModes = [
    {
      id: 'flag-blitz',
      title: 'Flag Blitz',
      subtitle: 'Fast Identification',
      description: '15 rapid-fire national flags. 4 choices per round. No RP loss, pure lightning reflex training.',
      rounds: '15 Flags • 6s each',
      players: 'Instant 4-Player Lobby',
      color: 'from-blue-600 to-indigo-600',
      icon: <Flag className="w-6 h-6 text-white" />,
    },
    {
      id: 'capital-sprint',
      title: 'Capital Dash',
      subtitle: 'Metropolis Knowledge',
      description: 'Match countries to their true capitals. Includes tricky non-primary and historic capital cities.',
      rounds: '10 Rounds • 8s each',
      players: 'Instant Match',
      color: 'from-amber-500 to-orange-500',
      icon: <Building2 className="w-6 h-6 text-white" />,
    },
    {
      id: 'silhouette-mystery',
      title: 'Silhouette Mystery',
      subtitle: 'Border Outlines',
      description: 'Identify nations strictly by their geographic border geometry with zero labels or flags.',
      rounds: '8 Rounds • 10s each',
      players: 'Instant Match',
      color: 'from-purple-600 to-violet-600',
      icon: <Map className="w-6 h-6 text-white" />,
    },
    {
      id: 'geo-roulette',
      title: 'Continental Roulette',
      subtitle: 'Random Curated Mix',
      description: 'Mixed challenge cycling between flags, capitals, land borders, and ocean coordinates.',
      rounds: '12 Rounds • 7s each',
      players: 'Instant 8-Player Royale',
      color: 'from-emerald-500 to-teal-600',
      icon: <Compass className="w-6 h-6 text-white" />,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase font-tech tracking-wider">
            <Zap className="w-4 h-4 text-white fill-white" />
            <span>Casual Arcade • Zero RP Pressure</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-tech uppercase tracking-wide">
            Quick Play Arenas
          </h1>
          <p className="text-sm text-orange-100 font-medium">
            Jump directly into rapid unranked matches. Hone your geography reflexes, warm up for Ranked, and earn Rush Tokens.
          </p>
        </div>
      </div>

      {/* Grid of Casual Arenas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickModes.map((qm) => (
          <div
            key={qm.id}
            className="group bg-white rounded-3xl border border-slate-200/80 hover:border-orange-300 p-6 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${qm.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                  {qm.icon}
                </div>
                <span className="text-[11px] font-black uppercase font-tech bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full">
                  Instant Queue
                </span>
              </div>

              <span className="text-[11px] font-extrabold text-orange-600 uppercase font-tech tracking-wider">
                {qm.subtitle}
              </span>
              <h3 className="text-xl font-black text-slate-800 font-tech uppercase tracking-wide group-hover:text-orange-600 transition-colors mb-2">
                {qm.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                {qm.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] font-bold text-slate-400">
                <span>{qm.rounds}</span>
              </div>

              <Button
                variant="secondary"
                size="md"
                onClick={() => onLaunchQuickQueue(qm.title)}
                icon={<Play className="w-4 h-4 fill-white" />}
                className="font-tech font-extrabold uppercase shadow-sm"
              >
                QUICK MATCH
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
