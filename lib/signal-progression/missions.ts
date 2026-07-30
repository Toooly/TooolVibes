import "server-only";

import type { RewardTier } from "@/lib/rewards/contracts";
import type { SignalEventType } from "@/lib/signal-progression/rules";
import { SIGNAL_RULES_VERSION } from "@/lib/signal-progression/rules";

export const SIGNAL_MISSION_RULES_VERSION = SIGNAL_RULES_VERSION;
export const SIGNAL_MISSION_CATALOG_VERSION = "signal-missions-v1";

export const SIGNAL_ONBOARDING_MISSION_IDS = [
  "save_first_tool",
  "complete_first_comparison",
  "explore_first_collection",
  "return_to_radar",
  "complete_profile_context",
] as const;

export type SignalMissionId = (typeof SIGNAL_ONBOARDING_MISSION_IDS)[number];

export type SignalMissionDefinition = {
  id: SignalMissionId;
  title: string;
  description: string;
  completesOn: SignalEventType;
  order: number;
  rewardSp: number;
  rewardTier: RewardTier;
  reasonCode: string;
  rewardTitle: string;
  rewardDescription: string;
  announcement: string;
  badgeId?: string;
  priority: number;
};

export const SIGNAL_ONBOARDING_MISSIONS: readonly SignalMissionDefinition[] = [
  {
    id: "save_first_tool",
    title: "Salva il primo tool",
    description: "Aggiungi un tool alla shortlist per iniziare la tua mappa.",
    completesOn: "tool_saved_first_time",
    order: 1,
    rewardSp: 20,
    rewardTier: "achievement",
    reasonCode: "mission_save_first_tool",
    rewardTitle: "Missione: primo salvataggio",
    rewardDescription: "Hai tracciato il primo tool nella shortlist.",
    announcement: "Missione completata: salva il primo tool.",
    badgeId: "first_signal",
    priority: 70,
  },
  {
    id: "complete_first_comparison",
    title: "Completa il primo confronto",
    description: "Chiudi un confronto con una decisione esplicita.",
    completesOn: "comparison_completed",
    order: 2,
    rewardSp: 25,
    rewardTier: "achievement",
    reasonCode: "mission_complete_first_comparison",
    rewardTitle: "Missione: primo confronto",
    rewardDescription: "Hai concluso un confronto significativo.",
    announcement: "Missione completata: primo confronto.",
    badgeId: "first_verdict",
    priority: 72,
  },
  {
    id: "explore_first_collection",
    title: "Esplora una selezione",
    description: "Avanza in una raccolta curata oltre la semplice apertura pagina.",
    completesOn: "collection_progressed",
    order: 3,
    rewardSp: 20,
    rewardTier: "achievement",
    reasonCode: "mission_explore_first_collection",
    rewardTitle: "Missione: prima selezione",
    rewardDescription: "Hai percorso uno step in una raccolta curata.",
    announcement: "Missione completata: esplora una selezione.",
    badgeId: "pathfinder",
    priority: 71,
  },
  {
    id: "return_to_radar",
    title: "Leggi i segnali del Radar",
    description: "Consulta il Radar quando i segnali sono disponibili.",
    completesOn: "radar_returned",
    order: 4,
    rewardSp: 15,
    rewardTier: "achievement",
    reasonCode: "mission_return_to_radar",
    rewardTitle: "Missione: ritorno al Radar",
    rewardDescription: "Hai letto i segnali del Radar.",
    announcement: "Missione completata: radar.",
    priority: 68,
  },
  {
    id: "complete_profile_context",
    title: "Completa il tuo contesto",
    description: "Indica focus e obiettivo per migliorare i suggerimenti.",
    completesOn: "profile_completed",
    order: 5,
    rewardSp: 25,
    rewardTier: "achievement",
    reasonCode: "mission_complete_profile_context",
    rewardTitle: "Missione: contesto profilo",
    rewardDescription: "Hai definito il contesto del profilo.",
    announcement: "Missione completata: contesto profilo.",
    badgeId: "profile_set",
    priority: 74,
  },
] as const;

export type SignalEngagementEventRow = {
  event_type: string;
  context?: Record<string, unknown> | null;
};

export function getMissionById(id: string): SignalMissionDefinition | undefined {
  return SIGNAL_ONBOARDING_MISSIONS.find((m) => m.id === id);
}

export function missionsCompletedByEvent(
  eventType: SignalEventType,
): SignalMissionDefinition[] {
  return SIGNAL_ONBOARDING_MISSIONS.filter((m) => m.completesOn === eventType);
}

export function publicMissionCatalog() {
  return SIGNAL_ONBOARDING_MISSIONS.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    order: m.order,
    rewardSp: m.rewardSp,
  }));
}

export function projectSignalMissions(
  rows: SignalEngagementEventRow[],
): Array<{
  id: string;
  title: string;
  description: string;
  status: "locked" | "active" | "completed";
  progress: number;
  target: number;
  category: "onboarding";
}> {
  const types = new Set(rows.map((r) => r.event_type));
  let currentSet = false;
  return SIGNAL_ONBOARDING_MISSIONS.map((m) => {
    const done =
      types.has(m.completesOn) ||
      (m.completesOn === "tool_saved_first_time" &&
        (types.has("tool_saved_first_time") || types.has("tool_saved")));
    if (done) {
      return {
        id: m.id,
        title: m.title,
        description: m.description,
        status: "completed" as const,
        progress: 1,
        target: 1,
        category: "onboarding" as const,
      };
    }
    if (!currentSet) {
      currentSet = true;
      return {
        id: m.id,
        title: m.title,
        description: m.description,
        status: "active" as const,
        progress: 0,
        target: 1,
        category: "onboarding" as const,
      };
    }
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      status: "locked" as const,
      progress: 0,
      target: 1,
      category: "onboarding" as const,
    };
  });
}
