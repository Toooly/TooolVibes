"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  deferWorkspaceTool,
  setWorkspaceDecision,
  setWorkspaceNote,
  setWorkspacePinned,
  setWorkspaceRevisit,
  setWorkspaceUseCase,
} from "@/lib/account/workspace-actions";
import { OUTCOME_STATE_LABELS, formatRevisitLine } from "@/lib/account/workspace-lifecycle";
import {
  deriveResurfaceSignals,
  pipelineColumnForTool,
} from "@/lib/account/workspace-pipeline";
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
      tool?.pinned,
  );
}

function noteSnippet(note: string | null | undefined) {
  const value = note?.trim();
  if (!value) return null;
  if (value.length <= 140) return value;
  return `${value.slice(0, 137).trimEnd()}…`;
}

export function WorkspaceDecisions({ state }: { state: WorkspaceStateV1 }) {
  const catalog = usePublicToolCatalog();
  const slugs = Object.keys(state.toolStates).filter((slug) =>
    hasJournalTrace(state.toolStates[slug]),
  );
  const dueSlugs = useMemo(() => {
    return new Set(
      deriveResurfaceSignals(state)
        .filter((item) => item.kind === "deferred_due" && item.slug)
        .map((item) => item.slug as string),
    );
  }, [state]);
  const [open, setOpen] = useState<string | null>(slugs[0] ?? null);
  useEffect(() => {
    if (!open && slugs[0]) setOpen(slugs[0]);
  }, [open, slugs]);

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
  const [revisit, setRevisit] = useState(
    tool?.revisitAt ? tool.revisitAt.slice(0, 10) : "",
  );
  const alternatives = tool?.alternatives ?? [];
  const currentOutcome = tool?.decision?.outcome ?? null;

  const [pendingDefer, setPendingDefer] = useState(currentOutcome === "deferred");

  const record = (outcome: WorkspaceDecisionOutcome | null) => {
    if (outcome === "deferred") {
      setPendingDefer(true);
      return;
    }
    setPendingDefer(false);
    setWorkspaceDecision(slug, outcome);
  };

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
                setRevisit(revisitAt.slice(0, 10));
              }}
            />
            {formatRevisitLine(tool?.revisitAt) ? (
              <p className="tv-journal-sheet__alts">{formatRevisitLine(tool?.revisitAt)}</p>
            ) : null}
          </div>
        ) : null}
      </section>

      <form
        className="tv-journal-sheet__form"
        onSubmit={(event) => {
          event.preventDefault();
          setWorkspaceNote(slug, note.trim() || null);
          setWorkspaceUseCase(slug, useCase.trim() || null);
          setWorkspaceRevisit(
            slug,
            revisit ? new Date(`${revisit}T00:00:00.000Z`).toISOString() : null,
          );
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

        <section className="tv-journal-block">
          <h3 className="tv-journal-block__label">Rivedi</h3>
          <label>
            <span className="sr-only">Rivedi il</span>
            <input
              type="date"
              value={revisit}
              onChange={(event) => setRevisit(event.target.value)}
            />
          </label>
        </section>

        <button type="submit" className="account-btn-primary">
          Salva
        </button>
      </form>
    </article>
  );
}
