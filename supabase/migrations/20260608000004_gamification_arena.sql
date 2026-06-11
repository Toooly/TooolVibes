CREATE TABLE IF NOT EXISTS public.arena_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('1v1', 'royale', 'bracket')),
  tool_slugs TEXT[] NOT NULL,
  winner_slug TEXT NOT NULL,
  score_snapshot JSONB NOT NULL DEFAULT '{}',
  battle_log JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.arena_battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own arena battles"
  ON public.arena_battles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own arena battle"
  ON public.arena_battles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
