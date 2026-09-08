"use client";

import { useEffect, useState, useMemo, type CSSProperties } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { levelBTransition } from "@/lib/motion/transitions";
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
  NotebookPen,
  Pin,
  PlusCircle,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

import { DecisionSheet } from "@/components/account/workspace/decision-sheet";
import {
  formatRevisitLine,
  OUTCOME_STATE_LABELS,
  STAGE_LABELS,
  usageActionLabel,
  usageStateLabel,
} from "@/lib/account/workspace-lifecycle";
import { ShortlistStageToggle } from "@/components/tools/shortlist-stage-toggle";
import { useDiscoverySnapshot } from "@/lib/discovery/client-store";
import {
  markWorkspaceToolReplaced,
  markWorkspaceToolStopped,
  markWorkspaceToolUsing,
  reopenWorkspaceDecision,
  setWorkspaceNote,
  setWorkspacePinned,
  setWorkspaceSaveReason,
} from "@/lib/account/workspace-actions";
import type {
  WorkspaceDecisionOutcome,
  WorkspaceUsage,
} from "@/lib/discovery/types";
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
  categoryCount: number;
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

/**
 * Personal family identity tone: muted lilac variants only, never a rainbow.
 * Used as a thin spine / dot accent, not a fill.
 */
function getToolColor(tool: ToolPublic): string {
  const palette = [
    "var(--tv-grammar-personal-accent-strong)",
    "var(--tv-accent-violet-on-dark)",
    "var(--tv-grammar-personal-accent)",
  ];
  let hash = 0;
  for (let i = 0; i < tool.slug.length; i++)
    hash = (hash << 5) - hash + tool.slug.charCodeAt(i);
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
  return STAGE_LABELS[stage];
}

function resolveToolName(
  tools: ToolPublic[],
  slug: string | null | undefined,
): string | null {
  if (!slug) return null;
  return tools.find((tool) => tool.slug === slug)?.name ?? null;
}

function formatUsageLine(
  usage: WorkspaceUsage | null | undefined,
  replacedByName: string | null,
): string | null {
  if (!usage) return null;
  const label = usageStateLabel(usage);
  return usage === "replaced" && replacedByName
    ? `${label} → ${replacedByName}`
    : label;
}

const decisionOutcomeMeta: Record<
  WorkspaceDecisionOutcome,
  { stateLabel: string }
> = {
  selected: { stateLabel: OUTCOME_STATE_LABELS.selected },
  rejected: { stateLabel: OUTCOME_STATE_LABELS.rejected },
  deferred: { stateLabel: OUTCOME_STATE_LABELS.deferred },
};

export function MobileShortlistBoard({
  tools,
  categoryCount,
  decisionMemoryEnabled = true,
}: MobileShortlistBoardProps) {
  const discovery = useDiscoverySnapshot();
  const savedSlugs = useToolWorkspaceStore((state) => state.savedSlugs);
  const compareSlugs = useToolWorkspaceStore((state) => state.compareSlugs);
  const shortlistStages = discovery.shortlistStages;
  const decisionMemories = discovery.decisionMemories;
  const decisionOutcomes = discovery.decisionOutcomes ?? {};
  const decisionUpdatedAts = discovery.decisionUpdatedAts ?? {};
  const decisionRevisitAts = discovery.decisionRevisitAts ?? {};
  const toolUsages = discovery.toolUsages ?? {};
  const toolReplacedBy = discovery.toolReplacedBy ?? {};

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
        <MobileLibraryEmpty tools={tools} categoryCount={categoryCount} />
      </div>
    );
  }

  const favoriteTools = baseTools.filter((t) => t.stage === "top");
  const toTryTools = baseTools.filter(
    (t) => t.stage === "saved" || t.stage === "review",
  );
  const recentTools = [...baseTools].reverse().slice(0, 8);
  const readyToCompare = baseTools.filter((t) => t.isInCompare);
  const noteTool = noteSlug
    ? baseTools.find((t) => t.slug === noteSlug)
    : undefined;

  return (
    <div className="mobile-library-board">
      <MobileLibraryHero
        totalCount={totalCount}
        compareCount={compareSlugs.length}
      />

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
              const usage = toolUsages[tool.slug] ?? null;
              const usageLine = formatUsageLine(
                usage,
                resolveToolName(tools, toolReplacedBy[tool.slug]),
              );

              return (
                <li key={tool.slug} className="mobile-library-board__decision">
                  <button
                    type="button"
                    onClick={() => setNoteSlug(tool.slug)}
                    aria-label={`Apri decisione di ${tool.name}`}
                    className="text-sm font-semibold underline-offset-2 hover:underline"
                  >
                    {tool.name}
                  </button>
                  <span
                    className="shortlist-decision-chip"
                    data-outcome={outcome}
                  >
                    {meta.stateLabel}
                  </span>
                  {usageLine ? (
                    <span className="shortlist-usage-chip">{usageLine}</span>
                  ) : null}
                  <span className="shortlist-decision-meta">
                    {outcome === "deferred"
                      ? (formatRevisitLine(decisionRevisitAts[tool.slug]) ??
                        "Rivedi: data da impostare")
                      : `Registrata ${formatDecisionTimestamp(decisionUpdatedAts[tool.slug])}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => reopenWorkspaceDecision(tool.slug)}
                    aria-label={`Riapri decisione di ${tool.name}`}
                    data-sonic-action="update"
                    className="shortlist-sheet-chip"
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
            <Link
              href="/compare"
              className="mobile-library-board__compare-chip mobile-library-board__compare-chip--open"
              aria-label={`Apri il confronto con ${readyToCompare.length} tool`}
              data-sonic-action="navigate"
            >
              <span>Apri il confronto</span>
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      {/* Shelves */}
      <MobileLibraryShelf
        title="Preferiti"
        icon={Heart}
        tools={favoriteTools}
        catalogTools={tools}
        color="var(--tv-grammar-personal-accent-strong)"
        emptyText="I tool che ami di più appariranno qui"
        decisionOutcomes={decisionOutcomes}
        decisionRevisitAts={decisionRevisitAts}
        toolUsages={toolUsages}
        toolReplacedBy={toolReplacedBy}
        onOpenMemory={setNoteSlug}
      />

      <MobileLibraryShelf
        title="Da provare"
        icon={Bookmark}
        tools={toTryTools}
        catalogTools={tools}
        color="var(--tv-grammar-personal-accent)"
        emptyText="Tool salvati da esplorare"
        decisionOutcomes={decisionOutcomes}
        decisionRevisitAts={decisionRevisitAts}
        toolUsages={toolUsages}
        toolReplacedBy={toolReplacedBy}
        onOpenMemory={setNoteSlug}
      />

      <MobileLibraryShelf
        title="Recenti"
        icon={Clock}
        tools={recentTools}
        catalogTools={tools}
        color="var(--tv-grammar-personal-ink-muted)"
        emptyText="Gli ultimi tool aggiunti"
        decisionOutcomes={decisionOutcomes}
        decisionRevisitAts={decisionRevisitAts}
        toolUsages={toolUsages}
        toolReplacedBy={toolReplacedBy}
        onOpenMemory={setNoteSlug}
      />

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
            decisionRevisitAt={decisionRevisitAts[noteSlug] ?? null}
            usage={toolUsages[noteSlug] ?? null}
            replacedBySlug={toolReplacedBy[noteSlug] ?? null}
            replacedByName={resolveToolName(tools, toolReplacedBy[noteSlug])}
            replacementCandidates={baseTools
              .filter((tool) => tool.slug !== noteSlug)
              .map((tool) => ({ slug: tool.slug, name: tool.name }))}
            editable={decisionMemoryEnabled}
            onClose={() => setNoteSlug(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileLibraryHero({
  totalCount,
  compareCount,
}: {
  totalCount: number;
  compareCount: number;
}) {
  const stats = [
    { label: "Salvati", value: totalCount },
    { label: "Confronto", value: compareCount },
  ];

  return (
    <section
      className="mobile-library-hero"
      aria-labelledby="mobile-library-title"
    >
      <div className="mobile-library-board__header">
        <div className="mobile-library-board__icon">
          <Library size={22} />
        </div>
        <div>
          <span className="mobile-library-hero__eyebrow">Salvati</span>
          <h1 id="mobile-library-title">I tuoi Salvati</h1>
          <p>
            {totalCount > 0
              ? `${totalCount} candidati. Salvare non è decidere.`
              : "La shortlist è il tavolo di lavoro. La decisione è il motivo della scelta."}
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
  catalogTools,
  color,
  emptyText,
  decisionOutcomes,
  decisionRevisitAts,
  toolUsages,
  toolReplacedBy,
  onOpenMemory,
}: {
  title: string;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
    style?: React.CSSProperties;
  }>;
  tools: ToolWithMeta[];
  catalogTools: ToolPublic[];
  color: string;
  emptyText: string;
  decisionOutcomes: Record<string, WorkspaceDecisionOutcome>;
  decisionRevisitAts: Record<string, string>;
  toolUsages: Record<string, WorkspaceUsage>;
  toolReplacedBy: Record<string, string>;
  onOpenMemory: (slug: string) => void;
}) {
  return (
    <section
      className="mobile-library-shelf"
      style={{ "--shelf-color": color } as CSSProperties}
    >
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
              decisionRevisitAt={decisionRevisitAts[tool.slug] ?? null}
              usage={toolUsages[tool.slug] ?? null}
              replacedByName={resolveToolName(
                catalogTools,
                toolReplacedBy[tool.slug],
              )}
              onOpenMemory={() => onOpenMemory(tool.slug)}
            />
          ))}
        </div>
      ) : (
        <div className="mobile-library-shelf__empty">
          <span className="mobile-library-shelf__empty-icon" aria-hidden="true">
            <PlusCircle size={20} />
          </span>
          <p className="mobile-library-shelf__empty-text">{emptyText}</p>
          <Link href="/archivio" className="mobile-library-shelf__empty-cta">
            Esplora candidati
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
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
  decisionRevisitAt = null,
  usage = null,
  replacedByName = null,
  onOpenMemory,
}: {
  tool: ToolWithMeta;
  index: number;
  decisionOutcome: WorkspaceDecisionOutcome | null;
  decisionRevisitAt?: string | null;
  usage?: WorkspaceUsage | null;
  replacedByName?: string | null;
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
          <span>
            {decisionOutcomeMeta[decisionOutcome].stateLabel}
            {decisionOutcome === "deferred" &&
            formatRevisitLine(decisionRevisitAt)
              ? ` · ${formatRevisitLine(decisionRevisitAt)}`
              : ""}
          </span>
        ) : null}
        {formatUsageLine(usage, replacedByName) ? (
          <span>{formatUsageLine(usage, replacedByName)}</span>
        ) : null}
      </div>
      <div className="mobile-library-book__remove-wrap">
        <button
          type="button"
          onClick={onOpenMemory}
          className="mobile-library-book__remove mobile-library-book__remove--memory"
          aria-label={`Apri nota e decisione di ${tool.name}`}
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
  decisionRevisitAt = null,
  usage = null,
  replacedBySlug = null,
  replacedByName = null,
  replacementCandidates = [],
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
  decisionRevisitAt?: string | null;
  usage?: WorkspaceUsage | null;
  replacedBySlug?: string | null;
  replacedByName?: string | null;
  replacementCandidates?: Array<{ slug: string; name: string }>;
  editable: boolean;
  onClose: () => void;
}) {
  const preferReducedMotion = useReducedMotion();
  const compareSlugs = useToolWorkspaceStore((state) => state.compareSlugs);
  const [noteDraft, setNoteDraft] = useState(memory.note ?? "");
  const [pendingReplace, setPendingReplace] = useState(false);
  const [decideOpen, setDecideOpen] = useState(false);

  useEffect(() => {
    setNoteDraft(memory.note ?? "");
    setPendingReplace(false);
  }, [memory.note, slug]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (decideOpen) return;
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [decideOpen, onClose]);

  const noteIsDirty = noteDraft.trim() !== (memory.note ?? "");
  const noteId = `shortlist-sheet-note-${slug}`;

  return (
    <motion.div
      initial={preferReducedMotion ? false : { y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={preferReducedMotion ? undefined : { y: 12, opacity: 0 }}
      transition={levelBTransition({ preferReducedMotion })}
      className="mobile-shortlist-board__sheet"
      role="dialog"
      aria-modal="true"
      aria-label={`Memoria decisionale di ${toolName}`}
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
                onClick={() => setWorkspacePinned(slug, !memory.is_pinned)}
                data-sonic-action="update"
                aria-pressed={Boolean(memory.is_pinned)}
                className="shortlist-sheet-chip"
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
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDecideOpen(true)}
                  data-sonic-action="tab"
                  className="shortlist-sheet-chip shortlist-sheet-chip--decide"
                >
                  Decidi
                </button>
              </div>
              {decisionOutcome ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="shortlist-sheet-meta">
                    {decisionOutcomeMeta[decisionOutcome].stateLabel}
                    {formatUsageLine(usage, replacedByName)
                      ? ` · ${formatUsageLine(usage, replacedByName)}`
                      : ""}
                    {decisionOutcome === "deferred"
                      ? ` · ${formatRevisitLine(decisionRevisitAt) ?? "Rivedi: data da impostare"}`
                      : ` · Registrata ${formatDecisionTimestamp(
                          decisionUpdatedAt ?? memory.updated_at,
                        )}`}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingReplace(false);
                      reopenWorkspaceDecision(slug);
                    }}
                    data-sonic-action="update"
                    className="shortlist-sheet-chip"
                  >
                    <RotateCcw size={12} />
                    Riapri decisione
                  </button>
                </div>
              ) : null}
              {decisionOutcome === "selected" && !usage ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => markWorkspaceToolUsing(slug)}
                    data-sonic-action="update"
                    className="shortlist-sheet-chip"
                  >
                    {usageActionLabel("using")}
                  </button>
                </div>
              ) : null}
              {usage === "using" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingReplace(false);
                      markWorkspaceToolStopped(slug);
                    }}
                    data-sonic-action="update"
                    className="shortlist-sheet-chip"
                  >
                    {usageActionLabel("stopped")}
                  </button>
                  {replacementCandidates.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setPendingReplace(true)}
                      aria-pressed={pendingReplace}
                      data-sonic-action="tab"
                      className="shortlist-sheet-chip"
                    >
                      {usageActionLabel("replaced")}
                    </button>
                  ) : null}
                </div>
              ) : null}
              {(pendingReplace || usage === "replaced") &&
              replacementCandidates.length > 0 ? (
                <div
                  className="tool-rail mt-3 -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1"
                  role="group"
                  aria-label="Sostituito con"
                >
                  {replacementCandidates.map((candidate) => {
                    const active = replacedBySlug === candidate.slug;
                    return (
                      <button
                        key={candidate.slug}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          markWorkspaceToolReplaced(slug, candidate.slug);
                          setPendingReplace(false);
                        }}
                        data-sonic-action="tab"
                        className="shortlist-sheet-chip"
                      >
                        {candidate.name}
                      </button>
                    );
                  })}
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
                        setWorkspaceSaveReason(slug, active ? null : option)
                      }
                      data-sonic-action="tab"
                      className="shortlist-sheet-chip"
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
                className="shortlist-note-field mt-3 w-full px-4 py-3"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="shortlist-sheet-meta">
                  {noteDraft.length}/2000 · Ultimo salvataggio:{" "}
                  {formatDecisionTimestamp(memory.updated_at)}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setWorkspaceNote(slug, noteDraft.trim() || null)
                  }
                  disabled={!noteIsDirty}
                  data-sonic-action="save"
                  data-dirty={noteIsDirty ? "true" : "false"}
                  className="shortlist-sheet-chip shortlist-sheet-chip--save"
                >
                  {noteIsDirty ? "Salva nota" : "Nota salvata"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <DecisionSheet
        open={decideOpen}
        onOpenChange={setDecideOpen}
        slug={slug}
        toolName={toolName}
        alternatives={compareSlugs.filter((item) => item !== slug)}
        source="shortlist"
        defaultOutcome={decisionOutcome ?? "selected"}
      />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MobileLibraryEmpty
   ═══════════════════════════════════════════════════════════════ */

function MobileLibraryEmpty({
  tools,
  categoryCount,
}: {
  tools: ToolPublic[];
  categoryCount: number;
}) {
  const starterTools = tools.slice(0, 3);

  return (
    <section
      className="mobile-library-empty"
      aria-labelledby="mobile-library-empty-title"
    >
      <div className="mobile-library-empty__content">
        <span className="mobile-library-empty__kicker">Salvati</span>
        <h1 id="mobile-library-empty-title">
          Salva i tool che stai considerando.
        </h1>
        <p>La shortlist è un tavolo di lavoro, non una decisione.</p>
      </div>
      {starterTools.length > 0 ? (
        <div
          className="mobile-library-empty__starter"
          aria-label="Tool da cui partire"
        >
          <span>Da valutare per iniziare</span>
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
          Esplora i tool
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
        <div className="mobile-library-empty__recommendations">
          <Link
            href="/archivio"
            className="mobile-library-empty__recommendation-card"
          >
            <strong>Esplora catalogo</strong>
            <span>
              {tools.length} tool in {categoryCount} categorie da restringere.
            </span>
          </Link>
          <Link
            href="/collections"
            className="mobile-library-empty__recommendation-card"
          >
            <strong>Parti da uno stack</strong>
            <span>Raccolte con ruoli, limiti e ordine di lavoro.</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
