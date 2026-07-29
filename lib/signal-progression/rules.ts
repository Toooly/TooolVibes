import "server-only";

import type { RewardTier } from "@/lib/rewards/contracts";

export const SIGNAL_RULES_VERSION = "signal-progression-v1";

export const SIGNAL_EVENT_TYPES = [
  "tool_saved_first_time",
  "tool_saved",
  "tool_unsaved",
  "comparison_started",
  "comparison_completed",
  "analysis_read",
  "collection_opened",
  "collection_progressed",
  "radar_returned",
  "profile_completed",
  "mission_completed",
  "achievement_unlocked",
  "level_advanced",
] as const;

export type SignalEventType = (typeof SIGNAL_EVENT_TYPES)[number];

export type SignalRewardRule = {
  eventType: SignalEventType;
  authRequired: true;
  /** SP amount decided server-side only */
  spDelta: number;
  tier: RewardTier;
  reasonCode: string;
  title: string;
  description: string;
  announcement: string;
  priority: number;
  onceOnly: boolean;
  /** Max awards per UTC day for this event type (grant count with sp>0) */
  dailyEventCap: number | null;
  cooldownSeconds: number | null;
  /** Allowed context keys (strict) */
  allowedContextKeys: readonly string[];
  /** Required context keys */
  requiredContextKeys: readonly string[];
  /** Builds durable dedupe key from user + context */
  buildDedupeKey: (userId: string, context: Record<string, string>) => string;
};

const slugKey = ["slug"] as const;
const collectionKeys = ["slug"] as const;
const collectionStepKeys = ["slug", "step"] as const;
const compareKeys = ["setHash"] as const;

export const SIGNAL_REWARD_RULES: Record<SignalEventType, SignalRewardRule> = {
  tool_saved_first_time: {
    eventType: "tool_saved_first_time",
    authRequired: true,
    spDelta: 40,
    tier: "micro",
    reasonCode: "first_signal",
    title: "Prima traccia",
    description: "Hai salvato il tuo primo tool.",
    announcement: "Micro ricompensa: prima traccia salvata.",
    priority: 40,
    onceOnly: true,
    dailyEventCap: 1,
    cooldownSeconds: null,
    allowedContextKeys: slugKey,
    requiredContextKeys: slugKey,
    buildDedupeKey: (userId) => `save_first:${userId}`,
  },
  tool_saved: {
    eventType: "tool_saved",
    authRequired: true,
    spDelta: 5,
    tier: "micro",
    reasonCode: "tool_saved",
    title: "Tool salvato",
    description: "Hai aggiunto un tool alla shortlist.",
    announcement: "Micro ricompensa: tool salvato.",
    priority: 10,
    onceOnly: true,
    dailyEventCap: 3,
    cooldownSeconds: null,
    allowedContextKeys: slugKey,
    requiredContextKeys: slugKey,
    buildDedupeKey: (userId, ctx) => `save:${userId}:${ctx.slug}`,
  },
  tool_unsaved: {
    eventType: "tool_unsaved",
    authRequired: true,
    spDelta: 0,
    tier: "interaction",
    reasonCode: "tool_unsaved",
    title: "Tool rimosso",
    description: "Rimozione registrata senza punti.",
    announcement: "Nessun punto per la rimozione.",
    priority: 0,
    onceOnly: false,
    dailyEventCap: null,
    cooldownSeconds: 0,
    allowedContextKeys: slugKey,
    requiredContextKeys: slugKey,
    buildDedupeKey: (userId, ctx) =>
      `unsave:${userId}:${ctx.slug}:${new Date().toISOString().slice(0, 10)}`,
  },
  comparison_started: {
    eventType: "comparison_started",
    authRequired: true,
    spDelta: 0,
    tier: "interaction",
    reasonCode: "comparison_started",
    title: "Confronto avviato",
    description: "Hai iniziato un confronto.",
    announcement: "Confronto avviato.",
    priority: 0,
    onceOnly: false,
    dailyEventCap: null,
    cooldownSeconds: null,
    allowedContextKeys: compareKeys,
    requiredContextKeys: compareKeys,
    buildDedupeKey: (userId, ctx) => `cmp_start:${userId}:${ctx.setHash}`,
  },
  comparison_completed: {
    eventType: "comparison_completed",
    authRequired: true,
    spDelta: 15,
    tier: "micro",
    reasonCode: "comparison_completed",
    title: "Confronto chiuso",
    description: "Hai completato un confronto significativo.",
    announcement: "Micro ricompensa: confronto completato.",
    priority: 30,
    onceOnly: true,
    dailyEventCap: 2,
    cooldownSeconds: null,
    allowedContextKeys: compareKeys,
    requiredContextKeys: compareKeys,
    buildDedupeKey: (userId, ctx) => `cmp_done:${userId}:${ctx.setHash}`,
  },
  analysis_read: {
    eventType: "analysis_read",
    authRequired: true,
    spDelta: 10,
    tier: "micro",
    reasonCode: "analysis_read",
    title: "Lettura profonda",
    description: "Hai esplorato una scheda tool in profondità.",
    announcement: "Micro ricompensa: lettura scheda.",
    priority: 15,
    onceOnly: true,
    dailyEventCap: 5,
    cooldownSeconds: null,
    allowedContextKeys: slugKey,
    requiredContextKeys: slugKey,
    buildDedupeKey: (userId, ctx) => `read:${userId}:${ctx.slug}`,
  },
  collection_opened: {
    eventType: "collection_opened",
    authRequired: true,
    spDelta: 10,
    tier: "micro",
    reasonCode: "collection_opened",
    title: "Raccolta aperta",
    description: "Hai aperto una raccolta curata.",
    announcement: "Micro ricompensa: raccolta aperta.",
    priority: 15,
    onceOnly: true,
    dailyEventCap: 5,
    cooldownSeconds: null,
    allowedContextKeys: collectionKeys,
    requiredContextKeys: collectionKeys,
    buildDedupeKey: (userId, ctx) => `col_open:${userId}:${ctx.slug}`,
  },
  collection_progressed: {
    eventType: "collection_progressed",
    authRequired: true,
    spDelta: 25,
    tier: "micro",
    reasonCode: "collection_progressed",
    title: "Percorso avanzato",
    description: "Hai avanzato in una raccolta curata.",
    announcement: "Micro ricompensa: progresso raccolta.",
    priority: 25,
    onceOnly: true,
    dailyEventCap: 3,
    cooldownSeconds: null,
    allowedContextKeys: collectionStepKeys,
    requiredContextKeys: collectionStepKeys,
    buildDedupeKey: (userId, ctx) =>
      `col_prog:${userId}:${ctx.slug}:${ctx.step}`,
  },
  radar_returned: {
    eventType: "radar_returned",
    authRequired: true,
    spDelta: 8,
    tier: "micro",
    reasonCode: "radar_returned",
    title: "Ritorno al radar",
    description: "Hai consultato il radar oggi.",
    announcement: "Micro ricompensa: ritorno al radar.",
    priority: 12,
    onceOnly: false,
    dailyEventCap: 1,
    cooldownSeconds: 86400,
    allowedContextKeys: ["date"] as const,
    requiredContextKeys: ["date"] as const,
    buildDedupeKey: (userId, ctx) => `radar:${userId}:${ctx.date}`,
  },
  profile_completed: {
    eventType: "profile_completed",
    authRequired: true,
    spDelta: 30,
    tier: "micro",
    reasonCode: "profile_completed",
    title: "Profilo pronto",
    description: "Hai completato il contesto del profilo.",
    announcement: "Micro ricompensa: profilo completato.",
    priority: 35,
    onceOnly: true,
    dailyEventCap: 1,
    cooldownSeconds: null,
    allowedContextKeys: [] as const,
    requiredContextKeys: [] as const,
    buildDedupeKey: (userId) => `profile:${userId}`,
  },
  mission_completed: {
    eventType: "mission_completed",
    authRequired: true,
    spDelta: 0,
    tier: "interaction",
    reasonCode: "mission_completed",
    title: "Missione",
    description: "Riservato alle missioni future.",
    announcement: "Evento missione registrato.",
    priority: 0,
    onceOnly: true,
    dailyEventCap: null,
    cooldownSeconds: null,
    allowedContextKeys: ["missionId"] as const,
    requiredContextKeys: ["missionId"] as const,
    buildDedupeKey: (userId, ctx) => `mission:${userId}:${ctx.missionId}`,
  },
  achievement_unlocked: {
    eventType: "achievement_unlocked",
    authRequired: true,
    spDelta: 0,
    tier: "achievement",
    reasonCode: "achievement_unlocked",
    title: "Achievement",
    description: "Riservato al motore achievement futuro.",
    announcement: "Achievement registrato.",
    priority: 80,
    onceOnly: true,
    dailyEventCap: null,
    cooldownSeconds: null,
    allowedContextKeys: ["code"] as const,
    requiredContextKeys: ["code"] as const,
    buildDedupeKey: (userId, ctx) => `ach:${userId}:${ctx.code}`,
  },
  level_advanced: {
    eventType: "level_advanced",
    authRequired: true,
    spDelta: 0,
    tier: "milestone",
    reasonCode: "level_advanced",
    title: "Livello",
    description: "Riservato al motore livelli futuro.",
    announcement: "Avanzamento livello registrato.",
    priority: 90,
    onceOnly: true,
    dailyEventCap: null,
    cooldownSeconds: null,
    allowedContextKeys: ["level"] as const,
    requiredContextKeys: ["level"] as const,
    buildDedupeKey: (userId, ctx) => `lvl:${userId}:${ctx.level}`,
  },
};

export const GLOBAL_DAILY_SP_CAP = 120;

export function isSignalEventType(value: string): value is SignalEventType {
  return (SIGNAL_EVENT_TYPES as readonly string[]).includes(value);
}

export function getSignalRule(eventType: SignalEventType): SignalRewardRule {
  return SIGNAL_REWARD_RULES[eventType];
}
