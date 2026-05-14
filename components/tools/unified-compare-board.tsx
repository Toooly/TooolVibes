"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Columns3, Gauge, PieChart, Sparkles, X } from "lucide-react";

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
          Tocca e scorri le righe: le celle illuminate indicano dove partire nella lettura.
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
  const leadTool = getLeadTool(tools);

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
      <div className="metadata-block rounded-[28px] border px-4 py-4 sm:px-5 sm:py-5" style={{ borderColor: "var(--line)" }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-[48rem]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="selection-status is-fresh">Compare attivo</span>
              <span className="selection-chip">{tools.length}/{MAX_COMPARE_TOOLS} tool</span>
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
          <div className="flex flex-col gap-2 sm:flex-row">
            <PremiumLink href="/archivio" tone="secondary">
              Aggiungi tool
            </PremiumLink>
            <PremiumButton type="button" tone="subtle" onClick={clearCompare}>
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

      <DirectoryCompareMobileDeck
        tools={tools}
        leadTool={leadTool}
        onRemove={(slug) => toggleCompare(slug)}
      />
      <DirectoryCompareMobileMatrix tools={tools} leadTool={leadTool} />

      {tools.length > 1 ? (
        <section className="compare-desktop-matrix hidden md:block">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="compare-desktop-matrix__icon" aria-hidden="true">
                <Gauge className="size-4" />
              </span>
              <div>
                <p className="editorial-label">Matrice desktop</p>
                <p className="text-sm font-semibold text-[var(--muted-strong)]">
                  Tabella completa, ora subito visibile prima delle card.
                </p>
              </div>
            </div>
            <span className="selection-chip">Scroll orizzontale solo su desktop</span>
          </div>
          <div className="compare-score-shell tool-rail overflow-x-auto rounded-[28px] border" style={{ borderColor: "var(--line)" }}>
            <div
              className="compare-score-grid min-w-[54rem]"
              style={{
                gridTemplateColumns: `minmax(10rem, 0.8fr) repeat(${tools.length}, minmax(14.5rem, 1fr))`,
              }}
            >
              <div className="compare-score-head compare-score-head-intro">
                <p className="editorial-label">Lettura</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
                  Parti dalle righe evidenziate: TL;DR, use case e review.
                </p>
              </div>
              {tools.map((tool) => (
                <div key={`head-${tool.slug}`} className="compare-score-head">
                  <p className="editorial-label">{tool.category}</p>
                  <p className="text-display-card mt-2 text-[1.12rem] text-[var(--foreground)]">
                    {tool.name}
                  </p>
                </div>
              ))}

              {compareRows.map((row) => (
                <div key={row.label} className="contents">
                  <div className="compare-score-axis">
                    <p className="font-semibold text-[var(--foreground)]">{row.label}</p>
                  </div>
                  {tools.map((tool) => (
                    <div
                      key={`${row.label}-${tool.slug}`}
                      className={`compare-score-cell ${row.label === "TL;DR" || row.label === "Use case" ? "is-leader" : ""}`}
                    >
                      <p className="text-sm leading-6 text-[var(--muted-strong)]">
                        {row.value(tool)}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="hidden gap-4 md:grid lg:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
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
