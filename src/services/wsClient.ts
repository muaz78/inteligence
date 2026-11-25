// CountryRush Frontend Realtime WebSocket Client Foundation
// Consumes typed envelopes from ../../shared/protocol/websocket for Phase 3 & Phase 6.
// Server (MatchRoomDO) remains 100% authoritative for timers, answers, scores, and state.

import type { ClientToServerMessage, ServerToClientMessage } from '../../shared/protocol/websocket';
import { WS_CLOSE_CODES } from '../../shared/protocol/websocket';
import { FRONTEND_ENV } from '../config/env';

export type WsConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
export type WsMessageListener = (message: ServerToClientMessage) => void;
export type WsStateListener = (state: WsConnectionState) => void;
export type WsCloseListener = (event: { code: number; reason: string }) => void;

export class CountryRushWsClient {
  private socket: WebSocket | null = null;
  private state: WsConnectionState = 'disconnected';
  private messageListeners = new Set<WsMessageListener>();
  private stateListeners = new Set<WsStateListener>();
  private closeListeners = new Set<WsCloseListener>();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  public getState(): WsConnectionState {
    return this.state;
  }

  public onMessage(listener: WsMessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  public onStateChange(listener: WsStateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  public onClose(listener: WsCloseListener): () => void {
    this.closeListeners.add(listener);
    return () => this.closeListeners.delete(listener);
  }

  /**
   * Connects to a Cloudflare Durable Object MatchRoom WebSocket endpoint.
   * Authentication token is passed via protocol header or short-lived WS ticket in Phase 3.
   */
  public connect(matchId: string, wsAuthToken: string): void {
    this.disconnect();
    this.setState('connecting');

    const base = FRONTEND_ENV.wsBaseUrl.replace(/\/+$/, '');
    const url = `${base}/api/v1/ws/match/${encodeURIComponent(matchId)}?token=${encodeURIComponent(wsAuthToken)}`;

    const ws = new WebSocket(url);
    this.socket = ws;

    ws.onopen = () => {
      if (this.socket !== ws) return;
      this.setState('connected');
      this.startHeartbeat();
      this.send({ type: 'client:ready', matchId });
      this.send({ type: 'client:ping', clientTimeMs: Date.now() });
    };

    ws.onmessage = (event) => {
      if (this.socket !== ws) return;
      try {
        const parsed = JSON.parse(String(event.data)) as ServerToClientMessage;
        this.messageListeners.forEach((fn) => fn(parsed));
      } catch {
        // Ignore malformed frame safely
      }
    };

    ws.onclose = (event) => {
      if (this.socket !== ws) return;
      this.stopHeartbeat();
      this.setState('disconnected');
      this.socket = null;
      this.closeListeners.forEach((fn) => fn({ code: event.code, reason: event.reason || '' }));
    };

    ws.onerror = () => {
      // Error surfaced via onclose lifecycle; reconnect policy added in Phase 3.
    };
  }

  public send(message: ClientToServerMessage): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    this.socket.send(JSON.stringify(message));
    return true;
  }

  public disconnect(code: number = WS_CLOSE_CODES.NORMAL, reason = 'Client closed'): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close(code, reason);
      this.socket = null;
    }
    this.setState('disconnected');
  }

  private setState(next: WsConnectionState): void {
    this.state = next;
    this.stateListeners.forEach((fn) => fn(next));
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'client:ping', clientTimeMs: Date.now() });
    }, 15_000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

export const wsClient = new CountryRushWsClient();
