import "server-only";

import type { RewardTier } from "@/lib/rewards/contracts";
import type { SignalEventType } from "@/lib/signal-progression/rules";
import { SIGNAL_RULES_VERSION } from "@/lib/signal-progression/rules";

export const SIGNAL_MISSION_RULES_VERSION = SIGNAL_RULES_VERSION;
export const SIGNAL_MISSION_CATALOG_VERSION = "signal-missions-v1";

export const SIGNAL_ONBOARDING_MISSION_IDS = [
  "save_first_tool",
  "complete_first_comparison",
  "record_first_decision",
  "create_useful_stack",
  "defer_with_date",
  "revisit_due_decision",
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
    id: "record_first_decision",
    title: "Registra la prima decisione",
    description: "Scegli o scarta un tool e lascia la scelta nello spazio di lavoro.",
    completesOn: "decision_recorded",
    order: 3,
    rewardSp: 20,
    rewardTier: "achievement",
    reasonCode: "mission_record_first_decision",
    rewardTitle: "Missione: prima decisione",
    rewardDescription: "Hai registrato una scelta nello spazio di lavoro.",
    announcement: "Missione completata: prima decisione.",
    priority: 73,
  },
  {
    id: "create_useful_stack",
    title: "Crea uno stack utile",
    description: "Metti almeno tre tool in uno stack personale attivo.",
    completesOn: "useful_stack",
    order: 4,
    rewardSp: 25,
    rewardTier: "achievement",
    reasonCode: "mission_create_useful_stack",
    rewardTitle: "Missione: stack utile",
    rewardDescription: "Hai uno stack con almeno tre tool.",
    announcement: "Missione completata: stack utile.",
    priority: 74,
  },
  {
    id: "defer_with_date",
    title: "Rimanda con una data",
    description: "Rimanda una decisione e imposta quando riprenderla.",
    completesOn: "defer_with_revisit",
    order: 5,
    rewardSp: 15,
    rewardTier: "achievement",
    reasonCode: "mission_defer_with_date",
    rewardTitle: "Missione: rimando con data",
    rewardDescription: "Hai lasciato una decisione aperta con una data di ritorno.",
    announcement: "Missione completata: rimando con data.",
    priority: 75,
  },
  {
    id: "revisit_due_decision",
    title: "Riprendi una decisione in scadenza",
    description: "Chiudi una decisione che avevi rimandato.",
    completesOn: "decision_revisited",
    order: 6,
    rewardSp: 20,
    rewardTier: "achievement",
    reasonCode: "mission_revisit_due_decision",
    rewardTitle: "Missione: decisione ripresa",
    rewardDescription: "Hai chiuso una decisione che era rimandata.",
    announcement: "Missione completata: decisione ripresa.",
    priority: 76,
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
