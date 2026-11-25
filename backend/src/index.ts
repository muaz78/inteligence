// CountryRush Backend — Cloudflare Workers Entry Point
// Exports the HTTP/WebSocket fetch handler AND all Durable Object classes.

import type { ExecutionContext } from './types/cloudflare';
import type { WorkerEnv } from './config/env';
import { handleCorsPreflight } from './api/middleware/cors';
import { routeApiRequest } from './api/router';

// Export Durable Objects so Wrangler binds `MatchRoomDO` and `MatchmakingQueueDO`
export { MatchRoomDO } from './durable-objects/MatchRoomDO';
export { MatchmakingQueueDO } from './durable-objects/MatchmakingQueueDO';

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    void ctx;
    if (request.method.toUpperCase() === 'OPTIONS') {
      return handleCorsPreflight(request, env);
    }

    const requestId =
      request.headers.get('CF-Ray') ||
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `req_${Date.now()}`);

    return routeApiRequest(request, env, requestId);
  },
};
