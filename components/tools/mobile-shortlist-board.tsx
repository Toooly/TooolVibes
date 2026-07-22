"use client";

import { useEffect, useState, useMemo, type CSSProperties } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  GitCompare,
  Trash2,
  ArrowRight,
  Bookmark,
  Heart,
  Clock,
  ClipboardCheck,
  Library,
  Link2,
  NotebookPen,
  Pin,
  PlusCircle,
  RotateCcw,
  Sparkles,
  Tags,
} from "lucide-react";
import Link from "next/link";

import { RequestToolForm } from "@/components/wishlist/request-tool-form";
import { ShortlistStageToggle } from "@/components/tools/shortlist-stage-toggle";
import { useDiscoverySnapshot } from "@/lib/discovery/client-store";
import {
  reopenToolDecision,
  setToolDecisionOutcome,
  toggleToolPin,
  updateToolDecisionMemory,
} from "@/lib/discovery/local-storage";
import type { WorkspaceDecisionOutcome } from "@/lib/discovery/types";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import {
  formatDecisionTimestamp,
  getSaveReasonMeta,
  saveReasonOptions,
} from "@/lib/tools/discovery";
import type { ShortlistStage, ToolDecisionMemory } from "@/lib/types/tool";
import type { ToolPublic } from "@/lib/types/tool-public";

type MobileShortlistBoardProps = {
  tools: ToolPublic[];
  /**
   * B32 release flag (TOOOLVIBES_DECISION_MEMORY_BOARD_ENABLED). When false
   * the sheet stays the legacy read-only note viewer.
   */
  decisionMemoryEnabled?: boolean;
};

type ToolWithMeta = ToolPublic & {
  stage: ShortlistStage;
  note?: string;
  isInCompare: boolean;
};

function getToolColor(tool: ToolPublic): string {
  const palette = ["#6a3cff","#39d2f6","#f3bf4c","#ec4899","#22c55e","#f97316","#8b5cf6","#14b8a6"];
  let hash = 0;
  for (let i = 0; i < tool.slug.length; i++) hash = ((hash << 5) - hash) + tool.slug.charCodeAt(i);
  return palette[Math.abs(hash) % palette.length];
}

function extractDomain(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function getStageLabel(stage: ShortlistStage): string {
  const labels: Record<ShortlistStage, string> = {
    saved: "Da provare",
    review: "In valutazione",
    top: "Preferito",
  };

  return labels[stage];
}

const decisionOutcomeOptions: WorkspaceDecisionOutcome[] = [
  "selected",
  "rejected",
  "deferred",
];

const decisionOutcomeMeta: Record<
  WorkspaceDecisionOutcome,
  { label: string; tone: string; background: string }
> = {
  selected: {
    label: "Scelto",
    tone: "var(--accent-strong)",
    background: "#efe8ff",
  },
  rejected: {
    label: "Scartato",
    tone: "var(--muted-strong)",
    background: "#fff2ec",
  },
  deferred: {
    label: "Rimandato",
    tone: "var(--muted-strong)",
    background: "#fff5df",
  },
};

const sheetChipClassName =
  "selection-chip text-ui-strong inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)] disabled:cursor-default disabled:opacity-100";

const sheetChipIdleStyle: CSSProperties = {
  borderColor: "var(--line)",
  background: "#f7f4ff",
  color: "var(--muted-strong)",
};

export function MobileShortlistBoard({
  tools,
  decisionMemoryEnabled = true,
}: MobileShortlistBoardProps) {
  const discovery = useDiscoverySnapshot();
  const savedSlugs = useToolWorkspaceStore((state) => state.savedSlugs);
  const compareSlugs = useToolWorkspaceStore((state) => state.compareSlugs);
  const shortlistStages = discovery.shortlistStages;
  const decisionMemories = discovery.decisionMemories;
  const decisionOutcomes = discovery.decisionOutcomes ?? {};
  const decisionUpdatedAts = discovery.decisionUpdatedAts ?? {};

  const [noteSlug, setNoteSlug] = useState<string | null>(null);

  const baseTools = useMemo(() => {
    return tools
      .filter((t) => savedSlugs.includes(t.slug))
      .map((t) => ({
        ...t,
        stage: (shortlistStages[t.slug] ?? "saved") as ShortlistStage,
        note: decisionMemories[t.slug]?.note,
        isInCompare: compareSlugs.includes(t.slug),
      }));
  }, [tools, savedSlugs, shortlistStages, decisionMemories, compareSlugs]);

  const totalCount = baseTools.length;

  // B35 / FLOW-604: decisioni registrate (anche dal confronto) con contesto,
  // visibili in shortlist dopo reload e login; ordinate per timestamp.
  // Le dipendenze restano le proprietà stabili dello snapshot (i fallback
  // `?? {}` vivono dentro il memo per non invalidarlo a ogni render).
  const decidedTools = useMemo(() => {
    const outcomes = discovery.decisionOutcomes ?? {};
    const updatedAts = discovery.decisionUpdatedAts ?? {};
    const timestamp = (slug: string) => {
      const value = updatedAts[slug];
      const parsed = value ? new Date(value).getTime() : Number.NaN;
      return Number.isFinite(parsed) ? parsed : 0;
    };

    return baseTools
      .filter((tool) => outcomes[tool.slug])
      .sort((left, right) => timestamp(right.slug) - timestamp(left.slug));
  }, [baseTools, discovery.decisionOutcomes, discovery.decisionUpdatedAts]);

  if (totalCount === 0) {
    return (
      <div className="mobile-library-board mobile-library-board--empty">
        <MobileLibraryEmpty tools={tools} />
        <LibraryWishlistSection />
      </div>
    );
  }

  const favoriteTools = baseTools.filter((t) => t.stage === "top");
  const toTryTools = baseTools.filter((t) => t.stage === "saved" || t.stage === "review");
  const recentTools = [...baseTools].reverse().slice(0, 8);
  const readyToCompare = baseTools.filter((t) => t.isInCompare);
  const noteTool = noteSlug
    ? baseTools.find((t) => t.slug === noteSlug)
    : undefined;

  return (
    <div className="mobile-library-board">
      <MobileLibraryHero totalCount={totalCount} compareCount={compareSlugs.length} />

      {/* Decision view (B35 / FLOW-604): le decisioni registrate — anche dal
          confronto — restano visibili qui dopo reload e login, riapribili con
          contesto. Riusa la geometria `mobile-library-board__compare` (stesso
          blocco sezione della board, nessuna nuova regola CSS). */}
      {decisionMemoryEnabled && decidedTools.length > 0 && (
        <section
          className="mobile-library-board__compare"
          aria-labelledby="mobile-library-decisions-title"
        >
          <h2 id="mobile-library-decisions-title">
            <ClipboardCheck size={14} />
            Decisioni registrate
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {decidedTools.map((tool) => {
              const outcome = decisionOutcomes[tool.slug];
              if (!outcome) return null;
              const meta = decisionOutcomeMeta[outcome];

              return (
                <li
                  key={tool.slug}
                  className="flex flex-wrap items-center gap-2 rounded-[16px] border px-3 py-2"
                  style={{
                    borderColor: "var(--line)",
                    background: "#ffffff",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setNoteSlug(tool.slug)}
                    aria-label={`Apri decisione di ${tool.name}`}
                    className="text-sm font-semibold underline-offset-2 hover:underline"
                  >
                    {tool.name}
                  </button>
                  <span
                    className={sheetChipClassName}
                    style={{
                      borderColor: "rgba(112,82,255,0.24)",
                      background: meta.background,
                      color: meta.tone,
                    }}
                  >
                    {meta.label}
                  </span>
                  <span
                    className="text-xs uppercase tracking-[0.14em]"
                    style={{ color: "var(--muted)" }}
                  >
                    Registrata{" "}
                    {formatDecisionTimestamp(decisionUpdatedAts[tool.slug])}
                  </span>
                  <button
                    type="button"
                    onClick={() => reopenToolDecision(tool.slug)}
                    aria-label={`Riapri decisione di ${tool.name}`}
                    data-sonic-action="update"
                    className={`${sheetChipClassName} gap-2`}
                    style={sheetChipIdleStyle}
                  >
                    <RotateCcw size={12} />
                    Riapri
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Compare section */}
      {readyToCompare.length > 0 && (
        <div className="mobile-library-board__compare">
          <h2>
            <GitCompare size={14} />
            Pronti per confrontare
          </h2>
          <div className="mobile-library-board__compare-list">
            {readyToCompare.map((tool) => (
              <Link
                key={tool.slug}
                href={`/toools/${tool.slug}`}
                className="mobile-library-board__compare-chip"
                style={{ "--chip-color": getToolColor(tool) } as CSSProperties}
              >
                <span>{tool.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Shelves */}
      <MobileLibraryShelf
        title="Preferiti"
        icon={Heart}
        tools={favoriteTools}
        color="#f3bf4c"
        emptyText="I tool che ami di più appariranno qui"
        decisionOutcomes={decisionOutcomes}
        onOpenMemory={setNoteSlug}
      />

      <MobileLibraryShelf
        title="Da provare"
        icon={Bookmark}
        tools={toTryTools}
        color="#9be8ff"
        emptyText="Tool salvati da esplorare"
        decisionOutcomes={decisionOutcomes}
        onOpenMemory={setNoteSlug}
      />

      <MobileLibraryShelf
        title="Recenti"
        icon={Clock}
        tools={recentTools}
        color="#ff8ecb"
        emptyText="Gli ultimi tool aggiunti"
        decisionOutcomes={decisionOutcomes}
        onOpenMemory={setNoteSlug}
      />

      <LibraryWishlistSection />

      {/* Decision memory bottom sheet (B32) */}
      <AnimatePresence>
        {noteSlug && noteTool && (
          <MobileNoteSheet
            key={noteSlug}
            slug={noteSlug}
            toolName={noteTool.name}
            memory={decisionMemories[noteSlug] ?? {}}
            decisionOutcome={decisionOutcomes[noteSlug] ?? null}
            decisionUpdatedAt={decisionUpdatedAts[noteSlug] ?? null}
            editable={decisionMemoryEnabled}
            onClose={() => setNoteSlug(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function LibraryWishlistSection() {
  const signalCards = [
    { icon: Link2, label: "Link ufficiale", copy: "Evita cloni e schede duplicate: partiamo sempre dalla fonte giusta." },
    { icon: Tags, label: "Categoria", copy: "AI app builder, no-code, automazioni o SaaS: il contesto decide dove inserirlo." },
    { icon: Sparkles, label: "Motivo", copy: "Una frase chiara aiuta a capire perché merita spazio nella libreria." },
  ];

  return (
    <section id="wishlist" className="mobile-library-wishlist" aria-labelledby="library-wishlist-title">
      <div className="mobile-library-wishlist__intro">
        <span className="mobile-library-wishlist__eyebrow">
          <Heart size={14} />
          Segnalazioni TooolVibes
        </span>
        <h2 id="library-wishlist-title">Suggerisci un tool alla selezione.</h2>
        <p>
          Se manca un tool AI, SaaS o builder che merita spazio, segnalalo da qui:
          resta tra i tuoi suggerimenti e diventa parte del percorso di selezione.
        </p>
        <div className="mobile-library-wishlist__signals" aria-label="Segnali utili per proporre un tool">
          {signalCards.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="mobile-library-wishlist__signal-card">
                <span aria-hidden="true">
                  <Icon size={15} />
                </span>
                <strong>{item.label}</strong>
                <small>{item.copy}</small>
              </div>
            );
          })}
        </div>
      </div>
      <RequestToolForm className="mobile-library-wishlist__form" />
    </section>
  );
}

function MobileLibraryHero({ totalCount, compareCount }: { totalCount: number; compareCount: number }) {
  const stats = [
    { label: "Salvati", value: totalCount },
    { label: "Confronto", value: compareCount },
    { label: "Segnalazioni", value: "Aperte" },
  ];

  return (
    <section className="mobile-library-hero" aria-labelledby="mobile-library-title">
      <div className="mobile-library-board__header">
        <div className="mobile-library-board__icon">
          <Library size={22} />
        </div>
        <div>
          <span className="mobile-library-hero__eyebrow">Biblioteca operativa</span>
          <h1 id="mobile-library-title">La tua biblioteca</h1>
          <p>
            {totalCount > 0
              ? `${totalCount} tool salvati, ordinati per tornare subito alla scelta giusta.`
              : "Uno spazio vivo per tool salvati, segnalazioni e prossime scoperte."}
          </p>
        </div>
      </div>

      <div className="mobile-library-hero__stats">
        {stats.map((item) => (
          <div key={item.label} className="mobile-library-hero__stat">
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MobileLibraryShelf
   ═══════════════════════════════════════════════════════════════ */

function MobileLibraryShelf({
  title,
  icon: Icon,
  tools,
  color,
  emptyText,
  decisionOutcomes,
  onOpenMemory,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  tools: ToolWithMeta[];
  color: string;
  emptyText: string;
  decisionOutcomes: Record<string, WorkspaceDecisionOutcome>;
  onOpenMemory: (slug: string) => void;
}) {
  return (
    <section className="mobile-library-shelf" style={{ "--shelf-color": color } as CSSProperties}>
      <div className="mobile-library-shelf__header">
        <Icon size={14} style={{ color }} />
        <h2 style={{ color }}>{title}</h2>
        <span>{tools.length}</span>
      </div>

      {tools.length > 0 ? (
        <div className="mobile-library-shelf__rail">
          {tools.map((tool, index) => (
            <LibraryBook
              key={tool.slug}
              tool={tool}
              index={index}
              decisionOutcome={decisionOutcomes[tool.slug] ?? null}
              onOpenMemory={() => onOpenMemory(tool.slug)}
            />
          ))}
        </div>
      ) : (
        <div className="mobile-library-shelf__empty">
          <span aria-hidden="true">
            <PlusCircle size={16} />
          </span>
          <p>{emptyText}</p>
          <Link href="/archivio">Trova candidati</Link>
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LibraryBook
   ═══════════════════════════════════════════════════════════════ */

function LibraryBook({
  tool,
  index,
  decisionOutcome,
  onOpenMemory,
}: {
  tool: ToolWithMeta;
  index: number;
  decisionOutcome: WorkspaceDecisionOutcome | null;
  onOpenMemory: () => void;
}) {
  const color = getToolColor(tool);
  const domain = extractDomain(tool.urls.website);
  const iconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
    : undefined;
  const toggleSaved = useToolWorkspaceStore((state) => state.toggleSaved);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.25) }}
      className="mobile-library-book"
      style={{ "--book-color": color } as CSSProperties}
    >
      <Link
        href={`/toools/${tool.slug}`}
        className="mobile-library-book__cover"
        aria-label={`Apri la scheda di ${tool.name}`}
      >
        <span className="mobile-library-book__face">
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- TODO(B66): migrate this runtime image after the image contract is unified.
            <img src={iconUrl} alt="" loading="lazy" />
          ) : (
            <span>{tool.name.slice(0, 2).toUpperCase()}</span>
          )}
        </span>
      </Link>
      <div className="mobile-library-book__meta">
        <strong>{tool.name}</strong>
        <span>{getStageLabel(tool.stage)}</span>
        {decisionOutcome ? (
          <span>{decisionOutcomeMeta[decisionOutcome].label}</span>
        ) : null}
      </div>
      <div className="mobile-library-book__remove-wrap">
        <button
          type="button"
          onClick={onOpenMemory}
          className="mobile-library-book__remove"
          aria-label={`Apri nota e decisione di ${tool.name}`}
          style={{
            background: "#5b3fd6",
            boxShadow: "0 2px 6px rgba(91,63,214,0.24)",
          }}
        >
          <NotebookPen size={12} />
        </button>
        <button
          type="button"
          onClick={() => toggleSaved(tool.slug)}
          className="mobile-library-book__remove"
          aria-label={`Rimuovi ${tool.name} dai salvati`}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MobileNoteSheet
   ═══════════════════════════════════════════════════════════════ */

function MobileNoteSheet({
  slug,
  toolName,
  memory,
  decisionOutcome,
  decisionUpdatedAt = null,
  editable,
  onClose,
}: {
  slug: string;
  toolName: string;
  memory: ToolDecisionMemory;
  decisionOutcome: WorkspaceDecisionOutcome | null;
  /**
   * B35: timestamp versionato del record decisione. Copre anche i tool con
   * sola decisione (senza nota/motivo/pin), per cui la memoria è vuota ma il
   * record esiste — prima il "Registrata" cadeva su "Nessun aggiornamento".
   */
  decisionUpdatedAt?: string | null;
  editable: boolean;
  onClose: () => void;
}) {
  const [noteDraft, setNoteDraft] = useState(memory.note ?? "");

  useEffect(() => {
    setNoteDraft(memory.note ?? "");
  }, [memory.note, slug]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const noteIsDirty = noteDraft.trim() !== (memory.note ?? "");
  const noteId = `shortlist-sheet-note-${slug}`;

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="mobile-shortlist-board__sheet"
      role="dialog"
      aria-modal="true"
      aria-label={`Memoria decisionale di ${toolName}`}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 70,
        margin: "0 auto",
        maxWidth: 520,
        maxHeight: "82vh",
        overflowY: "auto",
        borderRadius: "24px 24px 0 0",
        border: "1px solid var(--line)",
        borderBottom: "none",
        background: "#fbfaff",
        boxShadow: "0 -18px 48px rgba(31,16,71,0.18)",
        padding: "10px 20px 28px",
      }}
    >
      <div className="mobile-shortlist-board__sheet-header">
        <button
          type="button"
          onClick={onClose}
          className="mobile-shortlist-board__sheet-close"
          aria-label="Chiudi memoria decisionale"
        >
          <X size={16} />
        </button>
      </div>
      <div className="mobile-shortlist-board__sheet-body">
        {!editable ? (
          <>
            <h3>Nota personale</h3>
            {memory.note ? (
              <p>{memory.note}</p>
            ) : (
              <p className="is-empty">Nessuna nota per questo tool.</p>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="editorial-label">Memoria decisionale</p>
                <h3 className="mt-1 text-base font-semibold">{toolName}</h3>
              </div>
              <button
                type="button"
                onClick={() => toggleToolPin(slug)}
                data-sonic-action="update"
                aria-pressed={Boolean(memory.is_pinned)}
                className={`${sheetChipClassName} gap-2 ${
                  memory.is_pinned ? "quick-filter-chip is-active" : ""
                }`}
                style={
                  memory.is_pinned
                    ? {
                        borderColor: "rgba(112,82,255,0.24)",
                        background: "#efe8ff",
                        color: "var(--accent-strong)",
                      }
                    : sheetChipIdleStyle
                }
              >
                <Pin size={12} />
                {memory.is_pinned ? "In primo piano" : "Metti in primo piano"}
              </button>
            </div>

            <div className="mt-4">
              <p className="editorial-label">Stato nella shortlist</p>
              <div className="mt-3">
                <ShortlistStageToggle slug={slug} />
              </div>
            </div>

            <div className="mt-4">
              <p className="editorial-label">Decisione</p>
              <div
                className="tool-rail mt-3 -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1"
                role="group"
                aria-label="Esito della decisione"
              >
                {decisionOutcomeOptions.map((option) => {
                  const meta = decisionOutcomeMeta[option];
                  const active = decisionOutcome === option;

                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={active}
                      aria-pressed={active}
                      onClick={() => {
                        if (!active) setToolDecisionOutcome(slug, option);
                      }}
                      data-sonic-action="tab"
                      className={`${sheetChipClassName} ${
                        active ? "quick-filter-chip is-active" : ""
                      }`}
                      style={
                        active
                          ? {
                              borderColor: "rgba(112,82,255,0.24)",
                              background: meta.background,
                              color: meta.tone,
                            }
                          : sheetChipIdleStyle
                      }
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>
              {decisionOutcome ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p
                    className="text-xs uppercase tracking-[0.16em]"
                    style={{ color: "var(--muted)" }}
                  >
                    Registrata{" "}
                    {formatDecisionTimestamp(
                      decisionUpdatedAt ?? memory.updated_at,
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => reopenToolDecision(slug)}
                    data-sonic-action="update"
                    className={`${sheetChipClassName} gap-2`}
                    style={sheetChipIdleStyle}
                  >
                    <RotateCcw size={12} />
                    Riapri decisione
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              <p className="editorial-label">Motivo del salvataggio</p>
              <div
                className="tool-rail mt-3 -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1"
                role="group"
                aria-label="Motivo del salvataggio"
              >
                {saveReasonOptions.map((option) => {
                  const meta = getSaveReasonMeta(option);
                  const active = memory.save_reason === option;

                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        updateToolDecisionMemory(slug, {
                          save_reason: active ? undefined : option,
                        })
                      }
                      data-sonic-action="tab"
                      className={`${sheetChipClassName} ${
                        active ? "quick-filter-chip is-active" : ""
                      }`}
                      style={
                        active
                          ? {
                              borderColor: "rgba(112,82,255,0.24)",
                              background: "#efe8ff",
                              color: meta.tone,
                            }
                          : sheetChipIdleStyle
                      }
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <label className="editorial-label" htmlFor={noteId}>
                Nota personale
              </label>
              <textarea
                id={noteId}
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                rows={3}
                maxLength={2000}
                placeholder={`Segnati cosa ti interessa davvero di ${toolName}...`}
                data-sonic-action="update"
                className="filter-control mt-3 w-full rounded-[18px] border px-4 py-3 outline-none"
                style={{
                  borderColor: "var(--line)",
                  background: "#ffffff",
                }}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p
                  className="text-xs uppercase tracking-[0.16em]"
                  style={{ color: "var(--muted)" }}
                >
                  {noteDraft.length}/2000 · Ultimo salvataggio:{" "}
                  {formatDecisionTimestamp(memory.updated_at)}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    updateToolDecisionMemory(slug, { note: noteDraft })
                  }
                  disabled={!noteIsDirty}
                  data-sonic-action="save"
                  className="selection-chip text-ui-strong inline-flex items-center rounded-full border px-2.75 py-1.25 text-xs font-semibold uppercase tracking-[0.14em] disabled:cursor-default disabled:opacity-55"
                  style={{
                    borderColor: noteIsDirty
                      ? "rgba(112,82,255,0.24)"
                      : "var(--line)",
                    background: noteIsDirty
                      ? "#efe8ff"
                      : "#f7f4ff",
                    color: noteIsDirty ? "var(--accent-strong)" : "var(--muted)",
                  }}
                >
                  {noteIsDirty ? "Salva nota" : "Nota salvata"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MobileLibraryEmpty
   ═══════════════════════════════════════════════════════════════ */

function MobileLibraryEmpty({ tools }: { tools: ToolPublic[] }) {
  const starterTools = tools.slice(0, 3);
  const routes = [
    { href: "/archivio", label: "Esplora catalogo", copy: "Filtra per categoria e salva i candidati davvero utili." },
    { href: "/radar", label: "Apri Radar", copy: "Parti dai segnali live quando non sai da dove cominciare." },
    { href: "#wishlist", label: "Suggerisci tool", copy: "Manca un nome importante? Segnalalo alla selezione." },
  ];

  return (
    <div className="mobile-library-empty">
      <div className="mobile-library-empty__visual">
        <div className="mobile-library-empty__shelf">
          <span className="mobile-library-empty__book" />
          <span className="mobile-library-empty__book" />
          <span className="mobile-library-empty__book is-ghost" />
        </div>
      </div>
      <div className="mobile-library-empty__content">
        <span className="mobile-library-empty__kicker">Nessun tool salvato, per ora</span>
        <h2>La tua biblioteca è pronta a riempirsi.</h2>
        <p>
          Inizia con pochi candidati buoni: quando salvi un tool, qui trovi categoria,
          stato, link alla scheda e scorciatoie per confronto o suggerimenti.
        </p>
      </div>
      <div className="mobile-library-empty__routes">
        {routes.map((route) => (
          <Link key={route.href} href={route.href} className="mobile-library-empty__route">
            <strong>{route.label}</strong>
            <span>{route.copy}</span>
          </Link>
        ))}
      </div>
      {starterTools.length > 0 ? (
        <div className="mobile-library-empty__starter" aria-label="Tool da cui partire">
          <span>Da provare per iniziare</span>
          <div>
            {starterTools.map((tool) => (
              <Link key={tool.slug} href={`/toools/${tool.slug}`}>
                {tool.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mobile-library-empty__actions">
        <Link href="/archivio" className="mobile-library-empty__cta">
          Esplora il catalogo
          <ArrowRight size={14} />
        </Link>
        <Link href="/radar" className="mobile-library-empty__cta is-secondary">
          Apri il Radar
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
