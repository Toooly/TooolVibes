"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";
import { useEffect, useMemo, useState } from "react";

import {
  deferWorkspaceTool,
  markWorkspaceToolReplaced,
  markWorkspaceToolStopped,
  markWorkspaceToolUsing,
  setWorkspaceNote,
  setWorkspacePinned,
  toggleWorkspaceCompare,
  toggleWorkspaceSaved,
} from "@/lib/account/workspace-actions";
import {
  formatRevisitLine,
  usageActionLabel,
} from "@/lib/account/workspace-lifecycle";
import {
  SALVATI_LIBRARY_FILTER_LABELS,
  SALVATI_SORT_LABELS,
  SALVATI_SORTS,
  composeSalvatiLibrary,
  compareSalvatiRelationships,
  formatStackContext,
  matchesSalvatiFilter,
  visibleSalvatiFilters,
  type SalvatiLibraryFilter,
  type SalvatiRelationship,
  type SalvatiSort,
} from "@/lib/account/salvati-relationship";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import { buildWorkspaceSearchIndex } from "@/lib/search/workspace-search-index";
import {
  matchesSalvatiPersonalQuery,
} from "@/lib/search/personal-search";
import {
  parsePersonalSearchQuery,
  personalSearchEmptyMessage,
} from "@/lib/search/personal-search-query";

import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";
import type { WorkspaceDecisionOutcome, WorkspaceStateV1 } from "@/lib/discovery/types";
import { getActiveWorkspaceOwner } from "@/lib/discovery/workspace-owner-storage";
import { MAX_NOTE_LENGTH } from "@/lib/discovery/workspace-constants";
import { excerptPrivateNote } from "@/lib/account/private-note";
import { StackPickOrCreate } from "@/components/tools/stack-pick-or-create";

import { DecisionSheet } from "./decision-sheet";
import { WorkspaceFilo } from "./filo";
import { RevisitWhenChips } from "./revisit-when-chips";
import { formatWorkspaceDate } from "./workspace-model";
import { WorkspaceCatalogMark } from "./workspace-tool-mark";
import { toolName } from "./workspace-tool-name";
import {
  WorkspaceChip,
  WorkspaceEmptyMotif,
  WorkspaceReplacement,
  pipelineTone,
  type StatusTone,
} from "./workspace-visual";

function catalogMap(catalog: readonly PublicToolCatalogItem[]) {
  return new Map(catalog.map((tool) => [tool.slug, tool]));
}

function relationshipTone(item: SalvatiRelationship): StatusTone {
  if (item.usage === "using") return "using";
  if (item.usage === "stopped") return "stopped";
  if (item.usage === "replaced") return "replaced";
  return pipelineTone(item.column);
}

function emptyCatalogItem(slug: string): PublicToolCatalogItem {
  return {
    slug,
    name: slug,
    categoryLabel: "",
    shortDescription: "",
    featured: false,
    toolOfWeek: false,
    tags: [],
    levelLabel: null,
  };
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
  const [filter, setFilter] = useState<SalvatiLibraryFilter>("tutti");
  const [sort, setSort] = useState<SalvatiSort>("recent");
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [decide, setDecide] = useState<{
    slug: string;
    name: string;
    defaultOutcome: WorkspaceDecisionOutcome;
    alternatives: string[];
  } | null>(null);
  const nowIso = useMemo(() => new Date().toISOString(), []);
  const library = useMemo(() => composeSalvatiLibrary(state, nowIso), [nowIso, state]);
  const bySlug = useMemo(() => catalogMap(catalog), [catalog]);
  const filterIds = visibleSalvatiFilters(library.filterCounts, library.showFilters);
  const searchIndex = useMemo(
    () => buildWorkspaceSearchIndex(state),
    [state],
  );
  const parsedQuery = useMemo(
    () => parsePersonalSearchQuery(query),
    [query],
  );
  const visible = useMemo(() => {
    const filtered = library.items.filter((item) => {
      if (!matchesSalvatiFilter(item, filter)) return false;
      const tool = bySlug.get(item.slug);
      return matchesSalvatiPersonalQuery(
        item,
        query,
        {
          name: tool?.name ?? item.slug,
          categoryLabel: tool?.categoryLabel ?? "",
        },
        searchIndex,
      );
    });
    return [...filtered].sort((left, right) =>
      compareSalvatiRelationships(
        left,
        right,
        sort,
        (slug) => bySlug.get(slug)?.name ?? slug,
      ),
    );
  }, [bySlug, filter, library.items, query, searchIndex, sort]);

  const filtersActive = query.trim() !== "" || filter !== "tutti";

  useEffect(() => {
    if (!focusSlug) return;
    document.querySelector(`[data-slug="${focusSlug}"]`)?.scrollIntoView({
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
        <p className="tv-lib-kicker"><LocalizedText>{"Salvati"}</LocalizedText></p>
        <h2 className="tv-lib-title"><LocalizedText>{"Nessun tool salvato ancora"}</LocalizedText></h2>
        <p className="tv-lib-copy"><LocalizedText>{"Salva un tool dal catalogo per ritrovarlo qui, con note e decisioni."}</LocalizedText></p>
        <Link className="tv-lib-cta" href="/archivio"><LocalizedText>{"Inizia dal catalogo "}</LocalizedText></Link>
      </section>
    );
  }

  return (
    <div className="tv-lib">
      <div className="tv-lib-toolbar">
        <label className="tv-lib-search">
          <span className="tv-lib-field-label"><LocalizedText>{"Cerca"}</LocalizedText></span>
          <LocalizedAttributes><input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome del tool"
            aria-label="Cerca in Salvati"
          /></LocalizedAttributes>
        </label>
        <label className="tv-lib-select">
          <span className="tv-lib-field-label"><LocalizedText>{"Ordina"}</LocalizedText></span>
          <LocalizedAttributes><select
            aria-label="Ordina i salvati"
            value={sort}
            onChange={(event) => setSort(event.target.value as SalvatiSort)}
          >
            {SALVATI_SORTS.map((id) => (
              <option key={id} value={id}>
                <LocalizedText>{SALVATI_SORT_LABELS[id]}</LocalizedText>
              </option>
            ))}
          </select></LocalizedAttributes>
        </label>
        {filterIds.length > 0 ? (
          <LocalizedAttributes><div className="tv-lib-filters" role="group" aria-label="Relazione">
            {filterIds.map((id) => {
              const count = library.filterCounts[id];
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={filter === id}
                  className={filter === id ? "is-active" : undefined}
                  onClick={() => setFilter(id)}
                >
                  <LocalizedText>{SALVATI_LIBRARY_FILTER_LABELS[id]}</LocalizedText>
                  <span className="tv-lib-filter-n">{count}</span>
                </button>
              );
            })}
          </div></LocalizedAttributes>
        ) : null}
        {filtersActive ? (
          <button
            type="button"
            className="tv-lib-clear"
            onClick={() => {
              setQuery("");
              setFilter("tutti");
            }}
          ><LocalizedText>{"Azzera filtri "}</LocalizedText></button>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <p className="tv-lib-copy"><LocalizedText>{personalSearchEmptyMessage(parsedQuery)}</LocalizedText></p>
      ) : (
        <LocalizedAttributes><ul className="tv-lib-list" aria-label="Libreria software">
          {visible.map((item) => (
            <LibraryRow
              key={item.slug}
              item={item}
              state={state}
              catalog={catalog}
              catalogItem={bySlug.get(item.slug) ?? emptyCatalogItem(item.slug)}
              focused={focusSlug === item.slug}
              noteOpen={openNote === item.slug}
              onToggleNote={() =>
                setOpenNote((current) => (current === item.slug ? null : item.slug))
              }
              onDecidi={(defaultOutcome) =>
                setDecide({
                  slug: item.slug,
                  name: toolName(catalog, item.slug),
                  defaultOutcome,
                  alternatives: item.alternatives,
                })
              }
            />
          ))}
        </ul></LocalizedAttributes>
      )}

      {decide ? (
        <DecisionSheet
          open
          onOpenChange={(open) => {
            if (!open) setDecide(null);
          }}
          slug={decide.slug}
          toolName={decide.name}
          alternatives={decide.alternatives}
          source="salvati"
          defaultOutcome={decide.defaultOutcome}
        />
      ) : null}
    </div>
  );
}

function LibraryRow({
  item,
  state,
  catalog,
  catalogItem,
  focused,
  noteOpen,
  onToggleNote,
  onDecidi,
}: {
  item: SalvatiRelationship;
  state: WorkspaceStateV1;
  catalog: readonly PublicToolCatalogItem[];
  catalogItem: PublicToolCatalogItem;
  focused: boolean;
  noteOpen: boolean;
  onToggleNote: () => void;
  onDecidi: (outcome: WorkspaceDecisionOutcome) => void;
}) {
  const name = catalogItem.name || item.slug;
  const [draft, setDraft] = useState(item.note ?? "");
  const showMarkStopped = item.usage === "using";
  const showMarkReplaced =
    item.outcome === "selected" || item.usage === "using" || item.usage === "stopped";
  const otherSaved = state.saved.slugs.filter((slug) => slug !== item.slug);
  const replacedName = item.replacedBy ? toolName(catalog, item.replacedBy) : null;
  const revisitLine =
    item.column === "rimandato" ? formatRevisitLine(item.revisitAt) : null;
  const stackLine = formatStackContext(item.stackNames);
  const descriptor = catalogItem.shortDescription?.trim() || catalogItem.categoryLabel;
  const primary = item.primaryAction;
  const statusLabel = item.reviewDue ? "Da rivedere" : item.compact.label;
  const noteExcerpt = item.note ? excerptPrivateNote(item.note, 80) : null;

  function handlePrimary() {
    if (primary.kind === "rivedi" || primary.kind === "valuta") {
      onDecidi(item.outcome ?? "selected");
      return;
    }
    if (primary.kind === "conferma_uso") {
      markWorkspaceToolUsing(item.slug);
    }
  }

  return (
    <li
      className="tv-lib-row"
      data-slug={item.slug}
      data-focus={focused ? "true" : undefined}
      data-relationship={item.compact.key}
      data-primary-action={primary.kind}
    >
      <WorkspaceCatalogMark catalog={catalog} slug={item.slug} size="lg" />
      <div className="tv-lib-row__main">
        <Link className="tv-lib-name" href={`/toools/${item.slug}`}>
          <LocalizedText>{name}</LocalizedText>
        </Link>
        {descriptor ? <p className="tv-lib-desc"><LocalizedText>{descriptor}</LocalizedText></p> : null}
        <p className="tv-lib-meta">
          <WorkspaceChip tone={item.reviewDue ? "revisit" : relationshipTone(item)}>
            <LocalizedText>{statusLabel}</LocalizedText>
          </WorkspaceChip>
          {noteExcerpt ? (
            <LocalizedAttributes><span className="tv-lib-note-excerpt" title={noteExcerpt}>
              <LocalizedText>{noteExcerpt}</LocalizedText>
            </span></LocalizedAttributes>
          ) : null}
        </p>
        <WorkspaceFilo
          state={state}
          slug={item.slug}
          catalog={catalog}
          defaultOpen={focused}
          events={item.events}
        />
        {replacedName && item.replacedBy ? (
          <WorkspaceReplacement catalog={catalog} fromSlug={item.slug} toSlug={item.replacedBy} />
        ) : null}
      </div>

      <div className="tv-lib-quick">
        {primary.href ? (
          <Link className="tv-lib-cta tv-lib-cta--row" href={primary.href}>
            <LocalizedText>{primary.label}</LocalizedText>
          </Link>
        ) : (
          <button type="button" className="tv-lib-cta tv-lib-cta--row" onClick={handlePrimary}>
            <LocalizedText>{primary.label}</LocalizedText>
          </button>
        )}
        <details className="tv-lib-menu">
          <LocalizedAttributes><summary aria-label={`Azioni per ${name}`}>⋯</summary></LocalizedAttributes>
          <div className="tv-lib-menu__panel">
            {item.inCompare ? (
              <span className="tv-lib-action tv-lib-action--status"><LocalizedText>{"Nel confronto"}</LocalizedText></span>
            ) : null}
            {stackLine ? (
              <span className="tv-lib-action tv-lib-action--status"><LocalizedText>{stackLine}</LocalizedText></span>
            ) : null}
            {revisitLine ? (
              <span className="tv-lib-action tv-lib-action--status"><LocalizedText>{revisitLine}</LocalizedText></span>
            ) : null}
            {formatWorkspaceDate(item.updatedAt) ? (
              <span className="tv-lib-action tv-lib-action--status">
                <LocalizedText>{formatWorkspaceDate(item.updatedAt)}</LocalizedText>
              </span>
            ) : null}
            {item.pinned ? (
              <span className="tv-lib-action tv-lib-action--status"><LocalizedText>{"Fisso"}</LocalizedText></span>
            ) : null}
            <Link className="tv-lib-action" href={`/toools/${item.slug}`}><LocalizedText>{"Apri "}</LocalizedText></Link>
            {item.compareFull ? (
              <span className="tv-lib-action tv-lib-action--status"><LocalizedText>{"Confronto pieno"}</LocalizedText></span>
            ) : (
              <button
                type="button"
                className="tv-lib-action"
                onClick={() => toggleWorkspaceCompare(item.slug)}
              >
                <LocalizedText>{item.inCompare ? "Togli dal confronto" : "Confronta"}</LocalizedText>
              </button>
            )}
            {primary.kind === "valuta" || primary.kind === "rivedi" ? null : (
              <button
                type="button"
                className="tv-lib-action"
                onClick={() => onDecidi(item.outcome ?? "selected")}
              >
                <LocalizedText>{item.reviewDue ? "Rivedi" : "Valuta"}</LocalizedText>
              </button>
            )}
            {showMarkStopped ? (
              <button
                type="button"
                className="tv-lib-action"
                onClick={() => markWorkspaceToolStopped(item.slug)}
              >
                <LocalizedText>{usageActionLabel("stopped")}</LocalizedText>
              </button>
            ) : null}
            {showMarkReplaced && otherSaved.length > 0 ? (
              <label className="tv-lib-action tv-lib-action--field">
                <span><LocalizedText>{usageActionLabel("replaced")}</LocalizedText></span>
                <LocalizedAttributes><select
                  aria-label={usageActionLabel("replaced")}
                  defaultValue=""
                  onChange={(event) => {
                    if (event.target.value) {
                      markWorkspaceToolReplaced(item.slug, event.target.value);
                    }
                    event.target.value = "";
                  }}
                >
                  <option value=""><LocalizedText>{"Sostituisci con"}</LocalizedText></option>
                  {otherSaved.map((slug) => (
                    <option key={slug} value={slug}>
                      <LocalizedText>{toolName(catalog, slug)}</LocalizedText>
                    </option>
                  ))}
                </select></LocalizedAttributes>
              </label>
            ) : null}
            {item.column === "rimandato" ? (
              <div className="tv-lib-action tv-lib-action--field">
                <span><LocalizedText>{"Quando rivedere"}</LocalizedText></span>
                <RevisitWhenChips
                  onSelect={(revisitAt) => deferWorkspaceTool(item.slug, revisitAt)}
                />
              </div>
            ) : null}
            <StackPickOrCreate
              slug={item.slug}
              allowCreate={getActiveWorkspaceOwner().kind === "account"}
              compact
            />
            <button type="button" className="tv-lib-action" onClick={onToggleNote}>
              <LocalizedText>{noteOpen ? "Chiudi nota" : item.note ? "Modifica nota" : "Aggiungi nota"}</LocalizedText>
            </button>
            <button
              type="button"
              className="tv-lib-action"
              onClick={() => setWorkspacePinned(item.slug, !item.pinned)}
            >
              <LocalizedText>{item.pinned ? "Togli fisso" : "Fissa"}</LocalizedText>
            </button>
            <button
              type="button"
              className="tv-lib-action tv-lib-action--danger"
              onClick={() => toggleWorkspaceSaved(item.slug)}
            ><LocalizedText>{"Rimuovi dai salvati "}</LocalizedText></button>
          </div>
        </details>
      </div>

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
            <span className="sr-only"><LocalizedText>{"Nota su "}</LocalizedText><LocalizedText>{name}</LocalizedText></span>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={MAX_NOTE_LENGTH}
              rows={3}
            />
          </label>
          <div className="tv-lib-note__actions">
            <button type="submit" className="tv-lib-action"><LocalizedText>{"Salva nota "}</LocalizedText></button>
            <button type="button" className="tv-lib-action" onClick={onToggleNote}><LocalizedText>{"Annulla "}</LocalizedText></button>
            {item.note ? (
              <button
                type="button"
                className="tv-lib-action tv-lib-action--danger"
                onClick={() => {
                  setWorkspaceNote(item.slug, null);
                  onToggleNote();
                }}
              ><LocalizedText>{"Elimina "}</LocalizedText></button>
            ) : null}
          </div>
        </form>
      ) : null}
    </li>
  );
}
