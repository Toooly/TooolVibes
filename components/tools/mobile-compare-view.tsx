"use client";

import { type CSSProperties, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Columns3, Swords, Trophy, X, Zap, Scale } from "lucide-react";

import { useToolWorkspaceStore, MAX_COMPARE_TOOLS } from "@/lib/stores/tool-workspace-store";
import type { DirectoryTool, DirectoryToolLevel } from "@/lib/data/tooolvibes-directory";
import type { ToolRecord } from "@/lib/types/tool";
import { cn } from "@/lib/utils";

type MobileCompareViewProps = {
  directoryTools: DirectoryTool[];
  legacyTools: ToolRecord[];
};

/* ---------- utils directory ---------- */
const levelScoreBase: Record<DirectoryToolLevel, number> = {
  featured: 91,
  beginner: 72,
  intermediate: 82,
  expert: 87,
};

function dirScore(t: DirectoryTool) {
  return Math.min(
    98,
    levelScoreBase[t.level] +
      (t.toolOfWeek ? 4 : 0) +
      (t.featured ? 2 : 0) +
      Math.min(t.highlights.length, 3),
  );
}

/* ---------- legacy normalisation ---------- */
function hashColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h % 360);
  return `hsl(${hue} 80% 55%)`;
}

function legacyScore(t: ToolRecord): number {
  return Math.min(95, 70 + (t.is_featured ? 10 : 0) + Math.min(t.tags?.length ?? 0, 5) * 2);
}

type NormalisedTool = {
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  score: number;
  accentFrom: string;
  accentTo: string;
  tldr: string;
  useCase: string;
  review: string;
  highlights: string[];
  readingTime: string;
  url: string;
  isDirectory: boolean;
};

function normalise(
  directoryTools: DirectoryTool[],
  legacyTools: ToolRecord[],
  compareSlugs: string[],
): NormalisedTool[] {
  const out: NormalisedTool[] = [];
  for (const slug of compareSlugs) {
    const d = directoryTools.find((t) => t.slug === slug);
    if (d) {
      out.push({
        slug: d.slug,
        name: d.name,
        category: d.category,
        categoryLabel: d.categoryLabel,
        score: dirScore(d),
        accentFrom: d.accentFrom,
        accentTo: d.accentTo,
        tldr: d.tldr,
        useCase: d.idealUseCase,
        review: d.editorialReview,
        highlights: d.highlights,
        readingTime: d.readingTime,
        url: d.url,
        isDirectory: true,
      });
      continue;
    }
    const l = legacyTools.find((t) => t.slug === slug);
    if (l) {
      const c = hashColor(l.name);
      out.push({
        slug: l.slug,
        name: l.name,
        category: l.category ?? "Tool",
        categoryLabel: l.category ?? "Tool",
        score: legacyScore(l),
        accentFrom: c,
        accentTo: c,
        tldr: l.short_description_it ?? l.description_it ?? "Nessun riassunto disponibile.",
        useCase: l.description_it ?? "",
        review: l.editorial_note ?? "",
        highlights: l.tags?.slice(0, 3) ?? [],
        readingTime: "2 min",
        url: l.website_url ?? "",
        isDirectory: false,
      });
    }
  }
  return out;
}

/* ---------- sub-components ---------- */

function ArenaHeader({ count }: { count: number }) {
  return (
    <header className="mobile-compare-arena__header">
      <div className="mobile-compare-arena__badge">
        <Swords className="size-5" />
        <span>Arena</span>
      </div>
      <h1>Il punto in cui i candidati smettono di somigliarsi.</h1>
      <p>Metti i tool uno accanto all&apos;altro e fai emergere il distacco vero.</p>
      <div className="mobile-compare-arena__dots">
        {Array.from({ length: MAX_COMPARE_TOOLS }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "mobile-compare-arena__dot",
              i < count && "is-active",
            )}
          />
        ))}
      </div>
    </header>
  );
}

function ChampionCard({
  tool,
  onRemove,
}: {
  tool: NormalisedTool;
  onRemove: () => void;
}) {
  return (
    <article
      className="mobile-compare-arena__champion"
      style={
        {
          "--arena-a": tool.accentFrom,
          "--arena-b": tool.accentTo,
          "--compare-score-angle": `${tool.score * 3.6}deg`,
        } as CSSProperties
      }
    >
      <div className="mobile-compare-arena__champion-glow" />
      <div className="mobile-compare-arena__champion-inner">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mobile-compare-arena__champion-badge">
                <Trophy className="size-3.5" />
                Candidato #1
              </span>
              <span className="mobile-compare-arena__cat">{tool.categoryLabel}</span>
            </div>
            <h2 className="mobile-compare-arena__champion-name">{tool.name}</h2>
            <p className="mobile-compare-arena__champion-tldr">{tool.tldr}</p>
          </div>
          <div className="mobile-compare-arena__score">
            <span>{tool.score}</span>
            <small>/100</small>
          </div>
        </div>

        <div className="mobile-compare-arena__metrics">
          <div>
            <span>Fit</span>
            <strong>{tool.highlights.length}</strong>
          </div>
          <div>
            <span>Tag</span>
            <strong>{tool.highlights.length}</strong>
          </div>
          <div>
            <span>Tempo</span>
            <strong>{tool.readingTime}</strong>
          </div>
        </div>

        <div className="mobile-compare-arena__champion-actions">
          <Link
            href={`/toools/${tool.slug}`}
            className="mobile-compare-arena__btn mobile-compare-arena__btn--primary"
          >
            Scheda
          </Link>
          <button
            type="button"
            onClick={onRemove}
            className="mobile-compare-arena__btn mobile-compare-arena__btn--ghost"
          >
            <X className="size-4" />
            Rimuovi
          </button>
        </div>
      </div>
    </article>
  );
}

function ChallengerCard({
  tool,
  rank,
  diff,
  onRemove,
}: {
  tool: NormalisedTool;
  rank: number;
  diff: number;
  onRemove: () => void;
}) {
  return (
    <article
      className="mobile-compare-arena__challenger"
      style={
        {
          "--arena-a": tool.accentFrom,
          "--arena-b": tool.accentTo,
        } as CSSProperties
      }
    >
      <div className="flex items-start gap-3">
        <div className="mobile-compare-arena__challenger-rank">#{rank}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mobile-compare-arena__cat">{tool.categoryLabel}</span>
            {diff !== 0 && (
              <span className="mobile-compare-arena__diff">
                {diff > 0 ? "+" : ""}
                {diff} vs #1
              </span>
            )}
          </div>
          <h3 className="mobile-compare-arena__challenger-name">{tool.name}</h3>
          <p className="mobile-compare-arena__challenger-tldr">{tool.tldr}</p>
        </div>
        <div className="mobile-compare-arena__score mobile-compare-arena__score--sm">
          <span>{tool.score}</span>
        </div>
      </div>

      <div className="mobile-compare-arena__challenger-bar">
        <span
          style={{
            width: `${Math.max(20, tool.score)}%`,
            background: `linear-gradient(90deg,${tool.accentFrom},${tool.accentTo})`,
          }}
        />
      </div>

      <div className="mobile-compare-arena__challenger-actions">
        <Link href={`/toools/${tool.slug}`} className="mobile-compare-arena__link">
          Scheda
        </Link>
        <button type="button" onClick={onRemove} className="mobile-compare-arena__link mobile-compare-arena__link--muted">
          Rimuovi
        </button>
      </div>
    </article>
  );
}

function DiffMatrix({ tools }: { tools: NormalisedTool[] }) {
  if (tools.length < 2) return null;
  const rows = [
    { label: "Categoria", value: (t: NormalisedTool) => t.categoryLabel },
    { label: "TL;DR", value: (t: NormalisedTool) => t.tldr },
    { label: "Use case", value: (t: NormalisedTool) => t.useCase },
  ];
  return (
    <section className="mobile-compare-arena__matrix">
      <div className="mobile-compare-arena__matrix-header">
        <Scale className="size-4" />
        <span>Differenze vive</span>
      </div>
      <div className="mobile-compare-arena__matrix-scroll">
        {rows.map((row) => (
          <div key={row.label} className="mobile-compare-arena__matrix-row">
            <div className="mobile-compare-arena__matrix-axis">{row.label}</div>
            <div className="mobile-compare-arena__matrix-cells">
              {tools.map((tool) => (
                <div
                  key={tool.slug}
                  className="mobile-compare-arena__matrix-cell"
                  style={
                    {
                      "--arena-a": tool.accentFrom,
                      "--arena-b": tool.accentTo,
                    } as CSSProperties
                  }
                >
                  <strong>{tool.name}</strong>
                  <p>{row.value(tool)}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- main ---------- */

export function MobileCompareView({
  directoryTools,
  legacyTools,
}: MobileCompareViewProps) {
  const compareSlugs = useToolWorkspaceStore((s) => s.compareSlugs);
  const toggleCompare = useToolWorkspaceStore((s) => s.toggleCompare);
  const clearCompare = useToolWorkspaceStore((s) => s.clearCompare);

  const tools = useMemo(
    () => normalise(directoryTools, legacyTools, compareSlugs),
    [directoryTools, legacyTools, compareSlugs],
  );

  if (tools.length === 0) {
    return (
      <div className="mobile-compare-arena">
        <ArenaHeader count={0} />
        <div className="mobile-compare-arena__empty">
          <div className="mobile-compare-arena__empty-icon">
            <Columns3 className="size-10" />
          </div>
          <h2>Nessun candidato in arena.</h2>
          <p>
            Aggiungi 2 o pi&ugrave; tool dal catalogo per far emergere il distacco vero.
          </p>
          <Link href="/archivio" className="mobile-compare-arena__cta">
            Scegli i tool
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (tools.length === 1) {
    return (
      <div className="mobile-compare-arena">
        <ArenaHeader count={1} />
        <ChampionCard tool={tools[0]} onRemove={() => toggleCompare(tools[0].slug)} />
        <div className="mobile-compare-arena__partial">
          <p className="mobile-compare-arena__partial-label">Compare parziale</p>
          <p>
            {tools[0].name} è già in arena. Aggiungi un altro profilo per vedere le differenze.
          </p>
          <Link href="/archivio" className="mobile-compare-arena__cta">
            Aggiungi sfidante
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  const sorted = [...tools].sort((a, b) => b.score - a.score);
  const lead = sorted[0];
  const rest = sorted.slice(1);

  return (
    <div className="mobile-compare-arena">
      <ArenaHeader count={tools.length} />

      <ChampionCard tool={lead} onRemove={() => toggleCompare(lead.slug)} />

      <div className="mobile-compare-arena__challengers">
        {rest.map((tool, i) => (
          <ChallengerCard
            key={tool.slug}
            tool={tool}
            rank={i + 2}
            diff={tool.score - lead.score}
            onRemove={() => toggleCompare(tool.slug)}
          />
        ))}
      </div>

      <DiffMatrix tools={sorted} />

      <div className="mobile-compare-arena__footer">
        <Link href="/archivio" className="mobile-compare-arena__footer-btn mobile-compare-arena__footer-btn--primary">
          <Zap className="size-4" />
          Aggiungi tool
        </Link>
        <button
          type="button"
          onClick={clearCompare}
          className="mobile-compare-arena__footer-btn mobile-compare-arena__footer-btn--ghost"
        >
          Svuota arena
        </button>
        <Link href="/shortlist" className="mobile-compare-arena__footer-btn mobile-compare-arena__footer-btn--secondary">
          Shortlist
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
