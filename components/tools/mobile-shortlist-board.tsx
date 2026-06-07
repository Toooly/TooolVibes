"use client";

import { useState, useMemo, useEffect, type CSSProperties } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUp,
  ArrowDown,
  X,
  MessageSquare,
  GitCompare,
  Trash2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

import { useDiscoverySnapshot } from "@/lib/discovery/client-store";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import type {
  ShortlistStage,
  ToolDecisionMemory,
  ToolRecord,
} from "@/lib/types/tool";

type MobileShortlistBoardProps = {
  tools: ToolRecord[];
};

type ToolWithMeta = ToolRecord & {
  stage: ShortlistStage;
  note?: string;
  isInCompare: boolean;
};

const STAGE_COLORS: Record<string, string> = {
  saved: "#6a3cff",
  pinned: "#39d2f6",
  top: "#f3bf4c",
  rejected: "#ef4444",
};

function getToolColor(tool: ToolRecord): string {
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

export function MobileShortlistBoard({ tools }: MobileShortlistBoardProps) {
  const discovery = useDiscoverySnapshot();
  const savedSlugs = useToolWorkspaceStore((state) => state.savedSlugs);
  const compareSlugs = useToolWorkspaceStore((state) => state.compareSlugs);
  const toggleSaved = useToolWorkspaceStore((state) => state.toggleSaved);
  const shortlistStages = discovery.shortlistStages;
  const decisionMemories = discovery.decisionMemories;

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

  const [toEvaluate, setToEvaluate] = useState<ToolWithMeta[]>(() =>
    baseTools.filter((t) => !["pinned", "top"].includes(t.stage))
  );
  const [topCandidates, setTopCandidates] = useState<ToolWithMeta[]>(() =>
    baseTools.filter((t) => ["pinned", "top"].includes(t.stage))
  );

  // Sync if baseTools changes (new save/unsave)
  useEffect(() => {
    const newEvaluate = baseTools.filter((t) => !["pinned", "top"].includes(t.stage));
    const newTop = baseTools.filter((t) => ["pinned", "top"].includes(t.stage));
    // Only update if lengths differ significantly to avoid overriding user reorder
    const evalDiff = Math.abs(newEvaluate.length - toEvaluate.length);
    const topDiff = Math.abs(newTop.length - topCandidates.length);
    if (evalDiff > 0 || topDiff > 0) {
      setToEvaluate(newEvaluate);
      setTopCandidates(newTop);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseTools]);

  const readyToCompare = useMemo(
    () => baseTools.filter((t) => t.isInCompare),
    [baseTools]
  );

  const moveItem = (
    list: ToolWithMeta[],
    setList: (l: ToolWithMeta[]) => void,
    index: number,
    direction: -1 | 1
  ) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= list.length) return;
    const newList = [...list];
    [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
    setList(newList);
  };

  const handleRemove = (slug: string) => {
    toggleSaved(slug);
    setToEvaluate((prev) => prev.filter((t) => t.slug !== slug));
    setTopCandidates((prev) => prev.filter((t) => t.slug !== slug));
  };

  const activeNote = noteSlug
    ? baseTools.find((t) => t.slug === noteSlug)?.note
    : undefined;

  const totalCount = baseTools.length;

  if (totalCount === 0) {
    return <MobileShortlistEmpty />;
  }

  return (
    <div className="mobile-shortlist-board">
      {/* Header */}
      <div className="mobile-shortlist-board__header">
        <div className="mobile-shortlist-board__avatar">
          <span>S</span>
        </div>
        <div>
          <h1>La tua scrivania</h1>
          <p>
            {totalCount} candidati · aggiornato {new Date().toLocaleDateString("it-IT")}
          </p>
        </div>
      </div>

      {/* Kanban Grid */}
      <div className="mobile-shortlist-board__kanban">
        {/* Column: Da valutare */}
        <div className="mobile-shortlist-board__column">
          <h2>
            <span style={{ background: STAGE_COLORS.saved }} />
            Da valutare
          </h2>
          <div className="mobile-shortlist-board__cards">
            {toEvaluate.map((tool, index) => (
              <PostItCard
                key={tool.slug}
                tool={tool}
                index={index}
                total={toEvaluate.length}
                onMoveUp={() => moveItem(toEvaluate, setToEvaluate, index, -1)}
                onMoveDown={() => moveItem(toEvaluate, setToEvaluate, index, 1)}
                onNote={() => setNoteSlug(tool.slug)}
                onRemove={() => handleRemove(tool.slug)}
              />
            ))}
          </div>
        </div>

        {/* Column: Top candidati */}
        <div className="mobile-shortlist-board__column">
          <h2>
            <span style={{ background: STAGE_COLORS.pinned }} />
            Top candidati
          </h2>
          <div className="mobile-shortlist-board__cards">
            {topCandidates.map((tool, index) => (
              <PostItCard
                key={tool.slug}
                tool={tool}
                index={index}
                total={topCandidates.length}
                onMoveUp={() => moveItem(topCandidates, setTopCandidates, index, -1)}
                onMoveDown={() => moveItem(topCandidates, setTopCandidates, index, 1)}
                onNote={() => setNoteSlug(tool.slug)}
                onRemove={() => handleRemove(tool.slug)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Ready to compare */}
      {readyToCompare.length > 0 && (
        <div className="mobile-shortlist-board__compare">
          <h2>
            <GitCompare size={14} />
            Pronti per confrontare
          </h2>
          <div className="mobile-shortlist-board__compare-list">
            {readyToCompare.map((tool) => (
              <Link
                key={tool.slug}
                href={`/toools/${tool.slug}`}
                className="mobile-shortlist-board__compare-chip"
                style={{ "--chip-color": getToolColor(tool) } as CSSProperties}
              >
                <span>{tool.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Note Bottom Sheet */}
      <AnimatePresence>
        {noteSlug && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="mobile-shortlist-board__sheet"
          >
            <div className="mobile-shortlist-board__sheet-header">
              <span className="mobile-shortlist-board__sheet-handle" />
              <button
                type="button"
                onClick={() => setNoteSlug(null)}
                className="mobile-shortlist-board__sheet-close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mobile-shortlist-board__sheet-body">
              <h3>Nota personale</h3>
              {activeNote ? (
                <p>{activeNote}</p>
              ) : (
                <p className="is-empty">Nessuna nota per questo tool.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PostItCard
   ═══════════════════════════════════════════════════════════════ */

function PostItCard({
  tool,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onNote,
  onRemove,
}: {
  tool: ToolWithMeta;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onNote: () => void;
  onRemove: () => void;
}) {
  const color = getToolColor(tool);
  const domain = extractDomain(tool.website_url);
  const iconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
    : undefined;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.2) }}
      className="mobile-shortlist-postit"
      style={{ "--postit-color": color } as CSSProperties}
    >
      <span className="mobile-shortlist-postit__fold" aria-hidden="true" />

      <div className="mobile-shortlist-postit__header">
        {iconUrl ? (
          <img src={iconUrl} alt="" loading="lazy" className="mobile-shortlist-postit__icon" />
        ) : (
          <span className="mobile-shortlist-postit__initials">
            {tool.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <span
          className="mobile-shortlist-postit__stage"
          style={{ background: STAGE_COLORS[tool.stage] || color }}
        >
          {tool.stage}
        </span>
      </div>

      <strong className="mobile-shortlist-postit__name">{tool.name}</strong>

      {tool.note && (
        <p className="mobile-shortlist-postit__note">{tool.note}</p>
      )}

      <div className="mobile-shortlist-postit__actions">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          aria-label="Sposta su"
        >
          <ArrowUp size={13} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          aria-label="Sposta giù"
        >
          <ArrowDown size={13} />
        </button>
        <button type="button" onClick={onNote} aria-label="Vedi nota">
          <MessageSquare size={13} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="is-danger"
          aria-label="Rimuovi"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MobileShortlistEmpty
   ═══════════════════════════════════════════════════════════════ */

function MobileShortlistEmpty() {
  return (
    <div className="mobile-shortlist-empty">
      <div className="mobile-shortlist-empty__visual">
        <span>📋</span>
      </div>
      <h2>La tua scrivania è vuota</h2>
      <p>
        Salva tool dall&apos;archivio o dalle collection. Poi torna qui per
        organizzarli, annotarli e prepararli al confronto.
      </p>
      <Link href="/archivio" className="mobile-shortlist-empty__cta">
        Esplora l&apos;archivio
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
