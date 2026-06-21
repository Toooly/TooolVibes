REVOKE ALL ON FUNCTION public.record_game_interaction(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_game_interaction(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.record_game_interaction(UUID, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_game_interaction(UUID, INTEGER) TO service_role;

REVOKE ALL ON FUNCTION public.award_badges(UUID, UUID[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.award_badges(UUID, UUID[]) FROM anon;
REVOKE ALL ON FUNCTION public.award_badges(UUID, UUID[]) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.award_badges(UUID, UUID[]) TO service_role;
