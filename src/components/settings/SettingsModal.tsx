import React, { useState } from 'react';
import { Volume2, Monitor, Gamepad, User, Check, ShieldCheck, LogOut, LogIn, Pencil } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { sounds } from '../../utils/soundEffects';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEditProfile?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenEditProfile,
}) => {
  const { activePlayer, session, isRealAuthenticatedUser, signOut, exitOfflinePreview } = useAuth();
  const [activeTab, setActiveTab] = useState<'audio' | 'graphics' | 'gameplay' | 'account'>('audio');
  
  // Settings state
  const [volume, setVolume] = useState(sounds.getVolume() * 100);
  const [sfxMuted, setSfxMuted] = useState(sounds.getMuted());
  const [fps, setFps] = useState<'60' | '120'>('120');
  const [animeEffects, setAnimeEffects] = useState(true);
  const [screenShake, setScreenShake] = useState(true);
  const [region, setRegion] = useState('auto');
  const [saved, setSaved] = useState(false);

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    sounds.setVolume(v / 100);
  };

  const handleSave = () => {
    sounds.playClick();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Game Settings"
      subtitle="Customize audiovisuals, controls, and performance preferences"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Settings Navigation Tabs */}
        <div className="flex space-x-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => { sounds.playHover(); setActiveTab('audio'); }}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-black uppercase font-tech transition-all cursor-pointer ${
              activeTab === 'audio' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Audio</span>
          </button>
          <button
            onClick={() => { sounds.playHover(); setActiveTab('graphics'); }}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-black uppercase font-tech transition-all cursor-pointer ${
              activeTab === 'graphics' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Graphics</span>
          </button>
          <button
            onClick={() => { sounds.playHover(); setActiveTab('gameplay'); }}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-black uppercase font-tech transition-all cursor-pointer ${
              activeTab === 'gameplay' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Gamepad className="w-4 h-4" />
            <span>Gameplay</span>
          </button>
          <button
            onClick={() => { sounds.playHover(); setActiveTab('account'); }}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-black uppercase font-tech transition-all cursor-pointer ${
              activeTab === 'account' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Account</span>
          </button>
        </div>

        {/* Tab 1: Audio */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
                <span>Master Sound Effects Volume</span>
                <span className="text-blue-600 font-tech font-black text-sm">{Math.round(volume)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <h5 className="text-xs font-bold text-slate-800">Mute All Audio Effects</h5>
                <p className="text-[11px] text-slate-400">Silences UI clicks, radar cues, and match found chimes</p>
              </div>
              <input
                type="checkbox"
                checked={sfxMuted}
                onChange={(e) => {
                  const m = e.target.checked;
                  setSfxMuted(m);
                  sounds.setMuted(m);
                }}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <h5 className="text-xs font-bold text-slate-800">Match Found Victory Fanfare</h5>
                <p className="text-[11px] text-slate-400">Play triumphant audio jingle upon finding a worthy opponent</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Graphics */}
        {activeTab === 'graphics' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <h5 className="text-xs font-bold text-slate-800">Target Frame Rate</h5>
                <p className="text-[11px] text-slate-400">Locks Phaser 3 engine animation step frequency</p>
              </div>
              <div className="flex space-x-1.5">
                <button
                  onClick={() => setFps('60')}
                  className={`px-3 py-1 rounded-xl text-xs font-black font-tech cursor-pointer ${
                    fps === '60' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  60 FPS
                </button>
                <button
                  onClick={() => setFps('120')}
                  className={`px-3 py-1 rounded-xl text-xs font-black font-tech cursor-pointer ${
                    fps === '120' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  120 FPS Ultra
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <h5 className="text-xs font-bold text-slate-800">Anime Esports Visual Effects</h5>
                <p className="text-[11px] text-slate-400">Subtle floating mascot HUD, glowing rank auras, and sonar radar</p>
              </div>
              <input
                type="checkbox"
                checked={animeEffects}
                onChange={(e) => setAnimeEffects(e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <h5 className="text-xs font-bold text-slate-800">Combo Screen Shake</h5>
                <p className="text-[11px] text-slate-400">Micro-pulse on rapid correct geography streaks</p>
              </div>
              <input
                type="checkbox"
                checked={screenShake}
                onChange={(e) => setScreenShake(e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Gameplay */}
        {activeTab === 'gameplay' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <h5 className="text-xs font-bold text-slate-800">Matchmaking Region</h5>
                <p className="text-[11px] text-slate-400">Select preferred low-latency edge node</p>
              </div>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-400"
              >
                <option value="auto">Auto Lowest Ping (Tokyo 24ms)</option>
                <option value="ap-east">Asia East (Tokyo)</option>
                <option value="eu-west">Europe West (Frankfurt)</option>
                <option value="us-east">US East (Virginia)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <h5 className="text-xs font-bold text-slate-800">Instant Answer Submit</h5>
                <p className="text-[11px] text-slate-400">Lock in selection immediately on click without double confirm</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Tab 4: Account */}
        {activeTab === 'account' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider font-tech">
                  Account & Identity Status
                </span>
                {isRealAuthenticatedUser ? (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase font-tech text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Supabase Authenticated</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase font-tech text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Offline Preview Mode
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Public Player ID</span>
                <span className="font-mono text-blue-600">{activePlayer.publicPlayerId}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Username</span>
                <span className="font-tech text-slate-900">{activePlayer.username}</span>
              </div>
              {session?.email && (
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Email</span>
                  <span className="text-slate-600">{session.email}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Protected Rating</span>
                <span className="text-blue-700 font-tech">
                  {activePlayer.rankTier} {activePlayer.rankDivision} • {activePlayer.rankPoints} RP / {activePlayer.mmr} MMR
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {onOpenEditProfile && isRealAuthenticatedUser && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenEditProfile();
                  }}
                  icon={<Pencil className="w-3.5 h-3.5" />}
                  className="font-tech uppercase"
                >
                  Edit Username & Avatar
                </Button>
              )}

              {isRealAuthenticatedUser ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onClose();
                    void signOut();
                  }}
                  icon={<LogOut className="w-3.5 h-3.5 text-rose-500" />}
                  className="text-rose-600 hover:bg-rose-50 font-tech uppercase"
                >
                  Sign Out
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    exitOfflinePreview();
                  }}
                  icon={<LogIn className="w-3.5 h-3.5" />}
                  className="font-tech uppercase"
                >
                  Sign In / Register Account
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            icon={saved ? <Check className="w-4 h-4 text-emerald-300" /> : undefined}
          >
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
