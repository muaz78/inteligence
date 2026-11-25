import React, { useState } from 'react';
import {
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Layers,
  Cpu,
  Car,
  Plane,
  Building2,
  Home,
  Tag,
  Landmark,
  Trees,
  Compass,
  AlertTriangle
} from 'lucide-react';
import type {
  RankTier,
  RankDivision
} from '../../types/game';
import type {
  GeneratedMatchSequence,
  QuestionCategory,
  CalibrationCandidate
} from '../../types/question';
import {
  ALL_RANK_DEFINITIONS,
  getRankDefinition
} from '../../question-engine/config/rankConfig';
import {
  DIFFICULTY_LEVELS,
  calculateAdjustedDistribution
} from '../../question-engine/config/difficultyConfig';
import {
  ALL_CATEGORIES
} from '../../question-engine/config/categoryConfig';
import {
  generateMatchQuestionSequence
} from '../../question-engine/selection/questionSelector';
import {
  antiRepeatManager
} from '../../question-engine/antiRepeat/antiRepeatManager';
import {
  auditQuestionPoolCalibration
} from '../../question-engine/calibration/difficultyCalibrator';
import {
  MOCK_QUESTION_POOL
} from '../../question-engine/data/mockQuestionPool';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { sounds } from '../../utils/soundEffects';

interface RaqeInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RaqeInspectorModal: React.FC<RaqeInspectorModalProps> = ({ isOpen, onClose }) => {
  const [tier, setTier] = useState<RankTier>('Diamond');
  const [division, setDivision] = useState<RankDivision>('III');
  const [rounds, setRounds] = useState(8);

  const initialRank = getRankDefinition('Diamond', 'III');
  const [mmr, setMmr] = useState(initialRank.targetMMR);

  // Active sequence state
  const [sequence, setSequence] = useState<GeneratedMatchSequence>(() => {
    return generateMatchQuestionSequence({
      matchId: 'sim_test_01',
      mode: '1v1',
      totalRounds: 8,
      primaryRankTier: 'Diamond',
      primaryRankDivision: 'III',
      playerMMRs: [initialRank.targetMMR],
    });
  });

  const [calibrationAudit] = useState<CalibrationCandidate[]>(() => {
    return auditQuestionPoolCalibration(MOCK_QUESTION_POOL);
  });

  const currentRankDef = getRankDefinition(tier, division);
  const targetDist = calculateAdjustedDistribution(currentRankDef, mmr);

  const handleTierChange = (newTier: RankTier) => {
    setTier(newTier);
    const newDef = getRankDefinition(newTier, division);
    setMmr(newDef.targetMMR);
  };

  const handleRunSequence = () => {
    sounds.playClick();
    const newSeq = generateMatchQuestionSequence({
      matchId: `sim_${Date.now()}`,
      mode: '1v1',
      totalRounds: rounds,
      primaryRankTier: tier,
      primaryRankDivision: tier === 'Master' || tier === 'Elite' ? undefined : division,
      playerMMRs: [mmr],
    });
    setSequence(newSeq);

    // Record into anti-repeat manager for simulation test
    antiRepeatManager.recordServedQuestions(newSeq.questions.map((q) => q.id));
  };

  const handleClearHistory = () => {
    sounds.playClick();
    antiRepeatManager.resetHistory();
    handleRunSequence();
  };

  const getCategoryIcon = (catId: QuestionCategory) => {
    switch (catId) {
      case 'automotive': return <Car className="w-3.5 h-3.5 text-blue-600" />;
      case 'aviation': return <Plane className="w-3.5 h-3.5 text-indigo-600" />;
      case 'cities': return <Building2 className="w-3.5 h-3.5 text-cyan-600" />;
      case 'villages': return <Home className="w-3.5 h-3.5 text-amber-600" />;
      case 'technology': return <Cpu className="w-3.5 h-3.5 text-purple-600" />;
      case 'brands': return <Tag className="w-3.5 h-3.5 text-rose-600" />;
      case 'landmarks': return <Landmark className="w-3.5 h-3.5 text-orange-600" />;
      case 'nature': return <Trees className="w-3.5 h-3.5 text-emerald-600" />;
      case 'geography': return <Compass className="w-3.5 h-3.5 text-blue-700" />;
      default: return <Layers className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="RAQE — Question Selection Engine Inspector"
      subtitle="Development & Balance Telemetry for Rank-Aware Question Selection"
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Top Control Bar: Rank Anchor, Division, MMR & Rounds */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 border border-blue-200">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            {/* Rank Tier Selector */}
            <div>
              <label className="text-[10px] font-black uppercase text-blue-700 tracking-wider font-tech block mb-1">
                Competitive Rank Tier
              </label>
              <select
                value={tier}
                onChange={(e) => handleTierChange(e.target.value as RankTier)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-black font-tech text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="Bronze">Bronze (D1-D3)</option>
                <option value="Silver">Silver (D1-D4)</option>
                <option value="Gold">Gold (D1-D4)</option>
                <option value="Platinum">Platinum (D1-D5)</option>
                <option value="Diamond">Diamond (D2-D5)</option>
                <option value="Master">Master (D2-D5)</option>
                <option value="Elite">Elite (D3-D5)</option>
              </select>
            </div>

            {/* Division Selector */}
            <div>
              <label className="text-[10px] font-black uppercase text-blue-700 tracking-wider font-tech block mb-1">
                Tier Division
              </label>
              <select
                value={division}
                disabled={tier === 'Master' || tier === 'Elite'}
                onChange={(e) => setDivision(e.target.value as RankDivision)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-black font-tech text-slate-800 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option value="III">Division III (Low)</option>
                <option value="II">Division II (Mid)</option>
                <option value="I">Division I (High)</option>
              </select>
            </div>

            {/* Simulated MMR Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-black uppercase text-blue-700 tracking-wider font-tech">
                  Skill Rating (MMR)
                </label>
                <span className="text-xs font-black font-tech text-blue-600">
                  {mmr} <span className="text-[10px] text-slate-400">({currentRankDef.targetMMR} base)</span>
                </span>
              </div>
              <input
                type="range"
                min={currentRankDef.minMMR}
                max={currentRankDef.maxMMR}
                value={mmr}
                onChange={(e) => setMmr(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Rounds & Run Trigger */}
            <div className="flex items-end space-x-2">
              <div className="w-20">
                <label className="text-[10px] font-black uppercase text-blue-700 tracking-wider font-tech block mb-1">
                  Rounds
                </label>
                <select
                  value={rounds}
                  onChange={(e) => setRounds(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-xs font-black font-tech text-slate-800"
                >
                  <option value={6}>6</option>
                  <option value={8}>8</option>
                  <option value={10}>10</option>
                  <option value={12}>12</option>
                </select>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleRunSequence}
                icon={<Sparkles className="w-3.5 h-3.5" />}
                className="flex-1 font-tech uppercase"
              >
                GENERATE
              </Button>
            </div>
          </div>
        </div>

        {/* Difficulty Distribution: Target vs Actual Breakdown */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black uppercase text-slate-800 font-tech tracking-wide flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-orange-500" />
              <span>Calibrated Difficulty Distribution (MMR-Adjusted)</span>
            </span>
            <span className="text-[10px] text-slate-500 font-bold">
              Allowed Tiers: {currentRankDef.allowedDifficulties.join(', ')}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-3 text-center">
            {(['D1', 'D2', 'D3', 'D4', 'D5'] as const).map((d) => {
              const info = DIFFICULTY_LEVELS[d];
              const targetPct = targetDist[d] || 0;
              const actualCount = sequence.actualDistribution[d] || 0;
              const isAllowed = currentRankDef.allowedDifficulties.includes(d);

              return (
                <div
                  key={d}
                  className={`p-2.5 rounded-xl border transition-all ${isAllowed ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-100/60 border-dashed border-slate-200 opacity-40'
                    }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-black font-tech mb-1">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] ${info.badgeColor}`}>
                      {d}
                    </span>
                    <span className="text-slate-500">{info.name}</span>
                  </div>

                  <div className="text-lg font-black font-tech text-slate-800">
                    {targetPct}%
                  </div>

                  <div className="text-[10px] text-slate-400 font-bold">
                    Actual: <span className="text-blue-600 font-black font-tech">{actualCount} Qs</span>
                  </div>

                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${targetPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Rotation Breakdown */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-black uppercase text-slate-800 font-tech tracking-wide flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Active Category Variety Plan</span>
            </span>
            <span className="text-[10px] text-slate-500 font-bold">
              Anti-Clumping Rule: Max 2/match, No immediate back-to-back
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => {
              const count = sequence.categoryBreakdown[cat.id] || 0;
              return (
                <div
                  key={cat.id}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${count > 0
                      ? 'bg-white border border-blue-200 text-slate-800 shadow-2xs'
                      : 'bg-slate-100/70 text-slate-400 border border-transparent'
                    }`}
                >
                  {getCategoryIcon(cat.id)}
                  <span className="font-tech uppercase">{cat.shortLabel}</span>
                  {count > 0 && (
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center font-tech">
                      {count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Generated Match Question Sequence Table */}
        <div>
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-black uppercase text-slate-800 font-tech tracking-wide flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Locked Match Sequence (Fairness Locked: {sequence.questions.length} Rounds)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Seed: {sequence.seed}
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white">
            {sequence.questions.map((q, idx) => (
              <div key={q.id + idx} className="p-3 hover:bg-slate-50 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center font-black font-tech text-slate-700 shrink-0">
                    {idx + 1}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black font-tech uppercase shrink-0 ${DIFFICULTY_LEVELS[q.difficulty].badgeColor
                    }`}>
                    {q.difficulty}
                  </span>
                  <div className="flex items-center space-x-1.5 shrink-0 text-slate-500 font-tech uppercase text-[11px]">
                    {getCategoryIcon(q.category)}
                    <span>{q.category}</span>
                  </div>
                  <span className="font-medium text-slate-800 truncate max-w-sm">
                    {q.prompt}
                  </span>
                </div>

                <div className="flex items-center space-x-2 shrink-0 ml-3">
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {q.correctCountry}
                  </span>
                  <span title="Verified QC Pass">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Control & Anti-Repeat Telemetry Footer */}
        <div className="p-3.5 rounded-2xl bg-slate-100/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium">
          <div className="flex items-center space-x-4">
            <span>
              Pool: <strong className="text-slate-800">{sequence.validationReport.passedVerification}</strong> verified questions
            </span>
            <span>
              Recent History Buffer: <strong className="text-slate-800">{antiRepeatManager.getRecentHistory().length}</strong>
            </span>
            {calibrationAudit.length > 0 && (
              <span className="text-amber-700 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{calibrationAudit.length} Calibration Telemetry Audits</span>
              </span>
            )}
          </div>

          <button
            onClick={handleClearHistory}
            className="flex items-center space-x-1 text-slate-500 hover:text-blue-600 font-bold cursor-pointer text-[11px]"
            title="Reset simulated player question history buffer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Anti-Repeat History</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
