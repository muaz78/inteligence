import React, { useState, useEffect } from 'react';
import { UserCheck, ShieldCheck, Globe2, AlertCircle, Sparkles, LogOut } from 'lucide-react';
import { validateUsername } from '../../../shared/validation/profileValidation';
import { DEFAULT_AVATAR_ID } from '../../../shared/constants/avatars';
import { INITIAL_PLAYER_PROFILE_CONFIG } from '../../../shared/constants/profileDefaults';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { AvatarSelector } from '../profile/AvatarSelector';
import { RankBadge } from '../common/RankBadge';
import { Button } from '../common/Button';
import { sounds } from '../../utils/soundEffects';

export const ProfileSetupScreen: React.FC = () => {
  const { profile, completeProfileSetup, signOut } = useAuth();

  const [username, setUsername] = useState('');
  const [avatarSeed, setAvatarSeed] = useState<string>(profile?.avatarSeed || DEFAULT_AVATAR_ID);
  const [favoriteContinent, setFavoriteContinent] = useState('Global');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed) {
      setAvailability({ checking: false });
      return;
    }

    const format = validateUsername(trimmed);
    if (!format.valid) {
      setAvailability({ checking: false, available: false, message: format.error });
      return;
    }

    setAvailability({ checking: true, message: 'Checking availability...' });
    const timer = setTimeout(async () => {
      try {
        const res = await profileService.checkUsernameAvailable(trimmed);
        setAvailability({
          checking: false,
          available: res.available,
          message: res.available ? 'Username available!' : res.reason || 'Already taken.',
        });
      } catch {
        setAvailability({ checking: false });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setError(null);

    const check = validateUsername(username);
    if (!check.valid || !check.normalized) {
      setError(check.error || 'Please choose a valid username.');
      return;
    }

    setSubmitting(true);
    try {
      await completeProfileSetup({
        username: check.normalized,
        avatarSeed,
        favoriteContinent,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile setup.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-esports-grid bg-[#F4F7FC] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-blue-200 shadow-2xl overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-orange-400" />

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-[11px] font-black uppercase font-tech text-blue-700 mb-2">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Competitor Onboarding</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-tech uppercase tracking-wide">
                Finalize Your CountryRush Identity
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Choose your permanent unique username and starter anime esports avatar.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void signOut()}
              className="text-xs font-bold text-slate-400 hover:text-rose-600 flex items-center space-x-1 cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Assigned Public Player ID + Server-Initialized Rank Info */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <RankBadge
                tier={profile?.rankTier || INITIAL_PLAYER_PROFILE_CONFIG.initialRankTier}
                division={profile?.rankDivision || INITIAL_PLAYER_PROFILE_CONFIG.initialRankDivision}
                size="md"
              />
              <div>
                <span className="text-[10px] font-black uppercase text-blue-700 font-tech tracking-wider block">
                  Server-Provisioned Starting Tier
                </span>
                <span className="text-sm font-black text-slate-900 font-tech uppercase">
                  {profile?.rankTier || INITIAL_PLAYER_PROFILE_CONFIG.initialRankTier}{' '}
                  {profile?.rankDivision || INITIAL_PLAYER_PROFILE_CONFIG.initialRankDivision} •{' '}
                  {profile?.rankPoints ?? INITIAL_PLAYER_PROFILE_CONFIG.initialRankPoints} RP
                </span>
                <span className="text-[11px] text-slate-500 font-semibold block">
                  Calibration MMR: {profile?.mmr ?? INITIAL_PLAYER_PROFILE_CONFIG.initialMMR} (Protected)
                </span>
              </div>
            </div>

            {profile?.publicPlayerId && (
              <div className="bg-white border border-blue-200 px-3.5 py-2 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-tech block">
                  Public Player ID
                </span>
                <span className="text-sm font-black font-mono text-blue-700">
                  {profile.publicPlayerId}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center space-x-2 text-xs font-bold text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase text-slate-700 font-tech tracking-wider">
                  Unique Username
                </label>
                {availability.message && (
                  <span
                    className={`text-[11px] font-bold ${
                      availability.checking
                        ? 'text-blue-600'
                        : availability.available
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                    }`}
                  >
                    {availability.message}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose username (3-20 characters)"
                maxLength={20}
                disabled={submitting}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase text-slate-700 font-tech tracking-wider flex items-center space-x-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>Choose Anime Esports Avatar</span>
              </label>
              <AvatarSelector selectedAvatarId={avatarSeed} onSelect={setAvatarSeed} />
            </div>

            <div>
              <label className="text-xs font-black uppercase text-slate-700 font-tech tracking-wider flex items-center space-x-1.5 mb-1.5">
                <Globe2 className="w-4 h-4 text-blue-600" />
                <span>Preferred Region Focus</span>
              </label>
              <select
                value={favoriteContinent}
                onChange={(e) => setFavoriteContinent(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="Global">Global Mix</option>
                <option value="Europe">Europe</option>
                <option value="East Asia">East Asia</option>
                <option value="Americas">Americas</option>
                <option value="Africa">Africa</option>
                <option value="Oceania">Oceania</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Synced securely via Supabase RLS</span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={submitting || availability.available === false}
                className="font-tech uppercase shadow-glow-blue"
              >
                {submitting ? 'SAVING PROFILE...' : 'SAVE & ENTER LOBBY'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
