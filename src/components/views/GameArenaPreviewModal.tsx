import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Trophy,
  Clock,
  Zap,
  Sparkles,
  Check,
  ArrowRight,
  HelpCircle,
  Shield,
  Car,
  Plane,
  Building2,
  Home,
  Cpu,
  Tag,
  Landmark,
  Trees,
  Compass,
  Globe,
  AlertCircle,
  RotateCcw,
  Swords,
  Layers,
  MapPin,
  CheckCircle2,
  XCircle,
  Flame,
  Award
} from 'lucide-react';
import type { PlayerProfile } from '../../types/game';
import type { QuestionMetadata, GeneratedMatchSequence, QuestionDifficulty, QuestionCategory } from '../../types/question';
import { generateMatchQuestionSequence } from '../../question-engine/selection/questionSelector';
import { getQuestionMedia } from '../../media/questionMediaRegistry';
import { QuestionImage } from '../common/QuestionImage';
import { AnimeAvatar } from '../common/AnimeAvatar';
import { RankBadge } from '../common/RankBadge';
import { PhaserCanvas } from '../../game/PhaserCanvas';
import { Button } from '../common/Button';
import { sounds } from '../../utils/soundEffects';

interface GameArenaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerProfile;
  modeTitle: string;
}

interface RoundHistoryLog {
  round: number;
  question: QuestionMetadata;
  selectedOption: string;
  isCorrect: boolean;
  timeSpentSec: number;
  pointsEarned: number;
}

export const GameArenaPreviewModal: React.FC<GameArenaPreviewModalProps> = ({
  isOpen,
  onClose,
  player,
  modeTitle,
}) => {
  const [matchSequence, setMatchSequence] = useState<GeneratedMatchSequence | null>(null);
  const [round, setRound] = useState(1);
  const [timer, setTimer] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [matchFinished, setMatchFinished] = useState(false);
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [roundHistory, setRoundHistory] = useState<RoundHistoryLog[]>([]);
  const [showCoordinatesSandbox, setShowCoordinatesSandbox] = useState(false);

  // Simulated live opponent duel state
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponentStatus, setOpponentStatus] = useState<string>('Analyzing query...');
  const [opponentAnswered, setOpponentAnswered] = useState<boolean>(false);

  const mockOpponent = useMemo(() => ({
    username: 'Ren_Kyoto',
    tag: 'JP1',
    rankTier: 'Diamond' as const,
    rankDivision: 'II' as const,
    rp: 1845,
    avatarSeed: 'kaito_ren',
    country: 'Japan 🇯🇵',
  }), []);

  // Initialize locked RAQE sequence on modal open
  useEffect(() => {
    if (isOpen) {
      const seq = generateMatchQuestionSequence({
        matchId: `arena_${Date.now()}`,
        mode: modeTitle.toLowerCase().includes('2v2') ? '2v2' : '1v1',
        totalRounds: 8,
        primaryRankTier: player.rankTier,
        primaryRankDivision: player.rankDivision,
        playerMMRs: [player.mmr || 1880],
      });
      setMatchSequence(seq);
      setRound(1);
      setTimer(10);
      setSelectedAnswer(null);
      setScore(0);
      setOpponentScore(0);
      setStreak(0);
      setMatchFinished(false);
      setRevealedHints(0);
      setRoundHistory([]);
      setShowCoordinatesSandbox(false);
    }
  }, [isOpen, modeTitle, player.rankTier, player.rankDivision, player.mmr]);

  const currentQuestion: QuestionMetadata | undefined = useMemo(() => {
    if (!matchSequence || !matchSequence.questions) return undefined;
    return matchSequence.questions[round - 1];
  }, [matchSequence, round]);

  const currentMedia = useMemo(() => {
    if (!currentQuestion) return null;
    return getQuestionMedia(currentQuestion.id);
  }, [currentQuestion]);

  // Round countdown timer
  useEffect(() => {
    let t: ReturnType<typeof setInterval>;
    if (isOpen && !matchFinished && selectedAnswer === null) {
      t = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(t);
  }, [isOpen, round, matchFinished, selectedAnswer]);

  // Simulated Opponent Real-time Reaction
  useEffect(() => {
    if (!isOpen || matchFinished || selectedAnswer !== null) {
      setOpponentStatus('Analyzing query...');
      setOpponentAnswered(false);
      return;
    }

    setOpponentStatus('Analyzing query...');
    setOpponentAnswered(false);

    // Opponent answers between 1.8s and 4.2s
    const opponentReactionDelay = Math.floor(Math.random() * 2400) + 1800;
    const opponentTimer = setTimeout(() => {
      // 82% opponent accuracy in Diamond tier
      const isOpponentCorrect = Math.random() < 0.82;
      const opponentPoints = isOpponentCorrect ? 210 + Math.floor(Math.random() * 40) : 0;

      setOpponentAnswered(true);
      if (isOpponentCorrect) {
        setOpponentScore((s) => s + opponentPoints);
        setOpponentStatus(`Locked in (${(opponentReactionDelay / 1000).toFixed(1)}s) • +${opponentPoints} PTS`);
      } else {
        setOpponentStatus(`Mistake (${(opponentReactionDelay / 1000).toFixed(1)}s) • +0 PTS`);
      }
    }, opponentReactionDelay);

    return () => clearTimeout(opponentTimer);
  }, [isOpen, round, selectedAnswer, matchFinished]);

  const handleTimeout = () => {
    if (selectedAnswer !== null || !currentQuestion) return;
    sounds.playCancel();
    setSelectedAnswer('__TIMEOUT__');
    setStreak(0);

    setRoundHistory((prev) => [
      ...prev,
      {
        round,
        question: currentQuestion,
        selectedOption: 'Time Expired',
        isCorrect: false,
        timeSpentSec: 10,
        pointsEarned: 0,
      },
    ]);
  };

  const handleSelectAnswer = useCallback((option: string) => {
    if (selectedAnswer !== null || !currentQuestion) return;
    setSelectedAnswer(option);

    const isCorrect = option === currentQuestion.correctCountry;
    let earned = 0;

    if (isCorrect) {
      sounds.playClick();
      const basePoints = 200;
      const speedBonus = timer > 7 ? 60 : timer > 4 ? 30 : 0;
      const streakMultiplier = Math.min(1 + streak * 0.1, 2.0);
      earned = Math.round((basePoints + speedBonus) * streakMultiplier);

      setScore((s) => s + earned);
      setStreak((st) => st + 1);
    } else {
      sounds.playCancel();
      setStreak(0);
    }

    setRoundHistory((prev) => [
      ...prev,
      {
        round,
        question: currentQuestion,
        selectedOption: option,
        isCorrect,
        timeSpentSec: 10 - timer,
        pointsEarned: earned,
      },
    ]);
  }, [selectedAnswer, currentQuestion, timer, streak, round]);

  // Keyboard Navigation: keys 1-4 or A-D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || selectedAnswer !== null || !currentQuestion || matchFinished) return;
      const key = e.key.toLowerCase();
      let index = -1;

      if (key === '1' || key === 'a') index = 0;
      else if (key === '2' || key === 'b') index = 1;
      else if (key === '3' || key === 'c') index = 2;
      else if (key === '4' || key === 'd') index = 3;

      if (index >= 0 && index < currentQuestion.options.length) {
        handleSelectAnswer(currentQuestion.options[index]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedAnswer, currentQuestion, matchFinished, handleSelectAnswer]);

  const handleNextRound = () => {
    sounds.playClick();
    if (!matchSequence) return;

    if (round >= matchSequence.questions.length) {
      setMatchFinished(true);
      // Trigger celebratory confetti on victory
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#3478F6', '#FF9F43', '#8B5CF6'],
        });
      } catch {
        // safe fallback
      }
    } else {
      setRound((r) => r + 1);
      setTimer(10);
      setSelectedAnswer(null);
      setRevealedHints(0);
    }
  };

  const handleRevealHint = () => {
    if (!currentQuestion?.hints || revealedHints >= currentQuestion.hints.length) return;
    sounds.playHover();
    setRevealedHints((prev) => prev + 1);
    setScore((s) => Math.max(0, s - 25));
  };

  if (!isOpen) return null;

  // Category Icon & Label mapping
  const getCategoryMeta = (cat: QuestionCategory) => {
    switch (cat) {
      case 'automotive':
        return { label: 'Cars & Automotive', icon: Car, color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'aviation':
        return { label: 'Aircraft & Aviation', icon: Plane, color: 'text-sky-700 bg-sky-50 border-sky-200' };
      case 'cities':
        return { label: 'World Cities', icon: Building2, color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'villages':
        return { label: 'Villages & Rural', icon: Home, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'technology':
        return { label: 'Technology', icon: Cpu, color: 'text-violet-700 bg-violet-50 border-violet-200' };
      case 'brands':
        return { label: 'Brands & Industry', icon: Tag, color: 'text-pink-700 bg-pink-50 border-pink-200' };
      case 'landmarks':
        return { label: 'Landmarks', icon: Landmark, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
      case 'nature':
        return { label: 'Nature & Wonders', icon: Trees, color: 'text-emerald-800 bg-emerald-50 border-emerald-200' };
      case 'geography':
        return { label: 'Geography & Borders', icon: Compass, color: 'text-cyan-800 bg-cyan-50 border-cyan-200' };
      case 'culture':
      default:
        return { label: 'Culture & Heritage', icon: Globe, color: 'text-purple-700 bg-purple-50 border-purple-200' };
    }
  };

  // Difficulty badge colors
  const getDifficultyBadge = (diff: QuestionDifficulty) => {
    switch (diff) {
      case 'D1':
        return { label: 'D1 • Easy', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'D2':
        return { label: 'D2 • Normal', bg: 'bg-teal-100 text-teal-800 border-teal-300' };
      case 'D3':
        return { label: 'D3 • Medium', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'D4':
        return { label: 'D4 • Hard', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'D5':
        return { label: 'D5 • Expert', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
    }
  };

  const catMeta = currentQuestion ? getCategoryMeta(currentQuestion.category) : null;
  const CatIcon = catMeta ? catMeta.icon : Globe;
  const diffBadge = currentQuestion ? getDifficultyBadge(currentQuestion.difficulty) : null;
  const totalRounds = matchSequence?.questions.length || 8;
  const isPlayerAhead = score >= opponentScore;
  const scoreDiff = Math.abs(score - opponentScore);
  const isMatchVictory = score >= opponentScore;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-blue-200 overflow-hidden flex flex-col my-auto max-h-[96vh]">
        {/* Top Glowing Esports Stripe */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-orange-400" />

        {/* Header Bar */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-black uppercase text-blue-600 font-tech tracking-wider">
              {modeTitle} • Round {round}/{totalRounds}
            </span>
            <span className="hidden sm:inline-block text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
              RAQE Seed: {matchSequence?.seed.slice(0, 8)}
            </span>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-5">
            <div className="flex items-center space-x-1.5 text-orange-600 font-tech font-black text-sm">
              <Zap className="w-4 h-4 fill-orange-500" />
              <span>{streak}x Streak</span>
            </div>

            <div className="flex items-center space-x-1.5 text-blue-600 font-tech font-black text-sm">
              <Trophy className="w-4 h-4" />
              <span>{score} PTS</span>
            </div>

            <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl font-tech font-black text-sm transition-colors ${timer <= 3 ? 'bg-rose-100 text-rose-600 animate-pulse border border-rose-300' : 'bg-blue-100 text-blue-700'
              }`}>
              <Clock className="w-4 h-4" />
              <span>{timer}s</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl cursor-pointer"
              title="Return to Main Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Head-to-Head Duel Status Bar */}
        {!matchFinished && (
          <div className="px-5 py-2.5 bg-gradient-to-r from-blue-50/80 via-white to-orange-50/80 border-b border-slate-200/80 flex items-center justify-between">
            {/* Player Info */}
            <div className="flex items-center space-x-2.5">
              <AnimeAvatar seed={player.avatarSeed} size="xs" rankTier={player.rankTier} />
              <div className="text-left">
                <span className="text-xs font-black text-slate-800 font-tech block leading-none">
                  {player.username} (YOU)
                </span>
                <span className="text-[10px] text-blue-600 font-bold font-tech">
                  {score} PTS
                </span>
              </div>
            </div>

            {/* Tug-of-War Score Bar & Live Gap */}
            <div className="flex-1 max-w-xs mx-4 hidden sm:block">
              <div className="flex justify-between items-center text-[10px] font-black font-tech uppercase mb-1">
                <span className={isPlayerAhead ? 'text-emerald-600' : 'text-slate-400'}>
                  {isPlayerAhead ? `+${scoreDiff} Ahead` : `-${scoreDiff} Behind`}
                </span>
                <span className="text-slate-400 font-mono">VS DUEL</span>
                <span className={!isPlayerAhead ? 'text-orange-600' : 'text-slate-400'}>
                  {opponentScore} PTS
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-blue-600 h-full transition-all duration-500"
                  style={{ width: `${Math.max(10, Math.min(90, (score / Math.max(score + opponentScore, 1)) * 100))}%` }}
                />
                <div
                  className="bg-orange-500 h-full transition-all duration-500"
                  style={{ width: `${Math.max(10, Math.min(90, (opponentScore / Math.max(score + opponentScore, 1)) * 100))}%` }}
                />
              </div>
            </div>

            {/* Simulated Opponent Info */}
            <div className="flex items-center space-x-2.5 text-right">
              <div>
                <span className="text-xs font-black text-slate-800 font-tech block leading-none">
                  {mockOpponent.username}
                </span>
                <span className={`text-[10px] font-bold font-tech ${opponentAnswered ? 'text-orange-600' : 'text-slate-400 animate-pulse'}`}>
                  {opponentStatus}
                </span>
              </div>
              <AnimeAvatar seed={mockOpponent.avatarSeed} size="xs" rankTier={mockOpponent.rankTier} />
            </div>
          </div>
        )}

        {/* Main Arena Body */}
        {!matchFinished && currentQuestion ? (
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
            {/* Dominant Real-World Question Photograph */}
            <div className="w-full">
              <QuestionImage
                media={currentMedia}
                altText={currentQuestion.prompt}
                categoryLabel={catMeta?.label}
                difficultyLabel={diffBadge?.label}
              />
            </div>

            {/* Question Text & Prompt Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-white to-blue-50/50 border border-blue-200 text-center relative shadow-sm">
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 font-tech uppercase tracking-wide max-w-3xl mx-auto leading-snug">
                {currentQuestion.prompt}
              </h2>

              {/* Tags & Quick Clue Reveal Toggle */}
              <div className="mt-2 flex items-center justify-center space-x-2 flex-wrap gap-y-1">
                {currentQuestion.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    #{tag}
                  </span>
                ))}

                {currentQuestion.hints && currentQuestion.hints.length > 0 && selectedAnswer === null && (
                  <button
                    onClick={handleRevealHint}
                    className="inline-flex items-center space-x-1 text-[11px] font-black text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Clue ({revealedHints}/{currentQuestion.hints.length}) [-25 pts]</span>
                  </button>
                )}
              </div>

              {/* Revealed Hints Box */}
              {revealedHints > 0 && currentQuestion.hints && (
                <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 max-w-xl mx-auto animate-in fade-in">
                  💡 Clue: {currentQuestion.hints[revealedHints - 1]}
                </div>
              )}
            </div>

            {/* 4 Interactive Esports Answer Cards with Keyboard Hotkeys */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {currentQuestion.options.map((opt, idx) => {
                const keyLetter = ['A', 'B', 'C', 'D'][idx];
                const keyNumber = idx + 1;
                const isSelected = selectedAnswer === opt;
                const isCorrect = opt === currentQuestion.correctCountry;

                let cardStyle = 'bg-white hover:bg-blue-50/60 border-slate-200 text-slate-800 shadow-sm hover:border-blue-300';

                if (selectedAnswer !== null) {
                  if (isCorrect) {
                    cardStyle = 'bg-emerald-500 border-emerald-600 text-white shadow-lg ring-2 ring-emerald-400/30 scale-[1.02]';
                  } else if (isSelected) {
                    cardStyle = 'bg-rose-500 border-rose-600 text-white';
                  } else {
                    cardStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-50';
                  }
                }

                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectAnswer(opt)}
                    disabled={selectedAnswer !== null}
                    className={`relative p-4 rounded-2xl border-2 text-left font-tech font-black transition-all cursor-pointer group flex items-center justify-between ${cardStyle}`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black font-tech border ${selectedAnswer !== null && (isCorrect || isSelected)
                          ? 'bg-white/20 text-white border-white/30'
                          : 'bg-slate-100 text-slate-600 border-slate-200 group-hover:bg-blue-100 group-hover:text-blue-700'
                        }`}>
                        {keyLetter}
                      </span>
                      <span className="text-base sm:text-lg uppercase tracking-wide">
                        {opt}
                      </span>
                    </div>

                    {selectedAnswer !== null && isCorrect && (
                      <Check className="w-5 h-5 text-white shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Feedback Banner & Next Round Trigger */}
            {selectedAnswer !== null && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
                <div className="text-left">
                  <span className={`font-tech text-base font-black flex items-center space-x-1.5 ${selectedAnswer === currentQuestion.correctCountry ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                    {selectedAnswer === currentQuestion.correctCountry ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span>EXCELLENT! SPEED BONUS ACTIVE</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-500" />
                        <span>INCORRECT • Correct answer is {currentQuestion.correctCountry}</span>
                      </>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-500 font-bold block mt-0.5">
                    Historical Accuracy: {Math.round(currentQuestion.stats.correctRate * 100)}% • Category: {catMeta?.label}
                  </span>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setShowCoordinatesSandbox(!showCoordinatesSandbox)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer hidden md:flex items-center space-x-1"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{showCoordinatesSandbox ? 'Hide Coordinates' : 'Show Phaser Map'}</span>
                  </button>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleNextRound}
                    icon={<ArrowRight className="w-4 h-4" />}
                    iconPosition="right"
                    className="font-tech uppercase shadow-glow-blue w-full sm:w-auto"
                  >
                    {round >= totalRounds ? 'VIEW MATCH RESULTS' : 'NEXT ROUND'}
                  </Button>
                </div>
              </div>
            )}

            {/* Optional Phaser 3 Interactive Coordinates Map */}
            {showCoordinatesSandbox && (
              <div className="h-[220px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner animate-in fade-in">
                <PhaserCanvas />
              </div>
            )}
          </div>
        ) : matchFinished ? (
          /* MATCH FINISHED SUMMARY SCREEN */
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            {/* Victory / Defeat Esports Podium Banner */}
            <div className={`p-6 rounded-3xl text-center text-white relative overflow-hidden shadow-xl ${isMatchVictory
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500'
                : 'bg-gradient-to-r from-slate-800 via-slate-900 to-rose-900'
              }`}>
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-lg">
                {isMatchVictory ? (
                  <Trophy className="w-8 h-8 text-amber-300" />
                ) : (
                  <Swords className="w-8 h-8 text-white" />
                )}
              </div>

              <span className="text-xs font-black uppercase tracking-widest text-blue-100 font-tech block">
                Official Competitive Match Result
              </span>

              <h2 className="text-3xl sm:text-4xl font-black font-tech uppercase tracking-wide">
                {isMatchVictory ? 'VICTORY OVER OPPONENT!' : 'DEFEAT — CLOSE SHOWDOWN'}
              </h2>

              <p className="text-sm font-medium text-blue-100 mt-1 max-w-md mx-auto">
                {isMatchVictory
                  ? `You outmatched ${mockOpponent.username} in speed and geographical precision!`
                  : `Well played duel against ${mockOpponent.username}. Keep training your radar.`}
              </p>

              {/* Head to Head Scores */}
              <div className="mt-4 inline-flex items-center space-x-6 bg-black/30 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/20">
                <div className="text-left">
                  <span className="text-[10px] text-white/70 block uppercase font-tech">YOU</span>
                  <span className="text-xl font-black font-tech text-white">{score} PTS</span>
                </div>
                <span className="text-sm font-black font-tech text-amber-400">VS</span>
                <div className="text-right">
                  <span className="text-[10px] text-white/70 block uppercase font-tech">{mockOpponent.username}</span>
                  <span className="text-xl font-black font-tech text-white">{opponentScore} PTS</span>
                </div>
              </div>
            </div>

            {/* Match Performance Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-center">
                <span className="text-[10px] font-black uppercase text-blue-600 font-tech block">Accuracy</span>
                <span className="text-2xl font-black font-tech text-blue-900">
                  {Math.round((roundHistory.filter((r) => r.isCorrect).length / totalRounds) * 100)}%
                </span>
                <span className="text-[10px] text-slate-400 font-bold block">
                  {roundHistory.filter((r) => r.isCorrect).length}/{totalRounds} Correct
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50/80 border border-orange-200 text-center">
                <span className="text-[10px] font-black uppercase text-orange-600 font-tech block">Peak Combo</span>
                <span className="text-2xl font-black font-tech text-orange-900">{streak}x</span>
                <span className="text-[10px] text-slate-400 font-bold block">Consecutive</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center">
                <span className="text-[10px] font-black uppercase text-emerald-600 font-tech block">RP Change</span>
                <span className="text-2xl font-black font-tech text-emerald-900">
                  {isMatchVictory ? '+28 RP' : '-12 RP'}
                </span>
                <span className="text-[10px] text-slate-400 font-bold block">
                  Current: {player.rankPoints + (isMatchVictory ? 28 : -12)} RP
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 text-center">
                <span className="text-[10px] font-black uppercase text-purple-600 font-tech block">Avg Speed</span>
                <span className="text-2xl font-black font-tech text-purple-900">
                  {(roundHistory.reduce((acc, r) => acc + r.timeSpentSec, 0) / Math.max(roundHistory.length, 1)).toFixed(1)}s
                </span>
                <span className="text-[10px] text-slate-400 font-bold block">Per Answer</span>
              </div>
            </div>

            {/* Round-by-Round Question Gallery with Real Photos */}
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200">
              <h3 className="text-sm font-black text-slate-800 font-tech uppercase tracking-wide mb-3 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Round-by-Round Photographic Query Review</span>
              </h3>

              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {roundHistory.map((item) => {
                  const media = getQuestionMedia(item.question.id);
                  return (
                    <div
                      key={item.round}
                      className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {/* Real Image Thumbnail */}
                        {media ? (
                          <img
                            src={media.thumbnailUrl || media.url}
                            alt={item.question.prompt}
                            className="w-12 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase font-tech block">
                            Round {item.round} • {item.question.category}
                          </span>
                          <p className="text-xs font-black text-slate-800 truncate font-tech">
                            {item.question.prompt}
                          </p>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Your answer: <strong className={item.isCorrect ? 'text-emerald-600' : 'text-rose-600'}>{item.selectedOption}</strong>
                            {' '}• Correct: <strong className="text-emerald-700">{item.question.correctCountry}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-xs font-black font-tech px-2 py-0.5 rounded-md ${item.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                          {item.isCorrect ? `+${item.pointsEarned} PTS` : '+0 PTS'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-bold">
                          {item.timeSpentSec}s
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-center space-x-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setMatchFinished(false);
                  setRound(1);
                  setScore(0);
                  setOpponentScore(0);
                  setStreak(0);
                  setSelectedAnswer(null);
                  setTimer(10);
                  setRoundHistory([]);
                }}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Replay Match Sequence
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={onClose}
                className="font-tech uppercase shadow-glow-blue"
              >
                Return to Game Lobby
              </Button>
            </div>
          </div>
        ) : null}

        {/* Footer Bar */}
        <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs font-bold text-slate-400">
          <span className="hidden sm:inline">CountryRush Esports Arena • Authentic Photography Powered</span>
          <button
            onClick={onClose}
            className="text-blue-600 hover:text-blue-700 font-tech font-black uppercase cursor-pointer"
          >
            Leave Match & Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};
