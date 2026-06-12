CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  xp_bonus INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are public read"
  ON public.badges FOR SELECT
  USING (true);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (false);

CREATE INDEX IF NOT EXISTS user_badges_user_id_idx
  ON public.user_badges (user_id);

CREATE TABLE IF NOT EXISTS public.tool_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug TEXT NOT NULL,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  category_tags TEXT[] NOT NULL DEFAULT '{}',
  UNIQUE(user_id, tool_slug)
);

ALTER TABLE public.tool_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tool collection"
  ON public.tool_collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tool collection"
  ON public.tool_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS tool_collections_user_id_idx
  ON public.tool_collections (user_id);

INSERT INTO public.badges (id, code, name, description, icon, requirement_type, requirement_value, xp_bonus)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'first_scan', 'Primo Scan', 'Completa la tua prima missione Radar', 'Radar', 'missions_completed', 1, 50),
  ('00000000-0000-0000-0000-000000000002', 'arena_rookie', 'Esordiente', 'Vinci la tua prima battaglia in Arena', 'Swords', 'battles_played', 1, 50),
  ('00000000-0000-0000-0000-000000000003', 'arena_veteran', 'Veterano', 'Vinci 10 battaglie in Arena', 'Trophy', 'battles_played', 10, 150),
  ('00000000-0000-0000-0000-000000000004', 'radar_prophet', 'Profeta', 'Azzecca 5 predizioni Radar', 'Sparkles', 'predictions_correct', 5, 200),
  ('00000000-0000-0000-0000-000000000005', 'shortlist_guardian', 'Guardiano', 'Colleziona 20 tool', 'Bookmark', 'tools_collected', 20, 100),
  ('00000000-0000-0000-0000-000000000006', 'seven_streak', 'Sette Giorni', 'Raggiungi una streak di 7 giorni', 'Flame', 'streak_days', 7, 200)
ON CONFLICT (code) DO NOTHING;
