import React, { useState } from 'react';
import { Copy, Check, Users, Settings, Globe, Play, UserPlus } from 'lucide-react';
import type { PlayerProfile, Friend } from '../../types/game';
import { AnimeAvatar } from '../common/AnimeAvatar';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { sounds } from '../../utils/soundEffects';

interface PrivateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerProfile;
  friends: Friend[];
  onStartCustomMatch: () => void;
}

export const PrivateRoomModal: React.FC<PrivateRoomModalProps> = ({
  isOpen,
  onClose,
  player,
  friends,
  onStartCustomMatch,
}) => {
  const [roomCode] = useState('RUSH-7941');
  const [copied, setCopied] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('Global All');
  const [timerSeconds, setTimerSeconds] = useState(10);
  const [roundsCount, setRoundsCount] = useState(8);

  const handleCopyCode = () => {
    sounds.playClick();
    navigator.clipboard?.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regions = ['Global All', 'Europe Only', 'Asia & Pacific', 'Americas', 'Africa'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Private Room Lobby"
      subtitle="Custom match settings & player slots (Simulated Frontend)"
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Room Code Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-white border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-wider font-tech">
              Room Access Code
            </span>
            <div className="text-2xl font-black text-slate-800 font-tech tracking-wider">
              {roomCode}
            </div>
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center space-x-1.5 bg-white hover:bg-blue-50 text-blue-600 px-3.5 py-2 rounded-xl border border-blue-200 shadow-sm text-xs font-bold transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Code!' : 'Copy Code & Link'}</span>
          </button>
        </div>

        {/* Player Slots */}
        <div>
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-black uppercase text-slate-700 font-tech tracking-wider flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Lobby Players (2/8)</span>
            </span>
            <span className="text-[11px] font-bold text-slate-400">Host has match launch controls</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Slot 1: Host (You) */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-blue-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AnimeAvatar seed={player.avatarSeed} size="sm" rankTier={player.rankTier} />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-black text-slate-800 font-tech">
                      {player.username}
                    </span>
                    <span className="text-[9px] bg-blue-600 text-white font-extrabold px-1.5 py-0.2 rounded font-tech">
                      HOST
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {player.rankTier} {player.rankDivision}
                  </span>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-600 font-tech">READY</span>
            </div>

            {/* Slot 2: Invited Friend */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AnimeAvatar seed="sakura_speed" size="sm" rankTier="Diamond" />
                <div>
                  <span className="text-xs font-black text-slate-800 font-tech">
                    SakuraSpeed
                  </span>
                  <div className="text-[10px] text-slate-400 font-bold">
                    Diamond II
                  </div>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-600 font-tech">READY</span>
            </div>

            {/* Slot 3: Empty Invite Slot */}
            <div className="p-3 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center space-x-2 text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-colors cursor-pointer py-4">
              <UserPlus className="w-4 h-4" />
              <span className="text-xs font-bold font-tech">Invite Friend to Slot 3</span>
            </div>

            {/* Slot 4: Empty Invite Slot */}
            <div className="p-3 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center space-x-2 text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-colors cursor-pointer py-4">
              <UserPlus className="w-4 h-4" />
              <span className="text-xs font-bold font-tech">Invite Friend to Slot 4</span>
            </div>
          </div>
        </div>

        {/* Custom Match Rules Settings */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 text-xs font-black uppercase text-slate-700 font-tech">
            <Settings className="w-4 h-4 text-orange-500" />
            <span>Custom Lobby Rules</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Region Pool */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Region Pool</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-400"
              >
                {regions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Question Timer */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Time per Round</label>
              <select
                value={timerSeconds}
                onChange={(e) => setTimerSeconds(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-400"
              >
                <option value={5}>5 Seconds (Hyper Blitz)</option>
                <option value={10}>10 Seconds (Standard)</option>
                <option value={15}>15 Seconds (Relaxed)</option>
              </select>
            </div>

            {/* Rounds Count */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Total Rounds</label>
              <select
                value={roundsCount}
                onChange={(e) => setRoundsCount(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-400"
              >
                <option value={6}>6 Rounds</option>
                <option value={8}>8 Rounds</option>
                <option value={12}>12 Rounds</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              sounds.playClick();
              onStartCustomMatch();
            }}
            icon={<Play className="w-5 h-5 fill-white" />}
            className="shadow-glow-blue"
          >
            START CUSTOM MATCH
          </Button>
        </div>
      </div>
    </Modal>
  );
};
