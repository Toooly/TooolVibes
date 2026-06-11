create or replace function public.calculate_level(p_xp integer)
returns integer
language plpgsql
immutable
as $$
declare
  level integer := 1;
  remaining integer := p_xp;
  needed integer;
begin
  loop
    needed := 100 + (level - 1) * 115;
    exit when remaining < needed;
    remaining := remaining - needed;
    level := level + 1;
  end loop;
  return level;
end;
$$;

create or replace function public.record_game_interaction(
  p_user_id uuid,
  p_xp_delta integer
)
returns public.game_profiles
language plpgsql
security invoker
as $$
declare
  profile public.game_profiles;
  new_xp integer;
  new_level integer;
  new_streak_days integer;
  new_last_interaction timestamptz;
  hours_since double precision;
begin
  if p_xp_delta < 0 or p_xp_delta > 10000 then
    raise exception 'Invalid xp_delta: %', p_xp_delta;
  end if;

  select *
  into profile
  from public.game_profiles
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'Profile not found for user %', p_user_id;
  end if;

  new_xp := profile.xp + p_xp_delta;
  new_level := public.calculate_level(new_xp);
  new_last_interaction := timezone('utc', now());

  if profile.last_interaction_at is null then
    new_streak_days := 1;
  else
    hours_since := extract(epoch from (new_last_interaction - profile.last_interaction_at)) / 3600;
    if hours_since >= 48 then
      new_streak_days := 1;
    elsif hours_since >= 24 then
      new_streak_days := profile.streak_days + 1;
    else
      new_streak_days := profile.streak_days;
    end if;
  end if;

  update public.game_profiles
  set
    xp = new_xp,
    level = new_level,
    streak_days = new_streak_days,
    last_interaction_at = new_last_interaction
  where user_id = p_user_id
  returning * into profile;

  return profile;
end;
$$;

drop trigger if exists game_profiles_set_updated_at on public.game_profiles;
create trigger game_profiles_set_updated_at
  before update on public.game_profiles
  for each row
  execute function public.set_updated_at();

drop trigger if exists leaderboard_snapshots_set_updated_at on public.leaderboard_snapshots;
create trigger leaderboard_snapshots_set_updated_at
  before update on public.leaderboard_snapshots
  for each row
  execute function public.set_updated_at();
