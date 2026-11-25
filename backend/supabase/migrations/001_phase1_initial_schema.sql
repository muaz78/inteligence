-- =============================================================================
-- CountryRush | Migration 001: Phase 1 baseline schema
-- Creates the baseline tables. Run before 002_phase2_auth_profiles_rls.sql.
-- Safe for a fresh Supabase project; does not drop or truncate existing data.
-- =============================================================================

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  username text not null unique,
  tag text not null default 'GLB1',
  title text not null default 'Rookie Cartographer',
  avatar_seed text not null default 'aoi_valkyrie',
  country_code text,
  level integer not null default 1 check (level >= 1),
  current_xp integer not null default 0 check (current_xp >= 0),
  rush_tokens integer not null default 250 check (rush_tokens >= 0),
  star_gems integer not null default 25 check (star_gems >= 0),
  favorite_continent text not null default 'Global',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_ratings (
  player_id uuid primary key references public.profiles(id) on delete cascade,
  season_id text not null default 'season_1',
  rank_tier text not null default 'Bronze',
  rank_division text default 'III',
  rank_points integer not null default 0 check (rank_points >= 0),
  peak_rank_points integer not null default 0 check (peak_rank_points >= 0),
  mmr integer not null default 400 check (mmr >= 0),
  mmr_uncertainty numeric(5,2) not null default 50.00,
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0),
  avg_response_time_ms integer not null default 0 check (avg_response_time_ms >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id text primary key,
  category text not null,
  format text not null,
  prompt text not null,
  options jsonb not null,
  correct_country text not null,
  correct_option_index smallint not null check (correct_option_index between 0 and 3),
  country_code text,
  difficulty text not null check (difficulty in ('D1','D2','D3','D4','D5')),
  verified boolean not null default false,
  hints jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  total_attempts integer not null default 0 check (total_attempts >= 0),
  correct_count integer not null default 0 check (correct_count >= 0),
  avg_response_time_ms integer not null default 0 check (avg_response_time_ms >= 0),
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_questions_raqe_filter
  on public.questions (verified, difficulty, category);

create table if not exists public.question_media (
  asset_id text primary key,
  question_id text not null references public.questions(id) on delete cascade,
  image_url text not null,
  thumbnail_url text,
  source text not null,
  author text not null,
  license text not null,
  attribution text not null,
  media_type text not null,
  caption text not null,
  aspect_ratio text not null default '16:9',
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  durable_object_id text not null,
  mode text not null,
  status text not null,
  rank_anchor text not null,
  total_rounds smallint not null,
  has_bot_fallback boolean not null default false,
  winning_team text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz
);

create table if not exists public.match_participants (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid references public.profiles(id) on delete set null,
  bot_id text,
  participant_type text not null check (participant_type in ('human', 'bot')),
  team_id text not null,
  final_score integer not null default 0,
  correct_count smallint not null default 0,
  rp_before integer,
  rp_after integer,
  rp_delta integer,
  mmr_before integer,
  mmr_after integer,
  mmr_delta integer,
  check (
    (participant_type = 'human' and player_id is not null and bot_id is null)
    or (participant_type = 'bot' and bot_id is not null and player_id is null)
  )
);

create index if not exists idx_match_participants_lookup
  on public.match_participants (match_id, player_id);

create table if not exists public.player_question_history (
  player_id uuid not null references public.profiles(id) on delete cascade,
  question_id text not null references public.questions(id) on delete cascade,
  match_id uuid references public.matches(id) on delete set null,
  served_at timestamptz not null default now(),
  primary key (player_id, question_id, served_at)
);

create index if not exists idx_player_question_history_recent
  on public.player_question_history (player_id, served_at desc);

-- Lock down every table immediately. Migration 002 adds the intended grants
-- and narrowly-scoped policies. This prevents an exposed interval between 001
-- and 002 on a newly-created Supabase project.
alter table public.profiles enable row level security;
alter table public.player_ratings enable row level security;
alter table public.questions enable row level security;
alter table public.question_media enable row level security;
alter table public.matches enable row level security;
alter table public.match_participants enable row level security;
alter table public.player_question_history enable row level security;

revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.player_ratings from public, anon, authenticated;
revoke all on table public.questions from public, anon, authenticated;
revoke all on table public.question_media from public, anon, authenticated;
revoke all on table public.matches from public, anon, authenticated;
revoke all on table public.match_participants from public, anon, authenticated;
revoke all on table public.player_question_history from public, anon, authenticated;
