"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  deferWorkspaceTool,
  markWorkspaceToolReplaced,
  markWorkspaceToolStopped,
  markWorkspaceToolUsing,
  setWorkspaceDecision,
  setWorkspaceNote,
  setWorkspacePinned,
  setWorkspaceUseCase,
} from "@/lib/account/workspace-actions";
import {
  OUTCOME_STATE_LABELS,
  USAGE_ACTION_LABELS,
  USAGE_STATE_LABELS,
  formatRevisitLine,
} from "@/lib/account/workspace-lifecycle";
import {
  deriveResurfaceSignals,
  pipelineColumnForTool,
} from "@/lib/account/workspace-pipeline";
import { getCompareObjectiveLabel } from "@/lib/compare/compare-objective";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import type {
  WorkspaceDecisionOutcome,
  WorkspaceStateV1,
  WorkspaceToolState,
} from "@/lib/discovery/types";

import { RevisitWhenChips } from "./revisit-when-chips";
import { PIPELINE_LABELS, formatWorkspaceDate } from "./workspace-model";
import { toolName } from "./workspace-tool-name";

const OUTCOME_ACTIONS: Array<{
  outcome: WorkspaceDecisionOutcome | null;
  label: string;
}> = [
  { outcome: "selected", label: OUTCOME_STATE_LABELS.selected },
  { outcome: "rejected", label: OUTCOME_STATE_LABELS.rejected },
  { outcome: "deferred", label: OUTCOME_STATE_LABELS.deferred },
  { outcome: null, label: "Riapri" },
];

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

function noteSnippet(note: string | null | undefined) {
  const value = note?.trim();
  if (!value) return null;
  if (value.length <= 140) return value;
  return `${value.slice(0, 137).trimEnd()}…`;
}

function replacedByLabel(
  catalog: Parameters<typeof toolName>[0],
  replacedBy: string | null | undefined,
) {
  if (!replacedBy) return null;
  return `Sostituito da ${toolName(catalog, replacedBy)}`;
}

export function WorkspaceDecisions({
  state,
  focusSlug = null,
}: {
  state: WorkspaceStateV1;
  focusSlug?: string | null;
}) {
  const catalog = usePublicToolCatalog();
  const slugs = useMemo(
    () =>
      Object.keys(state.toolStates).filter((slug) => hasJournalTrace(state.toolStates[slug])),
    [state.toolStates],
  );
  const dueSlugs = useMemo(() => {
    return new Set(
      deriveResurfaceSignals(state)
        .filter((item) => item.kind === "deferred_due" && item.slug)
        .map((item) => item.slug as string),
    );
  }, [state]);
  const [open, setOpen] = useState<string | null>(() => {
    if (focusSlug && slugs.includes(focusSlug)) return focusSlug;
    return slugs[0] ?? null;
  });

  useEffect(() => {
    if (focusSlug && slugs.includes(focusSlug)) {
      setOpen(focusSlug);
      return;
    }
    if (!open && slugs[0]) setOpen(slugs[0]);
  }, [focusSlug, open, slugs]);

  if (slugs.length === 0) {
    return (
      <section className="tv-journal" aria-labelledby="tv-journal-empty">
        <p className="account-label">Decisioni</p>
        <h2 id="tv-journal-empty" className="tv-journal-empty__title">
          Ancora nessuna traccia
        </h2>
        <p className="tv-journal-empty__copy">
          Decisioni è il diario dei Salvati: stesso inventario, solo i verdetti e il perché.
        </p>
        <Link className="account-btn-primary" href="/archivio">
          Salva il primo tool
        </Link>
      </section>
    );
  }

  return (
    <div className="tv-journal">
      <ul className="tv-journal-list">
        {slugs.map((slug) => {
          const tool = state.toolStates[slug];
          const column = pipelineColumnForTool({
            stage: tool?.stage ?? "saved",
            outcome: tool?.decision?.outcome ?? null,
          });
          const outcomeLabel = tool?.decision?.outcome
            ? PIPELINE_LABELS[column]
            : null;
          const why = noteSnippet(tool?.note);
          const alternatives = (tool?.alternatives ?? []).map((item) =>
            toolName(catalog, item),
          );
          const revisit = formatWorkspaceDate(tool?.revisitAt ?? null);
          const usageLabel = tool?.replacedBy
            ? replacedByLabel(catalog, tool.replacedBy)
            : tool?.usage
              ? USAGE_STATE_LABELS[tool.usage]
              : null;
          const selected = slug === open;
          return (
            <li key={slug}>
              <button
                type="button"
                className={selected ? "tv-journal-entry is-open" : "tv-journal-entry"}
                onClick={() => setOpen(slug)}
                aria-current={selected ? "true" : undefined}
              >
                <span className="tv-journal-entry__tool">{toolName(catalog, slug)}</span>
                <span className="tv-journal-entry__facts">
                  {outcomeLabel ? <span>{outcomeLabel}</span> : null}
                  {usageLabel ? <span>{usageLabel}</span> : null}
                  {tool?.useCase ? <span>{tool.useCase}</span> : null}
                  {tool?.pinned ? <span>Fissato</span> : null}
                  {revisit ? <span>Rivedi: {revisit}</span> : null}
                  {dueSlugs.has(slug) ? (
                    <span className="tv-journal-mark">Da riprendere</span>
                  ) : null}
                </span>
                {why ? <span className="tv-journal-entry__why">{why}</span> : null}
                {alternatives.length > 0 ? (
                  <span className="tv-journal-entry__alts">
                    Alternative: {alternatives.join(", ")}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      {open ? <DecisionEditor key={open} slug={open} state={state} /> : null}
    </div>
  );
}

function DecisionEditor({
  slug,
  state,
}: {
  slug: string;
  state: WorkspaceStateV1;
}) {
  const catalog = usePublicToolCatalog();
  const tool = state.toolStates[slug];
  const [note, setNote] = useState(tool?.note ?? "");
  const [useCase, setUseCase] = useState(tool?.useCase ?? "");
  const [pickingReplacement, setPickingReplacement] = useState(false);
  const alternatives = tool?.alternatives ?? [];
  const currentOutcome = tool?.decision?.outcome ?? null;
  const usage = tool?.usage ?? null;
  const replacedBy = tool?.replacedBy ?? null;
  const otherSaved = state.saved.slugs.filter((item) => item !== slug);
  const outcomeDate = formatWorkspaceDate(tool?.decision?.updatedAt ?? null);
  const revisitLine = formatRevisitLine(tool?.revisitAt);
  const objectiveLabel = tool?.compareObjective
    ? getCompareObjectiveLabel(tool.compareObjective)
    : null;
  const statusFacts = [
    currentOutcome
      ? `${OUTCOME_STATE_LABELS[currentOutcome]}${outcomeDate ? ` · ${outcomeDate}` : ""}`
      : null,
    usage && usage !== "replaced" ? USAGE_STATE_LABELS[usage] : null,
    objectiveLabel,
  ].filter((item): item is string => Boolean(item));

  const [pendingDefer, setPendingDefer] = useState(currentOutcome === "deferred");

  const record = (outcome: WorkspaceDecisionOutcome | null) => {
    if (outcome === "deferred") {
      setPendingDefer(true);
      return;
    }
    setPendingDefer(false);
    setWorkspaceDecision(slug, outcome);
  };

  const showUsageFollowUp =
    currentOutcome !== "deferred" && (currentOutcome === "selected" || Boolean(usage));
  const showUsingAgain = usage === "using";
  const showMarkUsing =
    usage === "replaced" ||
    usage === "stopped" ||
    (currentOutcome === "selected" && usage !== "using" && usage !== "replaced");
  const showStop = usage === "using" || (currentOutcome === "selected" && !usage);
  const showReplace = usage !== "replaced" && otherSaved.length > 0;

  return (
    <article className="tv-journal-sheet" aria-labelledby={`decision-${slug}`}>
      <header className="tv-journal-sheet__head">
        <h2 id={`decision-${slug}`} className="tv-journal-sheet__title">
          {toolName(catalog, slug)}
        </h2>
        <button
          type="button"
          className="tv-journal-pin"
          onClick={() => setWorkspacePinned(slug, !tool?.pinned)}
        >
          {tool?.pinned ? "Togli fissato" : "Fissa"}
        </button>
      </header>

      {statusFacts.length > 0 ? (
        <p className="tv-journal-sheet__alts">{statusFacts.join(" · ")}</p>
      ) : null}
      {replacedBy ? (
        <p className="tv-journal-sheet__alts">
          Sostituito da{" "}
          <Link href={`/toools/${replacedBy}`}>{toolName(catalog, replacedBy)}</Link>
        </p>
      ) : null}

      <section className="tv-journal-block">
        <h3 className="tv-journal-block__label">Decisione</h3>
        <div className="tv-journal-outcomes">
          {OUTCOME_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              className={
                action.outcome === currentOutcome
                  ? "account-btn-secondary is-current"
                  : "account-btn-secondary"
              }
              aria-pressed={action.outcome === currentOutcome}
              onClick={() => record(action.outcome)}
            >
              {action.label}
            </button>
          ))}
        </div>
        {pendingDefer || currentOutcome === "deferred" ? (
          <div className="mt-3">
            <p className="tv-journal-block__label">Quando rivedere</p>
            <RevisitWhenChips
              onSelect={(revisitAt) => {
                setPendingDefer(false);
                deferWorkspaceTool(slug, revisitAt);
              }}
            />
            {revisitLine ? (
              <p className="tv-journal-sheet__alts">{revisitLine}</p>
            ) : null}
          </div>
        ) : null}
      </section>

      {showUsageFollowUp ? (
        <section className="tv-journal-block">
          <h3 className="tv-journal-block__label">Uso</h3>
          <div className="tv-journal-outcomes">
            {showUsingAgain ? (
              <button
                type="button"
                className="account-btn-secondary"
                onClick={() => markWorkspaceToolUsing(slug)}
              >
                Lo uso ancora
              </button>
            ) : null}
            {showMarkUsing ? (
              <button
                type="button"
                className="account-btn-secondary"
                onClick={() => markWorkspaceToolUsing(slug)}
              >
                {USAGE_ACTION_LABELS.using}
              </button>
            ) : null}
            {showStop ? (
              <button
                type="button"
                className="account-btn-secondary"
                onClick={() => markWorkspaceToolStopped(slug)}
              >
                {USAGE_ACTION_LABELS.stopped}
              </button>
            ) : null}
            {showReplace ? (
              <button
                type="button"
                className={
                  pickingReplacement
                    ? "account-btn-secondary is-current"
                    : "account-btn-secondary"
                }
                aria-pressed={pickingReplacement}
                onClick={() => setPickingReplacement((value) => !value)}
              >
                {USAGE_ACTION_LABELS.replaced}
              </button>
            ) : null}
          </div>
          {pickingReplacement && showReplace ? (
            <label>
              <span className="sr-only">Sostituito da</span>
              <select
                defaultValue=""
                onChange={(event) => {
                  const next = event.target.value;
                  if (!next) return;
                  markWorkspaceToolReplaced(slug, next);
                  setPickingReplacement(false);
                }}
              >
                <option value="" disabled>
                  Scegli un tool
                </option>
                {otherSaved.map((item) => (
                  <option key={item} value={item}>
                    {toolName(catalog, item)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </section>
      ) : null}

      <form
        className="tv-journal-sheet__form"
        onSubmit={(event) => {
          event.preventDefault();
          setWorkspaceNote(slug, note.trim() || null);
          setWorkspaceUseCase(slug, useCase.trim() || null);
        }}
      >
        <section className="tv-journal-block">
          <h3 className="tv-journal-block__label">Caso d’uso</h3>
          <label>
            <span className="sr-only">Caso d’uso</span>
            <input
              value={useCase}
              onChange={(event) => setUseCase(event.target.value)}
              maxLength={200}
            />
          </label>
        </section>

        <section className="tv-journal-block">
          <h3 className="tv-journal-block__label">Perché</h3>
          <label>
            <span className="sr-only">Perché</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={2000}
              rows={4}
            />
          </label>
        </section>

        {alternatives.length > 0 ? (
          <section className="tv-journal-block">
            <h3 className="tv-journal-block__label">Alternative</h3>
            <p className="tv-journal-sheet__alts">
              {alternatives.map((item) => toolName(catalog, item)).join(", ")}
            </p>
          </section>
        ) : null}

        {revisitLine && currentOutcome !== "deferred" ? (
          <p className="tv-journal-sheet__alts">{revisitLine}</p>
        ) : null}

        <button type="submit" className="account-btn-primary">
          Salva
        </button>
      </form>
    </article>
  );
}
