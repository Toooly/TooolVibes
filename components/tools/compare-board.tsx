"use client";

import { Fragment, type CSSProperties, useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MAX_COMPARE_TOOLS, MIN_COMPARE_TOOLS, useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import { cn } from "@/lib/utils";
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
  polish: "Quanto l'interfaccia restituisce maturità e cura.",
  workflow_fit: "Quanto si integra bene in un flusso già reale.",
  experimentation_value: "Quanto apre strade nuove da provare davvero.",
  editorial_conviction: "Quanto merita di restare nel radar TooolVibes.",
};

function LegacyCompareMobileDeck({
  tools,
  scorecardsByTool,
  leadCountsByTool,
}: {
  tools: ToolRecord[];
  scorecardsByTool: Record<string, ReturnType<typeof getEditorialScorecard>>;
  leadCountsByTool: Record<string, number>;
}) {
  return (
    <div className="compare-mobile-deck md:hidden">
      <section className="compare-mobile-hero">
        <p className="editorial-label">Confronto mobile</p>
        <h3 className="text-display-card mt-1 text-[1.28rem] text-[var(--foreground)]">
          Scheda punteggio verticale, niente tabella.
        </h3>
        <p className="mt-3 text-[0.92rem] leading-6 text-[var(--muted-strong)]">
          Sul telefono leggi ogni tool come una scheda decisionale: punteggio, dimensioni forti e nota.
        </p>
      </section>

      <div className="grid gap-3">
        {tools.map((tool, index) => {
          const scorecard = scorecardsByTool[tool.slug] ?? [];
          const averageStrength = scorecard.length
            ? Math.round((scorecard.reduce((sum, item) => sum + item.strength, 0) / scorecard.length) * 20)
            : 0;

          return (
            <article
              key={`legacy-mobile-${tool.slug}`}
              className="compare-mobile-card"
              style={
                {
                  "--compare-a": "var(--accent)",
                  "--compare-b": "var(--cyan)",
                  "--compare-score-angle": `${averageStrength * 3.6}deg`,
                } as CSSProperties
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="editorial-label">{tool.category}</p>
                  <h3 className="text-display-card mt-2 text-[1.35rem] leading-tight">
                    {index + 1}. {tool.name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
                    {getToolEditorialState(tool)}
                  </p>
                </div>
                <div className="compare-mobile-score-ring" aria-label={`Punteggio ${averageStrength} su 100`}>
                  <span>{averageStrength}</span>
                  <small>/100</small>
                </div>
              </div>

              <div className="compare-mobile-metrics">
                <div>
                  <span>Picchi</span>
                  <strong>{leadCountsByTool[tool.slug] ?? 0}</strong>
                </div>
                <div>
                  <span>Tag</span>
                  <strong>{tool.tags.length}</strong>
                </div>
                <div>
                  <span>Fonte</span>
                  <strong>{getToolPricing(tool)}</strong>
                </div>
              </div>

              <div className="mt-4 grid gap-2.5">
                {scorecard.slice(0, 3).map((entry) => (
                  <div key={`${tool.slug}-${entry.key}`} className="compare-mobile-line">
                    <span>{entry.label}</span>
                    <p>{entry.descriptor}</p>
                  </div>
                ))}
                <div className="compare-mobile-line">
                  <span>Nota editoriale</span>
                  <p>{getToolEditorialNote(tool)}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function LegacyCompareMobileMatrix({
  tools,
  scoreDimensions,
  scorecardsByTool,
}: {
  tools: ToolRecord[];
  scoreDimensions: ReturnType<typeof getEditorialScoreDimensions>;
  scorecardsByTool: Record<string, ReturnType<typeof getEditorialScorecard>>;
}) {
  if (tools.length < MIN_COMPARE_TOOLS) {
    return null;
  }

  return (
    <section className="compare-mobile-matrix md:hidden" aria-label="Matrice mobile del confronto">
      <div className="compare-mobile-matrix__header">
        <p className="editorial-label">Matrice mobile</p>
        <p>
          Ogni riga confronta una dimensione. Le celle illuminate sono i distacchi veri.
        </p>
      </div>

      <div className="grid gap-2.5">
        {scoreDimensions.map((dimension) => {
          const leaders = getCompareDimensionLeaders(tools, dimension.key);

          return (
            <article key={`mobile-matrix-${dimension.key}`} className="compare-mobile-matrix__row">
              <div className="compare-mobile-matrix__axis">
                <span>{dimension.label}</span>
                <p>{dimensionReadingCopy[dimension.key]}</p>
              </div>
              <div className="compare-mobile-matrix__cells">
                {tools.map((tool) => {
                  const entry = scorecardsByTool[tool.slug].find((item) => item.key === dimension.key);
                  const isLeader = leaders.includes(tool.slug);

                  if (!entry) {
                    return null;
                  }

                  return (
                    <div
                      key={`${dimension.key}-${tool.slug}`}
                      className={`compare-mobile-matrix__cell ${isLeader ? "is-leader" : ""}`}
                      tabIndex={0}
                      style={{ "--compare-strength": `${entry.strength * 20}%` } as CSSProperties}
                    >
                      <strong>{tool.name}</strong>
                      <p>{entry.descriptor}</p>
                      <span className="compare-mobile-matrix__meter">
                        <span />
                      </span>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function CompareBoard({ tools }: CompareBoardProps) {
  const compareSlugs = useToolWorkspaceStore((state) => state.compareSlugs);
  const clearCompare = useToolWorkspaceStore((state) => state.clearCompare);

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
        className="light-surface rounded-[32px] border px-6 py-8 text-center sm:px-8 sm:py-9"
        style={{
          borderColor: "var(--line)",
          background: "var(--tv-surface-inverted-raised)",
        }}
      >
        <p className="pill mx-auto">Confronto</p>
        <h2 className="text-display-card mx-auto mt-4 max-w-none text-[1.72rem] sm:max-w-[16ch] sm:text-[2.08rem] sm:text-balance">
          Il confronto ha senso con pochi candidati veri.
        </h2>
        <p className="text-body-soft mx-auto mt-3 max-w-[31rem] text-[0.93rem]" style={{ color: "var(--muted)" }}>
          Aggiungi pochi tool dalle schede, dai profili o dai salvati. Il confronto serve a far
          emergere differenze reali, non a costruire una matrice infinita.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "1. Parti dall'archivio o da una raccolta coerente.",
            "2. Tieni nel confronto solo i profili davvero vicini.",
            "3. Leggi prima integrazione nel flusso, poi prezzo e nota editoriale.",
          ].map((item) => (
            <div
              key={item}
              className="stat-block rounded-[24px] border p-4 text-left"
              style={{ borderColor: "var(--line)", background: "var(--tv-surface-inverted-raised)" }}
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
            <ArrowRight aria-hidden="true" className="button-arrow size-4" />
          </Link>
          <Link
            href="/shortlist"
            className="button-shell button-secondary text-ui-strong inline-flex rounded-full px-5 py-3 text-sm font-semibold"
          >
            Apri i salvati
          </Link>
        </div>
      </div>
    );
  }

  if (comparedTools.length === 1) {
    return (
      <div
        className="light-surface rounded-[32px] border px-6 py-8 text-center sm:px-8 sm:py-9"
        style={{
          borderColor: "var(--line)",
          background: "var(--tv-surface-inverted-raised)",
        }}
      >
        <p className="pill mx-auto">Confronto parziale</p>
        <h2 className="text-display-card mx-auto mt-4 max-w-none text-[1.72rem] sm:max-w-[16ch] sm:text-[2.08rem] sm:text-balance">
          Serve un secondo profilo per un confronto utile.
        </h2>
            <p className="text-body-soft mx-auto mt-3 max-w-[31rem] text-[0.93rem]" style={{ color: "var(--muted)" }}>
              {comparedTools[0].name} è già nel confronto. Aggiungi un altro profilo vicino per capire
              davvero dove cambia l&apos;integrazione nel flusso.
            </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/archivio"
            className="button-shell button-primary text-ui-strong inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white"
          >
            Aggiungi un altro tool
            <ArrowRight aria-hidden="true" className="button-arrow size-4" />
          </Link>
          <Link
            href="/shortlist"
            className="button-shell button-secondary text-ui-strong inline-flex rounded-full px-5 py-3 text-sm font-semibold"
          >
            Apri i salvati
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
              <span className="editorial-label">Confronto attivo</span>
              <span className="selection-status">{comparedTools.length}/{MAX_COMPARE_TOOLS} tool affiancati</span>
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
              onClick={clearCompare}
              className="selection-chip text-ui-strong rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em]"
              style={{ borderColor: "var(--line)", background: "var(--tv-surface-inverted-raised)", color: "var(--muted)" }}
            >
              Svuota
            </button>
          </div>
        </div>
      </div>

      {comparedTools.length >= MAX_COMPARE_TOOLS ? (
        <div className="rounded-[24px] border border-amber-500/20 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-amber-900">
          <p className="font-semibold">Confronto al limite: 2-4 tool restano la lettura piu chiara.</p>
          <p className="mt-1">
            Usa il quinto come candidato da togliere o confermare dopo aver letto il verdetto iniziale.
          </p>
        </div>
      ) : null}

      <div className="metadata-block rounded-[28px] px-4 py-4 sm:px-5 sm:py-4.5">
        <p className="brand-kicker">Verdetto iniziale</p>
        <p className="mt-2 max-w-[42rem] text-[0.96rem] leading-7" style={{ color: "var(--muted-strong)" }}>
          {topDecisionLead
            ? hasTopLeadTie
              ? `Il gruppo resta vicino: ${topDecisionLead.tool.name} non stacca davvero e conviene leggere prima integrazione nel flusso, prezzo e nota editoriale.`
              : `${topDecisionLead.tool.name} spicca in ${topDecisionLead.leadCount} dimensioni su ${scoreDimensions.length}. Parti da qui e poi conferma il verdetto nei dettagli.`
            : "Il confronto serve a far emergere differenze vere, non a costruire una matrice infinita."}
        </p>

        <LegacyCompareMobileDeck
          tools={comparedTools}
          scorecardsByTool={scorecardsByTool}
          leadCountsByTool={leadCountsByTool}
        />
        <LegacyCompareMobileMatrix
          tools={comparedTools}
          scoreDimensions={scoreDimensions}
          scorecardsByTool={scorecardsByTool}
        />

        <div className="compare-score-shell tool-rail mt-5 hidden overflow-x-auto rounded-[26px] border md:block" style={{ borderColor: "var(--line)" }}>
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
                <p className="mt-2 text-xs uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                  {getToolEditorialState(tool)}
                </p>
              </div>
            ))}

            {scoreDimensions.map((dimension) => {
              const leaders = getCompareDimensionLeaders(comparedTools, dimension.key);

              return (
                <Fragment key={dimension.key}>
                  <div className="compare-score-axis">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted-strong)" }}>
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
                            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
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

      <div className="grid gap-3 md:hidden">
        {comparedTools.map((tool) => (
          <article
            key={`snapshot-mobile-${tool.slug}`}
            className="metadata-block rounded-[28px] px-5 py-5"
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
