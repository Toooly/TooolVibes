"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { clearCompareTools, getCompareTools } from "@/lib/discovery/local-storage";
import {
  getCompareDimensionLeaders,
  getEditorialScoreDimensions,
  getEditorialScoreLevelLabel,
  getEditorialScorecard,
} from "@/lib/tools/editorial-score";
import {
  getToolEditorialNote,
  getToolEditorialState,
  getToolPlatforms,
  getToolPricing,
} from "@/lib/tools/discovery";
import type { EditorialScoreDimension, ToolRecord } from "@/lib/types/tool";

import { EditorialScoreMeter } from "@/components/tools/editorial-scorecard";
import { TagPill } from "@/components/tools/tag-pill";

type CompareBoardProps = {
  tools: ToolRecord[];
};

const dimensionReadingCopy: Record<EditorialScoreDimension, string> = {
  ease_of_use: "Quanto entra in mano senza attrito iniziale.",
  versatility: "Quanto regge scenari diversi senza perdere fuoco.",
  polish: "Quanto l'interfaccia restituisce maturita` e cura.",
  workflow_fit: "Quanto si integra bene in un flusso gia` reale.",
  experimentation_value: "Quanto apre strade nuove da provare davvero.",
  editorial_conviction: "Quanto merita di restare nel radar TooolVibes.",
};

export function CompareBoard({ tools }: CompareBoardProps) {
  const [compareSlugs, setCompareSlugs] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setCompareSlugs(getCompareTools());

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("tooolvibes:discovery-sync", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("tooolvibes:discovery-sync", sync);
    };
  }, []);

  const comparedTools = useMemo(
    () =>
      compareSlugs
        .map((slug) => tools.find((tool) => tool.slug === slug))
        .filter((tool): tool is ToolRecord => Boolean(tool)),
    [compareSlugs, tools],
  );

  const scoreDimensions = useMemo(() => getEditorialScoreDimensions(), []);
  const scorecardsByTool = useMemo(
    () =>
      Object.fromEntries(
        comparedTools.map((tool) => [tool.slug, getEditorialScorecard(tool)]),
      ) as Record<string, ReturnType<typeof getEditorialScorecard>>,
    [comparedTools],
  );
  const leadCountsByTool = useMemo(() => {
    const counts = Object.fromEntries(
      comparedTools.map((tool) => [tool.slug, 0]),
    ) as Record<string, number>;

    for (const dimension of scoreDimensions) {
      const leaders = getCompareDimensionLeaders(comparedTools, dimension.key);

      for (const leader of leaders) {
        counts[leader] = (counts[leader] ?? 0) + 1;
      }
    }

    return counts;
  }, [comparedTools, scoreDimensions]);
  const rankedDecisionLeads = useMemo(
    () =>
      [...comparedTools]
        .map((tool) => {
          const scorecard = scorecardsByTool[tool.slug] ?? [];
          const convictionStrength =
            scorecard.find((item) => item.key === "editorial_conviction")?.strength ?? 1;
          const workflowStrength =
            scorecard.find((item) => item.key === "workflow_fit")?.strength ?? 1;

          return {
            tool,
            leadCount: leadCountsByTool[tool.slug] ?? 0,
            convictionStrength,
            workflowStrength,
          };
        })
        .sort((left, right) => {
          if (right.leadCount !== left.leadCount) {
            return right.leadCount - left.leadCount;
          }

          if (right.convictionStrength !== left.convictionStrength) {
            return right.convictionStrength - left.convictionStrength;
          }

          if (right.workflowStrength !== left.workflowStrength) {
            return right.workflowStrength - left.workflowStrength;
          }

          return right.tool.is_featured === left.tool.is_featured
            ? 0
            : right.tool.is_featured
              ? 1
              : -1;
        }),
    [comparedTools, leadCountsByTool, scorecardsByTool],
  );
  const topDecisionLead = rankedDecisionLeads[0] ?? null;
  const hasTopLeadTie =
    Boolean(topDecisionLead) &&
    (rankedDecisionLeads[1]?.leadCount ?? -1) === topDecisionLead?.leadCount;
  if (compareSlugs.length === 0) {
    return (
      <div
        className="rounded-[32px] border px-6 py-8 text-center sm:px-8 sm:py-9"
        style={{
          borderColor: "var(--line)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.84), rgba(243,237,255,0.74))",
        }}
      >
        <p className="pill mx-auto">Compare layer</p>
        <h2 className="text-display-card mx-auto mt-4 max-w-none text-[1.72rem] sm:max-w-[16ch] sm:text-[2.08rem] sm:text-balance">
          Il compare ha senso solo con 2 o 3 candidati veri.
        </h2>
        <p className="text-body-soft mx-auto mt-3 max-w-[31rem] text-[0.93rem]" style={{ color: "var(--muted)" }}>
          Aggiungi pochi tool dalle card, dai profili o dalla shortlist. Il confronto serve a far
          emergere differenze reali, non a costruire una matrice infinita.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "1. Parti dall'archivio o da una collection coerente.",
            "2. Tieni nel tray solo i profili davvero vicini.",
            "3. Leggi prima workflow fit, poi pricing e nota editoriale.",
          ].map((item) => (
            <div
              key={item}
              className="stat-block rounded-[24px] border p-4 text-left"
              style={{ borderColor: "var(--line)", background: "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(243,237,255,0.74))" }}
            >
              <p className="text-[0.92rem] leading-6" style={{ color: "var(--muted-strong)" }}>
                {item}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/archivio"
            className="button-shell button-primary text-ui-strong inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white"
          >
            Vai all&apos;archivio
            <span aria-hidden="true" className="button-arrow">
              →
            </span>
          </Link>
          <Link
            href="/shortlist"
            className="button-shell button-secondary text-ui-strong inline-flex rounded-full px-5 py-3 text-sm font-semibold"
          >
            Apri la shortlist
          </Link>
        </div>
      </div>
    );
  }

  if (comparedTools.length === 1) {
    return (
      <div
        className="rounded-[32px] border px-6 py-8 text-center sm:px-8 sm:py-9"
        style={{
          borderColor: "var(--line)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.84), rgba(243,237,255,0.74))",
        }}
      >
        <p className="pill mx-auto">Compare parziale</p>
        <h2 className="text-display-card mx-auto mt-4 max-w-none text-[1.72rem] sm:max-w-[16ch] sm:text-[2.08rem] sm:text-balance">
          Serve un secondo profilo per un confronto utile.
        </h2>
            <p className="text-body-soft mx-auto mt-3 max-w-[31rem] text-[0.93rem]" style={{ color: "var(--muted)" }}>
              {comparedTools[0].name} e` gia` nel tray. Aggiungi un altro profilo vicino per capire
              davvero dove cambia il fit di workflow.
            </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/archivio"
            className="button-shell button-primary text-ui-strong inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white"
          >
            Aggiungi un altro tool
            <span aria-hidden="true" className="button-arrow">
              →
            </span>
          </Link>
          <Link
            href="/shortlist"
            className="button-shell button-secondary text-ui-strong inline-flex rounded-full px-5 py-3 text-sm font-semibold"
          >
            Apri shortlist
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="tone-compare space-y-4">
      <div className="brand-panel panel-lift rounded-[28px] px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="editorial-label">Compare attivo</span>
              <span className="selection-status">{comparedTools.length} tool affiancati</span>
            </div>
            <p className="text-body-soft mt-2 text-[0.92rem]" style={{ color: "var(--muted)" }}>
              Prima guarda il distacco vero. Poi leggi i dettagli che chiudono il verdetto.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/archivio" className="section-quiet-link text-sm font-semibold" style={{ color: "var(--accent-strong)" }}>
              Aggiungi dall&apos;archivio
            </Link>
            <button
              type="button"
              onClick={() => clearCompareTools()}
              className="selection-chip text-ui-strong rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.15em]"
              style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.76)", color: "var(--muted)" }}
            >
              Svuota
            </button>
          </div>
        </div>
      </div>

      <div className="metadata-block rounded-[28px] px-4 py-4 sm:px-5 sm:py-4.5">
        <p className="brand-kicker">Verdetto iniziale</p>
        <p className="mt-2 max-w-[42rem] text-[0.96rem] leading-7" style={{ color: "var(--muted-strong)" }}>
          {topDecisionLead
            ? hasTopLeadTie
              ? `Il set resta vicino: ${topDecisionLead.tool.name} non stacca davvero e conviene leggere prima workflow fit, pricing e nota editoriale.`
              : `${topDecisionLead.tool.name} spicca in ${topDecisionLead.leadCount} dimensioni su ${scoreDimensions.length}. Parti da qui e poi conferma il verdetto nei dettagli.`
            : "Il compare serve a far emergere differenze vere, non a costruire una matrice infinita."}
        </p>

        <div className="compare-score-shell tool-rail mt-5 overflow-x-auto rounded-[26px] border" style={{ borderColor: "var(--line)" }}>
          <div
            className="compare-score-grid min-w-[48rem]"
            style={{
              gridTemplateColumns: `minmax(11rem, 1.02fr) repeat(${comparedTools.length}, minmax(13.75rem, 1fr))`,
            }}
          >
            <div className="compare-score-head compare-score-head-intro">
              <p className="editorial-label">Lettura</p>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                Le righe raccontano dove il fit cambia davvero.
              </p>
            </div>
            {comparedTools.map((tool) => (
              <div key={`head-${tool.slug}`} className="compare-score-head">
                <p className="editorial-label">{tool.category}</p>
                <p className="text-display-card mt-2 text-[1.16rem]">{tool.name}</p>
                <p className="mt-2 text-[0.74rem] uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                  {getToolEditorialState(tool)}
                </p>
              </div>
            ))}

            {scoreDimensions.map((dimension) => {
              const leaders = getCompareDimensionLeaders(comparedTools, dimension.key);

              return (
                <Fragment key={dimension.key}>
                  <div className="compare-score-axis">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted-strong)" }}>
                      {dimension.label}
                    </p>
                    <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                      {dimensionReadingCopy[dimension.key]}
                    </p>
                  </div>

                  {comparedTools.map((tool) => {
                    const entry = scorecardsByTool[tool.slug].find((item) => item.key === dimension.key);

                    if (!entry) {
                      return null;
                    }

                    const isLeader = leaders.includes(tool.slug);

                    return (
                      <div
                        key={`${dimension.key}-${tool.slug}`}
                        className={cn("compare-score-cell", isLeader && "is-leader")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                              {getEditorialScoreLevelLabel(entry.level)}
                            </p>
                            <p className="mt-2 text-[0.95rem] leading-6" style={{ color: "var(--muted-strong)" }}>
                              {entry.descriptor}
                            </p>
                          </div>
                          {isLeader ? (
                            <span className="compare-score-lead">Spicca qui</span>
                          ) : null}
                        </div>
                        <EditorialScoreMeter strength={entry.strength} className="mt-3" />
                      </div>
                    );
                  })}
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="tool-rail -mx-1.5 flex snap-x gap-3 overflow-x-auto px-1.5 pb-1 md:hidden">
        {comparedTools.map((tool) => (
          <article
            key={`snapshot-mobile-${tool.slug}`}
            className="metadata-block w-[min(19.75rem,calc(100vw-2.75rem))] shrink-0 snap-start rounded-[28px] px-5 py-5"
          >
            <p className="editorial-label">Snapshot decisionale</p>
            <p className="text-display-card mt-2 text-[1.24rem]">{tool.name}</p>

            <div className="mt-4 grid gap-3">
              <div className="compare-detail-card">
                <p className="editorial-label">Pricing</p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                  {getToolPricing(tool)}
                </p>
              </div>
              <div className="compare-detail-card">
                <p className="editorial-label">Piattaforma</p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                  {getToolPlatforms(tool).join(" / ")}
                </p>
              </div>
              <div className="compare-detail-card">
                <p className="editorial-label">Nota editoriale</p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                  {getToolEditorialNote(tool)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden gap-4 md:grid xl:grid-cols-3">
        {comparedTools.map((tool) => (
          <article key={`snapshot-${tool.slug}`} className="metadata-block rounded-[28px] px-5 py-5">
            <p className="editorial-label">Snapshot decisionale</p>
            <p className="text-display-card mt-2 text-[1.24rem]">{tool.name}</p>

            <div className="mt-4 grid gap-3">
              <div className="compare-detail-card">
                <p className="editorial-label">Pricing</p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                  {getToolPricing(tool)}
                </p>
              </div>
              <div className="compare-detail-card">
                <p className="editorial-label">Piattaforme</p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                  {getToolPlatforms(tool).join(" / ")}
                </p>
              </div>
              <div className="compare-detail-card">
                <p className="editorial-label">Tag principali</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {tool.tags.slice(0, 3).map((tag) => (
                    <TagPill key={`${tool.slug}-${tag}`} tag={tag} />
                  ))}
                </div>
              </div>
              <div className="compare-detail-card">
                <p className="editorial-label">Nota editoriale</p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                  {getToolEditorialNote(tool)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
