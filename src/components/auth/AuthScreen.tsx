import React, { useState, useEffect } from 'react';
import {
  Globe2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Compass,
  Trophy,
  Wrench,
} from 'lucide-react';
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from '../../../shared/validation/profileValidation';
import { DEFAULT_AVATAR_ID } from '../../../shared/constants/avatars';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { AnimeMascot } from '../hero/AnimeMascot';
import { AvatarSelector } from '../profile/AvatarSelector';
import { Button } from '../common/Button';
import { sounds } from '../../utils/soundEffects';

export const AuthScreen: React.FC = () => {
  const {
    supabaseConfigured,
    errorMessage: contextError,
    signIn,
    signUp,
    enterOfflinePreview,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [avatarSeed, setAvatarSeed] = useState<string>(DEFAULT_AVATAR_ID);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [verificationSentTo, setVerificationSentTo] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  // Clear local error when switching mode
  const handleSwitchMode = (nextMode: 'login' | 'register') => {
    sounds.playHover();
    setMode(nextMode);
    setFormError(null);
    setVerificationSentTo(null);
  };

  // Debounced live username format + availability check during registration
  useEffect(() => {
    if (mode !== 'register' || !supabaseConfigured) return;

    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameStatus({ checking: false });
      return;
    }

    const formatCheck = validateUsername(trimmed);
    if (!formatCheck.valid) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: formatCheck.error,
      });
      return;
    }

    setUsernameStatus({ checking: true, message: 'Checking availability...' });
    const timer = setTimeout(async () => {
      try {
        const res = await profileService.checkUsernameAvailable(trimmed);
        setUsernameStatus({
          checking: false,
          available: res.available,
          message: res.available ? 'Username available!' : res.reason || 'Username already taken.',
        });
      } catch {
        setUsernameStatus({ checking: false });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username, mode, supabaseConfigured]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setFormError(null);
    setVerificationSentTo(null);

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setFormError(emailCheck.error || 'Please enter a valid email.');
      return;
    }

    if (mode === 'login') {
      if (!password) {
        setFormError('Please enter your password.');
        return;
      }

      setSubmitting(true);
      try {
        await signIn(email, password);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Unable to sign in.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Registration validation
    const usernameCheck = validateUsername(username);
    if (!usernameCheck.valid) {
      setFormError(usernameCheck.error || 'Please choose a valid username.');
      return;
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      setFormError(passwordCheck.error || 'Please enter a stronger password.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await signUp({
        email,
        password,
        username,
        avatarSeed,
      });

      if (result.emailVerificationRequired) {
        setVerificationSentTo(emailCheck.normalized || email);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create your account.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = formError || contextError;

  return (
    <div className="min-h-screen w-full bg-esports-grid bg-[#F4F7FC] text-[#20283A] flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden">
      {/* Subtle Light Esports Radial Accents */}
      <div className="fixed top-0 right-0 w-[520px] h-[520px] bg-blue-400/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[440px] h-[440px] bg-orange-400/10 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none" />

      <div className="max-w-6xl w-full mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Showcase Column: CountryRush Esports Identity */}
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center space-x-2.5 bg-white/95 border border-blue-200 px-3.5 py-1.5 rounded-full shadow-sm">
            <Globe2 className="w-4 h-4 text-blue-600 animate-spin [animation-duration:18s]" />
            <span className="text-xs font-black uppercase text-blue-700 font-tech tracking-wider">
              Season 1 • Continental Clash
            </span>
            <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              Competitive Geo
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-tech uppercase tracking-tight text-slate-900 leading-none">
              COUNTRY<span className="text-blue-600">RUSH</span>
            </h1>
            <p className="text-lg sm:text-xl font-bold text-slate-600">
              Guess the country. <span className="text-blue-600 font-black">Beat everyone.</span>
            </p>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed">
              Sign in or register your Cartographer profile to unlock your persistent Public Player ID,
              custom anime esports avatar, and Bronze-to-Elite competitive progression.
            </p>
          </div>

          {/* Starter Competitive Guarantees Pills */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto lg:mx-0">
            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-left">
              <ShieldCheck className="w-4 h-4 text-blue-600 mb-1" />
              <span className="text-[11px] font-black text-slate-800 font-tech block uppercase">
                Verified Profile
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                Unique CR Player ID
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-left">
              <Trophy className="w-4 h-4 text-orange-500 mb-1" />
              <span className="text-[11px] font-black text-slate-800 font-tech block uppercase">
                Bronze III Start
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                0 RP • 400 MMR
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-left">
              <Compass className="w-4 h-4 text-emerald-600 mb-1" />
              <span className="text-[11px] font-black text-slate-800 font-tech block uppercase">
                Server Protected
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                RLS Anti-Tamper
              </span>
            </div>
          </div>

          <div className="hidden lg:flex justify-center lg:justify-start pt-2">
            <AnimeMascot className="scale-90 origin-left" />
          </div>
        </div>

        {/* Right Column: Login / Register Esports Card */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-3xl border border-blue-200/90 shadow-2xl overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-orange-400" />

            <div className="p-6 sm:p-8 space-y-6">
              {/* Configuration Missing Warning Banner (Strict Rule 13) */}
              {!supabaseConfigured && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-2">
                  <div className="flex items-center space-x-2 text-amber-800">
                    <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-black uppercase font-tech tracking-wider">
                      Supabase Authentication Setup Required
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/90 font-medium leading-relaxed">
                    Add <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[11px]">VITE_SUPABASE_URL</code> and{' '}
                    <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[11px]">VITE_SUPABASE_PUBLISHABLE_KEY</code> (or{' '}
                    <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[11px]">VITE_SUPABASE_ANON_KEY</code>) to{' '}
                    <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[11px]">.env.local</code> and execute the Phase 2 SQL migrations to activate real accounts.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      enterOfflinePreview();
                    }}
                    className="mt-1 inline-flex items-center space-x-1.5 text-xs font-black font-tech uppercase bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <span>Enter Offline Frontend Preview</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Navigation Tabs: Sign In vs Create Account */}
              <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase font-tech tracking-wider transition-all cursor-pointer ${mode === 'login'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  Player Login
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('register')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase font-tech tracking-wider transition-all cursor-pointer ${mode === 'register'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  Create Account
                </button>
              </div>

              {/* Email Verification Notice */}
              {verificationSentTo && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start space-x-3 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <h4 className="font-black text-emerald-900 font-tech uppercase">
                      Verification Email Sent!
                    </h4>
                    <p className="text-emerald-800 font-medium mt-0.5">
                      We sent a confirmation link to <strong>{verificationSentTo}</strong>. Verify your email, then return here to log in.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {displayError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-xs text-rose-700 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="font-bold">{displayError}</span>
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 font-tech tracking-wider block mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="player@countryrush.gg"
                      autoComplete="email"
                      disabled={!supabaseConfigured || submitting}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Username (Register Mode) */}
                {mode === 'register' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-black uppercase text-slate-600 font-tech tracking-wider">
                        Competitive Username
                      </label>
                      {usernameStatus.message && (
                        <span
                          className={`text-[10px] font-bold ${usernameStatus.checking
                              ? 'text-blue-600'
                              : usernameStatus.available
                                ? 'text-emerald-600'
                                : 'text-rose-600'
                            }`}
                        >
                          {usernameStatus.message}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. Aoi_Valkyrie"
                        maxLength={20}
                        autoComplete="username"
                        disabled={!supabaseConfigured || submitting}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors disabled:opacity-60"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium block mt-1">
                      3–20 characters. Letters, numbers, and single underscores only.
                    </span>
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 font-tech tracking-wider block mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'register' ? 'Min 8 characters (letters + numbers)' : 'Enter your password'}
                      autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                      disabled={!supabaseConfigured || submitting}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-11 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Anime Esports Avatar Picker (Register Mode) */}
                {mode === 'register' && (
                  <div className="pt-1">
                    <label className="text-[11px] font-black uppercase text-slate-600 font-tech tracking-wider flex items-center space-x-1.5 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                      <span>Select Starter Avatar</span>
                    </label>
                    <AvatarSelector
                      selectedAvatarId={avatarSeed}
                      onSelect={setAvatarSeed}
                      compact
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={!supabaseConfigured || submitting}
                  className="w-full font-tech uppercase shadow-glow-blue mt-2"
                >
                  {submitting
                    ? mode === 'login'
                      ? 'AUTHENTICATING...'
                      : 'CREATING PROFILE...'
                    : mode === 'login'
                      ? 'ENTER GAME LOBBY'
                      : 'CREATE COMPETITOR ACCOUNT'}
                </Button>
              </form>

              {/* Footer Switch / Preview Link */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-medium">
                <span>
                  {mode === 'login' ? 'New to CountryRush? ' : 'Already registered? '}
                  <button
                    type="button"
                    onClick={() => handleSwitchMode(mode === 'login' ? 'register' : 'login')}
                    className="text-blue-600 hover:text-blue-700 font-black font-tech uppercase cursor-pointer"
                  >
                    {mode === 'login' ? 'Create Account' : 'Sign In'}
                  </button>
                </span>

                {supabaseConfigured && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      enterOfflinePreview();
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
                  >
                    Continue in Offline Preview
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
