"use client";

/**
 * TooolVibes — Definitive Archive (v4, 2026-07-24)
 *
 * Rebuilt using the accepted v4 visual DNA:
 *  - dark Command Center intro with compact editorial H1 + integrated search
 *  - filter strip with category + level chips
 *  - tool-card grid (3-col desktop, 2-col tablet, 1-col mobile)
 *  - persistent comparison tray (rendered separately)
 *  - warm ivory Decision Desk band for the promoted "Tool of the Week" card
 *  - clear transition to footer
 *
 * Each tool card has its own state model (default / hover / selected / promoted)
 * defined in ArchiveV4ToolCard.
 *
 * No real data is fabricated: counts come from `tools` + `filterGroups`.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Sparkles, ArrowRight, Filter } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ToolFilterGroup, ToolPublicView } from "@/lib/data/tool-public-view";
import { ArchiveV4ToolCard } from "./archive-v4-tool-card";
import { ArchiveV4CompareTray } from "./archive-v4-compare-tray";

type DefinitiveArchiveProps = {
  tools: ToolPublicView[];
  filterGroups: ToolFilterGroup[];
};

const LEVEL_FILTERS = [
  { key: "all", label: "Tutti i livelli" },
  { key: "beginner", label: "Principiante" },
  { key: "intermediate", label: "Intermedio" },
  { key: "expert", label: "Esperto" },
  { key: "featured", label: "In evidenza" },
] as const;

export function DefinitiveArchive({ tools, filterGroups }: DefinitiveArchiveProps) {
  const [activeGroup, setActiveGroup] = useState<string>("all");
  const [activeLevel, setActiveLevel] = useState<string>("all");
  const [query, setQuery] = useState<string>("");

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      if (activeGroup !== "all") {
        if (!t.filterGroups.includes(activeGroup)) return false;
      }
      if (activeLevel !== "all") {
        if (activeLevel === "featured") {
          if (!t.featured && !t.toolOfWeek) return false;
        } else if (t.level !== activeLevel) {
          return false;
        }
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const haystack = `${t.name} ${t.categoryLabel} ${t.tldr ?? ""} ${t.shortDescription ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [tools, activeGroup, activeLevel, query]);

  const totalTools = tools.length;
  const totalGroups = filterGroups.length;
  const shown = filtered.length;

  // Build a per-group tool count from tools.filterGroups membership
  const groupCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tools) {
      for (const g of t.filterGroups) {
        map.set(g, (map.get(g) ?? 0) + 1);
      }
    }
    return map;
  }, [tools]);

  // Pick the first tool of week for the Decision Desk band
  const toolOfWeek = tools.find((t) => t.toolOfWeek) ?? tools[0] ?? null;
  const promotedTools = tools.filter((t) => t.featured).slice(0, 3);

  return (
    <div className="ar4-shell">
      {/* 1. COMPACT EDITORIAL INTRO (dark Command Center) */}
      <section className="ar4-intro" aria-labelledby="ar4-intro-title">
        <div className="ar4-intro__inner">
          <div className="ar4-intro__copy">
            <p className="ar4-intro__eyebrow">
              <span aria-hidden="true" className="ar4-intro__eyebrow-dot" />
              Directory editoriale
            </p>
            <h1 id="ar4-intro-title" className="ar4-intro__title">
              Il catalogo, <span className="ar4-intro__highlight">senza il caos.</span>
            </h1>
            <p className="ar4-intro__lede">
              Parti da un obiettivo oppure cerca direttamente. Ogni profilo è
              selezionato per aiutarti a decidere, non per riempire una lista.
            </p>
          </div>

          <div className="ar4-intro__panel">
            <label className="ar4-intro__search" aria-label="Cerca tool o categorie">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                placeholder="Cerca tool, categorie o tag…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <kbd aria-hidden="true">⌘K</kbd>
            </label>
            <dl className="ar4-intro__stats">
              <div>
                <dt>Tool curati</dt>
                <dd>{String(totalTools).padStart(2, "0")}</dd>
              </div>
              <div>
                <dt>Categorie</dt>
                <dd>{String(totalGroups).padStart(2, "0")}</dd>
              </div>
              <div>
                <dt>Percorsi</dt>
                <dd>{String(totalGroups).padStart(2, "0")}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* 2. FILTER STRIP */}
      <section className="ar4-filters" aria-label="Filtri catalogo">
        <div className="ar4-filters__inner">
          <div className="ar4-filters__group" role="tablist" aria-label="Categorie">
            <span className="ar4-filters__label" aria-hidden="true">
              <Filter size={12} />
              <span>Categoria</span>
            </span>
            <button
              type="button"
              role="tab"
              aria-selected={activeGroup === "all"}
              className={cn("ar4-chip", activeGroup === "all" && "is-active")}
              onClick={() => setActiveGroup("all")}
            >
              Tutti
              <em>{totalTools}</em>
            </button>
            {filterGroups.filter((g) => g.key !== "all").map((g) => (
              <button
                key={g.key}
                type="button"
                role="tab"
                aria-selected={activeGroup === g.key}
                className={cn("ar4-chip", activeGroup === g.key && "is-active")}
                onClick={() => setActiveGroup(g.key)}
              >
                {g.label}
                <em>{groupCounts.get(g.key) ?? 0}</em>
              </button>
            ))}
          </div>

          <div className="ar4-filters__group" role="tablist" aria-label="Livello">
            <span className="ar4-filters__label" aria-hidden="true">
              <span>Livello</span>
            </span>
            {LEVEL_FILTERS.map((l) => (
              <button
                key={l.key}
                type="button"
                role="tab"
                aria-selected={activeLevel === l.key}
                className={cn("ar4-chip ar4-chip--level", activeLevel === l.key && "is-active")}
                onClick={() => setActiveLevel(l.key)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. TOOL GRID + IVORY DECISION DESK (tool of the week band) */}
      {toolOfWeek && (
        <section className="ar4-ivory" aria-labelledby="ar4-ivory-title">
          <div className="ar4-ivory__inner">
            <div className="ar4-ivory__head">
              <p className="ar4-ivory__eyebrow">
                <Sparkles size={12} aria-hidden="true" />
                Decision desk
              </p>
              <h2 id="ar4-ivory-title" className="ar4-ivory__title">
                Il tool della settimana, in evidenza.
              </h2>
            </div>
            <div className="ar4-ivory__promoted">
              {promotedTools.length > 0 ? (
                <div className="ar4-ivory__promoted-grid">
                  {promotedTools.map((t, idx) => (
                    <ArchiveV4ToolCard
                      key={t.slug}
                      tool={t}
                      promoted
                      rank={idx + 1}
                    />
                  ))}
                </div>
              ) : (
                <ArchiveV4ToolCard tool={toolOfWeek} promoted rank={1} />
              )}
            </div>
          </div>
        </section>
      )}

      {/* 4. TOOL GRID */}
      <section className="ar4-grid" aria-labelledby="ar4-grid-title">
        <div className="ar4-grid__inner">
          <header className="ar4-grid__head">
            <div>
              <p className="ar4-grid__eyebrow">Catalogo completo</p>
              <h2 id="ar4-grid-title" className="ar4-grid__title">
                {activeGroup === "all" && activeLevel === "all"
                  ? "Tutti i tool"
                  : "Tool filtrati"}
              </h2>
            </div>
            <p className="ar4-grid__count" aria-live="polite">
              {String(shown).padStart(2, "0")} di {String(totalTools).padStart(2, "0")}
            </p>
          </header>

          {filtered.length === 0 ? (
            <div className="ar4-grid__empty">
              <p>Nessun tool corrisponde ai filtri attivi.</p>
              <button
                type="button"
                className="ar4-grid__empty-reset"
                onClick={() => {
                  setActiveGroup("all");
                  setActiveLevel("all");
                  setQuery("");
                }}
              >
                Reimposta filtri
              </button>
            </div>
          ) : (
            <ul className="ar4-grid__list">
              {filtered.map((t, idx) => (
                <li key={t.slug}>
                  <ArchiveV4ToolCard tool={t} rank={idx + 1} />
                </li>
              ))}
            </ul>
          )}

          <div className="ar4-grid__cta-row">
            <Link href="/metodo" className="ar4-grid__method-link">
              Come selezioniamo i tool
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. PERSISTENT COMPARISON TRAY */}
      <ArchiveV4CompareTray tools={tools} />
    </div>
  );
}

export default DefinitiveArchive;
