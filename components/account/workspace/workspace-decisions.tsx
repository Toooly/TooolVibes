"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  setWorkspaceDecision,
  setWorkspaceNote,
  setWorkspaceRevisit,
  setWorkspaceUseCase,
} from "@/lib/account/workspace-actions";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import type { WorkspaceDecisionOutcome, WorkspaceStateV1 } from "@/lib/discovery/types";

import { PIPELINE_LABELS } from "./workspace-model";
import { pipelineColumnForTool } from "@/lib/account/workspace-pipeline";
import { toolName } from "./workspace-tool-name";

export function WorkspaceDecisions({ state }: { state: WorkspaceStateV1 }) {
  const catalog = usePublicToolCatalog();
  const slugs = Object.keys(state.toolStates).filter((slug) => {
    const tool = state.toolStates[slug];
    return Boolean(
      tool?.decision?.outcome ||
        tool?.note ||
        tool?.useCase ||
        (tool?.alternatives && tool.alternatives.length > 0) ||
        tool?.pinned,
    );
  });
  const [open, setOpen] = useState<string | null>(slugs[0] ?? null);
  useEffect(() => {
    if (!open && slugs[0]) setOpen(slugs[0]);
  }, [open, slugs]);

  if (slugs.length === 0) {
    return (
      <section className="tv-space-card">
        <p className="account-label">Decisioni</p>
        <h2 className="tv-space-card__title">Ancora nessuna traccia</h2>
        <p className="tv-space-card__body">
          Quando scegli, scarti o rimandi, qui resta il perché.
        </p>
        <Link className="account-btn-primary" href="/archivio">
          Salva il primo tool
        </Link>
      </section>
    );
  }

  return (
    <div className="tv-space-stack">
      <ul className="tv-space-list tv-space-list--cards">
        {slugs.map((slug) => {
          const tool = state.toolStates[slug];
          const column = pipelineColumnForTool({
            stage: tool?.stage ?? "saved",
            outcome: tool?.decision?.outcome ?? null,
          });
          return (
            <li key={slug}>
              <button type="button" className="tv-space-row" onClick={() => setOpen(slug)}>
                <span>{toolName(catalog, slug)}</span>
                <span className="tv-space-row__meta">{PIPELINE_LABELS[column]}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {open ? <DecisionEditor slug={open} state={state} /> : null}
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
  const [revisit, setRevisit] = useState(tool?.revisitAt ? tool.revisitAt.slice(0, 10) : "");

  const record = (outcome: WorkspaceDecisionOutcome | null) => {
    setWorkspaceDecision(slug, outcome);
  };

  return (
    <section className="tv-space-card" aria-labelledby={`decision-${slug}`}>
      <h2 id={`decision-${slug}`} className="tv-space-card__title">
        {toolName(catalog, slug)}
      </h2>
      {tool?.alternatives && tool.alternatives.length > 0 ? (
        <p className="tv-space-card__body">
          Traccia del confronto: {tool.alternatives.map((item) => toolName(catalog, item)).join(", ")}
        </p>
      ) : null}
      <div className="tv-space-actions tv-space-actions--compact">
        <button type="button" className="account-btn-secondary" onClick={() => record("selected")}>
          Scelto
        </button>
        <button type="button" className="account-btn-secondary" onClick={() => record("rejected")}>
          Scartato
        </button>
        <button type="button" className="account-btn-secondary" onClick={() => record("deferred")}>
          Rimandato
        </button>
        <button type="button" className="account-btn-secondary" onClick={() => record(null)}>
          Riapri
        </button>
      </div>
      <form
        className="tv-space-stack"
        onSubmit={(event) => {
          event.preventDefault();
          setWorkspaceNote(slug, note.trim() || null);
          setWorkspaceUseCase(slug, useCase.trim() || null);
          setWorkspaceRevisit(slug, revisit ? new Date(`${revisit}T00:00:00.000Z`).toISOString() : null);
        }}
      >
        <label className="tv-space-search">
          <span>Perché</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} rows={3} />
        </label>
        <label className="tv-space-search">
          <span>Caso d’uso</span>
          <input value={useCase} onChange={(event) => setUseCase(event.target.value)} maxLength={200} />
        </label>
        <label className="tv-space-search">
          <span>Rivedi il</span>
          <input type="date" value={revisit} onChange={(event) => setRevisit(event.target.value)} />
        </label>
        <button type="submit" className="account-btn-primary">
          Salva nota
        </button>
      </form>
    </section>
  );
}
