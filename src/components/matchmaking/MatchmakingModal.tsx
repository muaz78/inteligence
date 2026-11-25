import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Shield,
  X,
  Wifi,
  Sparkles,
  Swords,
  Globe2,
  Bot,
  AlertTriangle,
  RefreshCw,
  LogIn,
  CheckCircle2,
  Users,
} from 'lucide-react';
import type { GameModeInfo, PlayerProfile } from '../../types/game';
import type {
  MatchFoundPayload,
  MatchedParticipantSummary,
  MatchmakingRegion,
  MatchmakingRequest,
  MatchmakingTicket,
} from '../../../shared/types/matchmaking';
import type { ClientMatchState } from '../../../shared/types/match';
import { isBackendConfigured } from '../../config/env';
import { useAuth } from '../../context/AuthContext';
import { apiClient, ApiClientError } from '../../services/apiClient';
import { wsClient, type WsConnectionState } from '../../services/wsClient';
import { AnimeAvatar } from '../common/AnimeAvatar';
import { RankBadge } from '../common/RankBadge';
import { Button } from '../common/Button';
import { sounds } from '../../utils/soundEffects';

interface MatchmakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: GameModeInfo | null;
  player: PlayerProfile;
  onLaunchGamePreview: () => void;
}

type ModalPhase =
  | 'initializing'
  | 'searching'
  | 'matched_lobby'
  | 'error'
  | 'auth_required'
  | 'backend_unavailable';

const REGION_OPTIONS: ReadonlyArray<{ id: MatchmakingRegion; label: string }> = [
  { id: 'global', label: 'Global' },
  { id: 'eu_west', label: 'EU West' },
  { id: 'us_east', label: 'US East' },
  { id: 'ap_northeast', label: 'Asia-Pacific' },
];

function mapGameModeToQueueMode(modeId?: string): MatchmakingRequest['mode'] {
  if (modeId === 'ranked-2v2' || modeId === 'ranked_2v2') return 'ranked_2v2';
  if (modeId === 'quickplay') return 'quickplay';
  return 'ranked_1v1';
}

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({
  isOpen,
  onClose,
  mode,
  player: _player,
  onLaunchGamePreview,
}) => {
  const { isRealAuthenticatedUser, exitOfflinePreview } = useAuth();
  const backendReady = isBackendConfigured();
  const queueMode = mapGameModeToQueueMode(mode?.id);

  const [region, setRegion] = useState<MatchmakingRegion>('global');
  const [phase, setPhase] = useState<ModalPhase>('initializing');
  const [ticket, setTicket] = useState<Omit<MatchmakingTicket, 'authUserId' | 'playerId'> | null>(null);
  const [queueDepthHint, setQueueDepthHint] = useState<number | undefined>(undefined);
  const [matchFound, setMatchFound] = useState<MatchFoundPayload | null>(null);
  const [roomState, setRoomState] = useState<ClientMatchState | null>(null);
  const [wsState, setWsState] = useState<WsConnectionState>('disconnected');
  const [wsPingMs, setWsPingMs] = useState<number | null>(null);
  const [wsErrorNotice, setWsErrorNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [isCancelling, setIsCancelling] = useState(false);

  const ticketRef = useRef<Omit<MatchmakingTicket, 'authUserId' | 'playerId'> | null>(null);
  ticketRef.current = ticket;

  const phaseRef = useRef<ModalPhase>(phase);
  phaseRef.current = phase;

  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const joinLockRef = useRef(false);
  const confettiFiredRef = useRef(false);

  const resetLocalState = useCallback(() => {
    ticketRef.current = null;
    setTicket(null);
    setQueueDepthHint(undefined);
    setMatchFound(null);
    setRoomState(null);
    setWsState('disconnected');
    setWsPingMs(null);
    setWsErrorNotice(null);
    setErrorMessage(null);
    setIsCancelling(false);
    confettiFiredRef.current = false;
  }, []);

  const activateMatchedLobby = useCallback((payload: MatchFoundPayload) => {
    setMatchFound(payload);
    setPhase('matched_lobby');
    setWsErrorNotice(null);
    setWsPingMs(null);

    if (!confettiFiredRef.current) {
      confettiFiredRef.current = true;
      sounds.playMatchFound();
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3478F6', '#FF9F43', '#8B5CF6'],
        });
      } catch {
        // Confetti unavailable safely ignored
      }
    }

    wsClient.connect(payload.matchId, payload.wsJoinTicket);
  }, []);

  const startQueueRequest = useCallback(
    async (targetMode: MatchmakingRequest['mode'], targetRegion: MatchmakingRegion) => {
      if (joinLockRef.current) return;
      joinLockRef.current = true;

      resetLocalState();
      wsClient.disconnect();
      setPhase('initializing');

      try {
        const res = await apiClient.joinMatchmaking({
          mode: targetMode,
          region: targetRegion,
        });
        if (!isOpenRef.current) return;

        sounds.playQueueStart();
        setTicket(res.ticket.ticket);
        setQueueDepthHint(res.ticket.queueDepthHint);

        if (res.ticket.matchFound) {
          activateMatchedLobby(res.ticket.matchFound);
        } else {
          setPhase('searching');
        }
      } catch (err) {
        if (!isOpenRef.current) return;

        // Recover smoothly if player already holds an active queue ticket in another tab/request
        if (err instanceof ApiClientError && err.code === 'CONFLICT') {
          try {
            const activeStatus = await apiClient.getMatchmakingStatus();
            if (!isOpenRef.current) return;
            setTicket(activeStatus.ticket);
            setQueueDepthHint(undefined);
            if (activeStatus.matchFound) {
              activateMatchedLobby(activeStatus.matchFound);
            } else if (
              activeStatus.ticket.status === 'queued' ||
              activeStatus.ticket.status === 'expanding_mmr' ||
              activeStatus.ticket.status === 'ai_fallback_pending'
            ) {
              setRegion(activeStatus.ticket.region);
              setPhase('searching');
              return;
            }
          } catch {
            // Fall through to showing conflict error cleanly
          }
        }

        const msg =
          err instanceof Error
            ? err.message
            : 'Unable to reach matchmaking server. Please try again.';
        setErrorMessage(msg);
        setPhase('error');
      } finally {
        joinLockRef.current = false;
      }
    },
    [activateMatchedLobby, resetLocalState]
  );

  // Initialize queue on modal open (strictly real backend, zero simulated matches)
  useEffect(() => {
    if (!isOpen) {
      wsClient.disconnect();
      resetLocalState();
      return;
    }

    if (!isRealAuthenticatedUser) {
      setPhase('auth_required');
      return;
    }

    if (!backendReady) {
      setPhase('backend_unavailable');
      return;
    }

    void startQueueRequest(queueMode, region);

    return () => {
      // If user unmounts/closes abruptly while actively searching, best-effort cancel
      const activeT = ticketRef.current;
      if (
        activeT &&
        (activeT.status === 'queued' ||
          activeT.status === 'expanding_mmr' ||
          activeT.status === 'ai_fallback_pending')
      ) {
        void apiClient.cancelMatchmaking(activeT.ticketId).catch(() => undefined);
      }
      wsClient.disconnect();
    };
  }, [isOpen, isRealAuthenticatedUser, backendReady, queueMode]);

  // Real wall-clock 1s ticker based on server `ticket.enqueuedAtMs`
  useEffect(() => {
    if (!isOpen || phase !== 'searching') return;
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 500);
    return () => clearInterval(id);
  }, [isOpen, phase]);

  // Real server status polling while queued
  useEffect(() => {
    if (!isOpen || phase !== 'searching' || !ticket?.ticketId) return;

    let stopped = false;
    const pollId = setInterval(() => {
      if (stopped) return;
      void apiClient
        .getMatchmakingStatus(ticket.ticketId)
        .then((statusResp) => {
          if (stopped || !isOpenRef.current) return;
          setTicket(statusResp.ticket);

          if (statusResp.ticket.status === 'match_found' && statusResp.matchFound) {
            activateMatchedLobby(statusResp.matchFound);
            return;
          }

          if (
            statusResp.ticket.status === 'cancelled' ||
            statusResp.ticket.status === 'expired'
          ) {
            setErrorMessage(
              statusResp.ticket.status === 'expired'
                ? 'Matchmaking ticket expired before provisioning completed. Please queue again.'
                : 'Matchmaking ticket was cancelled.'
            );
            setPhase('error');
          }
        })
        .catch((err) => {
          if (stopped || !isOpenRef.current) return;
          if (err instanceof ApiClientError && (err.status === 401 || err.status === 404)) {
            setErrorMessage(err.message);
            setPhase('error');
          }
        });
    }, 1500);

    return () => {
      stopped = true;
      clearInterval(pollId);
    };
  }, [isOpen, phase, ticket?.ticketId, activateMatchedLobby]);

  // WebSocket MatchRoomDO listener for real lobby state & RTT ping
  useEffect(() => {
    if (!isOpen) return;

    const unsubState = wsClient.onStateChange((nextState) => {
      setWsState(nextState);
    });

    const unsubMsg = wsClient.onMessage((msg) => {
      if (msg.type === 'server:pong') {
        const rtt = Math.max(1, Date.now() - msg.clientTimeMs);
        setWsPingMs(rtt);
        return;
      }

      if (msg.type === 'server:state_sync') {
        setRoomState(msg.state);
        return;
      }

      if (msg.type === 'server:participant_status') {
        setRoomState((prev) => {
          if (!prev || prev.matchId !== msg.matchId) return prev;
          return {
            ...prev,
            participants: prev.participants.map((p) =>
              p.participantId === msg.participantId
                ? {
                    ...p,
                    connectionStatus: msg.connectionStatus,
                    hasAnsweredCurrentRound: msg.hasAnsweredCurrentRound,
                  }
                : p
            ),
          };
        });
        return;
      }

      if (msg.type === 'server:error') {
        setWsErrorNotice(msg.message);
      }
    });

    const unsubClose = wsClient.onClose(({ code, reason }) => {
      if (phaseRef.current === 'matched_lobby' && code !== 1000) {
        setWsErrorNotice(reason || `WebSocket closed (code ${code}).`);
      }
    });

    return () => {
      unsubState();
      unsubMsg();
      unsubClose();
    };
  }, [isOpen]);

  const handleRegionSwitch = async (nextRegion: MatchmakingRegion) => {
    if (nextRegion === region || joinLockRef.current || isCancelling) return;
    setRegion(nextRegion);

    if (
      phase === 'searching' &&
      ticket &&
      (ticket.status === 'queued' ||
        ticket.status === 'expanding_mmr' ||
        ticket.status === 'ai_fallback_pending')
    ) {
      setIsCancelling(true);
      try {
        const cancelRes = await apiClient.cancelMatchmaking(ticket.ticketId);
        if (cancelRes.status === 'match_found') {
          const latest = await apiClient.getMatchmakingStatus(ticket.ticketId);
          if (latest.matchFound) {
            setIsCancelling(false);
            activateMatchedLobby(latest.matchFound);
            return;
          }
        }
      } catch {
        // Proceed cleanly to join target region
      } finally {
        setIsCancelling(false);
      }
      void startQueueRequest(queueMode, nextRegion);
    }
  };

  const handleCancel = async () => {
    sounds.playCancel();
    if (
      phase === 'searching' &&
      ticket &&
      (ticket.status === 'queued' ||
        ticket.status === 'expanding_mmr' ||
        ticket.status === 'ai_fallback_pending')
    ) {
      setIsCancelling(true);
      try {
        const cancelRes = await apiClient.cancelMatchmaking(ticket.ticketId);
        if (cancelRes.status === 'match_found') {
          const latest = await apiClient.getMatchmakingStatus(ticket.ticketId);
          if (latest.matchFound) {
            setIsCancelling(false);
            activateMatchedLobby(latest.matchFound);
            return;
          }
        }
      } catch {
        // Best-effort cancel before closing modal
      } finally {
        setIsCancelling(false);
      }
    }

    wsClient.disconnect();
    resetLocalState();
    onClose();
  };

  const handleReconnectLobby = async () => {
    if (!matchFound) return;
    setWsErrorNotice(null);
    try {
      const metadata = await apiClient.getMatchMetadata(matchFound.matchId);
      wsClient.connect(metadata.match.id, metadata.wsJoinTicket);
    } catch (err) {
      setWsErrorNotice(
        err instanceof Error ? err.message : 'Could not obtain a fresh reconnect ticket.'
      );
    }
  };

  if (!isOpen) return null;

  const elapsedSec = ticket
    ? Math.max(0, Math.floor((nowMs - ticket.enqueuedAtMs) / 1000))
    : 0;
  const fallbackRemainingSec = ticket
    ? Math.max(0, Math.ceil((ticket.botFallbackDeadlineMs - nowMs) / 1000))
    : 20;

  // Prefer live synchronized participants from MatchRoomDO when available
  const displayRoster: Array<
    MatchedParticipantSummary & { connectionStatus?: 'connected' | 'reconnecting' | 'disconnected' }
  > = roomState
    ? roomState.participants.map((p) => ({
        participantId: p.participantId,
        participantType: p.participantType,
        teamId: p.teamId,
        username: p.username,
        tag: p.tag,
        avatarSeed: p.avatarSeed,
        countryCode: p.countryCode,
        rankTier: p.rankTier,
        rankDivision: p.rankDivision,
        rankPoints: p.rankPoints,
        isBot: p.participantType === 'bot',
        connectionStatus: p.connectionStatus,
      }))
    : matchFound?.participants ?? [];

  const teamAlpha = displayRoster.filter((p) => p.teamId === 'team_alpha');
  const teamBeta = displayRoster.filter((p) => p.teamId === 'team_beta');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
        onClick={() => void handleCancel()}
      />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-blue-200 overflow-hidden z-10 transition-all duration-300 animate-in fade-in zoom-in-95">
        <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-orange-400" />

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-gradient-to-b from-blue-50/60 to-white">
          <div className="flex items-center space-x-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                phase === 'matched_lobby' && wsState === 'connected'
                  ? 'bg-emerald-500 animate-pulse'
                  : phase === 'searching'
                  ? 'bg-blue-500 animate-ping'
                  : 'bg-amber-500'
              }`}
            />
            <div>
              <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-wider font-tech">
                Authoritative Server Matchmaking
              </span>
              <h3 className="text-xl font-black text-slate-800 font-tech uppercase tracking-wide">
                {mode?.title || (queueMode === 'ranked_2v2' ? 'Ranked 2v2' : queueMode === 'quickplay' ? 'Quick Play' : 'Ranked 1v1')}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {phase === 'matched_lobby' ? (
              <div
                className={`flex items-center space-x-1 text-xs font-bold px-2.5 py-0.5 rounded-lg ${
                  wsState === 'connected'
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-amber-700 bg-amber-50'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>
                  {wsState === 'connected'
                    ? wsPingMs !== null
                      ? `${wsPingMs}ms RTT`
                      : 'WS Connected'
                    : wsState === 'connecting'
                    ? 'Connecting WS...'
                    : 'WS Offline'}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg uppercase">
                <Globe2 className="w-3.5 h-3.5 text-blue-600" />
                <span>{region.replace('_', ' ')}</span>
              </div>
            )}

            <button
              onClick={() => void handleCancel()}
              disabled={isCancelling}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Close matchmaking"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center text-center">
          {phase === 'auth_required' && (
            <div className="w-full max-w-md py-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                <LogIn className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-black text-slate-900 font-tech uppercase">
                Account Sign-In Required
              </h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Real multiplayer matchmaking is authenticated via Supabase and hosted by Cloudflare Durable Objects. Sign in to queue for Ranked 1v1, Ranked 2v2, or Quick Play.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    onClose();
                    exitOfflinePreview();
                  }}
                  className="flex-1 font-tech uppercase"
                >
                  Sign In / Create Account
                </Button>
                <Button variant="outline" size="md" onClick={onClose} className="flex-1">
                  Stay in Preview
                </Button>
              </div>
            </div>
          )}

          {phase === 'backend_unavailable' && (
            <div className="w-full max-w-md py-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-black text-slate-900 font-tech uppercase">
                Backend Matchmaking Not Configured
              </h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Real matchmaking requires <code className="text-blue-700 font-bold">VITE_ENABLE_BACKEND=true</code> and a configured Worker API URL in your frontend environment. Simulated matchmaking has been disabled.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    onClose();
                    onLaunchGamePreview();
                  }}
                  className="flex-1 font-tech uppercase"
                >
                  Open Offline Arena Preview
                </Button>
                <Button variant="outline" size="md" onClick={onClose} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}

          {phase === 'initializing' && (
            <div className="w-full py-10 flex flex-col items-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Globe2 className="w-7 h-7 animate-spin [animation-duration:2s]" />
              </div>
              <p className="text-sm font-black text-slate-800 font-tech uppercase tracking-wide">
                Submitting Server Queue Ticket...
              </p>
              <p className="text-xs text-slate-500">
                Verifying Supabase identity & syncing MMR window in Durable Object storage
              </p>
            </div>
          )}

          {phase === 'error' && (
            <div className="w-full max-w-md py-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-black text-slate-900 font-tech uppercase">
                Matchmaking Interrupted
              </h4>
              <p className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">
                {errorMessage || 'Unable to complete matchmaking request.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  icon={<RefreshCw className="w-4 h-4" />}
                  onClick={() => void startQueueRequest(queueMode, region)}
                  className="flex-1 font-tech uppercase"
                >
                  Retry Matchmaking
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => void handleCancel()}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {phase === 'searching' && ticket && (
            <div className="w-full flex flex-col items-center py-2">
              {/* Region selector pills */}
              <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                {REGION_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isCancelling}
                    onClick={() => void handleRegionSwitch(opt.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                      region === opt.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Animated Sonar Radar */}
              <div className="relative w-40 h-40 flex items-center justify-center my-2">
                <div className="absolute inset-0 rounded-full border border-blue-400/40 animate-sonar" />
                <div className="absolute inset-4 rounded-full border border-blue-300/30 animate-sonar [animation-delay:0.8s]" />
                <div className="absolute inset-8 rounded-full border border-indigo-200/30 animate-sonar [animation-delay:1.6s]" />
                <div className="absolute inset-0 rounded-full border-2 border-blue-100 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-tr from-blue-500/10 via-transparent to-transparent animate-radar-spin origin-center" />
                </div>
                <div className="relative z-10 w-18 h-18 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/40 p-4">
                  <Globe2 className="w-9 h-9 animate-spin [animation-duration:15s]" />
                </div>
              </div>

              {/* Real Server Timer & Queue Window */}
              <div className="mt-2 space-y-1">
                <span className="text-3xl font-black text-slate-800 font-tech tracking-wider">
                  {formatTimer(elapsedSec)}
                </span>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest font-tech">
                  {ticket.status === 'ai_fallback_pending'
                    ? '20s Limit Reached • Provisioning AI Fallback Lobby...'
                    : ticket.status === 'expanding_mmr'
                    ? `Expanding MMR Window (±${ticket.mmrToleranceRange} MMR)...`
                    : `Searching Strict MMR Window (±${ticket.mmrToleranceRange} MMR)...`}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Ticket #{ticket.ticketId.slice(0, 8)} •{' '}
                  {fallbackRemainingSec > 0
                    ? `AI fallback in ${fallbackRemainingSec}s`
                    : 'AI fallback active'}
                  {queueDepthHint !== undefined ? ` • Active in bucket: ${queueDepthHint}` : ''}
                </p>
              </div>

              {/* Server-Resolved Player Card */}
              <div className="mt-5 w-full max-w-md p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AnimeAvatar seed={ticket.avatarSeed} size="sm" rankTier={ticket.rankTier} />
                  <div className="text-left">
                    <span className="text-xs font-black text-slate-800 font-tech">
                      {ticket.username}{' '}
                      <span className="text-slate-400 font-bold">#{ticket.tag}</span>
                    </span>
                    <div className="text-[10px] text-slate-500 font-bold">
                      {ticket.rankTier} {ticket.rankDivision ?? ''} • {ticket.rankPoints} RP •{' '}
                      {ticket.mmr} MMR
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 text-xs font-black text-blue-600 bg-blue-100/70 px-2.5 py-1 rounded-xl font-tech">
                  <Shield className="w-3.5 h-3.5" />
                  <span>IN QUEUE</span>
                </div>
              </div>

              {/* Real Adaptive Window Milestones */}
              <div className="mt-3 w-full max-w-md p-3 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white rounded-2xl border border-blue-100 text-left">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[10px] font-black uppercase text-blue-700 font-tech tracking-wider">
                      Server Queue Progression
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">
                    {queueMode === 'ranked_2v2' ? '2v2 Team Balance' : 'Head-to-Head'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 flex items-center justify-between">
                  <span>0–10s: ±120 MMR</span>
                  <span>10–20s: ±300 MMR</span>
                  <span className="font-bold text-orange-600">20s: AI Fill</span>
                </div>
              </div>

              <div className="mt-5 w-full max-w-md">
                <Button
                  variant="outline"
                  size="md"
                  disabled={isCancelling}
                  onClick={() => void handleCancel()}
                  className="w-full text-slate-600 hover:text-rose-600 hover:border-rose-200"
                >
                  {isCancelling ? 'Cancelling Ticket...' : 'Cancel Matchmaking'}
                </Button>
              </div>
            </div>
          )}

          {phase === 'matched_lobby' && matchFound && (
            <div className="w-full flex flex-col items-center py-1 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Top Confirmation Pill */}
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-1.5 rounded-full shadow-lg shadow-blue-500/30 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span className="text-sm font-black uppercase font-tech tracking-wider">
                  MATCH PROVISIONED • LOBBY SYNCED
                </span>
              </div>

              {/* Rated vs AI-Fallback Notice */}
              <div
                className={`mb-4 inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl text-[11px] font-bold border ${
                  matchFound.includesBotOpponent || !matchFound.isRated
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}
              >
                {matchFound.includesBotOpponent ? (
                  <>
                    <Bot className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      AI Fallback Active • Unrated Practice Lobby (No RP/MMR Change)
                    </span>
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      {matchFound.isRated ? 'Rated Competitive Match' : 'Unranked Quick Play'} •{' '}
                      {matchFound.rankAnchor}
                    </span>
                  </>
                )}
              </div>

              {/* Team Roster Cards (Supports 1v1 & 2v2 cleanly) */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-11 gap-3 items-stretch mb-4">
                {/* Team Alpha */}
                <div className="sm:col-span-5 p-3.5 rounded-3xl bg-blue-50/70 border border-blue-200 space-y-2.5 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-blue-700 font-tech tracking-wider flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>Team Alpha</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {teamAlpha.length} Slot{teamAlpha.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {teamAlpha.map((p) => (
                    <div
                      key={p.participantId}
                      className={`p-2.5 rounded-2xl bg-white border flex items-center space-x-2.5 ${
                        p.participantId === matchFound.myParticipantId
                          ? 'border-blue-400 ring-1 ring-blue-200'
                          : 'border-blue-100'
                      }`}
                    >
                      <AnimeAvatar seed={p.avatarSeed} size="sm" rankTier={p.rankTier} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-black text-slate-800 font-tech truncate">
                            {p.username}
                          </span>
                          {p.participantId === matchFound.myParticipantId && (
                            <span className="text-[9px] font-black uppercase bg-blue-600 text-white px-1.5 py-0.5 rounded-md">
                              YOU
                            </span>
                          )}
                          {p.isBot && (
                            <span className="text-[9px] font-black uppercase bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-md">
                              AI BOT
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <RankBadge tier={p.rankTier} division={p.rankDivision} size="xs" />
                          <span className="text-[10px] font-bold text-slate-500">
                            {p.rankPoints} RP •{' '}
                            {p.isBot
                              ? 'AI Ready'
                              : p.connectionStatus === 'connected'
                              ? 'Synced'
                              : 'Joining...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* VS Divider */}
                <div className="sm:col-span-1 flex items-center justify-center py-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-black font-tech text-sm shadow-md shadow-orange-500/40">
                    VS
                  </div>
                </div>

                {/* Team Beta */}
                <div className="sm:col-span-5 p-3.5 rounded-3xl bg-orange-50/70 border border-orange-200 space-y-2.5 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-orange-700 font-tech tracking-wider flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>Team Beta</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {teamBeta.length} Slot{teamBeta.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {teamBeta.map((p) => (
                    <div
                      key={p.participantId}
                      className={`p-2.5 rounded-2xl bg-white border flex items-center space-x-2.5 ${
                        p.participantId === matchFound.myParticipantId
                          ? 'border-blue-400 ring-1 ring-blue-200'
                          : 'border-orange-100'
                      }`}
                    >
                      <AnimeAvatar seed={p.avatarSeed} size="sm" rankTier={p.rankTier} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-black text-slate-800 font-tech truncate">
                            {p.username}
                          </span>
                          {p.participantId === matchFound.myParticipantId && (
                            <span className="text-[9px] font-black uppercase bg-blue-600 text-white px-1.5 py-0.5 rounded-md">
                              YOU
                            </span>
                          )}
                          {p.isBot && (
                            <span className="text-[9px] font-black uppercase bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-md">
                              AI BOT
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <RankBadge tier={p.rankTier} division={p.rankDivision} size="xs" />
                          <span className="text-[10px] font-bold text-slate-500">
                            {p.rankPoints} RP •{' '}
                            {p.isBot
                              ? 'AI Ready'
                              : p.connectionStatus === 'connected'
                              ? 'Synced'
                              : 'Joining...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MatchRoomDO Connection & Metadata Strip */}
              <div className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2 mb-4">
                <span>
                  Match ID: <strong className="font-mono text-slate-800">{matchFound.matchId.slice(0, 8)}...</strong>
                </span>
                <span>
                  Phase: <strong className="text-blue-700 uppercase font-tech">{roomState?.phase || 'lobby_sync'}</strong>
                </span>
                <span>
                  State v{roomState?.version ?? 1} • {roomState?.totalRounds ?? (queueMode === 'ranked_2v2' ? 10 : queueMode === 'quickplay' ? 6 : 8)} Rounds Configured
                </span>
              </div>

              {wsErrorNotice && (
                <div className="w-full mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-semibold flex items-center justify-between gap-2">
                  <span>{wsErrorNotice}</span>
                  {wsState === 'disconnected' && (
                    <button
                      type="button"
                      onClick={() => void handleReconnectLobby()}
                      className="text-blue-700 font-black uppercase text-[11px] hover:underline cursor-pointer"
                    >
                      Reconnect
                    </button>
                  )}
                </div>
              )}

              <p className="text-[11px] text-slate-500 font-medium mb-4">
                Authenticated WebSocket MatchRoom lobby synchronized. Live 10-round server gameplay activates in Phase 6.
              </p>

              {/* Actions */}
              <div className="w-full space-y-2.5">
                {wsState !== 'connected' ? (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => void handleReconnectLobby()}
                    icon={<RefreshCw className="w-5 h-5" />}
                    className="w-full shadow-glow-blue"
                  >
                    RECONNECT TO MATCH ROOM LOBBY
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => {
                      sounds.playClick();
                      onLaunchGamePreview();
                    }}
                    icon={<Swords className="w-5 h-5" />}
                    className="w-full shadow-glow-blue"
                  >
                    OPEN ARENA UI PREVIEW (PHASER 3 SHELL)
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleCancel()}
                  className="w-full text-slate-500"
                >
                  Leave Match Lobby
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
