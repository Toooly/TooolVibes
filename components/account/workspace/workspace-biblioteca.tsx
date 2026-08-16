"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { listPipelineItems, type PipelineColumn } from "@/lib/account/workspace-pipeline";
import { setWorkspaceDecision, setWorkspaceStage } from "@/lib/account/workspace-actions";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";

import { PIPELINE_LABELS } from "./workspace-model";
import { toolName } from "./workspace-tool-name";

const FILTERS: Array<{ id: "tutti" | PipelineColumn; label: string }> = [
  { id: "tutti", label: "Tutti" },
  { id: "salvato", label: PIPELINE_LABELS.salvato },
  { id: "da_valutare", label: PIPELINE_LABELS.da_valutare },
  { id: "candidato", label: PIPELINE_LABELS.candidato },
  { id: "scelto", label: PIPELINE_LABELS.scelto },
  { id: "scartato", label: PIPELINE_LABELS.scartato },
  { id: "rimandato", label: PIPELINE_LABELS.rimandato },
];

export function WorkspaceBiblioteca({ state }: { state: WorkspaceStateV1 }) {
  const catalog = usePublicToolCatalog();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("tutti");
  const [expanded, setExpanded] = useState(false);
  const items = listPipelineItems(state);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "tutti" && item.column !== filter) return false;
      if (!needle) return true;
      const name = toolName(catalog, item.slug).toLowerCase();
      return name.includes(needle) || item.slug.includes(needle);
    });
  }, [catalog, filter, items, query]);
  const shown = expanded ? visible : visible.slice(0, 20);

  if (state.saved.slugs.length === 0) {
    return (
      <section className="tv-space-card">
        <p className="account-label">Biblioteca</p>
        <h2 className="tv-space-card__title">Nessun tool salvato ancora</h2>
        <p className="tv-space-card__body">
          Salva un candidato dall’archivio. Poi spostalo: da valutare, candidato, deciso.
        </p>
        <Link className="account-btn-primary" href="/archivio">
          Inizia dal catalogo
        </Link>
      </section>
    );
  }

  return (
    <div className="tv-space-stack">
      <div className="tv-space-toolbar">
        <label className="tv-space-search">
          <span className="sr-only">Cerca nella biblioteca</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca un tool"
          />
        </label>
        <div className="tv-space-filters" role="tablist" aria-label="Stato decisione">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              className={filter === item.id ? "is-active" : undefined}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="tv-space-list">
        {shown.map((item) => (
          <li key={item.slug} className="tv-space-row tv-space-row--library">
            <Link href={`/toools/${item.slug}`}>{toolName(catalog, item.slug)}</Link>
            <label className="tv-space-row__move">
              <span className="sr-only">Stato di {toolName(catalog, item.slug)}</span>
              <select
                value={item.column}
                onChange={(event) => {
                  const next = event.target.value as PipelineColumn;
                  if (next === "salvato") {
                    setWorkspaceDecision(item.slug, null);
                    setWorkspaceStage(item.slug, "saved");
                  }
                  if (next === "da_valutare") {
                    setWorkspaceDecision(item.slug, null);
                    setWorkspaceStage(item.slug, "review");
                  }
                  if (next === "candidato") {
                    setWorkspaceDecision(item.slug, null);
                    setWorkspaceStage(item.slug, "top");
                  }
                  if (next === "scelto") setWorkspaceDecision(item.slug, "selected");
                  if (next === "scartato") setWorkspaceDecision(item.slug, "rejected");
                  if (next === "rimandato") setWorkspaceDecision(item.slug, "deferred");
                }}
              >
                {FILTERS.filter((entry) => entry.id !== "tutti").map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
          </li>
        ))}
      </ul>
      {visible.length > 20 && !expanded ? (
        <button type="button" className="account-btn-secondary" onClick={() => setExpanded(true)}>
          Mostra tutti ({visible.length})
        </button>
      ) : null}
    </div>
  );
}
