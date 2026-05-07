"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Columns3, Sparkles, X } from "lucide-react";

import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import { PremiumBadge, PremiumButton, PremiumLink, PremiumPanel } from "@/components/ui/premium";
import { EmptyState } from "@/components/ui/premium-section";
import { CompareBoard } from "@/components/tools/compare-board";
import { levelRank, type DirectoryTool } from "@/lib/data/tooolvibes-directory";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
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
        <div className="rounded-[20px] border border-[var(--line)] bg-white/72 p-3.5">
          <p className="editorial-label">TL;DR</p>
          <p className="mt-2 text-[0.92rem] leading-6 text-[var(--muted-strong)]">
            {tool.tldr}
          </p>
        </div>
        <div className="rounded-[20px] border border-[var(--line)] bg-white/64 p-3.5">
          <p className="editorial-label">Review rapida</p>
          <p className="mt-2 text-[0.88rem] leading-6 text-[var(--muted-strong)]">
            {tool.editorialReview}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tool.highlights.slice(0, 3).map((item) => (
          <span
            key={item}
            className="rounded-full border border-[var(--line)] bg-white/72 px-3 py-1 text-[0.68rem] font-semibold text-[var(--muted-strong)]"
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
              <span className="selection-chip">{tools.length}/4 tool</span>
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

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <DirectoryCompareCard
            key={tool.slug}
            tool={tool}
            onRemove={() => toggleCompare(tool.slug)}
          />
        ))}
      </div>

      {tools.length > 1 ? (
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
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[var(--line)] bg-white/72 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--muted-strong)]">
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

  if (compareSlugs.length > 0) {
    return <DirectoryCompareBoard tools={comparedDirectoryTools} />;
  }

  return <CompareBoard tools={legacyTools} />;
}
