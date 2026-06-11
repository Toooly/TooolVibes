CREATE TABLE IF NOT EXISTS public.game_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('radar', 'arena')),
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target INTEGER NOT NULL DEFAULT 1,
  progress INTEGER NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'claimed')),
  resets_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, scope, kind, resets_at)
);

ALTER TABLE public.game_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own missions"
  ON public.game_missions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own missions"
  ON public.game_missions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.game_mission_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.game_missions(id) ON DELETE CASCADE,
  xp_awarded INTEGER NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, mission_id)
);

ALTER TABLE public.game_mission_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own claims"
  ON public.game_mission_claims FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own claims"
  ON public.game_mission_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);
