"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  addToolToPersonalStack,
  setWorkspaceDecision,
  setWorkspaceNote,
  setWorkspacePinned,
  setWorkspaceStage,
  toggleWorkspaceCompare,
  toggleWorkspaceSaved,
} from "@/lib/account/workspace-actions";
import {
  PIPELINE_COLUMNS,
  activePersonalStacks,
  listPipelineItems,
  type PipelineColumn,
  type PipelineItem,
} from "@/lib/account/workspace-pipeline";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";
import { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";

import { PIPELINE_LABELS } from "./workspace-model";
import { toolName } from "./workspace-tool-name";

const STATUS_FILTERS: Array<{ id: "tutti" | PipelineColumn; label: string }> = [
  { id: "tutti", label: "Tutti" },
  { id: "salvato", label: PIPELINE_LABELS.salvato },
  { id: "da_valutare", label: PIPELINE_LABELS.da_valutare },
  { id: "candidato", label: PIPELINE_LABELS.candidato },
  { id: "scelto", label: PIPELINE_LABELS.scelto },
  { id: "scartato", label: PIPELINE_LABELS.scartato },
  { id: "rimandato", label: PIPELINE_LABELS.rimandato },
];

type LibrarySort = "recent" | "oldest" | "alpha" | "status";

const SORT_OPTIONS: Array<{ id: LibrarySort; label: string }> = [
  { id: "recent", label: "Aggiornati di recente" },
  { id: "oldest", label: "Più vecchi" },
  { id: "alpha", label: "A–Z" },
  { id: "status", label: "Stato" },
];

function categoryOf(
  catalogBySlug: Map<string, PublicToolCatalogItem>,
  slug: string,
) {
  return catalogBySlug.get(slug)?.categoryLabel ?? "";
}

function formatUpdated(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

function applyPipelineColumn(slug: string, next: PipelineColumn) {
  if (next === "salvato") {
    setWorkspaceDecision(slug, null);
    setWorkspaceStage(slug, "saved");
  }
  if (next === "da_valutare") {
    setWorkspaceDecision(slug, null);
    setWorkspaceStage(slug, "review");
  }
  if (next === "candidato") {
    setWorkspaceDecision(slug, null);
    setWorkspaceStage(slug, "top");
  }
  if (next === "scelto") setWorkspaceDecision(slug, "selected");
  if (next === "scartato") setWorkspaceDecision(slug, "rejected");
  if (next === "rimandato") setWorkspaceDecision(slug, "deferred");
}

function compareLibraryItems(
  left: PipelineItem,
  right: PipelineItem,
  sort: LibrarySort,
  catalogBySlug: Map<string, PublicToolCatalogItem>,
) {
  const leftName = catalogBySlug.get(left.slug)?.name ?? left.slug;
  const rightName = catalogBySlug.get(right.slug)?.name ?? right.slug;
  const byName = leftName.localeCompare(rightName, "it");
  if (sort === "alpha") return byName;
  if (sort === "status") {
    const delta =
      PIPELINE_COLUMNS.indexOf(left.column) - PIPELINE_COLUMNS.indexOf(right.column);
    return delta !== 0 ? delta : byName;
  }
  const leftAt = left.updatedAt ?? "";
  const rightAt = right.updatedAt ?? "";
  const byDate = leftAt.localeCompare(rightAt);
  if (sort === "oldest") return byDate !== 0 ? byDate : byName;
  return byDate !== 0 ? -byDate : byName;
}

export function WorkspaceBiblioteca({ state }: { state: WorkspaceStateV1 }) {
  const catalog = usePublicToolCatalog();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]["id"]>("tutti");
  const [category, setCategory] = useState("tutte");
  const [sort, setSort] = useState<LibrarySort>("recent");
  const [openNote, setOpenNote] = useState<string | null>(null);
  const items = listPipelineItems(state);
  const stacks = activePersonalStacks(state);
  const catalogBySlug = useMemo(
    () => new Map(catalog.map((tool) => [tool.slug, tool])),
    [catalog],
  );

  const categories = useMemo(() => {
    const labels = new Set<string>();
    for (const item of items) {
      const label = categoryOf(catalogBySlug, item.slug);
      if (label) labels.add(label);
    }
    return [...labels].sort((left, right) => left.localeCompare(right, "it"));
  }, [catalogBySlug, items]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (filter !== "tutti" && item.column !== filter) return false;
      const label = categoryOf(catalogBySlug, item.slug);
      if (category !== "tutte" && label !== category) return false;
      if (!needle) return true;
      const name = toolName(catalog, item.slug).toLowerCase();
      return (
        name.includes(needle) ||
        item.slug.toLowerCase().includes(needle) ||
        label.toLowerCase().includes(needle)
      );
    });
    return [...filtered].sort((left, right) =>
      compareLibraryItems(left, right, sort, catalogBySlug),
    );
  }, [catalog, catalogBySlug, category, filter, items, query, sort]);

  if (state.saved.slugs.length === 0) {
    return (
      <section className="tv-lib tv-lib--empty">
        <p className="tv-lib-kicker">Biblioteca</p>
        <h2 className="tv-lib-title">Nessun tool salvato ancora</h2>
        <p className="tv-lib-copy">
          Salva un candidato dal catalogo. Poi spostalo: da valutare, candidato, deciso.
        </p>
        <Link className="account-btn-primary" href="/archivio">
          Inizia dal catalogo
        </Link>
      </section>
    );
  }

  return (
    <div className="tv-lib">
      <div className="tv-lib-toolbar">
        <label className="tv-lib-search">
          <span className="sr-only">Cerca nella biblioteca</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca un tool"
          />
        </label>
        <label className="tv-lib-select">
          <span className="sr-only">Ordina</span>
          <select
            aria-label="Ordina"
            value={sort}
            onChange={(event) => setSort(event.target.value as LibrarySort)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="tv-lib-select tv-lib-select--status-mobile">
          <span className="sr-only">Stato decisione</span>
          <select
            aria-label="Stato decisione"
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as (typeof STATUS_FILTERS)[number]["id"])
            }
          >
            {STATUS_FILTERS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        {categories.length > 0 ? (
          <label className="tv-lib-select">
            <span className="sr-only">Categoria</span>
            <select
              aria-label="Categoria"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="tutte">Tutte le categorie</option>
              {categories.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="tv-lib-filters" role="group" aria-label="Stato decisione">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              className={filter === item.id ? "is-active" : undefined}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="tv-lib-count">
          {visible.length === items.length
            ? `${items.length} salvati`
            : `${visible.length} di ${items.length}`}
        </p>
      </div>

      {visible.length === 0 ? (
        <p className="tv-lib-copy">Nessun tool corrisponde ai filtri.</p>
      ) : (
        <ul className="tv-lib-list">
          {visible.map((item) => (
            <LibraryRow
              key={item.slug}
              item={item}
              state={state}
              catalog={catalog}
              stacks={stacks}
              category={categoryOf(catalogBySlug, item.slug)}
              noteOpen={openNote === item.slug}
              onToggleNote={() =>
                setOpenNote((current) => (current === item.slug ? null : item.slug))
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function LibraryRow({
  item,
  state,
  catalog,
  stacks,
  category,
  noteOpen,
  onToggleNote,
}: {
  item: PipelineItem;
  state: WorkspaceStateV1;
  catalog: readonly PublicToolCatalogItem[];
  stacks: ReturnType<typeof activePersonalStacks>;
  category: string;
  noteOpen: boolean;
  onToggleNote: () => void;
}) {
  const name = toolName(catalog, item.slug);
  const inCompare = state.compare.slugs.includes(item.slug);
  const compareFull = !inCompare && state.compare.slugs.length >= MAX_COMPARE_TOOLS;
  const availableStacks = stacks.filter((stack) => !stack.slugs.includes(item.slug));
  const updated = formatUpdated(item.updatedAt);
  const [draft, setDraft] = useState(item.note ?? "");

  return (
    <li className="tv-lib-row" data-slug={item.slug}>
      <div className="tv-lib-row__main">
        <Link className="tv-lib-name" href={`/toools/${item.slug}`}>
          {name}
        </Link>
        <p className="tv-lib-meta">
          <span>{category || "Senza categoria"}</span>
          <span aria-hidden="true"> · </span>
          <span>{PIPELINE_LABELS[item.column]}</span>
          {item.stackNames.length > 0 ? (
            <>
              <span aria-hidden="true"> · </span>
              <span>{item.stackNames.join(", ")}</span>
            </>
          ) : null}
          {updated ? (
            <>
              <span aria-hidden="true"> · </span>
              <span>{updated}</span>
            </>
          ) : null}
        </p>
        {item.pinned || item.note ? (
          <p className="tv-lib-marks">
            {item.pinned ? <span>Fisso</span> : null}
            {item.note ? <span>Nota</span> : null}
          </p>
        ) : null}
      </div>

      <details className="tv-lib-menu">
        <summary aria-label={`Azioni per ${name}`}>
          Azioni
        </summary>
        <div className="tv-lib-menu__panel">
          <Link className="tv-lib-action" href={`/toools/${item.slug}`}>
            Apri
          </Link>
          {compareFull ? (
            <p className="tv-lib-action tv-lib-action--status">
              Confronto pieno ({MAX_COMPARE_TOOLS})
            </p>
          ) : (
            <button
              type="button"
              className="tv-lib-action"
              onClick={() => toggleWorkspaceCompare(item.slug)}
            >
              {inCompare ? "Togli dal confronto" : "Aggiungi al confronto"}
            </button>
          )}
          <label className="tv-lib-action tv-lib-action--field">
            <span>Sposta</span>
            <select
              value={item.column}
              onChange={(event) =>
                applyPipelineColumn(item.slug, event.target.value as PipelineColumn)
              }
            >
              {STATUS_FILTERS.filter((entry) => entry.id !== "tutti").map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
          {availableStacks.length > 0 ? (
            <label className="tv-lib-action tv-lib-action--field">
              <span>Aggiungi a uno stack</span>
              <select
                defaultValue=""
                onChange={(event) => {
                  if (event.target.value) {
                    addToolToPersonalStack(event.target.value, item.slug);
                  }
                  event.target.value = "";
                }}
              >
                <option value="">Scegli stack</option>
                {availableStacks.map((stack) => (
                  <option key={stack.id} value={stack.id}>
                    {stack.name}
                  </option>
                ))}
              </select>
            </label>
          ) : stacks.length === 0 ? (
            <Link className="tv-lib-action" href="/account?view=stack">
              Nessuno stack attivo
            </Link>
          ) : (
            <p className="tv-lib-action tv-lib-action--status">Già in tutti gli stack</p>
          )}
          <button type="button" className="tv-lib-action" onClick={onToggleNote}>
            {noteOpen ? "Chiudi nota" : item.note ? "Modifica nota" : "Aggiungi nota"}
          </button>
          <button
            type="button"
            className="tv-lib-action"
            onClick={() => setWorkspacePinned(item.slug, !item.pinned)}
          >
            {item.pinned ? "Togli fisso" : "Fissa"}
          </button>
          <button
            type="button"
            className="tv-lib-action tv-lib-action--danger"
            onClick={() => toggleWorkspaceSaved(item.slug)}
          >
            Rimuovi dai salvati
          </button>
        </div>
      </details>

      {noteOpen ? (
        <form
          className="tv-lib-note"
          onSubmit={(event) => {
            event.preventDefault();
            setWorkspaceNote(item.slug, draft.trim() || null);
            onToggleNote();
          }}
        >
          <label>
            <span className="sr-only">Nota su {name}</span>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={2000}
              rows={3}
            />
          </label>
          <div className="tv-lib-note__actions">
            <button type="submit" className="tv-lib-action">
              Salva nota
            </button>
            <button type="button" className="tv-lib-action" onClick={onToggleNote}>
              Annulla
            </button>
          </div>
        </form>
      ) : null}
    </li>
  );
}
