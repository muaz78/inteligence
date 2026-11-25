// CountryRush Frontend HTTP API Client (Cloudflare Workers Entry Adapter)
// Typed wrapper around REST endpoints defined in ../../shared/protocol/api.

import type {
  ApiResponse,
  CancelMatchmakingApiResponse,
  CompleteProfileSetupRequest,
  HealthCheckPayload,
  JoinMatchmakingPayload,
  JoinMatchmakingApiResponse,
  MatchmakingStatusApiResponse,
  MatchMetadataApiResponse,
  MatchResultApiResponse,
  LeaderboardApiResponse,
  MyProfileApiResponse,
  PublicProfileApiResponse,
  ProfileUpdateRequest,
  UsernameAvailabilityResponse,
} from '../../shared/protocol/api';
import { FRONTEND_ENV, isBackendConfigured } from '../config/env';
import { authService } from './authService';

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly retryAfterSec?: number;

  constructor(message: string, status = 500, code = 'API_ERROR', retryAfterSec?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.retryAfterSec = retryAfterSec;
  }
}

export class CountryRushApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl = FRONTEND_ENV.apiBaseUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  public isLiveBackendActive(): boolean {
    return isBackendConfigured();
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await authService.getAccessToken();
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });

    let payload: ApiResponse<T>;
    try {
      payload = (await response.json()) as ApiResponse<T>;
    } catch {
      throw new ApiClientError(
        `Unexpected response format from server (HTTP ${response.status}).`,
        response.status,
        'INVALID_RESPONSE'
      );
    }

    if (!response.ok || !payload.ok) {
      const errMsg = !payload.ok ? payload.error.message : `HTTP ${response.status}`;
      const errCode = !payload.ok ? payload.error.code : 'HTTP_ERROR';
      const retryAfterSec = !payload.ok ? payload.error.retryAfterSec : undefined;
      throw new ApiClientError(errMsg, response.status, errCode, retryAfterSec);
    }

    return payload.data;
  }

  public healthCheck(): Promise<HealthCheckPayload> {
    return this.request<HealthCheckPayload>('/api/health', { method: 'GET' });
  }

  public checkUsernameAvailable(username: string): Promise<UsernameAvailabilityResponse> {
    return this.request<UsernameAvailabilityResponse>(
      `/api/v1/profile/check-username?username=${encodeURIComponent(username)}`,
      { method: 'GET' }
    );
  }

  public getMyProfile(): Promise<MyProfileApiResponse> {
    return this.request<MyProfileApiResponse>('/api/v1/profile/me', { method: 'GET' });
  }

  public completeProfileSetup(payload: CompleteProfileSetupRequest): Promise<MyProfileApiResponse> {
    return this.request<MyProfileApiResponse>('/api/v1/profile/setup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public updateMyProfile(update: ProfileUpdateRequest): Promise<MyProfileApiResponse> {
    return this.request<MyProfileApiResponse>('/api/v1/profile/me', {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
  }

  public getPublicProfile(publicPlayerId: string): Promise<PublicProfileApiResponse> {
    return this.request<PublicProfileApiResponse>(
      `/api/v1/profiles/${encodeURIComponent(publicPlayerId)}`,
      { method: 'GET' }
    );
  }

  public joinMatchmaking(payload: JoinMatchmakingPayload): Promise<JoinMatchmakingApiResponse> {
    return this.request<JoinMatchmakingApiResponse>('/api/v1/matchmaking/join', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public getMatchmakingStatus(ticketId?: string): Promise<MatchmakingStatusApiResponse> {
    const query = ticketId ? `?ticketId=${encodeURIComponent(ticketId)}` : '';
    return this.request<MatchmakingStatusApiResponse>(
      `/api/v1/matchmaking/status${query}`,
      { method: 'GET' }
    );
  }

  public cancelMatchmaking(ticketId: string): Promise<CancelMatchmakingApiResponse> {
    return this.request<CancelMatchmakingApiResponse>('/api/v1/matchmaking/cancel', {
      method: 'POST',
      body: JSON.stringify({ ticketId }),
    });
  }

  public getMatchMetadata(matchId: string): Promise<MatchMetadataApiResponse> {
    return this.request<MatchMetadataApiResponse>(
      `/api/v1/matches/${encodeURIComponent(matchId)}`,
      { method: 'GET' }
    );
  }

  public getMatchResult(matchId: string): Promise<MatchResultApiResponse> {
    return this.request<MatchResultApiResponse>(
      `/api/v1/matches/${encodeURIComponent(matchId)}/result`,
      { method: 'GET' }
    );
  }

  public getLeaderboard(region = 'global'): Promise<LeaderboardApiResponse> {
    return this.request<LeaderboardApiResponse>(
      `/api/v1/leaderboard?region=${encodeURIComponent(region)}`,
      { method: 'GET' }
    );
  }
}

export const apiClient = new CountryRushApiClient();
