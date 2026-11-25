import React, { useState } from 'react';
import { Flame, Clock, Trophy, CheckCircle, Play, Sparkles, Calendar, Award } from 'lucide-react';
import type { DailyChallengeInfo, PlayerProfile } from '../../types/game';
import { Button } from '../common/Button';
import { sounds } from '../../utils/soundEffects';

interface DailyChallengeViewProps {
  challenge: DailyChallengeInfo;
  player: PlayerProfile;
  onStartChallenge: () => void;
}

export const DailyChallengeView: React.FC<DailyChallengeViewProps> = ({
  challenge,
  player,
  onStartChallenge,
}) => {
  const [completed, setCompleted] = useState(challenge.completedToday);

  // 7 days of the week streak calendar
  const weekDays = [
    { day: 'Mon', done: true, score: '9,420' },
    { day: 'Tue', done: true, score: '9,110' },
    { day: 'Wed', done: true, score: '8,950' },
    { day: 'Thu', done: true, score: '9,600' },
    { day: 'Fri', done: true, score: '9,840' },
    { day: 'Sat', done: true, score: '9,500' },
    { day: 'Sun (Today)', done: completed, score: completed ? '9,720' : 'Pending' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase font-tech tracking-wider">
              <Flame className="w-4 h-4 text-white fill-white animate-pulse" />
              <span>Today’s Global Curated Trial</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-tech uppercase tracking-wide">
              {challenge.title}
            </h1>
            <p className="text-sm text-rose-100 font-medium">
              {challenge.description}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-3xl flex items-center space-x-4 shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center font-black font-tech text-2xl shadow-lg">
              {challenge.todayStreak}D
            </div>
            <div>
              <span className="text-xs font-black uppercase font-tech tracking-wider text-amber-200 block">
                Active Streak
              </span>
              <span className="text-xl font-black font-tech text-white">
                {challenge.multiplier} XP Bonus
              </span>
              <span className="text-[11px] text-rose-100 block">
                Reward: +{challenge.rpReward} RP & +{challenge.xpReward} XP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Rules & Start Action Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-800 font-tech uppercase tracking-wide mb-4">
              Trial Parameters
            </h3>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Questions
                </span>
                <span className="text-2xl font-black text-slate-800 font-tech">
                  {challenge.questionCount}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Time Limit
                </span>
                <span className="text-2xl font-black text-blue-600 font-tech">
                  {challenge.timeLimitSeconds}s
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Time Left Today
                </span>
                <span className="text-2xl font-black text-orange-500 font-tech">
                  {challenge.endsInHours}h 14m
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
              Every cartographer receives the exact same set of 10 geography questions today. Answer quickly to earn time bonuses and top the global daily leaderboard.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span>Single attempt per 24 hours</span>
            </div>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                sounds.playClick();
                setCompleted(true);
                onStartChallenge();
              }}
              icon={<Play className="w-5 h-5 fill-white" />}
              className="shadow-glow-orange font-tech uppercase font-extrabold"
            >
              {completed ? 'REPLAY TODAY’S SPRINT' : 'START TODAY’S SPRINT'}
            </Button>
          </div>
        </div>

        {/* Today's High Score Leader */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Award className="w-5 h-5 text-amber-500" />
              <h4 className="text-base font-black text-slate-800 font-tech uppercase tracking-wide">
                Today’s Top Record
              </h4>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center mb-4">
              <span className="text-xs font-black text-amber-800 uppercase font-tech tracking-wider block">
                Rank 1 Global
              </span>
              <span className="text-xl font-black text-slate-900 font-tech my-1 block">
                {challenge.topLeader.username}
              </span>
              <span className="text-2xl font-black text-amber-600 font-tech">
                {challenge.topLeader.score} PTS
              </span>
              <span className="text-xs text-slate-500 block font-medium mt-1">
                Completed in {challenge.topLeader.timeSeconds}s
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-medium text-center">
            Resets at 00:00 UTC daily
          </div>
        </div>
      </div>

      {/* 7-Day Streak Calendar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-black text-slate-800 font-tech uppercase tracking-wide">
              Weekly Streak Tracker
            </h3>
          </div>
          <span className="text-xs font-black text-orange-600 font-tech">
            🔥 7/7 DAYS COMPLETED
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {weekDays.map((w, idx) => (
            <div 
              key={idx}
              className={`p-4 rounded-2xl border flex flex-col items-center text-center transition-all ${
                w.done
                  ? 'bg-orange-50/60 border-orange-200 text-orange-700'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <span className="text-xs font-bold mb-2">{w.day}</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                w.done ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-400'
              }`}>
                {w.done ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-4 h-4" />}
              </div>
              <span className="text-xs font-black font-tech">
                {w.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
