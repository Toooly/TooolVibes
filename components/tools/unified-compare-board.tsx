"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Columns3, Gauge, Info, PieChart, Scale, Sparkles, Swords, Trophy, X, Zap } from "lucide-react";

import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import { PremiumBadge, PremiumButton, PremiumLink, PremiumPanel } from "@/components/ui/premium";
import { EmptyState } from "@/components/ui/premium-section";
import { CompareBoard } from "@/components/tools/compare-board";
import { levelRank, type DirectoryTool } from "@/lib/data/tooolvibes-directory";
import { MAX_COMPARE_TOOLS, useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import type { ToolRecord } from "@/lib/types/tool";

type UnifiedCompareBoardProps = {
  directoryTools: DirectoryTool[];
  legacyTools: ToolRecord[];
};

const levelTone: Record<DirectoryTool["level"], "accent" | "success" | "neutral" | "dark"> = {
  featured: "accent",
  beginner: "success",
  intermediate: "neutral",
  expert: "dark",
};

const compareRows: {
  label: string;
  value: (tool: DirectoryTool) => string;
}[] = [
  { label: "Categoria", value: (tool) => tool.categoryLabel },
  { label: "Livello", value: (tool) => tool.levelLabel },
  { label: "TL;DR", value: (tool) => tool.tldr },
  { label: "Use case", value: (tool) => tool.idealUseCase },
  { label: "Review", value: (tool) => tool.editorialReview },
  { label: "Fonte", value: (tool) => tool.domain },
];

const directoryScoreByLevel: Record<DirectoryTool["level"], number> = {
  featured: 91,
  beginner: 72,
  intermediate: 82,
  expert: 87,
};

function getDirectoryToolScore(tool: DirectoryTool) {
  return Math.min(
    98,
    directoryScoreByLevel[tool.level] +
      (tool.toolOfWeek ? 4 : 0) +
      (tool.featured ? 2 : 0) +
      Math.min(tool.highlights.length, 3),
  );
}

function getLeadTool(tools: DirectoryTool[]) {
  return [...tools].sort((left, right) => {
    if (Number(right.toolOfWeek) !== Number(left.toolOfWeek)) {
      return Number(right.toolOfWeek) - Number(left.toolOfWeek);
    }

    if (Number(right.featured) !== Number(left.featured)) {
      return Number(right.featured) - Number(left.featured);
    }

    return levelRank[left.level] - levelRank[right.level];
  })[0] ?? null;
}

/* ═══════════════════════════════════════════════════════════════
   Desktop Champion + DiffMatrix
   ═══════════════════════════════════════════════════════════════ */

function DesktopChampionCard({
  tool,
  score,
  onRemove,
}: {
  tool: DirectoryTool;
  score: number;
  onRemove: () => void;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const scoreWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showInfo) return;
    function handleClick(event: MouseEvent) {
      if (scoreWrapRef.current && !scoreWrapRef.current.contains(event.target as Node)) {
        setShowInfo(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showInfo]);

  return (
    <article
      className="desktop-compare-champion"
      style={
        {
          "--champ-a": tool.accentFrom,
          "--champ-b": tool.accentTo,
          "--champ-score": `${score * 3.6}deg`,
        } as CSSProperties
      }
    >
      <div className="desktop-compare-champion__glow" />
      <div className="desktop-compare-champion__inner">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="desktop-compare-champion__badge">
                <Trophy className="size-3.5" />
                Candidato #1
              </span>
              <PremiumBadge tone={levelTone[tool.level]}>{tool.levelLabel}</PremiumBadge>
            </div>
            <h3 className="desktop-compare-champion__name">{tool.name}</h3>
            <p className="desktop-compare-champion__category">{tool.categoryLabel}</p>
            <p className="desktop-compare-champion__tldr">{tool.tldr}</p>
          </div>
          <div ref={scoreWrapRef} className="desktop-compare-champion__score-wrap">
            <div className="desktop-compare-champion__score">
              <span>{score}</span>
              <small>/100</small>
            </div>
            <button
              type="button"
              aria-label="Come è calcolato il punteggio"
              onClick={() => setShowInfo((v) => !v)}
              className="desktop-compare-champion__info"
            >
              <Info className="size-3.5" />
            </button>
            {showInfo && (
              <div className="desktop-compare-champion__tooltip">
                Il punteggio è calcolato in base al livello del tool, alla visibilità in evidenza e al numero di punti di forza.
              </div>
            )}
          </div>
        </div>

        <div className="desktop-compare-champion__metrics">
          <div>
            <span>Fit</span>
            <strong>{tool.useCases.length}</strong>
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

        <div className="desktop-compare-champion__actions">
          <PremiumLink href={`/toools/${tool.slug}`} tone="secondary" size="sm">
            Scheda
          </PremiumLink>
          <button
            type="button"
            onClick={onRemove}
            className="premium-button premium-button-subtle min-h-10 rounded-full px-4 text-sm font-semibold"
          >
            <X className="size-4" />
            Rimuovi
          </button>
        </div>
      </div>
    </article>
  );
}

function DesktopDiffMatrix({
  tools,
  scores,
}: {
  tools: DirectoryTool[];
  scores: Map<string, number>;
}) {
  if (tools.length < 2) return null;
  const maxScore = Math.max(...tools.map((t) => scores.get(t.slug) ?? 0), 1);

  const rows = [
    {
      label: "Categoria",
      render: (tool: DirectoryTool) => (
        <span className="desktop-compare-matrix__badge">{tool.categoryLabel}</span>
      ),
    },
    {
      label: "Punteggio",
      render: (tool: DirectoryTool) => {
        const s = scores.get(tool.slug) ?? 0;
        return (
          <div className="desktop-compare-matrix__bar">
            <span style={{ width: `${(s / maxScore) * 100}%` }} />
            <strong>{s}</strong>
          </div>
        );
      },
    },
    {
      label: "Fit",
      render: (tool: DirectoryTool) => <span>{tool.useCases.length || "—"}</span>,
    },
    {
      label: "Highlights",
      render: (tool: DirectoryTool) => <span>{tool.highlights.length}</span>,
    },
    {
      label: "Tempo",
      render: (tool: DirectoryTool) => <span>{tool.readingTime}</span>,
    },
  ];

  return (
    <section className="desktop-compare-matrix" aria-label="Confronto caratteristiche">
      <div className="desktop-compare-matrix__header">
        <Scale className="size-4" />
        <span>Confronto caratteristiche</span>
      </div>
      <div className="desktop-compare-matrix__grid">
        {rows.map((row) => (
          <div key={row.label} className="desktop-compare-matrix__row">
            <div className="desktop-compare-matrix__axis">{row.label}</div>
            <div className="desktop-compare-matrix__cells">
              {tools.map((tool) => (
                <div
                  key={tool.slug}
                  className="desktop-compare-matrix__cell"
                  style={
                    {
                      "--champ-a": tool.accentFrom,
                      "--champ-b": tool.accentTo,
                    } as CSSProperties
                  }
                >
                  {row.render(tool)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DirectoryCompareMobileDeck({
  tools,
  leadTool,
  onRemove,
}: {
  tools: DirectoryTool[];
  leadTool: DirectoryTool | null;
  onRemove: (slug: string) => void;
}) {
  return (
    <div className="compare-mobile-deck md:hidden">
      {leadTool ? (
        <section className="compare-mobile-hero">
          <div className="flex items-center gap-3">
            <span className="compare-mobile-hero__icon" aria-hidden="true">
              <PieChart className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="editorial-label">Verdetto mobile</p>
              <h3 className="text-display-card mt-1 text-[1.28rem] text-[var(--foreground)]">
                Parti da {leadTool.name}
              </h3>
            </div>
          </div>
          <p className="mt-3 text-[0.92rem] leading-6 text-[var(--muted-strong)]">
            Ho tolto la tabella dal telefono: qui leggi score, fit e motivi forti in verticale,
            senza bloccare lo scroll.
          </p>
        </section>
      ) : null}

      <div className="grid gap-3">
        {tools.map((tool, index) => {
          const score = getDirectoryToolScore(tool);

          return (
            <article
              key={`mobile-compare-${tool.slug}`}
              className="compare-mobile-card"
              style={
                {
                  "--compare-a": tool.accentFrom,
                  "--compare-b": tool.accentTo,
                  "--compare-score-angle": `${score * 3.6}deg`,
                } as CSSProperties
              }
            >
              <div className="flex items-start gap-3">
                <DirectoryToolGlyph tool={tool} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <PremiumBadge tone={levelTone[tool.level]}>{tool.levelLabel}</PremiumBadge>
                    {tool.slug === leadTool?.slug ? <PremiumBadge tone="warning">Primo da leggere</PremiumBadge> : null}
                  </div>
                  <h3 className="text-display-card mt-2 text-[1.35rem] leading-tight text-[var(--foreground)]">
                    {index + 1}. {tool.name}
                  </h3>
                  <p className="mt-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                    {tool.categoryLabel}
                  </p>
                </div>
                <div className="compare-mobile-score-ring" aria-label={`Score ${score} su 100`}>
                  <span>{score}</span>
                  <small>/100</small>
                </div>
              </div>

              <div className="compare-mobile-metrics">
                <div>
                  <span>Fit</span>
                  <strong>{tool.useCases.length}</strong>
                </div>
                <div>
                  <span>Tag</span>
                  <strong>{tool.tags.length}</strong>
                </div>
                <div>
                  <span>Tempo</span>
                  <strong>{tool.readingTime}</strong>
                </div>
              </div>

              <div className="mt-4 grid gap-2.5">
                <div className="compare-mobile-line">
                  <span>Perché adesso</span>
                  <p>{tool.tldr}</p>
                </div>
                <div className="compare-mobile-line">
                  <span>Use case</span>
                  <p>{tool.idealUseCase}</p>
                </div>
                <div className="compare-mobile-line">
                  <span>Review</span>
                  <p>{tool.editorialReview}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {tool.highlights.slice(0, 3).map((item) => (
                  <span key={item} className="compare-mobile-chip">
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <PremiumLink href={`/toools/${tool.slug}`} tone="secondary" size="sm">
                  Scheda
                </PremiumLink>
                <button
                  type="button"
                  onClick={() => onRemove(tool.slug)}
                  className="premium-button premium-button-subtle min-h-10 rounded-full px-3 text-sm font-semibold"
                >
                  Rimuovi
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function DirectoryCompareMobileMatrix({
  tools,
  leadTool,
}: {
  tools: DirectoryTool[];
  leadTool: DirectoryTool | null;
}) {
  if (tools.length < 2) {
    return null;
  }

  const mobileRows = compareRows.filter((row) => row.label !== "Review");

  return (
    <section className="compare-mobile-matrix md:hidden" aria-label="Differenze tra tool">
      <div className="compare-mobile-matrix__header">
        <p className="editorial-label">Differenze vive</p>
        <p>
          Scorri ogni asse: la card evidenziata mostra dove partire nella lettura.
        </p>
      </div>

      <div className="grid gap-2.5">
        {mobileRows.map((row) => (
          <article key={`mobile-row-${row.label}`} className="compare-mobile-matrix__row">
            <div className="compare-mobile-matrix__axis">
              <span>{row.label}</span>
            </div>
            <div className="compare-mobile-matrix__cells">
              {tools.map((tool) => {
                const isLead =
                  tool.slug === leadTool?.slug &&
                  (row.label === "TL;DR" || row.label === "Use case" || row.label === "Livello");

                return (
                  <div
                    key={`${row.label}-${tool.slug}`}
                    className={`compare-mobile-matrix__cell ${isLead ? "is-leader" : ""}`}
                    tabIndex={0}
                    style={
                      {
                        "--compare-a": tool.accentFrom,
                        "--compare-b": tool.accentTo,
                      } as CSSProperties
                    }
                  >
                    <strong>{tool.name}</strong>
                    <p>{row.value(tool)}</p>
                    <span
                      className="compare-mobile-matrix__meter"
                      aria-hidden="true"
                      style={
                        {
                          "--compare-strength": isLead ? "92%" : `${62 - Math.min(22, tools.indexOf(tool) * 7)}%`,
                        } as CSSProperties
                      }
                    >
                      <span />
                    </span>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DirectoryCompareCard({
  tool,
  onRemove,
}: {
  tool: DirectoryTool;
  onRemove: () => void;
}) {
  return (
    <article
      className="directory-compare-card dynamic-card panel-lift rounded-[26px] border p-4 sm:p-5"
      style={{
        borderColor: "var(--line)",
        background: `radial-gradient(circle at 92% 0%, ${tool.accentTo}18, transparent 30%), radial-gradient(circle at 10% 0%, ${tool.accentFrom}18, transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.9), rgba(244,239,255,0.82))`,
      }}
    >
      <div className="flex items-start gap-3">
        <DirectoryToolGlyph tool={tool} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <PremiumBadge tone={levelTone[tool.level]}>{tool.levelLabel}</PremiumBadge>
            {tool.toolOfWeek ? <PremiumBadge tone="warning">Scelta</PremiumBadge> : null}
          </div>
          <h3 className="text-display-card mt-3 text-[1.35rem] leading-tight text-[var(--foreground)] sm:text-[1.62rem]">
            {tool.name}
          </h3>
          <p className="mt-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
            {tool.categoryLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="premium-button premium-button-subtle premium-button-icon min-h-10 min-w-10"
          aria-label={`Rimuovi ${tool.name} dal confronto`}
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-[20px] bg-white/72 p-3.5">
          <p className="editorial-label">TL;DR</p>
          <p className="mt-2 text-[0.92rem] leading-6 text-[var(--foreground)]">
            {tool.tldr}
          </p>
        </div>
        <div className="rounded-[20px] bg-white/64 p-3.5">
          <p className="editorial-label">Review rapida</p>
          <p className="mt-2 text-[0.88rem] leading-6 text-[var(--foreground)]">
            {tool.editorialReview}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tool.highlights.slice(0, 3).map((item) => (
          <span
            key={item}
            className="rounded-full bg-white/72 px-3 py-1 text-[0.68rem] font-semibold text-[var(--foreground)]"
          >
            {item}
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <PremiumLink href={`/toools/${tool.slug}`} tone="secondary" size="sm">
          Scheda
        </PremiumLink>
        <PremiumLink href={tool.url} external size="sm">
          Apri sito
        </PremiumLink>
      </div>
    </article>
  );
}

function DirectoryCompareBoard({ tools }: { tools: DirectoryTool[] }) {
  const toggleCompare = useToolWorkspaceStore((state) => state.toggleCompare);
  const clearCompare = useToolWorkspaceStore((state) => state.clearCompare);

  const scores = useMemo(() => {
    const map = new Map<string, number>();
    for (const tool of tools) {
      map.set(tool.slug, getDirectoryToolScore(tool));
    }
    return map;
  }, [tools]);

  const sortedTools = useMemo(() => {
    return [...tools].sort((a, b) => {
      const scoreA = scores.get(a.slug) ?? 0;
      const scoreB = scores.get(b.slug) ?? 0;
      return scoreB - scoreA;
    });
  }, [tools, scores]);

  const leadTool = sortedTools[0] ?? null;
  const leadScore = leadTool ? (scores.get(leadTool.slug) ?? 0) : 0;
  const restTools = sortedTools.slice(1);

  if (tools.length === 0) {
    return (
      <EmptyState
        icon={Columns3}
        eyebrow="Compare catalogo"
        title="Aggiungi 2 tool dal catalogo per far partire il confronto."
        description="Premi Confronta sulle card dei tool: qui leggerai differenze, use case, TL;DR e review in una vista unica."
        className="p-6 text-center sm:p-8"
        action={<PremiumLink href="/archivio">Apri catalogo</PremiumLink>}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="compare-summary-panel metadata-block rounded-[28px] border px-4 py-4 sm:px-5 sm:py-5" style={{ borderColor: "var(--line)" }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-[48rem]">
            <div className="compare-summary-kickers flex flex-wrap items-center gap-2">
              <span className="selection-status is-fresh">Compare attivo</span>
              <span className="selection-chip compare-count-chip">{tools.length}/{MAX_COMPARE_TOOLS} tool</span>
            </div>
            <h2 className="section-title mt-3 text-[1.9rem] sm:text-[2.55rem] lg:text-[3rem]">
              {tools.length > 1
                ? "Ora le differenze sono leggibili."
                : "Serve un secondo tool per chiudere il confronto."}
            </h2>
            <p className="section-copy mt-3">
              {leadTool
                ? `${leadTool.name} è il candidato da leggere per primo: poi confronta use case, review e fonte con gli altri profili.`
                : "Il compare del catalogo usa gli stessi tool che selezioni da Cerca, drawer e command palette."}
            </p>
          </div>
          <div className="compare-summary-actions flex flex-col gap-2 sm:flex-row">
            <PremiumLink href="/archivio" tone="secondary" size="sm">
              Aggiungi tool
            </PremiumLink>
            <PremiumButton type="button" tone="subtle" size="sm" onClick={clearCompare}>
              Svuota
            </PremiumButton>
          </div>
        </div>
      </div>

      {tools.length === 1 ? (
        <PremiumPanel tone="warm" className="grid gap-4 p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
          <CheckCircle2 className="size-9 text-[var(--warning)]" aria-hidden="true" />
          <div>
            <p className="editorial-label">Compare parziale</p>
            <p className="mt-2 text-[1.08rem] font-semibold leading-6 text-[var(--foreground)]">
              {tools[0].name} è dentro. Aggiungi un tool simile per vedere una matrice utile.
            </p>
          </div>
          <PremiumLink href="/archivio" size="sm">
            Trova alternativa
          </PremiumLink>
        </PremiumPanel>
      ) : null}

      <DirectoryCompareMobileMatrix tools={sortedTools} leadTool={leadTool} />
      <DirectoryCompareMobileDeck
        tools={sortedTools}
        leadTool={leadTool}
        onRemove={(slug) => toggleCompare(slug)}
      />

      {leadTool && tools.length >= 2 ? (
        <DesktopChampionCard
          tool={leadTool}
          score={leadScore}
          onRemove={() => toggleCompare(leadTool.slug)}
        />
      ) : null}

      <DesktopDiffMatrix tools={sortedTools} scores={scores} />

      <div className="hidden gap-4 md:grid lg:grid-cols-2 xl:grid-cols-3">
        {sortedTools.map((tool) => (
          <DirectoryCompareCard
            key={tool.slug}
            tool={tool}
            onRemove={() => toggleCompare(tool.slug)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-white/72 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <Sparkles className="size-4 text-[var(--accent)]" aria-hidden="true" />
          Il confronto resta salvato anche se cambi pagina.
        </div>
        <Link href="/archivio" className="section-quiet-link inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-strong)]">
          Continua a esplorare
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

export function UnifiedCompareBoard({
  directoryTools,
  legacyTools,
}: UnifiedCompareBoardProps) {
  const [mounted, setMounted] = useState(false);
  const compareSlugs = useToolWorkspaceStore((state) => state.compareSlugs);

  useEffect(() => setMounted(true), []);

  const comparedDirectoryTools = useMemo(
    () =>
      compareSlugs
        .map((slug) => directoryTools.find((tool) => tool.slug === slug))
        .filter((tool): tool is DirectoryTool => Boolean(tool)),
    [compareSlugs, directoryTools],
  );

  if (!mounted) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((item) => (
          <div
            key={item}
            className="h-56 animate-pulse rounded-[28px] border border-[var(--line)] bg-white/60"
          />
        ))}
      </div>
    );
  }

  if (comparedDirectoryTools.length > 0) {
    return <DirectoryCompareBoard tools={comparedDirectoryTools} />;
  }

  return <CompareBoard tools={legacyTools} />;
}
