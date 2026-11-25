-- =============================================================================
-- CountryRush | Migration 002: Auth, profiles, public IDs and RLS
-- Run AFTER 001_phase1_initial_schema.sql.
-- Reviewed revision: removes client-settable GUC bypass and fixes RLS recursion.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. Public Player ID generator
-- Uses PostgreSQL's gen_random_uuid() so it does not depend on the pgcrypto
-- extension being installed in a particular schema.
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists public_player_id text,
  add column if not exists profile_setup_completed boolean not null default false;

create or replace function public.generate_unique_public_player_id()
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  candidate text;
  attempts integer := 0;
begin
  loop
    attempts := attempts + 1;
    candidate := 'CR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

    if not exists (
      select 1
      from public.profiles p
      where p.public_player_id = candidate
    ) then
      return candidate;
    end if;

    if attempts >= 50 then
      raise exception 'Could not allocate a unique public Player ID';
    end if;
  end loop;
end;
$$;

-- Backfill legacy rows before enforcing NOT NULL and UNIQUE.
update public.profiles
set public_player_id = public.generate_unique_public_player_id()
where public_player_id is null;

alter table public.profiles
  alter column public_player_id set default public.generate_unique_public_player_id(),
  alter column public_player_id set not null,
  alter column tag set default 'GLB1',
  alter column title set default 'Rookie Cartographer',
  alter column avatar_seed set default 'aoi_valkyrie',
  alter column rush_tokens set default 250,
  alter column star_gems set default 25;

create unique index if not exists idx_profiles_public_player_id
  on public.profiles (public_player_id);

-- ----------------------------------------------------------------------------
-- 2. Profile validation constraints and case-insensitive username uniqueness
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'chk_profiles_public_player_id_fmt'
  ) then
    alter table public.profiles
      add constraint chk_profiles_public_player_id_fmt
      check (public_player_id ~ '^CR-[A-F0-9]{10}$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'chk_profiles_avatar_allowlist'
  ) then
    alter table public.profiles
      add constraint chk_profiles_avatar_allowlist
      check (avatar_seed in (
        'aoi_valkyrie',
        'kaito_tactician',
        'sakura_blitz',
        'neon_horizon',
        'zenith_striker',
        'ren_kyoto',
        'haru_alpine',
        'sora_apex'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'chk_profiles_username_fmt'
  ) then
    alter table public.profiles
      add constraint chk_profiles_username_fmt
      check (
        char_length(username) between 3 and 20
        and username ~ '^[A-Za-z0-9][A-Za-z0-9_]{1,18}[A-Za-z0-9]$'
        and username !~ '__'
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'chk_profiles_username_not_reserved'
  ) then
    alter table public.profiles
      add constraint chk_profiles_username_not_reserved
      check (lower(username) not in (
        'admin','administrator','moderator','system','countryrush',
        'support','official','staff','root','null','undefined'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.player_ratings'::regclass
      and conname = 'chk_ratings_rank_tier'
  ) then
    alter table public.player_ratings
      add constraint chk_ratings_rank_tier
      check (rank_tier in ('Bronze','Silver','Gold','Platinum','Diamond','Master','Elite'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.player_ratings'::regclass
      and conname = 'chk_ratings_rank_division'
  ) then
    alter table public.player_ratings
      add constraint chk_ratings_rank_division
      check (rank_division is null or rank_division in ('III','II','I'));
  end if;
end;
$$;

create unique index if not exists idx_profiles_username_ci
  on public.profiles (lower(username));

-- ----------------------------------------------------------------------------
-- 3. Updated-at trigger and protected profile fields
-- No client-settable custom GUC is used as a bypass. Only trusted database
-- execution contexts (postgres/service_role) can change protected fields.
-- profile_setup_completed is protected by column privileges and is changed
-- only inside the SECURITY DEFINER profile-setup RPC below.
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_touch_updated_at on public.profiles;
create trigger trg_profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_player_ratings_touch_updated_at on public.player_ratings;
create trigger trg_player_ratings_touch_updated_at
  before update on public.player_ratings
  for each row execute function public.touch_updated_at();

create or replace function public.guard_protected_profile_fields()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if current_user in ('postgres', 'service_role') then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.auth_user_id is distinct from old.auth_user_id
     or new.public_player_id is distinct from old.public_player_id
     or new.tag is distinct from old.tag
     or new.title is distinct from old.title
     or new.level is distinct from old.level
     or new.current_xp is distinct from old.current_xp
     or new.rush_tokens is distinct from old.rush_tokens
     or new.star_gems is distinct from old.star_gems
     or new.created_at is distinct from old.created_at then
    raise exception 'Protected profile fields cannot be modified by clients'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_guard_protected on public.profiles;
create trigger trg_profiles_guard_protected
  before update on public.profiles
  for each row execute function public.guard_protected_profile_fields();

-- ----------------------------------------------------------------------------
-- 4. Secure profile provisioning on Supabase Auth signup
-- Invalid or unavailable requested usernames receive a generated Agent_ name
-- and profile_setup_completed=false, so the user can choose a username later.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  requested_username text := trim(coalesce(new.raw_user_meta_data->>'username', ''));
  requested_avatar text := trim(coalesce(new.raw_user_meta_data->>'avatar_seed', 'aoi_valkyrie'));
  final_username text;
  final_avatar text;
  setup_done boolean := false;
  inserted_profile_id uuid;
  attempt integer;
begin
  if requested_avatar in (
    'aoi_valkyrie','kaito_tactician','sakura_blitz','neon_horizon',
    'zenith_striker','ren_kyoto','haru_alpine','sora_apex'
  ) then
    final_avatar := requested_avatar;
  else
    final_avatar := 'aoi_valkyrie';
  end if;

  if char_length(requested_username) between 3 and 20
     and requested_username ~ '^[A-Za-z0-9][A-Za-z0-9_]{1,18}[A-Za-z0-9]$'
     and requested_username !~ '__'
     and lower(requested_username) not in (
       'admin','administrator','moderator','system','countryrush',
       'support','official','staff','root','null','undefined'
     )
     and not exists (
       select 1 from public.profiles p
       where lower(p.username) = lower(requested_username)
     ) then
    final_username := requested_username;
    setup_done := true;
  else
    final_username := 'Agent_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
    setup_done := false;
  end if;

  -- Retry unique conflicts (including a username claimed concurrently).
  for attempt in 1..5 loop
    begin
      insert into public.profiles (
        auth_user_id,
        username,
        tag,
        title,
        avatar_seed,
        level,
        current_xp,
        rush_tokens,
        star_gems,
        favorite_continent,
        profile_setup_completed
      ) values (
        new.id,
        final_username,
        'GLB1',
        'Rookie Cartographer',
        final_avatar,
        1,
        0,
        250,
        25,
        'Global',
        setup_done
      )
      on conflict (auth_user_id) do nothing
      returning id into inserted_profile_id;

      exit;
    exception when unique_violation then
      final_username := 'Agent_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
      setup_done := false;
    end;
  end loop;

  if inserted_profile_id is null then
    -- A profile may already exist for this auth user; otherwise provisioning failed.
    if exists (select 1 from public.profiles p where p.auth_user_id = new.id) then
      return new;
    end if;
    raise exception 'Could not create CountryRush profile for new auth user';
  end if;

  insert into public.player_ratings (
    player_id,
    season_id,
    rank_tier,
    rank_division,
    rank_points,
    peak_rank_points,
    mmr,
    mmr_uncertainty
  ) values (
    inserted_profile_id,
    'season_1',
    'Bronze',
    'III',
    0,
    0,
    400,
    50.00
  )
  on conflict (player_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ----------------------------------------------------------------------------
-- 5. Public profile view
-- This view intentionally exposes only public-facing profile/rank fields.
-- It omits auth_user_id, currencies, private MMR, and internal identifiers.
-- The view is owner-executed (PostgreSQL's default) so it can provide public
-- rows while the underlying profiles table remains owner-only under RLS.
-- ----------------------------------------------------------------------------
create or replace view public.public_player_profiles
with (security_barrier = true)
as
select
  p.public_player_id,
  p.username,
  p.tag,
  p.title,
  p.avatar_seed,
  p.country_code,
  p.level,
  p.favorite_continent,
  p.created_at,
  coalesce(r.rank_tier, 'Bronze') as rank_tier,
  r.rank_division,
  coalesce(r.rank_points, 0) as rank_points,
  coalesce(r.wins, 0) as wins,
  coalesce(r.losses, 0) as losses,
  coalesce(r.current_streak, 0) as current_streak,
  coalesce(r.best_streak, 0) as best_streak,
  coalesce(r.season_id, 'season_1') as season_id
from public.profiles p
left join public.player_ratings r on r.player_id = p.id;

revoke all on public.public_player_profiles from public, anon, authenticated;
grant select on public.public_player_profiles to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 6. Client RPCs: username availability and profile setup
-- ----------------------------------------------------------------------------
create or replace function public.check_username_available(p_username text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  cleaned text := trim(coalesce(p_username, ''));
  taken boolean;
begin
  if char_length(cleaned) < 3 or char_length(cleaned) > 20
     or cleaned !~ '^[A-Za-z0-9][A-Za-z0-9_]{1,18}[A-Za-z0-9]$'
     or cleaned ~ '__' then
    return jsonb_build_object(
      'username', cleaned,
      'available', false,
      'reason', 'Invalid username format (3-20 chars, alphanumeric and single underscores).'
    );
  end if;

  if lower(cleaned) in (
    'admin','administrator','moderator','system','countryrush',
    'support','official','staff','root','null','undefined'
  ) then
    return jsonb_build_object(
      'username', cleaned,
      'available', false,
      'reason', 'This username is reserved.'
    );
  end if;

  select exists (
    select 1
    from public.profiles p
    where lower(p.username) = lower(cleaned)
      and p.auth_user_id is distinct from auth.uid()
  ) into taken;

  return jsonb_build_object(
    'username', cleaned,
    'available', not taken,
    'reason', case when taken then 'Username is already taken.' else null end
  );
end;
$$;

create or replace function public.complete_player_profile_setup(
  p_username text,
  p_avatar_seed text,
  p_country_code text default null,
  p_favorite_continent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  uid uuid := auth.uid();
  cleaned_user text := trim(coalesce(p_username, ''));
  cleaned_avatar text := trim(coalesce(p_avatar_seed, ''));
  cleaned_country text := nullif(upper(trim(coalesce(p_country_code, ''))), '');
  updated_id uuid;
begin
  if uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if char_length(cleaned_user) < 3 or char_length(cleaned_user) > 20
     or cleaned_user !~ '^[A-Za-z0-9][A-Za-z0-9_]{1,18}[A-Za-z0-9]$'
     or cleaned_user ~ '__'
     or lower(cleaned_user) in (
       'admin','administrator','moderator','system','countryrush',
       'support','official','staff','root','null','undefined'
     ) then
    raise exception 'Invalid username format' using errcode = '22023';
  end if;

  if cleaned_avatar not in (
    'aoi_valkyrie','kaito_tactician','sakura_blitz','neon_horizon',
    'zenith_striker','ren_kyoto','haru_alpine','sora_apex'
  ) then
    raise exception 'Invalid avatar identifier' using errcode = '22023';
  end if;

  if cleaned_country is not null and cleaned_country !~ '^[A-Z]{2}$' then
    raise exception 'Country code must be a two-letter ISO-style code' using errcode = '22023';
  end if;

  update public.profiles p
  set
    username = cleaned_user,
    avatar_seed = cleaned_avatar,
    country_code = coalesce(cleaned_country, p.country_code),
    favorite_continent = coalesce(nullif(trim(p_favorite_continent), ''), p.favorite_continent),
    profile_setup_completed = true
  where p.auth_user_id = uid
  returning p.id into updated_id;

  if updated_id is null then
    raise exception 'Profile row missing for authenticated user' using errcode = 'P0002';
  end if;

  return jsonb_build_object('ok', true, 'profile_id', updated_id);
end;
$$;

-- ----------------------------------------------------------------------------
-- 7. Non-recursive RLS helper for match visibility
-- SECURITY DEFINER + row_security=off avoids policies querying each other and
-- causing infinite RLS recursion. The function derives identity from auth.uid();
-- the caller cannot supply another player's user ID.
-- ----------------------------------------------------------------------------
create or replace function public.is_match_participant(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
set row_security = off
as $$
  select exists (
    select 1
    from public.match_participants mp
    join public.profiles p on p.id = mp.player_id
    where mp.match_id = p_match_id
      and p.auth_user_id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
-- 8. RLS and precise grants
-- ----------------------------------------------------------------------------
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

-- A player can read their own private profile and edit only these public fields.
grant select on table public.profiles to authenticated;
grant update (username, avatar_seed, country_code, favorite_continent)
  on table public.profiles to authenticated;

-- Rating changes are server-only; players may read their own rating row.
grant select on table public.player_ratings to authenticated;

-- Match history is readable only for matches in which the player participated.
grant select on table public.matches to authenticated;
grant select on table public.match_participants to authenticated;

-- Policies: profiles.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = auth_user_id);

drop policy if exists profiles_update_own_permitted on public.profiles;
create policy profiles_update_own_permitted
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- Policies: ratings.
drop policy if exists player_ratings_select_own on public.player_ratings;
create policy player_ratings_select_own
  on public.player_ratings
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = player_id
        and p.auth_user_id = auth.uid()
    )
  );

-- Policies: matches and participants. These call the non-recursive helper above.
drop policy if exists matches_select_participant on public.matches;
create policy matches_select_participant
  on public.matches
  for select
  to authenticated
  using (public.is_match_participant(id));

drop policy if exists match_participants_select_own_matches on public.match_participants;
create policy match_participants_select_own_matches
  on public.match_participants
  for select
  to authenticated
  using (public.is_match_participant(match_id));

-- Internal functions are not directly callable by browser clients.
revoke all on function public.generate_unique_public_player_id() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.guard_protected_profile_fields() from public, anon, authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.check_username_available(text) from public, anon, authenticated;
revoke all on function public.complete_player_profile_setup(text, text, text, text) from public, anon, authenticated;
revoke all on function public.is_match_participant(uuid) from public, anon, authenticated;

-- Only the intended RPCs are callable by clients. Username availability is
-- public; profile completion and match-membership checks require auth.
grant execute on function public.check_username_available(text) to anon, authenticated;
grant execute on function public.complete_player_profile_setup(text, text, text, text) to authenticated;
grant execute on function public.is_match_participant(uuid) to authenticated;

-- The backend service role may insert profiles and therefore needs to execute
-- the public ID default function. Browser roles do not receive this permission.
grant execute on function public.generate_unique_public_player_id() to service_role;

-- End of Migration 002.
