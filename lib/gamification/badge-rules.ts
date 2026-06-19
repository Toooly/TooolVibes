import type { Badge, BadgeContext, UserBadge } from "@/lib/gamification/types";

export type { BadgeContext } from "@/lib/gamification/types";

export const INITIAL_BADGES: Badge[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    code: "first_scan",
    name: "Primo Scan",
    description: "Completa la tua prima missione Radar",
    icon: "Radar",
    requirement_type: "missions_completed",
    requirement_value: 1,
    xp_bonus: 50,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    code: "arena_rookie",
    name: "Esordiente",
    description: "Vinci la tua prima sfida di confronto",
    icon: "Swords",
    requirement_type: "battles_played",
    requirement_value: 1,
    xp_bonus: 50,
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    code: "arena_veteran",
    name: "Veterano",
    description: "Vinci 10 sfide di confronto",
    icon: "Trophy",
    requirement_type: "battles_played",
    requirement_value: 10,
    xp_bonus: 150,
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    code: "radar_prophet",
    name: "Profeta",
    description: "Azzecca 5 predizioni Radar",
    icon: "Sparkles",
    requirement_type: "predictions_correct",
    requirement_value: 5,
    xp_bonus: 200,
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    code: "shortlist_guardian",
    name: "Guardiano",
    description: "Colleziona 20 tool",
    icon: "Bookmark",
    requirement_type: "tools_collected",
    requirement_value: 20,
    xp_bonus: 100,
  },
  {
    id: "00000000-0000-0000-0000-000000000006",
    code: "seven_streak",
    name: "Sette Giorni",
    description: "Raggiungi una streak di 7 giorni",
    icon: "Flame",
    requirement_type: "streak_days",
    requirement_value: 7,
    xp_bonus: 200,
  },
];

export function evaluateBadges(
  context: BadgeContext,
  userBadges: UserBadge[],
  availableBadges: Badge[]
): Badge[] {
  const ownedCodes = new Set(userBadges.map((ub) => ub.badge.code));
  return availableBadges.filter((badge) => {
    if (ownedCodes.has(badge.code)) return false;
    const value = context[badge.requirement_type] ?? 0;
    return value >= badge.requirement_value;
  });
}
