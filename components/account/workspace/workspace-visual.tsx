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
import { getCompareObjectiveLabel } from "@/lib/compare/compare-objective";
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

export function pipelineTone(column: string): StatusTone {
  if (column === "scelto") return "selected";
  if (column === "scartato") return "rejected";
  if (column === "rimandato") return "deferred";
  if (column === "da_valutare") return "review";
  if (column === "candidato") return "top";
  return "saved";
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
        <span className="tv-compose__seg" data-tone="review" style={{ flex: evaluating }} />
      ) : null}
      {selected > 0 ? (
        <span className="tv-compose__seg" data-tone="selected" style={{ flex: selected }} />
      ) : null}
      {using > 0 ? (
        <span className="tv-compose__seg" data-tone="using" style={{ flex: using }} />
      ) : null}
    </span>
  );
}

function noteSnippet(note: string | null | undefined) {
  const value = note?.trim();
  if (!value) return null;
  if (value.length <= 160) return value;
  return `${value.slice(0, 157).trimEnd()}…`;
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
  if (!tool) return null;
  const alternatives = tool.alternatives ?? [];
  const cast = Array.from(new Set([slug, ...alternatives]));
  const outcome = tool.decision?.outcome ?? null;
  const outcomeDate = formatWorkspaceDate(tool.decision?.updatedAt);
  const why = noteSnippet(tool.note);
  const objective = tool.compareObjective
    ? getCompareObjectiveLabel(tool.compareObjective)
    : null;
  const usage = tool.usage ?? null;
  const hasStory =
    alternatives.length > 0 ||
    Boolean(outcome) ||
    Boolean(usage) ||
    Boolean(tool.replacedBy) ||
    Boolean(why) ||
    Boolean(tool.useCase);

  if (!hasStory) return null;

  return (
    <ol className="tv-story">
      {cast.length > 1 ? (
        <li className="tv-story__act" data-act="compare">
          <p className="tv-story__kicker">Confronto</p>
          <ul className="tv-story__cast">
            {cast.map((item) => (
              <li key={item} className="tv-story__cast-item">
                <WorkspaceCatalogMark catalog={catalog} slug={item} size="sm" />
                <span>{toolName(catalog, item)}</span>
              </li>
            ))}
          </ul>
        </li>
      ) : null}

      <li className="tv-story__act" data-act={outcome ?? tool.stage ?? "saved"}>
        <p className="tv-story__kicker">
          {outcome ? OUTCOME_STATE_LABELS[outcome] : STAGE_LABELS[(tool.stage ?? "saved") as ShortlistStage]}
        </p>
        <div className="tv-story__hero">
          <WorkspaceCatalogMark catalog={catalog} slug={slug} size="md" />
          <span>
            <strong>{toolName(catalog, slug)}</strong>
            {outcomeDate ? <span className="tv-story__when">{outcomeDate}</span> : null}
          </span>
        </div>
        {tool.useCase ? <p className="tv-story__context">{tool.useCase}</p> : null}
        {objective ? <p className="tv-story__context">{objective}</p> : null}
        {why ? <p className="tv-story__why">{why}</p> : null}
      </li>

      {usage && usage !== "replaced" ? (
        <li className="tv-story__act" data-act={usage}>
          <p className="tv-story__kicker">{USAGE_STATE_LABELS[usage]}</p>
          <div className="tv-story__hero">
            <WorkspaceCatalogMark catalog={catalog} slug={slug} size="sm" />
            <span>{toolName(catalog, slug)}</span>
            {formatWorkspaceDate(tool.updatedAt) ? (
              <span className="tv-story__when">{formatWorkspaceDate(tool.updatedAt)}</span>
            ) : null}
          </div>
        </li>
      ) : null}

      {usage === "replaced" && tool.replacedBy ? (
        <li className="tv-story__act" data-act="replaced">
          <p className="tv-story__kicker">Sostituito da</p>
          <WorkspaceReplacement
            catalog={catalog}
            fromSlug={slug}
            toSlug={tool.replacedBy}
            at={tool.updatedAt}
          />
        </li>
      ) : null}
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
      <WorkspaceCatalogMark catalog={catalog} slug={fromSlug} size="sm" />
      <span>{toolName(catalog, fromSlug)}</span>
      <span className="tv-replace__arrow" aria-hidden="true">
        →
      </span>
      <WorkspaceCatalogMark catalog={catalog} slug={toSlug} size="sm" />
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

export function usageTone(usage: WorkspaceUsage): StatusTone {
  return usage;
}
