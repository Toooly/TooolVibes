import {
  activePersonalStacks,
  deriveResurfaceSignals,
  listPipelineItems,
} from "@/lib/account/workspace-pipeline";
import { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";
import type { WorkspaceStateV1, WorkspaceToolState } from "@/lib/discovery/types";

export type WorkspaceHud = {
  saved: number;
  compare: number;
  compareMax: number;
  stacks: number;
  using: number;
  deciding: number;
  traces: number;
  pinned: number;
};

export type WorkspaceHudInstrument = {
  id: "saved" | "compare" | "stacks" | "using" | "deciding";
  label: string;
  value: string;
  href: string;
  active: boolean;
};

function hasJournalTrace(tool: WorkspaceToolState | undefined) {
  return Boolean(
    tool?.decision?.outcome ||
      tool?.note ||
      tool?.useCase ||
      (tool?.alternatives && tool.alternatives.length > 0) ||
      tool?.pinned ||
      tool?.usage ||
      tool?.replacedBy ||
      tool?.compareObjective,
  );
}

export function readWorkspaceHud(state: WorkspaceStateV1): WorkspaceHud {
  const items = listPipelineItems(state);
  const deciding = new Set(
    deriveResurfaceSignals(state)
      .filter(
        (item) =>
          item.kind === "deferred_due" ||
          item.kind === "top_without_verdict" ||
          item.kind === "selected_follow_up",
      )
      .map((item) => item.slug)
      .filter((slug): slug is string => Boolean(slug)),
  );

  return {
    saved: state.saved.slugs.length,
    compare: state.compare.slugs.length,
    compareMax: MAX_COMPARE_TOOLS,
    stacks: activePersonalStacks(state).length,
    using: items.filter((item) => item.usage === "using").length,
    deciding: deciding.size,
    traces: Object.values(state.toolStates).filter((tool) => hasJournalTrace(tool)).length,
    pinned: items.filter((item) => item.pinned).length,
  };
}

export function workspaceHudInstruments(hud: WorkspaceHud): WorkspaceHudInstrument[] {
  return [
    {
      id: "saved",
      label: "Salvati",
      value: String(hud.saved),
      href: "/account?view=biblioteca",
      active: hud.saved > 0,
    },
    {
      id: "compare",
      label: "Confronto",
      value: `${hud.compare}/${hud.compareMax}`,
      href: "/compare",
      active: hud.compare > 0,
    },
    {
      id: "stacks",
      label: "Stack",
      value: String(hud.stacks),
      href: "/account?view=stack",
      active: hud.stacks > 0,
    },
    {
      id: "using",
      label: "In uso",
      value: String(hud.using),
      href: "/account?view=biblioteca",
      active: hud.using > 0,
    },
    {
      id: "deciding",
      label: "Da decidere",
      value: String(hud.deciding),
      href: "/account?view=decisioni",
      active: hud.deciding > 0,
    },
  ];
}
