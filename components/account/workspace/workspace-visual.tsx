"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useId, type ReactNode } from "react";

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
  const material = useId();
  return (
    <div className="tv-empty-motif" data-variant={variant} aria-hidden="true">
      <svg viewBox="0 0 144 108" focusable="false">
        <defs>
          <linearGradient id={material} x2="1" y2="1">
            <stop stopColor="var(--tv-color-violet-300)" stopOpacity="0.2" />
            <stop offset="1" stopColor="var(--tv-surface-raised)" />
          </linearGradient>
        </defs>
        <g className="tv-empty-motif__object" fill={`url(#${material})`} stroke="var(--tv-material-edge)">
          {variant === "home" ? <>
            <rect x="22" y="32" width="76" height="62" rx="12" />
            <rect x="42" y="16" width="78" height="70" rx="12" />
            <path className="tv-empty-motif__accent" d="M91 17v28l-8-6-8 6V17" />
            <path className="tv-empty-motif__trace" d="M57 59h46M57 69h30" />
          </> : null}
          {variant === "library" ? <>
            <rect x="18" y="42" width="30" height="48" rx="7" />
            <rect x="56" y="23" width="34" height="67" rx="8" />
            <rect x="98" y="35" width="27" height="55" rx="7" />
            <path className="tv-empty-motif__accent" d="M65 24v23l8-6 8 6V24" />
            <path className="tv-empty-motif__trace" d="M13 96h118M26 77h14M106 77h11" />
          </> : null}
          {variant === "stacks" ? <>
            <path d="m18 68 53-19 56 19-54 21Z" />
            <path d="m18 51 53-19 56 19-54 21Z" />
            <path d="m18 34 53-19 56 19-54 21Z" />
            <path className="tv-empty-motif__accent" d="m39 34 32-11 34 11-32 12Z" />
            <path className="tv-empty-motif__trace" d="M73 55v17m0 17v9" />
          </> : null}
          {variant === "journal" ? <>
            <path d="M73 25C53 15 35 17 19 24v63c16-7 34-9 54 1Z" />
            <path d="M73 25c20-10 38-8 54-1v63c-16-7-34-9-54 1Z" />
            <path className="tv-empty-motif__accent" d="M73 25v63m24-66v25l8-5 8 5V22" />
            <path className="tv-empty-motif__trace" d="m32 43 27 1m-27 12 27 1m-27 12 17 1m39-8 25 1m-25 12 16 1" />
          </> : null}
          {variant === "signal" ? <>
            <rect x="20" y="22" width="106" height="66" rx="13" />
            <path className="tv-empty-motif__trace" d="M34 43h77M34 65h77M54 34v41m36-41v41" />
            <path className="tv-empty-motif__accent" d="m34 64 19-12 17 8 18-22 24 10" />
            <circle className="tv-empty-motif__point" cx="88" cy="38" r="3" />
          </> : null}
        </g>
      </svg>
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
    <LocalizedAttributes><span
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
    </span></LocalizedAttributes>
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
          <p className="tv-story__kicker"><LocalizedText>{"Confronto"}</LocalizedText></p>
          <ul className="tv-story__cast">
            {cast.map((item) => (
              <li key={item} className="tv-story__cast-item">
                <WorkspaceCatalogMark catalog={catalog} slug={item} size="sm" />
                <span><LocalizedText>{toolName(catalog, item)}</LocalizedText></span>
              </li>
            ))}
          </ul>
        </li>
      ) : null}

      <li className="tv-story__act" data-act={outcome ?? tool.stage ?? "saved"}>
        <p className="tv-story__kicker">
          <LocalizedText>{outcome ? OUTCOME_STATE_LABELS[outcome] : STAGE_LABELS[(tool.stage ?? "saved") as ShortlistStage]}</LocalizedText>
        </p>
        <div className="tv-story__hero">
          <WorkspaceCatalogMark catalog={catalog} slug={slug} size="md" />
          <span>
            <strong><LocalizedText>{toolName(catalog, slug)}</LocalizedText></strong>
            {outcomeDate ? <span className="tv-story__when"><LocalizedText>{outcomeDate}</LocalizedText></span> : null}
          </span>
        </div>
        {tool.useCase ? <p className="tv-story__context"><LocalizedText>{tool.useCase}</LocalizedText></p> : null}
        {objective ? <p className="tv-story__context"><LocalizedText>{objective}</LocalizedText></p> : null}
        {why ? <p className="tv-story__why"><LocalizedText>{why}</LocalizedText></p> : null}
      </li>

      {usage && usage !== "replaced" ? (
        <li className="tv-story__act" data-act={usage}>
          <p className="tv-story__kicker"><LocalizedText>{USAGE_STATE_LABELS[usage]}</LocalizedText></p>
          <div className="tv-story__hero">
            <WorkspaceCatalogMark catalog={catalog} slug={slug} size="sm" />
            <span><LocalizedText>{toolName(catalog, slug)}</LocalizedText></span>
            {formatWorkspaceDate(tool.updatedAt) ? (
              <span className="tv-story__when"><LocalizedText>{formatWorkspaceDate(tool.updatedAt)}</LocalizedText></span>
            ) : null}
          </div>
        </li>
      ) : null}

      {usage === "replaced" && tool.replacedBy ? (
        <li className="tv-story__act" data-act="replaced">
          <p className="tv-story__kicker"><LocalizedText>{"Sostituito da"}</LocalizedText></p>
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
      <span><LocalizedText>{toolName(catalog, fromSlug)}</LocalizedText></span>
      <span className="tv-replace__arrow" aria-hidden="true">
        →
      </span>
      <WorkspaceCatalogMark catalog={catalog} slug={toSlug} size="sm" />
      <span><LocalizedText>{toolName(catalog, toSlug)}</LocalizedText></span>
      {when ? <span className="tv-trace__detail"><LocalizedText>{when}</LocalizedText></span> : null}
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
