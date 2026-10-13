"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
/**
 * Radar intelligence panels: Trend, Per te, Watchlist, Insight.
 * Every claim is grounded - see `lib/radar/radar-trend.ts`,
 * `lib/radar/radar-per-te.ts`, `lib/radar/radar-watch.ts`.
 */

import Link from "@/components/ui/app-link";
import { ArrowUpRight, Bookmark, ChartNoAxesColumn, Eye, EyeOff, Lightbulb, Search } from "lucide-react";
import { MetricStrip } from "@/components/ui/metric-strip";

import {
  RADAR_HISTORY_UNAVAILABLE_REASON,
  buildRadarTrendSections,
  formatAge,
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
        <h2 id="tv-rx-insights-title" className="tv-rx-section__title"><LocalizedText>{"Insight di oggi "}</LocalizedText></h2>
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
        <strong><LocalizedText>{insight.title}</LocalizedText></strong>
        <p><LocalizedText>{insight.body}</LocalizedText></p>
      </div>
      <Link href={href} className="tv-rx-insight__link"><LocalizedText>{"Apri "}</LocalizedText><ArrowUpRight size={12} aria-hidden="true" />
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
  const today = sections.filter((section) => section.group === "today");
  const movement = sections.filter((section) => section.group === "movement");
  const movementAvailable = movement.some((section) => section.available);
  return (
    <div className="tv-rx-trend">
      <header className="tv-rx-mode-head">
        <p className="tv-rx__eyebrow"><LocalizedText>{"Snapshot / "}</LocalizedText><LocalizedText>{rangeLabel}</LocalizedText></p>
        <h2 className="tv-rx-mode-head__title"><LocalizedText>{"Dove si concentra l'attenzione"}</LocalizedText></h2>
        <p className="tv-rx-section__desc"><LocalizedText>{"Ranking attuale, voti e discussioni. Il movimento richiede più snapshot."}</LocalizedText></p>
      </header>
      <div className="tv-rx-trend__grid">
      {today.map((section) => (
        <TrendSection key={section.key} section={section} onSelect={onSelect} />
      ))}
      </div>

      <p className="tv-rx-subtitle"><LocalizedText>{"Movimento nel tempo"}</LocalizedText></p>
      {movementAvailable ? (
        movement.map((section) => (
          <TrendSection key={section.key} section={section} onSelect={onSelect} />
        ))
      ) : (
        <HistoryUnavailableModule />
      )}
    </div>
  );
}

/**
 * §9 — premium compact "history unavailable" module.
 * Historical snapshots do not exist yet, so no acceleration/cooling claim and
 * no chart points are ever fabricated. Lists the future signals explicitly.
 */
function HistoryUnavailableModule() {
  return (
    <section
      className="tv-rx-hist"
      aria-labelledby="tv-rx-hist-title"
      data-history="false"
    >
      <header className="tv-rx-hist__head">
        <span className="tv-rx-hist__marker" aria-hidden="true" />
        <h3 id="tv-rx-hist-title" className="tv-rx-hist__title"><LocalizedText>{"Dati storici in raccolta "}</LocalizedText></h3>
      </header>
      <p className="tv-rx-hist__body">
        <LocalizedText>{RADAR_HISTORY_UNAVAILABLE_REASON}</LocalizedText>
      </p>
      <ul className="tv-rx-hist__list">
        <li><LocalizedText>{"variazione attenzione"}</LocalizedText></li>
        <li><LocalizedText>{"movimento ranking"}</LocalizedText></li>
        <li><LocalizedText>{"accelerazione"}</LocalizedText></li>
        <li><LocalizedText>{"raffreddamento"}</LocalizedText></li>
      </ul>
    </section>
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
    <section className="tv-rx-section tv-rx-trend__section" aria-labelledby={`tv-rx-trend-${section.key}`} data-ranking={section.key}>
      <header className="tv-rx-section__head">
        <h2 id={`tv-rx-trend-${section.key}`} className="tv-rx-section__title">
          <LocalizedText>{section.title}</LocalizedText>
        </h2>
        <p className="tv-rx-section__desc"><LocalizedText>{section.description}</LocalizedText></p>
      </header>

      {!section.available ? (
        <p className="tv-rx-honest" role="status">
          <LocalizedText>{section.unavailableReason ?? RADAR_HISTORY_UNAVAILABLE_REASON}</LocalizedText>
        </p>
      ) : section.entries.length === 0 ? (
        <p className="tv-rx-honest" role="status"><LocalizedText>{"Nessun segnale in questa sezione per il periodo selezionato. "}</LocalizedText></p>
      ) : (
        <ol className="tv-rx-trend__list">
          {section.entries.map((entry, index) => (
            <li key={entry.tool.id} className="tv-rx-trend__item">
              <button
                type="button"
                className="tv-rx-trend__button"
                onClick={() => onSelect(entry.tool.id)}
              >
                <span className="tv-rx-trend__identity"><span className="tv-rx-trend__rank" aria-hidden="true"><LocalizedText>{String(index + 1).padStart(2, "0")}</LocalizedText></span><strong>{entry.tool.name}</strong><ArrowUpRight size={13} aria-hidden="true" /></span>
                {section.key === "top-voted" || section.key === "discussion" ? (
                  <span className="tv-rx-ranking-bar" aria-hidden="true"><i style={{ inlineSize: `${(section.key === "top-voted" ? entry.tool.votesCount : entry.tool.commentsCount) / Math.max(1, ...section.entries.map((item) => section.key === "top-voted" ? item.tool.votesCount : item.tool.commentsCount)) * 100}%` }} /></span>
                ) : null}
                <span className="tv-rx-trend__why"><LocalizedText>{entry.explanation}</LocalizedText></span>
              </button>
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

  return (
    <section className="tv-rx-section tv-rx-personal" aria-labelledby="tv-rx-perte-title" data-personal-state={model.coldStart ? "cold" : model.empty ? "partial" : "useful"}>
      <header className="tv-rx-section__head">
        <p className="tv-rx__eyebrow"><LocalizedText>{"Il tuo segnale / Interessi reali"}</LocalizedText></p>
        <h2 id="tv-rx-perte-title" className="tv-rx-section__title"><LocalizedText>{model.coldStart ? "Costruiamo il tuo Radar" : "Per te"}</LocalizedText></h2>
        <p className="tv-rx-section__desc"><LocalizedText>{model.coldStart ? "Non abbiamo ancora segnali tuoi su cui lavorare. Parti da una di queste strade." : "Scelte dai tuoi salvataggi, confronti e categorie seguite."}</LocalizedText></p>
      </header>
      <div className="tv-rx-personal__workspace">
        <div className="tv-rx-workspace-main">
          {model.coldStart ? (
            <ul className="tv-rx-coldstart">
              <li>
                <Link href="/archivio"><Search size={22} aria-hidden="true" /><span><strong><LocalizedText>{"Scegli le tue categorie dal Catalogo"}</LocalizedText></strong><small><LocalizedText>{"Trova l'area in cui lavori."}</LocalizedText></small></span><ArrowUpRight size={16} aria-hidden="true" /></Link>
              </li>
              <li>
                <button type="button" onClick={onExploreTrend}>
                  <ChartNoAxesColumn size={22} aria-hidden="true" /><span><strong><LocalizedText>{"Esplora i trend di oggi"}</LocalizedText></strong><small><LocalizedText>{"Leggi voti, discussioni e nuovi ingressi."}</LocalizedText></small></span><ArrowUpRight size={16} aria-hidden="true" />
                </button>
              </li>
              <li>
                <Link href="/archivio"><Bookmark size={22} aria-hidden="true" /><span><strong><LocalizedText>{"Salva i primi tool"}</LocalizedText></strong><small><LocalizedText>{"I tuoi candidati danno forma al Radar."}</LocalizedText></small></span><ArrowUpRight size={16} aria-hidden="true" /></Link>
              </li>
            </ul>
          ) : model.empty ? (
            <div className="tv-rx-rail__block">
              <p className="tv-rx__eyebrow"><LocalizedText>{"Interessi presenti / Nessuna corrispondenza"}</LocalizedText></p>
              <h3 className="tv-rx-context__title"><LocalizedText>{"Il prossimo segnale deve essere rilevante"}</LocalizedText></h3>
              <p className="tv-rx-honest" role="status"><LocalizedText>{"Nessun segnale del Radar coincide con i tuoi interessi in questo periodo."}</LocalizedText></p>
              <button type="button" className="tv-rx-perte__explore" onClick={onExploreTrend}><LocalizedText>{"Esplora i trend"}</LocalizedText></button>
              <Link className="tv-rx-profile__link" href="/archivio"><LocalizedText>{"Esplora il Catalogo "}</LocalizedText><ArrowUpRight size={16} aria-hidden="true" /></Link>
            </div>
          ) : (
            <ul className="tv-rx-perte__list">
              {model.cards.map((card) => (
                <li key={card.tool.id} className="tv-rx-perte__card">
                  <div>
                    <strong className="tv-rx-perte__name">{card.tool.name}</strong>
                    <p className="tv-rx-perte__signal"><LocalizedText>{card.title}</LocalizedText></p>
                    <p className="tv-rx-perte__why"><LocalizedText>{card.explanation}</LocalizedText></p>
                    <p className="tv-rx-perte__meta">
                      <LocalizedText>{card.tool.category?.label ?? card.tool.categoryLabel ?? card.tool.topicCluster.label}</LocalizedText> ·<LocalizedText>{" "}</LocalizedText>
                      {card.tool.votesCount}<LocalizedText>{" voti · "}</LocalizedText>{card.tool.commentsCount}<LocalizedText>{" commenti "}</LocalizedText></p>
                  </div>
                  <button
                    type="button"
                    className="tv-rx-perte__explore"
                    onClick={() => onSelect(card.tool.id)}
                  ><LocalizedText>{"Esplora "}</LocalizedText></button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <aside className="tv-rx-profile tv-rx-rail__block" aria-labelledby="tv-rx-profile-title">
          <p className="tv-rx__eyebrow"><LocalizedText>{"Le basi / Il tuo workspace"}</LocalizedText></p>
          <h3 id="tv-rx-profile-title" className="tv-rx-context__title"><LocalizedText>{"Profilo di interessi"}</LocalizedText></h3>
          <MetricStrip label="Input personali del Radar" className="tv-rx-personal__metrics" items={[
            { label: "Salvati", value: workspace.saved.slugs.length },
            { label: "In confronto", value: workspace.compare.slugs.length },
            { label: "Tool seguiti", value: workspace.radarWatch.slugs.length },
          ]} />
          <dl className="tv-rx-profile__matrix">
            <div><dt><LocalizedText>{"Categorie seguite"}</LocalizedText></dt><dd>{workspace.radarWatch.categories.length}</dd></div>
            <div><dt><LocalizedText>{"Tool nello stack"}</LocalizedText></dt><dd>{workspace.stack.slugs.length}</dd></div>
            <div><dt><LocalizedText>{"Stati tool registrati"}</LocalizedText></dt><dd>{Object.keys(workspace.toolStates).length}</dd></div>
          </dl>
          <p className="tv-rx-rail__title"><LocalizedText>{"Interessi rilevati"}</LocalizedText></p>
          {model.interests.length ? <ul className="tv-rx-profile__interests">{model.interests.map((interest) => <li key={interest}><LocalizedText>{interest}</LocalizedText></li>)}</ul> : <p className="tv-rx-context__caption"><LocalizedText>{"Nessuna categoria di interesse rilevata."}</LocalizedText></p>}
          <p className="tv-rx-context__caption"><LocalizedText>{"Il Radar usa le scelte effettive nel workspace. Ogni segnale proposto spiega la propria corrispondenza."}</LocalizedText></p>
        </aside>
      </div>
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
  onSelect,
  rangeLabel,
  onExploreRadar,
}: {
  rangeLabel: string;
  onExploreRadar: () => void;
  tools: readonly RadarTool[];
  watch: WorkspaceStateV1["radarWatch"];
  onToggleTool: (id: string) => void;
  onToggleCategory: (categoryId: string) => void;
  onClear: () => void;
  categories: readonly { id: string; label: string; count: number }[];
  onSelect: (id: string) => void;
}) {
  const digest: RadarWatchDigest = evaluateRadarWatchSignals(watch, tools, null);
  const empty = isRadarWatchEmpty(watch);

  return (
    <section className="tv-rx-section tv-rx-watch" aria-labelledby="tv-rx-watch-title" data-watch-density={empty ? "empty" : digest.matchedTools.length === 1 ? "single" : "multiple"}>
      <header className="tv-rx-section__head">
        <p className="tv-rx__eyebrow"><LocalizedText>{"Monitoraggio / "}</LocalizedText><LocalizedText>{rangeLabel}</LocalizedText></p>
        <h2 id="tv-rx-watch-title" className="tv-rx-section__title"><LocalizedText>{"Watchlist "}</LocalizedText></h2>
        <p className="tv-rx-section__desc"><LocalizedText>{"Watch segue i segnali; Save conserva i candidati nel Catalogo. Le variazioni richiedono uno storico. "}</LocalizedText></p>
      </header>

      <div className="tv-rx-watch__workspace">
        <div className="tv-rx-workspace-main">
          {!empty ? (
            <div className="tv-rx-watch__status">
              <p className="tv-rx-watch__counts">
                {digest.watchedToolCount}<LocalizedText>{" tool seguiti · "}</LocalizedText>{digest.watchedCategoryCount}<LocalizedText>{" categorie seguite "}</LocalizedText></p>
              <button type="button" className="tv-rx-watch__clear" onClick={onClear}><LocalizedText>{"Azzera Watchlist "}</LocalizedText></button>
            </div>
          ) : null}

          <MetricStrip label="Snapshot della Watchlist" className="tv-rx-watch__metrics" items={[
            { label: "Tool seguiti", value: digest.watchedToolCount },
            { label: "Categorie", value: digest.watchedCategoryCount },
            { label: "Nel periodo", value: digest.matchedTools.length },
          ]} />

          {digest.matchedTools.length > 0 ? (
            <section className="tv-rx-watch__monitor" aria-labelledby="tv-rx-monitored-title">
              <h3 id="tv-rx-monitored-title" className="tv-rx-subtitle"><LocalizedText>{"Seguiti nel periodo"}</LocalizedText></h3>
              <ul className="tv-rx-watch__monitored-list">
                {digest.matchedTools.map((tool) => (
                  <li key={tool.id}>
                    <button className="tv-rx-watch__inspect" type="button" onClick={() => onSelect(tool.id)}>
                      <span><strong>{tool.name}</strong><small><LocalizedText>{tool.topicCluster.label}</LocalizedText><LocalizedText>{" · Product Hunt"}</LocalizedText></small></span>
                      <span><LocalizedText>{formatAge(tool.ageHours)}</LocalizedText></span>
                      <span>{tool.votesCount}<LocalizedText>{" voti · "}</LocalizedText>{tool.commentsCount}<LocalizedText>{" commenti"}</LocalizedText></span>
                      <span className="tv-rx-preview__badge" data-catalog-status={tool.catalogStatus}><LocalizedText>{tool.catalogStatus === "linked" ? "Nel Catalogo" : "Esterno"}</LocalizedText></span>
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section className="tv-rx-rail__block">
              <p className="tv-rx__eyebrow"><LocalizedText>{empty ? "Primo segnale" : "Fuori dal periodo"}</LocalizedText></p>
              <h3 className="tv-rx-context__title"><LocalizedText>{empty ? "Scegli cosa tenere d’occhio" : "Nessun tool seguito nello snapshot"}</LocalizedText></h3>
              <button type="button" className="tv-rx-perte__explore" onClick={onExploreRadar}><LocalizedText>{"Apri il Radar"}</LocalizedText></button>
              {empty ? <p className="tv-rx-context__caption" role="status"><LocalizedText>{"La tua Watchlist è vuota."}</LocalizedText></p> : null}
              <p className="tv-rx-context__caption"><LocalizedText>{"Segnali disponibili nel periodo · "}</LocalizedText>{tools.length}</p>
              <ul className="tv-rx-rail__list">{tools.slice(0, 3).map((tool) => <li key={tool.id}><button type="button" className="tv-rx-rail__signal" onClick={() => onSelect(tool.id)}><span className="tv-rx-rail__identity">{tool.name}<small className="tv-rx-rail__meta"><LocalizedText>{tool.topicCluster.label}</LocalizedText> · <LocalizedText>{formatAge(tool.ageHours)}</LocalizedText></small></span><ArrowUpRight size={16} aria-hidden="true" /></button></li>)}</ul>
            </section>
          )}

          <h3 className="tv-rx-subtitle"><LocalizedText>{"Segnali"}</LocalizedText></h3>
          {!digest.movementAlertsAvailable ? (
            <p className="tv-rx-honest" role="status">
              <LocalizedText>{RADAR_WATCH_MOVEMENT_REASON}</LocalizedText>
            </p>
          ) : null}
          {digest.signals.length === 0 ? (
            <p className="tv-rx-honest" role="status"><LocalizedText>{"Nessun segnale per la tua Watchlist in questo periodo. "}</LocalizedText></p>
          ) : (
            <ul className="tv-rx-watch__signals">
              {digest.signals.map((signal) => (
                <li key={signal.id} className="tv-rx-watch__signal">
                  <strong><LocalizedText>{signal.title}</LocalizedText></strong>
                  <p><LocalizedText>{signal.explanation}</LocalizedText></p>
                </li>
              ))}
            </ul>
          )}

        </div>
        <LocalizedAttributes><aside className="tv-rx-watch__management tv-rx-rail__block" aria-label="Categorie e gestione della Watchlist">
          <section>
            <p className="tv-rx__eyebrow"><LocalizedText>{"Contesto / Aree del Radar"}</LocalizedText></p>
            <h3 className="tv-rx-context__title"><LocalizedText>{"Aree da seguire"}</LocalizedText></h3>
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
                      <LocalizedText>{category.label}</LocalizedText> ({category.count})
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <details className="tv-rx-watch__picker">
            <summary><LocalizedText>{"Aggiungi o gestisci tool · "}</LocalizedText>{tools.length}<LocalizedText>{" nel Radar"}</LocalizedText></summary>
            <h3 className="tv-rx-subtitle"><LocalizedText>{"Tool nel Radar"}</LocalizedText></h3>
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
                      <LocalizedText>{active ? "Seguito" : "Segui"}</LocalizedText>
                    </button>
                  </li>
                );
              })}
            </ul>
          </details>
        </aside></LocalizedAttributes>

      </div>
      <p className="tv-rx-watch__note"><LocalizedText>{"Monitoraggio nell'app. Le notifiche push non sono ancora disponibili. "}</LocalizedText></p>
    </section>
  );
}
