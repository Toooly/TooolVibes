CREATE OR REPLACE FUNCTION public.claim_mission(p_mission_id UUID, p_user_id UUID)
RETURNS public.game_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mission public.game_missions;
  v_profile public.game_profiles;
BEGIN
  SELECT * INTO v_mission
  FROM public.game_missions
  WHERE id = p_mission_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mission not found';
  END IF;

  IF v_mission.status != 'completed' THEN
    RAISE EXCEPTION 'Mission not completed';
  END IF;

  INSERT INTO public.game_mission_claims (user_id, mission_id, xp_awarded)
  VALUES (p_user_id, p_mission_id, v_mission.xp_reward);

  UPDATE public.game_missions
  SET status = 'claimed'
  WHERE id = p_mission_id;

  SELECT * INTO v_profile
  FROM public.record_game_interaction(p_user_id, v_mission.xp_reward);

  RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_mission(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_mission(UUID, UUID) TO authenticated;
