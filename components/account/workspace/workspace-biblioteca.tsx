"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  addToolToPersonalStack,
  deferWorkspaceTool,
  markWorkspaceToolReplaced,
  markWorkspaceToolStopped,
  markWorkspaceToolUsing,
  setWorkspaceDecision,
  setWorkspaceNote,
  setWorkspacePinned,
  setWorkspaceStage,
  toggleWorkspaceCompare,
  toggleWorkspaceSaved,
} from "@/lib/account/workspace-actions";
import {
  compactPersonalStatus,
  formatRevisitLine,
  revisitAtFromPreset,
  USAGE_STATE_LABELS,
  usageActionLabel,
} from "@/lib/account/workspace-lifecycle";
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
import type { WorkspaceStateV1, WorkspaceUsage } from "@/lib/discovery/types";

import { RevisitWhenChips } from "./revisit-when-chips";
import { PIPELINE_LABELS, formatWorkspaceDate } from "./workspace-model";
import { WorkspaceCatalogMark } from "./workspace-tool-mark";
import { toolName } from "./workspace-tool-name";
import { WorkspaceChip, WorkspaceEmptyMotif, WorkspaceReplacement, pipelineTone } from "./workspace-visual";

const STATUS_FILTERS: Array<{ id: "tutti" | PipelineColumn; label: string }> = [
  { id: "tutti", label: "Tutti" },
  { id: "salvato", label: PIPELINE_LABELS.salvato },
  { id: "da_valutare", label: PIPELINE_LABELS.da_valutare },
  { id: "candidato", label: PIPELINE_LABELS.candidato },
  { id: "scelto", label: PIPELINE_LABELS.scelto },
  { id: "scartato", label: PIPELINE_LABELS.scartato },
  { id: "rimandato", label: PIPELINE_LABELS.rimandato },
];

type UsageFilter = "tutti" | WorkspaceUsage;

const USAGE_FILTERS: Array<{ id: UsageFilter; label: string }> = [
  { id: "tutti", label: "Tutti gli usi" },
  { id: "using", label: USAGE_STATE_LABELS.using },
  { id: "stopped", label: USAGE_STATE_LABELS.stopped },
  { id: "replaced", label: USAGE_STATE_LABELS.replaced },
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
  if (next === "rimandato") {
    deferWorkspaceTool(slug, revisitAtFromPreset("1w"));
  }
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

function personalStatusLabel(item: PipelineItem) {
  if (item.usage) {
    return compactPersonalStatus({
      usage: item.usage,
      outcome: item.outcome,
      stage: item.stage,
    }).label;
  }
  return PIPELINE_LABELS[item.column];
}

export function WorkspaceBiblioteca({
  state,
  focusSlug = null,
}: {
  state: WorkspaceStateV1;
  focusSlug?: string | null;
}) {
  const catalog = usePublicToolCatalog();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]["id"]>("tutti");
  const [usageFilter, setUsageFilter] = useState<UsageFilter>("tutti");
  const [category, setCategory] = useState("tutte");
  const [sort, setSort] = useState<LibrarySort>("recent");
  const [openNote, setOpenNote] = useState<string | null>(null);
  const items = listPipelineItems(state);
  const stacks = activePersonalStacks(state);
  const catalogBySlug = useMemo(
    () => new Map(catalog.map((tool) => [tool.slug, tool])),
    [catalog],
  );
  const hasUsageData = items.some((item) => item.usage != null);

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
      if (usageFilter !== "tutti" && item.usage !== usageFilter) return false;
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
  }, [catalog, catalogBySlug, category, filter, items, query, sort, usageFilter]);

  const filtersActive =
    query.trim() !== "" ||
    filter !== "tutti" ||
    category !== "tutte" ||
    usageFilter !== "tutti";

  useEffect(() => {
    if (!focusSlug) return;
    document
      .querySelector(`[data-slug="${focusSlug}"]`)
      ?.scrollIntoView({
        block: "center",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
  }, [focusSlug, visible]);

  if (state.saved.slugs.length === 0) {
    return (
      <section className="tv-lib tv-lib--empty">
        <WorkspaceEmptyMotif variant="library" />
        <p className="tv-lib-kicker">Biblioteca</p>
        <h2 className="tv-lib-title">Nessun tool salvato ancora</h2>
        <p className="tv-lib-copy">
          I Salvati vivono qui: stesso inventario, con stati e verdetti. Salva dal catalogo, poi valuta.
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
        {hasUsageData ? (
          <label className="tv-lib-select">
            <span className="sr-only">Uso</span>
            <select
              aria-label="Uso"
              value={usageFilter}
              onChange={(event) =>
                setUsageFilter(event.target.value as UsageFilter)
              }
            >
              {USAGE_FILTERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="tv-lib-count">
          <span>
            {visible.length === items.length
              ? `${items.length} salvati`
              : `${visible.length} di ${items.length}`}
          </span>
          {filtersActive ? (
            <button
              type="button"
              className="tv-lib-clear"
              onClick={() => {
                setQuery("");
                setFilter("tutti");
                setCategory("tutte");
                setUsageFilter("tutti");
              }}
            >
              Azzera filtri
            </button>
          ) : null}
        </div>
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
              focused={focusSlug === item.slug}
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
  focused,
  noteOpen,
  onToggleNote,
}: {
  item: PipelineItem;
  state: WorkspaceStateV1;
  catalog: readonly PublicToolCatalogItem[];
  stacks: ReturnType<typeof activePersonalStacks>;
  category: string;
  focused: boolean;
  noteOpen: boolean;
  onToggleNote: () => void;
}) {
  const name = toolName(catalog, item.slug);
  const catalogItem = catalog.find((tool) => tool.slug === item.slug);
  const inCompare = state.compare.slugs.includes(item.slug);
  const compareFull = !inCompare && state.compare.slugs.length >= MAX_COMPARE_TOOLS;
  const availableStacks = stacks.filter((stack) => !stack.slugs.includes(item.slug));
  const [draft, setDraft] = useState(item.note ?? "");
  const rejected = item.outcome === "rejected";
  const showMarkUsing =
    !rejected && item.usage !== "using" && item.outcome === "selected";
  const showMarkStopped = item.usage === "using";
  const showMarkReplaced =
    item.outcome === "selected" || item.usage === "using" || item.usage === "stopped";
  const otherSaved = state.saved.slugs.filter((slug) => slug !== item.slug);
  const replacedName = item.replacedBy ? toolName(catalog, item.replacedBy) : null;
  const revisitLine =
    item.column === "rimandato" ? formatRevisitLine(item.revisitAt) : null;

  return (
    <li
      className="tv-lib-row"
      data-slug={item.slug}
      data-focus={focused ? "true" : undefined}
    >
      <WorkspaceCatalogMark catalog={catalog} slug={item.slug} size="md" />
      <div className="tv-lib-row__main">
        <Link className="tv-lib-name" href={`/toools/${item.slug}`}>
          {name}
        </Link>
        {catalogItem?.shortDescription ? (
          <p className="tv-lib-desc">{catalogItem.shortDescription}</p>
        ) : null}
        <p className="tv-lib-meta">
          <WorkspaceChip tone="stack">{category || "Senza categoria"}</WorkspaceChip>
          <WorkspaceChip tone={pipelineTone(item.column)}>
            {personalStatusLabel(item)}
          </WorkspaceChip>
          {item.stackNames.length > 0 ? (
            <WorkspaceChip tone="stack">{item.stackNames.join(", ")}</WorkspaceChip>
          ) : null}
          {revisitLine ? <WorkspaceChip tone="revisit">{revisitLine}</WorkspaceChip> : null}
          {formatWorkspaceDate(item.updatedAt) ? (
            <WorkspaceChip tone="note">{formatWorkspaceDate(item.updatedAt)}</WorkspaceChip>
          ) : null}
        </p>
        {replacedName && item.replacedBy ? (
          <WorkspaceReplacement catalog={catalog} fromSlug={item.slug} toSlug={item.replacedBy} />
        ) : null}
        {item.pinned || item.note ? (
          <p className="tv-lib-marks">
            {item.pinned ? <WorkspaceChip tone="pin">Fisso</WorkspaceChip> : null}
            {item.note ? <WorkspaceChip tone="note">Nota</WorkspaceChip> : null}
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
          {showMarkUsing ? (
            <button
              type="button"
              className="tv-lib-action"
              onClick={() => markWorkspaceToolUsing(item.slug)}
            >
              {usageActionLabel("using")}
            </button>
          ) : null}
          {showMarkStopped ? (
            <button
              type="button"
              className="tv-lib-action"
              onClick={() => markWorkspaceToolStopped(item.slug)}
            >
              {usageActionLabel("stopped")}
            </button>
          ) : null}
          {showMarkReplaced && otherSaved.length > 0 ? (
            <label className="tv-lib-action tv-lib-action--field">
              <span>{usageActionLabel("replaced")}</span>
              <select
                aria-label={usageActionLabel("replaced")}
                defaultValue=""
                onChange={(event) => {
                  if (event.target.value) {
                    markWorkspaceToolReplaced(item.slug, event.target.value);
                  }
                  event.target.value = "";
                }}
              >
                <option value="">Sostituisci con</option>
                {otherSaved.map((slug) => (
                  <option key={slug} value={slug}>
                    {toolName(catalog, slug)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {item.column === "rimandato" ? (
            <div className="tv-lib-action tv-lib-action--field">
              <span>Quando rivedere</span>
              <RevisitWhenChips
                onSelect={(revisitAt) => deferWorkspaceTool(item.slug, revisitAt)}
              />
            </div>
          ) : null}
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
