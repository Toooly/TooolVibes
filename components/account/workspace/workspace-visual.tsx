"use client";

import type { ReactNode } from "react";

import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";
import type {
  WorkspaceDecisionOutcome,
  WorkspaceToolState,
  WorkspaceUsage,
} from "@/lib/discovery/types";
import {
  OUTCOME_STATE_LABELS,
  STAGE_LABELS,
  USAGE_STATE_LABELS,
} from "@/lib/account/workspace-lifecycle";
import type { ShortlistStage } from "@/lib/types/tool";

import { formatWorkspaceDate } from "./workspace-model";
import { WorkspaceCatalogMark } from "./workspace-tool-mark";
import { toolName } from "./workspace-tool-name";

export type StatusTone =
  | "saved"
  | "review"
  | "top"
  | "selected"
  | "rejected"
  | "deferred"
  | "using"
  | "stopped"
  | "replaced"
  | "pin"
  | "note"
  | "revisit"
  | "stack";

export function WorkspaceChip({
  tone,
  children,
}: {
  tone: StatusTone;
  children: ReactNode;
}) {
  return (
    <span className="tv-chip" data-tone={tone}>
      {children}
    </span>
  );
}

export function pipelineTone(
  column: string,
): StatusTone {
  if (column === "scelto") return "selected";
  if (column === "scartato") return "rejected";
  if (column === "rimandato") return "deferred";
  if (column === "da_valutare") return "review";
  if (column === "candidato") return "top";
  return "saved";
}

export function usageTone(usage: WorkspaceUsage): StatusTone {
  return usage;
}

export function WorkspaceEmptyMotif({
  variant,
}: {
  variant: "home" | "library" | "stacks" | "journal" | "signal";
}) {
  return (
    <div className="tv-empty-motif" data-variant={variant} aria-hidden="true">
      <span className="tv-empty-motif__ring" />
      <span className="tv-empty-motif__ring tv-empty-motif__ring--2" />
      <span className="tv-empty-motif__marks">
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}

export function WorkspaceCompositionBar({
  evaluating,
  selected,
  using,
}: {
  evaluating: number;
  selected: number;
  using: number;
}) {
  const total = evaluating + selected + using;
  if (total === 0) return null;
  return (
    <span
      className="tv-compose"
      aria-hidden="true"
      title={`${evaluating} in valutazione · ${selected} scelti · ${using} in uso`}
    >
      {evaluating > 0 ? (
        <span
          className="tv-compose__seg"
          data-tone="review"
          style={{ flex: evaluating }}
        />
      ) : null}
      {selected > 0 ? (
        <span
          className="tv-compose__seg"
          data-tone="selected"
          style={{ flex: selected }}
        />
      ) : null}
      {using > 0 ? (
        <span
          className="tv-compose__seg"
          data-tone="using"
          style={{ flex: using }}
        />
      ) : null}
    </span>
  );
}

type TraceStep = {
  key: string;
  label: string;
  tone: StatusTone;
  detail?: string | null;
};

export function buildDecisionTrace(input: {
  catalog: readonly PublicToolCatalogItem[];
  slug: string;
  tool: WorkspaceToolState | undefined;
}): TraceStep[] {
  const tool = input.tool;
  if (!tool) return [];
  const steps: TraceStep[] = [];
  const alternatives = tool.alternatives ?? [];
  if (alternatives.length > 0) {
    steps.push({
      key: "alts",
      label: "Confronto",
      tone: "review",
      detail: [toolName(input.catalog, input.slug), ...alternatives.map((slug) => toolName(input.catalog, slug))].join(" · "),
    });
  }
  if (tool.decision?.outcome) {
    steps.push({
      key: "outcome",
      label: OUTCOME_STATE_LABELS[tool.decision.outcome],
      tone: tool.decision.outcome,
      detail: formatWorkspaceDate(tool.decision.updatedAt),
    });
  } else {
    steps.push({
      key: "stage",
      label: STAGE_LABELS[(tool.stage ?? "saved") as ShortlistStage],
      tone: (tool.stage ?? "saved") as StatusTone,
    });
  }
  if (tool.usage && tool.usage !== "replaced") {
    steps.push({
      key: "usage",
      label: USAGE_STATE_LABELS[tool.usage],
      tone: tool.usage,
      detail: formatWorkspaceDate(tool.updatedAt),
    });
  }
  if (tool.usage === "replaced" && tool.replacedBy) {
    steps.push({
      key: "replaced",
      label: `Sostituito da ${toolName(input.catalog, tool.replacedBy)}`,
      tone: "replaced",
    });
  }
  return steps;
}

export function WorkspaceDecisionTrace({
  catalog,
  slug,
  tool,
}: {
  catalog: readonly PublicToolCatalogItem[];
  slug: string;
  tool: WorkspaceToolState | undefined;
}) {
  const steps = buildDecisionTrace({ catalog, slug, tool });
  if (steps.length === 0) return null;
  return (
    <ol className="tv-trace">
      {steps.map((step, index) => (
        <li key={step.key} className="tv-trace__step">
          {index > 0 ? <span className="tv-trace__arrow" aria-hidden="true" /> : null}
          <span className="tv-chip" data-tone={step.tone}>
            {step.label}
          </span>
          {step.detail ? <span className="tv-trace__detail">{step.detail}</span> : null}
        </li>
      ))}
    </ol>
  );
}

export function WorkspaceReplacement({
  catalog,
  fromSlug,
  toSlug,
  at,
}: {
  catalog: readonly PublicToolCatalogItem[];
  fromSlug: string;
  toSlug: string;
  at?: string | null;
}) {
  const when = formatWorkspaceDate(at);
  return (
    <p className="tv-replace">
      <WorkspaceCatalogMark catalog={catalog} slug={fromSlug} size="xs" />
      <span>{toolName(catalog, fromSlug)}</span>
      <span className="tv-replace__arrow" aria-hidden="true">
        →
      </span>
      <WorkspaceCatalogMark catalog={catalog} slug={toSlug} size="xs" />
      <span>{toolName(catalog, toSlug)}</span>
      {when ? <span className="tv-trace__detail">{when}</span> : null}
    </p>
  );
}

export function stageChip(
  stage: ShortlistStage,
  outcome: WorkspaceDecisionOutcome | null,
) {
  if (outcome) {
    return { tone: outcome as StatusTone, label: OUTCOME_STATE_LABELS[outcome] };
  }
  return { tone: stage as StatusTone, label: STAGE_LABELS[stage] };
}
