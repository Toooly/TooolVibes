CREATE TABLE IF NOT EXISTS public.radar_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug TEXT NOT NULL,
  context_date DATE NOT NULL,
  predicted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  actual_rank_change INTEGER,
  xp_awarded INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'close', 'lost')),
  UNIQUE(user_id, context_date)
);

ALTER TABLE public.radar_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own predictions"
  ON public.radar_predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prediction"
  ON public.radar_predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
