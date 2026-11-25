import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { validateUsername } from '../../../shared/validation/profileValidation';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AvatarSelector } from './AvatarSelector';
import { sounds } from '../../utils/soundEffects';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (msg: string) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { activePlayer, isRealAuthenticatedUser, updateProfile } = useAuth();

  const [username, setUsername] = useState(activePlayer.username);
  const [avatarSeed, setAvatarSeed] = useState(activePlayer.avatarSeed);
  const [favoriteContinent, setFavoriteContinent] = useState(activePlayer.favoriteContinent);
  const [countryCode, setCountryCode] = useState(activePlayer.countryCode || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameFeedback, setUsernameFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUsername(activePlayer.username);
      setAvatarSeed(activePlayer.avatarSeed);
      setFavoriteContinent(activePlayer.favoriteContinent);
      setCountryCode(activePlayer.countryCode || '');
      setError(null);
      setUsernameFeedback(null);
    }
  }, [isOpen, activePlayer]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setError(null);
    setUsernameFeedback(null);

    if (!isRealAuthenticatedUser) {
      setError('Sign in with a real Supabase account to save permanent profile changes.');
      return;
    }

    const userCheck = validateUsername(username);
    if (!userCheck.valid || !userCheck.normalized) {
      setError(userCheck.error || 'Invalid username.');
      return;
    }

    setSaving(true);
    try {
      // Check uniqueness only if username changed
      if (userCheck.normalized.toLowerCase() !== activePlayer.username.toLowerCase()) {
        const avail = await profileService.checkUsernameAvailable(userCheck.normalized);
        if (!avail.available) {
          setError(avail.reason || 'That username is already taken.');
          setSaving(false);
          return;
        }
      }

      await updateProfile({
        username: userCheck.normalized,
        avatarSeed,
        favoriteContinent,
        countryCode: countryCode.trim().toUpperCase(),
      });

      onSaved?.('Profile updated and synced with Supabase!');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customize Competitor Profile"
      subtitle="Permitted fields sync securely via PostgreSQL RLS"
      maxWidth="xl"
    >
      <form onSubmit={handleSave} className="space-y-5">
        {/* Read-Only Protected Competitive Summary */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-600 font-bold">
            <Lock className="w-4 h-4 text-blue-600" />
            <span>
              Public Player ID: <strong className="font-mono text-blue-700">{activePlayer.publicPlayerId}</strong>
            </span>
          </div>
          <span className="text-[11px] font-black font-tech uppercase text-slate-500">
            {activePlayer.rankTier} {activePlayer.rankDivision} • {activePlayer.rankPoints} RP (Protected)
          </span>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center space-x-2 text-xs font-bold text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-black uppercase text-slate-600 font-tech tracking-wider block mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                const c = validateUsername(e.target.value);
                setUsernameFeedback(c.valid ? 'Format valid' : c.error || null);
              }}
              maxLength={20}
              disabled={saving}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
            />
            {usernameFeedback && (
              <span className="text-[10px] font-semibold text-slate-500 mt-1 block">
                {usernameFeedback}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-black uppercase text-slate-600 font-tech tracking-wider block mb-1">
                Country Code (ISO)
              </label>
              <input
                type="text"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                placeholder="e.g. JP"
                maxLength={2}
                disabled={saving}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 uppercase focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-black uppercase text-slate-600 font-tech tracking-wider block mb-1">
                Region Focus
              </label>
              <select
                value={favoriteContinent}
                onChange={(e) => setFavoriteContinent(e.target.value)}
                disabled={saving}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="Global">Global</option>
                <option value="Europe">Europe</option>
                <option value="East Asia">East Asia</option>
                <option value="Americas">Americas</option>
                <option value="Africa">Africa</option>
                <option value="Oceania">Oceania</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-black uppercase text-slate-600 font-tech tracking-wider flex items-center space-x-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Select Anime Avatar</span>
          </label>
          <AvatarSelector selectedAvatarId={avatarSeed} onSelect={setAvatarSeed} compact />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={saving}
            icon={<CheckCircle2 className="w-4 h-4" />}
            className="font-tech uppercase"
          >
            {saving ? 'SAVING...' : 'SAVE CHANGES'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
