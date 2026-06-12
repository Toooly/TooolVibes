CREATE TABLE IF NOT EXISTS public.hidden_signal_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context_date DATE NOT NULL,
  tool_slug TEXT NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, context_date)
);

ALTER TABLE public.hidden_signal_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own hidden signal claims"
  ON public.hidden_signal_claims FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.claim_hidden_signal(
  p_user_id UUID,
  p_context_date DATE,
  p_tool_slug TEXT,
  p_expected_slug TEXT
)
RETURNS public.game_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.game_profiles;
BEGIN
  IF p_tool_slug IS DISTINCT FROM p_expected_slug THEN
    RAISE EXCEPTION 'Invalid hidden signal';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.hidden_signal_claims
    WHERE user_id = p_user_id AND context_date = p_context_date
  ) THEN
    RAISE EXCEPTION 'Hidden signal already claimed for %', p_context_date;
  END IF;

  INSERT INTO public.hidden_signal_claims (user_id, context_date, tool_slug)
  VALUES (p_user_id, p_context_date, p_tool_slug);

  SELECT * INTO v_profile
  FROM public.record_game_interaction(p_user_id, 25);

  RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_hidden_signal(UUID, DATE, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_hidden_signal(UUID, DATE, TEXT, TEXT) TO authenticated;

-- Optional performance improvement for the prediction resolver.
CREATE INDEX IF NOT EXISTS idx_radar_predictions_context_date_status
  ON public.radar_predictions(context_date, status);

-- Document that prediction updates/deletes are service-role only.
DROP POLICY IF EXISTS "Service role can update predictions" ON public.radar_predictions;
CREATE POLICY "Service role can update predictions"
  ON public.radar_predictions FOR UPDATE
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Service role can delete predictions" ON public.radar_predictions;
CREATE POLICY "Service role can delete predictions"
  ON public.radar_predictions FOR DELETE
  USING (false);
