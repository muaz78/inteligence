-- =============================================================================
-- Migration 003: CountryRush Phases 3, 4 & 5 — Matchmaking & Match Persistence
--
-- Non-destructive incremental migration on top of 001 and 002.
-- Adds region and rated/AI-match tracking on `matches` and participant
-- roster snapshot metadata on `match_participants` for lossless human/bot rosters.
-- Preserves all existing RLS policies and protected competitive field guards.
-- Review carefully and execute manually in Supabase SQL Editor.
-- =============================================================================

alter table public.matches
  add column if not exists region text not null default 'global',
  add column if not exists is_rated boolean not null default true;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_matches_mode_valid'
  ) then
    alter table public.matches
      add constraint chk_matches_mode_valid
      check (mode in ('ranked_1v1', 'ranked_2v2', 'quickplay', 'daily', 'custom'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_matches_region_valid'
  ) then
    alter table public.matches
      add constraint chk_matches_region_valid
      check (region in ('global', 'eu_west', 'us_east', 'ap_northeast'));
  end if;
end $$;

alter table public.match_participants
  add column if not exists participant_slot_id text,
  add column if not exists display_username text,
  add column if not exists avatar_seed text,
  add column if not exists rank_tier text,
  add column if not exists rank_division text,
  add column if not exists rank_points_snapshot integer;

create index if not exists idx_matches_status_created
  on public.matches (status, created_at desc);
