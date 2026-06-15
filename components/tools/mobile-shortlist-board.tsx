"use client";

import { useState, useMemo,  type CSSProperties } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  
  GitCompare,
  Trash2,
  ArrowRight,
  Bookmark,
  Heart,
  Clock,
} from "lucide-react";
import Link from "next/link";

import { useDiscoverySnapshot } from "@/lib/discovery/client-store";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import type {
  ShortlistStage,

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

  const totalCount = baseTools.length;

  if (totalCount === 0) {
    return <MobileLibraryEmpty />;
  }

  const favoriteTools = baseTools.filter((t) => t.stage === "top");
  const toTryTools = baseTools.filter((t) => t.stage === "saved" || t.stage === "review");
  const recentTools = [...baseTools].reverse().slice(0, 8);
  const readyToCompare = baseTools.filter((t) => t.isInCompare);

  return (
    <div className="mobile-library-board">
      {/* Header */}
      <div className="mobile-library-board__header">
        <div className="mobile-library-board__icon">
          <Bookmark size={20} />
        </div>
        <div>
          <h1>La tua biblioteca</h1>
          <p>{totalCount} tool salvati · collezione personale</p>
        </div>
      </div>

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
      />

      <MobileLibraryShelf
        title="Da provare"
        icon={Bookmark}
        tools={toTryTools}
        color="#6a3cff"
        emptyText="Tool salvati da esplorare"
      />

      <MobileLibraryShelf
        title="Recenti"
        icon={Clock}
        tools={recentTools}
        color="#39d2f6"
        emptyText="Gli ultimi tool aggiunti"
      />

      {/* Note Bottom Sheet */}
      <AnimatePresence>
        {noteSlug && (
          <MobileNoteSheet
            noteSlug={noteSlug}
            baseTools={baseTools}
            onClose={() => setNoteSlug(null)}
          />
        )}
      </AnimatePresence>
    </div>
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
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  tools: ToolWithMeta[];
  color: string;
  emptyText: string;
}) {
  return (
    <section className="mobile-library-shelf">
      <div className="mobile-library-shelf__header">
        <Icon size={14} style={{ color }} />
        <h2 style={{ color }}>{title}</h2>
        <span>{tools.length}</span>
      </div>

      {tools.length > 0 ? (
        <div className="mobile-library-shelf__rail">
          {tools.map((tool, index) => (
            <LibraryBook key={tool.slug} tool={tool} index={index} />
          ))}
        </div>
      ) : (
        <p className="mobile-library-shelf__empty">{emptyText}</p>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LibraryBook
   ═══════════════════════════════════════════════════════════════ */

function LibraryBook({ tool, index }: { tool: ToolWithMeta; index: number }) {
  const color = getToolColor(tool);
  const domain = extractDomain(tool.website_url);
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
      <Link href={`/toools/${tool.slug}`} className="mobile-library-book__cover">
        <span className="mobile-library-book__spine" aria-hidden="true" />
        <span className="mobile-library-book__face">
          {iconUrl ? (
            <img src={iconUrl} alt="" loading="lazy" />
          ) : (
            <span>{tool.name.slice(0, 2).toUpperCase()}</span>
          )}
        </span>
      </Link>
      <div className="mobile-library-book__meta">
        <strong>{tool.name}</strong>
        <span>{tool.stage}</span>
      </div>
      <div className="absolute right-1.5 bottom-1.5 z-10">
        <button
          type="button"
          onClick={() => toggleSaved(tool.slug)}
          className="mobile-library-book__remove"
          aria-label="Rimuovi dai salvati"
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
  noteSlug,
  baseTools,
  onClose,
}: {
  noteSlug: string;
  baseTools: ToolWithMeta[];
  onClose: () => void;
}) {
  const activeNote = baseTools.find((t) => t.slug === noteSlug)?.note;

  return (
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
          onClick={onClose}
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
  );
}

/* ═══════════════════════════════════════════════════════════════
   MobileLibraryEmpty
   ═══════════════════════════════════════════════════════════════ */

function MobileLibraryEmpty() {
  return (
    <div className="mobile-library-empty">
      <div className="mobile-library-empty__visual">
        <div className="mobile-library-empty__shelf">
          <span className="mobile-library-empty__book" />
          <span className="mobile-library-empty__book" />
          <span className="mobile-library-empty__book is-ghost" />
        </div>
      </div>
      <h2>La tua biblioteca è vuota</h2>
      <p>
        Salva tool dall&apos;archivio o dal radar. Trovali qui, ordinati e pronti
        per essere esplorati.
      </p>
      <div className="mobile-library-empty__actions">
        <Link href="/archivio" className="mobile-library-empty__cta">
          Esplora l&apos;archivio
          <ArrowRight size={14} />
        </Link>
        <Link href="/product-hunt" className="mobile-library-empty__cta is-secondary">
          Apri il Radar
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
