# CountryRush Backend Architecture (Phase 1 Foundation)

This directory contains the server-authoritative multiplayer backend foundation for **CountryRush**, built for:
- **Cloudflare Workers** (REST API & WebSocket upgrade edge gateway)
- **Cloudflare Durable Objects** (`MatchRoomDO` authoritative per-match state, `MatchmakingQueueDO` queue + 20s AI fallback scheduler)
- **WebSockets** (Hibernation API realtime gameplay protocol)
- **Supabase Authentication & PostgreSQL** (identity verification, persistent profiles, RP/MMR separation, private question answer storage, match history)

---

## Security & Authority Model

1. **Zero Client Authority**: The browser UI and Phaser canvas are strictly presentation layers. All match clocks, round deadlines, answer validation, scoring, speed bonuses, RP/MMR updates, and anti-repeat exclusions happen exclusively on the server inside Workers and Durable Objects.
2. **Sanitized State Projection**: `backend/src/match/matchStateManager.ts` projects `AuthoritativeMatchState` into `ClientMatchState`, stripping `correctCountry`, `correctOptionIndex`, and future round questions before sending WebSocket frames to clients.
3. **Secret Isolation**:
   - `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` live in root `.env.local` (safe browser identifiers).
   - `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, and `INTERNAL_WS_TICKET_SECRET` live strictly in `backend/.dev.vars` locally or Cloudflare Worker secrets (`wrangler secret put`) in deployment. They are **never** imported in `src/` or `shared/`.

---

## Project Layout

```text
├── shared/                        # Single source of truth (Frontend + Backend)
│   ├── types/                     # player, question, match, matchmaking, bot, chat
│   ├── protocol/                  # REST API & WebSocket message contracts
│   └── constants/                 # Shared timers, scoring & rate-limit rules
├── src/                           # Existing React + Vite + Phaser 3 Frontend
│   ├── config/env.ts              # Public VITE_* environment config
│   └── services/                  # authService, apiClient, wsClient foundations
└── backend/                       # Cloudflare Workers & Durable Objects
    ├── wrangler.toml              # Worker & DO bindings template
    ├── .dev.vars.example          # Local Cloudflare secret placeholders
    ├── supabase/schema.sql        # PostgreSQL + RLS Phase 2+ schema blueprint
    └── src/
        ├── api/                   # Router, CORS, JWT middleware, rate limiter
        ├── auth/                  # Supabase token & WS ticket verification
        ├── db/                    # Server-only Supabase admin client & repositories
        ├── durable-objects/       # MatchRoomDO & MatchmakingQueueDO skeletons
        ├── match/                 # Authoritative score calculator & state sanitizer
        ├── matchmaking/           # Queue coordinator & 20s AI fallback contracts
        ├── question-engine/       # Server-side RAQE engine contracts
        ├── bots/                  # AI bot profile & scheduled reaction contracts
        ├── chat/                  # In-game chat validation & moderation hooks
        └── websocket/             # Frame parser, membership check & error builder
```

---

## Multi-Phase Roadmap

- **Phase 1 (Current)**: Modular directories, shared domain/protocol types, Worker & DO skeletons, security boundaries, env templates, SQL schema blueprint.
- **Phase 2**: Install `@supabase/supabase-js` & `@cloudflare/workers-types`, deploy `schema.sql`, implement Supabase JWT verification and player profile endpoints.
- **Phase 3**: Deploy Cloudflare Workers + Durable Objects (`MatchRoomDO` + WebSocket lifecycle).
- **Phase 4**: Real multiplayer matchmaking (`MatchmakingQueueDO`).
- **Phase 5**: 20-second AI fallback opponent spawning via DO alarms.
- **Phase 6**: Authoritative server-side RAQE question selection, answer checking, and real-time match loop.
- **Phase 7**: Real-time match chat, moderation, and contextual bot chat.
- **Phase 8**: Authoritative post-match statistics, RP/MMR updates, and server-backed leaderboards.
