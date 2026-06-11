CREATE OR REPLACE FUNCTION public.refresh_leaderboard(p_week_start DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Aggregate XP gained during the week from mission claims and arena battles.
  WITH weekly_xp AS (
    SELECT user_id, COALESCE(SUM(xp_awarded), 0) AS xp
    FROM public.game_mission_claims
    WHERE claimed_at >= timezone('UTC', p_week_start::timestamp)
      AND claimed_at < timezone('UTC', (p_week_start + INTERVAL '7 days')::timestamp)
    GROUP BY user_id

    UNION ALL

    SELECT user_id, COUNT(*) * 40 AS xp
    FROM public.arena_battles
    WHERE created_at >= timezone('UTC', p_week_start::timestamp)
      AND created_at < timezone('UTC', (p_week_start + INTERVAL '7 days')::timestamp)
    GROUP BY user_id
  ),
  aggregated AS (
    SELECT user_id, SUM(xp) AS total_xp
    FROM weekly_xp
    GROUP BY user_id
  )
  INSERT INTO public.leaderboard_snapshots (user_id, week_start, xp_gained)
  SELECT user_id, p_week_start, total_xp
  FROM aggregated
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET xp_gained = EXCLUDED.xp_gained;

  -- Compute and persist ranks for the requested week.
  WITH ranked AS (
    SELECT id, RANK() OVER (ORDER BY xp_gained DESC) AS r
    FROM public.leaderboard_snapshots
    WHERE week_start = p_week_start
  )
  UPDATE public.leaderboard_snapshots ls
  SET rank = ranked.r
  FROM ranked
  WHERE ls.id = ranked.id;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_leaderboard(DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_leaderboard(DATE) TO service_role;
