// Cloudflare Durable Object — Authoritative Match Room Instance (Phases 3, 4 & 5 Active)
// Holds persisted AuthoritativeMatchState in `this.state.storage`, validates single-use HMAC
// WebSocket join tickets, enforces match participant membership, prevents duplicate sockets
// on reconnect, and synchronizes sanitized ClientMatchState + participant presence in lobby.
// Note: Full 10-round gameplay loop (`client:submit_answer`, timers, RP updates) activates in Phase 6.

import type { DurableObjectState, DurableObjectWebSocket } from '../types/cloudflare';
import type { WorkerEnv } from '../config/env';
import type { AuthoritativeMatchState } from '../../../shared/types/match';
import type { ServerToClientMessage } from '../../../shared/protocol/websocket';
import { WS_CLOSE_CODES } from '../../../shared/protocol/websocket';
import { authVerifier } from '../auth/supabaseAuthVerifier';
import { buildWsErrorFrame, checkWsInboundRateLimit, parseClientWsMessage } from '../websocket/wsGateway';
import { projectClientMatchState } from '../match/matchStateManager';

interface CfWebSocketPairConstructor {
  new (): { 0: WebSocket; 1: DurableObjectWebSocket };
}

interface WsSocketAttachment {
  participantId: string;
  playerId: string;
  matchId: string;
  connectedAtMs: number;
}

const MATCH_STATE_KEY = 'match_state';
const REDEEMED_JTI_PREFIX = 'ws_jti:';
const WS_READY_STATE_OPEN = 1;

function extractMatchIdFromPath(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  return decodeURIComponent(parts[parts.length - 1] || '').trim();
}

export class MatchRoomDO {
  private readonly state: DurableObjectState;
  private readonly env: WorkerEnv;
  private matchState: AuthoritativeMatchState | null = null;

  constructor(state: DurableObjectState, env: WorkerEnv) {
    this.state = state;
    this.env = env;
  }

  public async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const upgradeHeader = request.headers.get('Upgrade');

    if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
      return this.handleWebSocketUpgrade(url);
    }

    if (method === 'POST' && url.pathname.endsWith('/init')) {
      return this.handleInit(request);
    }

    if (method === 'POST' && url.pathname.endsWith('/abort')) {
      return this.handleAbort();
    }

    if (method === 'GET' && url.pathname.endsWith('/state')) {
      const current = await this.loadMatchState();
      if (!current) {
        return new Response(JSON.stringify({ ok: false, error: 'Match room not initialized.' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const preview = projectClientMatchState(current, '', Date.now());
      return new Response(JSON.stringify({ ok: true, state: preview }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, service: 'MatchRoomDO', phase: 'phase-3-4-5-lobby-sync' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async handleInit(request: Request): Promise<Response> {
    return this.state.blockConcurrencyWhile(async () => {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON payload for /init.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const candidate = (body as { state?: AuthoritativeMatchState } | null)?.state;
      if (
        !candidate ||
        !candidate.matchId ||
        !candidate.participants ||
        Object.keys(candidate.participants).length === 0
      ) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Invalid AuthoritativeMatchState in /init.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      await this.saveMatchState(candidate);
      return new Response(JSON.stringify({ ok: true, matchId: candidate.matchId }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
  }

  private async handleAbort(): Promise<Response> {
    return this.state.blockConcurrencyWhile(async () => {
      this.matchState = null;
      await this.state.storage.deleteAll();
      return new Response(JSON.stringify({ ok: true, aborted: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
  }

  private async handleWebSocketUpgrade(url: URL): Promise<Response> {
    return this.state.blockConcurrencyWhile(async () => {
      const token = url.searchParams.get('token') || '';
      if (!token) {
        return new Response('Unauthorized: missing WebSocket join ticket.', { status: 401 });
      }

      const pathMatchId = extractMatchIdFromPath(url.pathname);
      const authState = await this.loadMatchState();
      if (!authState || authState.status === 'abandoned') {
        return new Response('Match room not found or no longer active.', { status: 404 });
      }

      const expectedMatchId = pathMatchId && pathMatchId === authState.matchId ? pathMatchId : authState.matchId;

      let claims;
      try {
        claims = await authVerifier.verifyWsJoinTicket(token, expectedMatchId, this.env);
      } catch (err) {
        return new Response(err instanceof Error ? err.message : 'Invalid WebSocket join ticket.', {
          status: 401,
        });
      }

      // Single-use anti-replay protection per signed ticket ID (`jti`)
      const redeemedKey = `${REDEEMED_JTI_PREFIX}${claims.jti}`;
      const alreadyRedeemedAt = await this.state.storage.get<number>(redeemedKey);
      if (alreadyRedeemedAt !== undefined) {
        return new Response(
          'WebSocket join ticket already used. Request a fresh ticket via matchmaking status or match metadata.',
          { status: 401 }
        );
      }

      // Validate strict human participant membership inside this match room
      const participant = authState.participants[claims.participantId];
      if (
        !participant ||
        participant.participantType !== 'human' ||
        participant.playerId !== claims.playerId
      ) {
        return new Response('Forbidden: player is not a participant of this match.', {
          status: 403,
        });
      }

      const PairCtor = (globalThis as unknown as { WebSocketPair?: CfWebSocketPairConstructor })
        .WebSocketPair;
      if (!PairCtor) {
        return new Response('WebSocketPair runtime unavailable outside Cloudflare Workers.', {
          status: 501,
        });
      }

      const nowMs = Date.now();
      // Burn single-use ticket before completing upgrade
      await this.state.storage.put(redeemedKey, nowMs);

      // Supersede any existing socket for the same participant so reconnects never duplicate slots/sockets
      const existingSockets = this.state.getWebSockets(participant.participantId);
      for (const oldSocket of existingSockets) {
        try {
          oldSocket.close(WS_CLOSE_CODES.NORMAL, 'Replaced by newer connection');
        } catch {
          // Ignore already closed sockets
        }
      }

      const pair = new PairCtor();
      const client = pair[0];
      const server = pair[1];

      this.state.acceptWebSocket(server, [participant.participantId]);
      server.serializeAttachment({
        participantId: participant.participantId,
        playerId: claims.playerId,
        matchId: authState.matchId,
        connectedAtMs: nowMs,
      } satisfies WsSocketAttachment);

      participant.connectionStatus = 'connected';
      authState.version += 1;
      await this.saveMatchState(authState);

      const connectedFrame: ServerToClientMessage = {
        type: 'server:connected',
        matchId: authState.matchId,
        participantId: participant.participantId,
        serverNowMs: nowMs,
      };
      server.send(JSON.stringify(connectedFrame));

      const syncFrame: ServerToClientMessage = {
        type: 'server:state_sync',
        state: projectClientMatchState(authState, participant.participantId, nowMs),
      };
      server.send(JSON.stringify(syncFrame));

      this.broadcastPresenceAndState(authState, participant.participantId, nowMs, server);

      return new Response(null, { status: 101, webSocket: client } as unknown as ResponseInit);
    });
  }

  public async webSocketMessage(
    ws: DurableObjectWebSocket,
    message: string | ArrayBuffer
  ): Promise<void> {
    const parsed = parseClientWsMessage(message);
    if (!parsed) {
      ws.send(buildWsErrorFrame('INVALID_PAYLOAD', 'Malformed WebSocket message envelope.'));
      return;
    }

    const attachment = this.readAttachment(ws);
    if (!attachment) {
      ws.send(buildWsErrorFrame('UNAUTHORIZED', 'Unauthenticated WebSocket connection.'));
      return;
    }

    const withinRateLimit = await checkWsInboundRateLimit(attachment.participantId);
    if (!withinRateLimit) {
      ws.send(buildWsErrorFrame('RATE_LIMITED', 'WebSocket message rate limit exceeded.', 2000));
      return;
    }

    if (parsed.type === 'client:ping') {
      const pong: ServerToClientMessage = {
        type: 'server:pong',
        clientTimeMs: parsed.clientTimeMs,
        serverNowMs: Date.now(),
      };
      ws.send(JSON.stringify(pong));
      return;
    }

    await this.state.blockConcurrencyWhile(async () => {
      const authState = await this.loadMatchState();
      if (!authState) {
        ws.send(buildWsErrorFrame('INTERNAL_ERROR', 'Match room state not found.'));
        return;
      }

      const participant = authState.participants[attachment.participantId];
      if (
        !participant ||
        participant.participantType !== 'human' ||
        participant.playerId !== attachment.playerId
      ) {
        ws.send(buildWsErrorFrame('NOT_PARTICIPANT', 'Player is not a participant of this match.'));
        return;
      }

      const nowMs = Date.now();

      if (parsed.type === 'client:ready') {
        if (participant.connectionStatus !== 'connected') {
          participant.connectionStatus = 'connected';
        }
        authState.version += 1;
        await this.saveMatchState(authState);

        this.sendStateSyncToSocket(ws, authState, participant.participantId, nowMs);
        this.broadcastPresenceAndState(authState, participant.participantId, nowMs, ws);
        return;
      }

      if (parsed.type === 'client:request_resync') {
        this.sendStateSyncToSocket(ws, authState, participant.participantId, nowMs);
        return;
      }

      // Phase 6+ gameplay handlers are intentionally deferred from Phases 3-5 matchmaking scope
      ws.send(
        buildWsErrorFrame(
          'INTERNAL_ERROR',
          `Lobby synchronized (${participant.participantId}). Full match gameplay for ${parsed.type} starts in Phase 6.`
        )
      );
    });
  }

  public async webSocketClose(
    ws: DurableObjectWebSocket,
    code: number,
    _reason: string
  ): Promise<void> {
    const attachment = this.readAttachment(ws);
    if (!attachment) return;

    await this.state.blockConcurrencyWhile(async () => {
      const authState = await this.loadMatchState();
      if (!authState) return;

      const participant = authState.participants[attachment.participantId];
      if (!participant || participant.playerId !== attachment.playerId) return;

      const remainingSockets = this.state
        .getWebSockets(attachment.participantId)
        .filter((sock) => sock !== ws && sock.readyState === WS_READY_STATE_OPEN);

      if (remainingSockets.length > 0) {
        return;
      }

      participant.connectionStatus =
        code === WS_CLOSE_CODES.NORMAL ? 'disconnected' : 'reconnecting';
      authState.version += 1;
      await this.saveMatchState(authState);

      this.broadcastPresenceAndState(authState, participant.participantId, Date.now(), ws);
    });
  }

  public async webSocketError(_ws: DurableObjectWebSocket, error: unknown): Promise<void> {
    console.error('MatchRoomDO WebSocket error:', error);
  }

  public async alarm(): Promise<void> {
    void this.env;
    // Phase 6+ TODO: Round timeout & active match lifecycle alarms.
  }

  private readAttachment(ws: DurableObjectWebSocket): WsSocketAttachment | null {
    try {
      const raw = ws.deserializeAttachment?.() as Partial<WsSocketAttachment> | undefined;
      if (raw && raw.participantId && raw.playerId && raw.matchId) {
        return raw as WsSocketAttachment;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async loadMatchState(): Promise<AuthoritativeMatchState | null> {
    if (this.matchState) {
      return this.matchState;
    }
    const stored = await this.state.storage.get<AuthoritativeMatchState>(MATCH_STATE_KEY);
    if (stored) {
      this.matchState = stored;
    }
    return this.matchState;
  }

  private async saveMatchState(state: AuthoritativeMatchState): Promise<void> {
    this.matchState = state;
    await this.state.storage.put(MATCH_STATE_KEY, state);
  }

  private sendStateSyncToSocket(
    ws: DurableObjectWebSocket,
    authState: AuthoritativeMatchState,
    participantId: string,
    nowMs: number
  ): void {
    const syncFrame: ServerToClientMessage = {
      type: 'server:state_sync',
      state: projectClientMatchState(authState, participantId, nowMs),
    };
    ws.send(JSON.stringify(syncFrame));
  }

  private broadcastPresenceAndState(
    authState: AuthoritativeMatchState,
    changedParticipantId: string,
    nowMs: number,
    excludeSocket?: DurableObjectWebSocket
  ): void {
    const changedParticipant = authState.participants[changedParticipantId];
    if (!changedParticipant) return;

    const statusFrame: ServerToClientMessage = {
      type: 'server:participant_status',
      matchId: authState.matchId,
      participantId: changedParticipantId,
      connectionStatus: changedParticipant.connectionStatus,
      hasAnsweredCurrentRound: changedParticipant.hasAnsweredCurrentRound,
    };
    const serializedStatus = JSON.stringify(statusFrame);

    for (const sock of this.state.getWebSockets()) {
      if (sock === excludeSocket) continue;
      const att = this.readAttachment(sock);
      if (!att) continue;
      try {
        sock.send(serializedStatus);
        this.sendStateSyncToSocket(sock, authState, att.participantId, nowMs);
      } catch {
        // Ignore stale closing sockets
      }
    }
  }
}
