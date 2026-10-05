"use client";

/**
 * Radar intelligence panels: Trend, Per te, Watchlist, Insight.
 * Every claim is grounded - see `lib/radar/radar-trend.ts`,
 * `lib/radar/radar-per-te.ts`, `lib/radar/radar-watch.ts`.
 */

import Link from "next/link";
import { ArrowUpRight, Eye, EyeOff, Lightbulb } from "lucide-react";

import {
  RADAR_HISTORY_UNAVAILABLE_REASON,
  buildRadarTrendSections,
  type RadarTrendSection,
} from "@/lib/radar/radar-trend";
import { buildRadarPerTe } from "@/lib/radar/radar-per-te";
import {
  RADAR_WATCH_MOVEMENT_REASON,
  evaluateRadarWatchSignals,
  isRadarWatchEmpty,
  type RadarWatchDigest,
} from "@/lib/radar/radar-watch";
import { buildRadarInsights, type RadarInsight } from "@/lib/radar/radar-insights";
import type { RadarTool, RadarView } from "@/lib/radar/radar-domain";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";

export function RadarInsightStrip({ view }: { view: RadarView }) {
  const insights = buildRadarInsights(view);
  if (insights.length === 0) return null;
  return (
    <section className="tv-rx-insights" aria-labelledby="tv-rx-insights-title">
      <header className="tv-rx-section__head">
        <h2 id="tv-rx-insights-title" className="tv-rx-section__title">
          Insight di oggi
        </h2>
      </header>
      <ul className="tv-rx-insights__list">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </ul>
    </section>
  );
}

function InsightCard({ insight }: { insight: RadarInsight }) {
  const params = new URLSearchParams();
  if (insight.link.tab) params.set("v", insight.link.tab);
  if (insight.link.category) params.set("c", insight.link.category);
  const href = `/radar${params.toString() ? `?${params}` : ""}`;
  return (
    <li className="tv-rx-insight">
      <Lightbulb size={14} aria-hidden="true" />
      <div>
        <strong>{insight.title}</strong>
        <p>{insight.body}</p>
      </div>
      <Link href={href} className="tv-rx-insight__link">
        Apri
        <ArrowUpRight size={12} aria-hidden="true" />
      </Link>
    </li>
  );
}

export function RadarTrendPanel({
  tools,
  historyAvailable,
  rangeLabel,
  onSelect,
}: {
  tools: readonly RadarTool[];
  historyAvailable: boolean;
  rangeLabel: string;
  onSelect: (toolId: string) => void;
}) {
  const sections = buildRadarTrendSections(tools, { historyAvailable, rangeLabel });
  return (
    <div className="tv-rx-trend">
      {sections.map((section) => (
        <TrendSection key={section.key} section={section} onSelect={onSelect} />
      ))}
    </div>
  );
}

function TrendSection({
  section,
  onSelect,
}: {
  section: RadarTrendSection;
  onSelect: (toolId: string) => void;
}) {
  return (
    <section className="tv-rx-section" aria-labelledby={`tv-rx-trend-${section.key}`}>
      <header className="tv-rx-section__head">
        <h2 id={`tv-rx-trend-${section.key}`} className="tv-rx-section__title">
          {section.title}
        </h2>
        <p className="tv-rx-section__desc">{section.description}</p>
      </header>

      {!section.available ? (
        <p className="tv-rx-honest" role="status">
          {section.unavailableReason ?? RADAR_HISTORY_UNAVAILABLE_REASON}
        </p>
      ) : section.entries.length === 0 ? (
        <p className="tv-rx-honest" role="status">
          Nessun segnale in questa sezione per il periodo selezionato.
        </p>
      ) : (
        <ol className="tv-rx-trend__list">
          {section.entries.map((entry) => (
            <li key={entry.tool.id} className="tv-rx-trend__item">
              <button
                type="button"
                className="tv-rx-trend__button"
                onClick={() => onSelect(entry.tool.id)}
              >
                <strong>{entry.tool.name}</strong>
                <span className="tv-rx-trend__why">{entry.explanation}</span>
                <span className="tv-rx-trend__why-label">Perchè è in questa lista</span>
              </button>
              <span className="tv-rx-trend__chart" data-history="false">
                Dati storici in raccolta
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function RadarPerTePanel({
  tools,
  workspace,
  catalog,
  onSelect,
  onExploreTrend,
}: {
  tools: readonly RadarTool[];
  workspace: WorkspaceStateV1;
  catalog: readonly PublicToolCatalogItem[];
  onSelect: (toolId: string) => void;
  onExploreTrend: () => void;
}) {
  const model = buildRadarPerTe(tools, workspace, catalog);

  if (model.coldStart) {
    return (
      <section className="tv-rx-section" aria-labelledby="tv-rx-perte-title">
        <header className="tv-rx-section__head">
          <h2 id="tv-rx-perte-title" className="tv-rx-section__title">
            Costruiamo il tuo Radar
          </h2>
          <p className="tv-rx-section__desc">
            Non abbiamo ancora segnali tuoi su cui lavorare. Parti da una di queste strade.
          </p>
        </header>
        <ul className="tv-rx-coldstart">
          <li>
            <Link href="/archivio">Scegli le tue categorie dal Catalogo</Link>
          </li>
          <li>
            <button type="button" onClick={onExploreTrend}>
              Esplora i trend di oggi
            </button>
          </li>
          <li>
            <Link href="/archivio">Salva i primi tool</Link>
          </li>
        </ul>
      </section>
    );
  }

  return (
    <section className="tv-rx-section" aria-labelledby="tv-rx-perte-title">
      <header className="tv-rx-section__head">
        <h2 id="tv-rx-perte-title" className="tv-rx-section__title">
          Per te
        </h2>
        <p className="tv-rx-section__desc">
          Scelte dai tuoi salvataggi, confronti e categorie seguite.{" "}
          {model.interests.length > 0
            ? `Interessi rilevati: ${model.interests.join(", ")}.`
            : ""}
        </p>
      </header>

      {model.empty ? (
        <p className="tv-rx-honest" role="status">
          Nessun segnale del Radar coincide con i tuoi interessi in questo periodo.
        </p>
      ) : (
        <ul className="tv-rx-perte__list">
          {model.cards.map((card) => (
            <li key={card.tool.id} className="tv-rx-perte__card">
              <div>
                <strong>{card.title}</strong>
                <p className="tv-rx-perte__why">{card.explanation}</p>
                <p className="tv-rx-perte__meta">
                  {card.tool.votesCount} voti · {card.tool.commentsCount} commenti
                </p>
              </div>
              <button
                type="button"
                className="tv-rx-perte__explore"
                onClick={() => onSelect(card.tool.id)}
              >
                Esplora
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function RadarWatchPanel({
  tools,
  watch,
  onToggleTool,
  onToggleCategory,
  onClear,
  categories,
}: {
  tools: readonly RadarTool[];
  watch: WorkspaceStateV1["radarWatch"];
  onToggleTool: (id: string) => void;
  onToggleCategory: (categoryId: string) => void;
  onClear: () => void;
  categories: readonly { id: string; label: string; count: number }[];
}) {
  const digest: RadarWatchDigest = evaluateRadarWatchSignals(watch, tools, null);
  const empty = isRadarWatchEmpty(watch);

  return (
    <section className="tv-rx-section" aria-labelledby="tv-rx-watch-title">
      <header className="tv-rx-section__head">
        <h2 id="tv-rx-watch-title" className="tv-rx-section__title">
          Watchlist
        </h2>
        <p className="tv-rx-section__desc">
          Segui un tool o una categoria per farti segnalare i movimenti.{" "}
          <strong>Watch non è Save</strong>: Save (oro) tiene il tool, Watch (ciano)
          ti segnala i movimenti.
        </p>
      </header>

      {empty ? (
        <p className="tv-rx-honest" role="status">
          La tua Watchlist è vuota. Aggiungi un tool o una categoria dal Radar.
        </p>
      ) : (
        <>
          <p className="tv-rx-watch__counts">
            {digest.watchedToolCount} tool seguiti · {digest.watchedCategoryCount} categorie
            seguite
          </p>
          <button type="button" className="tv-rx-watch__clear" onClick={onClear}>
            Azzera Watchlist
          </button>
        </>
      )}

      <h3 className="tv-rx-subtitle">Categorie</h3>
      <ul className="tv-rx-watch__chips">
        {categories.map((category) => {
          const active = watch.categories.includes(category.id);
          return (
            <li key={category.id}>
              <button
                type="button"
                className="tv-rx-chip"
                data-active={active ? "true" : undefined}
                aria-pressed={active}
                onClick={() => onToggleCategory(category.id)}
              >
                {active ? <Eye size={12} aria-hidden="true" /> : <EyeOff size={12} aria-hidden="true" />}
                {category.label} ({category.count})
              </button>
            </li>
          );
        })}
      </ul>

      <h3 className="tv-rx-subtitle">Tool nel Radar</h3>
      <ul className="tv-rx-watch__tools">
        {tools.map((tool) => {
          const active = watch.slugs.includes(tool.catalogSlug ?? tool.id);
          return (
            <li key={tool.id} className="tv-rx-watch__tool">
              <span>{tool.name}</span>
              <button
                type="button"
                className="tv-rx-chip"
                data-active={active ? "true" : undefined}
                aria-pressed={active}
                onClick={() => onToggleTool(tool.catalogSlug ?? tool.id)}
              >
                {active ? "Seguito" : "Segui"}
              </button>
            </li>
          );
        })}
      </ul>

      <h3 className="tv-rx-subtitle">Segnali</h3>
      {!digest.movementAlertsAvailable ? (
        <p className="tv-rx-honest" role="status">
          {RADAR_WATCH_MOVEMENT_REASON}
        </p>
      ) : null}
      {digest.signals.length === 0 ? (
        <p className="tv-rx-honest" role="status">
          Nessun segnale per la tua Watchlist in questo periodo.
        </p>
      ) : (
        <ul className="tv-rx-watch__signals">
          {digest.signals.map((signal) => (
            <li key={signal.id} className="tv-rx-watch__signal">
              <strong>{signal.title}</strong>
              <p>{signal.explanation}</p>
            </li>
          ))}
        </ul>
      )}

      <p className="tv-rx-watch__note">
        Gli alert push non sono ancora disponibili: i segnali vivono nell&apos;app. Il
        backend di notifica è documentato come follow-up separato.
      </p>
    </section>
  );
}
