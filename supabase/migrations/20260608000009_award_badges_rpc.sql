CREATE OR REPLACE FUNCTION public.award_badges(p_user_id UUID, p_badge_ids UUID[])
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_badge_id UUID;
  v_inserted UUID[] := '{}';
BEGIN
  FOREACH v_badge_id IN ARRAY p_badge_ids LOOP
    INSERT INTO public.user_badges (user_id, badge_id)
    VALUES (p_user_id, v_badge_id)
    ON CONFLICT (user_id, badge_id) DO NOTHING
    RETURNING badge_id INTO v_badge_id;
    IF v_badge_id IS NOT NULL THEN
      v_inserted := array_append(v_inserted, v_badge_id);
    END IF;
  END LOOP;
  RETURN v_inserted;
END;
$$;
