export type GameScope = "radar" | "arena";

export type MissionKind =
  | "explore"
  | "signals"
  | "predict"
  | "battle"
  | "collect"
  | "underdog"
  | "social";

export type MissionStatus = "active" | "completed" | "claimed";

export type GameMission = {
  id: string;
  user_id: string;
  scope: GameScope;
  kind: MissionKind;
  title: string;
  description: string;
  target: number;
  progress: number;
  xp_reward: number;
  status: MissionStatus;
  resets_at: string; // ISO date
  created_at: string;
};

export type GameProfile = {
  user_id: string;
  xp: number;
  level: number;
  vibes: number;
  streak_days: number;
  last_interaction_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ArenaBattleMode = "1v1" | "royale" | "bracket";

export type ArenaBattle = {
  id: string;
  user_id: string;
  mode: ArenaBattleMode;
  tool_slugs: string[];
  winner_slug: string;
  score_snapshot: Record<string, number>;
  battle_log: BattleTurn[];
  created_at: string;
};

export type BattleTurn = {
  turn: number;
  attacker: string;
  defender: string;
  damage: number;
  reason: "votes" | "trend" | "comments" | "completeness" | "surprise";
};

export type RadarPredictionStatus = "pending" | "won" | "close" | "lost";

export type RadarPrediction = {
  id: string;
  user_id: string;
  tool_slug: string;
  context_date: string;
  predicted_at: string;
  resolved_at: string | null;
  actual_rank_change: number | null;
  xp_awarded: number | null;
  status: RadarPredictionStatus;
};

export type BadgeContext = {
  missions_completed: number;
  battles_played: number;
  predictions_correct: number;
  tools_collected: number;
  streak_days: number;
};

export type Badge = {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: keyof BadgeContext;
  requirement_value: number;
  xp_bonus: number;
};

export type UserBadge = {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  badge: Badge;
};

export type ToolCollection = {
  id: string;
  user_id: string;
  tool_slug: string;
  discovered_at: string;
  category_tags: string[];
};
