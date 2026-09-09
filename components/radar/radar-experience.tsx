"use client";

/**
 * TooolVibes — Radar Experience (V2, 2026-08-03)
 *
 * V2 contract for /radar:
 *  - Hero: eyebrow split (desktop/mobile via CSS), H1 "Segui i lanci.
 *    Individua i segnali da approfondire.", CatalogoFacetHead, lede breve.
 *  - Status bar compatta: Product Hunt · {rangeLabel} · {statusLabel}.
 *  - Periodo selector: Oggi / Ultimi 7 giorni / Ultimi 30 giorni
 *    (rolling windows — l'API ritorna last 24h / 7d / 30d).
 *  - Vista selector: Mappa / Elenco.
 *  - Stato display (5): loading | live | empty | stale | error.
 *    "LIVE" è bandito (V2 §3). fixture resta "QA FIXTURE" come
 *    segnale di debug dev-only (mai mostrato in produzione).
 *  - Empty / error / stale states con CTAs primarie e secondarie.
 *  - Retry button: "Aggiorna i dati" / "Aggiornamento in corso…".
 *  - Mappa: region aria-label "Mappa dei segnali Product Hunt per il
 *    periodo selezionato"; ogni nodo "[rank]. [name], [N] voti su
 *    Product Hunt. Apri il lancio."
 *  - Elenco: eyebrow "Elenco dei segnali", H2 "Tutti i segnali del
 *    periodo", colonne Posizione / Lancio / Voti / Commenti / PH.
 *  - Provenance in <details>: "Informazioni sui dati" + body +
 *    "Visita Product Hunt" link.
 *
 * Mantiene invariato HomeRadarPreview (consumato dalla home V2, copy
 * home è closed).
 */

import Image from "next/image";
import Link from "next/link";
import {
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowRight,
  ExternalLink,
  Radar as RadarIcon,
  RefreshCw,
} from "lucide-react";
import { TinyAdzInlineSlot } from "@/components/ads/tinyadz-inline-slot";
import { CatalogoFacetHead } from "@/components/archive/catalogo-facet-head";
import {
  RadarLensControl,
  RadarPersonalEmpty,
  RadarPersonalReason,
  useRadarPersonalLayer,
} from "@/components/radar/radar-personal-layer";
import type {
  ProductHuntItem,
  ProductHuntRange,
} from "@/lib/radar/product-hunt-contract";
import type { RadarPersonalSignal } from "@/lib/radar/radar-personal-signals";
import {
  RADAR_RANGE_OPTIONS,
  resolveRadarUiModel,
  type RadarUiModel,
} from "@/lib/radar/radar-ui-model";
import type { RadarDesktopVisual } from "@/lib/radar/radar-view-config";
import { useProductHuntRadar } from "@/lib/radar/use-product-hunt-radar";

const RADAR_VISUAL_OPTIONS: ReadonlyArray<{
  key: RadarDesktopVisual;
  label: string;
  /** Label accessibile per screen reader (stesso testo in V2). */
  ariaLabel: string;
}> = [
  { key: "nodes", label: "Mappa", ariaLabel: "Visualizza i segnali sulla mappa del Radar" },
  { key: "table", label: "Elenco", ariaLabel: "Visualizza i segnali in elenco" },
];

const RADAR_NODE_POSITIONS = [
  { x: 50, y: 13, side: "center" },
  { x: 82, y: 35, side: "right" },
  { x: 72, y: 76, side: "right" },
  { x: 28, y: 76, side: "left" },
  { x: 18, y: 35, side: "left" },
] as const;

function signalLinkProps(item: ProductHuntItem) {
  const external = item.productHuntUrl.startsWith("http");
  return {
    href: item.productHuntUrl,
    target: external ? ("_blank" as const) : undefined,
    rel: external ? "noopener noreferrer" : undefined,
  };
}

function nodeAriaLabel(rank: number, item: ProductHuntItem): string {
  const votesPart = item.votesCount > 0
    ? `${item.votesCount} ${item.votesCount === 1 ? "voto" : "voti"} su Product Hunt.`
    : "Dato non disponibile";
  return `${rank}. ${item.name}, ${votesPart} Apri il lancio.`;
}

function SignalIdentity({
  item,
  compact = false,
}: {
  item: ProductHuntItem;
  compact?: boolean;
}) {
  return (
    <span
      className="tv-radar-signal-identity"
      data-compact={compact || undefined}
      aria-hidden="true"
    >
      {item.thumbnailUrl ? (
        // Product Hunt controls these remote runtime images.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.thumbnailUrl} alt="" loading="lazy" />
      ) : (
        <span>{item.name.slice(0, 2).toUpperCase()}</span>
      )}
    </span>
  );
}

function RadarInstrument({
  model,
  compact = false,
  personalById,
}: {
  model: RadarUiModel;
  compact?: boolean;
  personalById?: Map<string, RadarPersonalSignal>;
}) {
  const nodes = model.items.slice(0, 5);

  return (
    <div
      className="tv-radar-instrument"
      data-state={model.state}
      data-compact={compact || undefined}
      role="region"
      aria-label="Mappa dei segnali Product Hunt per il periodo selezionato"
    >
      <span
        className="tv-radar-instrument__ring tv-radar-instrument__ring--outer"
        aria-hidden="true"
      />
      <span
        className="tv-radar-instrument__ring tv-radar-instrument__ring--middle"
        aria-hidden="true"
      />
      <span
        className="tv-radar-instrument__ring tv-radar-instrument__ring--inner"
        aria-hidden="true"
      />
      <span className="tv-radar-instrument__axis" aria-hidden="true" />
      {model.isAnimated ? (
        <span className="tv-radar-instrument__sweep" aria-hidden="true" />
      ) : null}

      {nodes.map((item, index) => {
        const rank = index + 1;
        const position =
          RADAR_NODE_POSITIONS[index] ?? RADAR_NODE_POSITIONS[0];
        const style = {
          "--tv-radar-node-x": `${position.x}%`,
          "--tv-radar-node-y": `${position.y}%`,
        } as CSSProperties;
        return (
          <a
            key={item.id}
            {...signalLinkProps(item)}
            className="tv-radar-node"
            data-side={position.side}
            style={style}
            aria-label={nodeAriaLabel(rank, item)}
          >
            <SignalIdentity item={item} compact />
            <span className="tv-radar-node__label">
              <strong>#{String(rank).padStart(2, "0")} · {item.name}</strong>
              <small>
                {item.votesCount > 0
                  ? `${item.votesCount} ${item.votesCount === 1 ? "voto" : "voti"}`
                  : "Dato non disponibile"}
              </small>
              <RadarPersonalReason signal={personalById?.get(item.id)} />
            </span>
          </a>
        );
      })}

      <span className="tv-radar-instrument__core" aria-hidden="true">
        <Image
          src="/brand/tooolvibes-logo.png"
          alt=""
          width={112}
          height={112}
          priority={compact}
        />
      </span>

      {/* Stato centrale del grafico: solo "Aggiornamento in corso" / "N segnali
          disponibili" / "Nessun segnale" — niente paragrafo, niente duplicazione
          del blocco di loading principale (V2 §10). */}
      {nodes.length === 0 ? (
        <div
          className="tv-radar-instrument__state"
          aria-hidden="true"
        >
          <strong>
            {model.state === "loading"
              ? "Aggiornamento in corso"
              : model.state === "empty"
                ? "Nessun segnale"
                : "Aggiornamento in corso"}
          </strong>
        </div>
      ) : (
        <div className="tv-radar-instrument__count" aria-hidden="true">
          <strong>{model.signalCount ?? "—"}</strong>
          <span>segnali disponibili</span>
        </div>
      )}
    </div>
  );
}

/**
 * Pannello errore/empty/stale condiviso.
 * Mostra: title + body + CTA primaria ("Riprova") + CTA secondaria
 * ("Vai al catalogo"). Lo stato empty ha copy leggermente diversa
 * (no errore tecnico).
 */
function RadarStatePanel({
  model,
  onRetry,
  isFetching,
  variant,
}: {
  model: RadarUiModel;
  onRetry: () => void;
  isFetching: boolean;
  variant: "empty" | "stale" | "error";
}) {
  const isStale = variant === "stale";
  const isError = variant === "error";

  return (
    <div
      className="tv-radar-state"
      data-variant={variant}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      {isStale ? (
        <span className="tv-radar-state__badge">Aggiornamento non recente</span>
      ) : null}
      <h3 className="tv-radar-state__title">{model.stageTitle}</h3>
      <p className="tv-radar-state__body">{model.stageBody}</p>
      <div className="tv-radar-state__actions">
        <button
          type="button"
          className="tv-radar-state__cta tv-radar-state__cta--primary"
          onClick={onRetry}
          disabled={isFetching}
        >
          <RefreshCw size={15} aria-hidden="true" />
          {isFetching ? "Aggiornamento in corso…" : "Riprova"}
        </button>
        <Link
          href="/archivio"
          className="tv-radar-state__cta tv-radar-state__cta--secondary"
        >
          Vai al catalogo
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function RadarTable({
  model,
  personalById,
}: {
  model: RadarUiModel;
  personalById?: Map<string, RadarPersonalSignal>;
}) {
  const signals = model.items.slice(0, 12);

  return (
    <section className="tv-radar-table" aria-labelledby="tv-radar-table-title">
      <header className="tv-radar-table__header">
        <div>
          <p>Elenco dei segnali</p>
          <h2 id="tv-radar-table-title">Tutti i segnali del periodo</h2>
        </div>
        <span>{model.rangeLabel}</span>
      </header>

      {signals.length > 0 ? (
        <>
          <div className="tv-radar-table__head" aria-hidden="true">
            <span>Posizione</span>
            <span>Lancio</span>
            <span>Voti</span>
            <span>Commenti</span>
            <span>Product Hunt</span>
          </div>
          <ol className="tv-radar-table__body">
            {signals.map((item, index) => {
              const rank = index + 1;
              return (
                <li key={item.id}>
                  <a
                    {...signalLinkProps(item)}
                    className="tv-radar-table__row"
                    aria-label={`Apri ${item.name} su Product Hunt in una nuova scheda`}
                  >
                    <span className="tv-radar-table__rank">
                      {String(rank).padStart(2, "0")}
                    </span>
                    <span className="tv-radar-table__tool">
                      <SignalIdentity item={item} compact />
                      <span>
                        <strong>{item.name}</strong>
                        <small>
                          {item.tagline || "Descrizione non disponibile."}
                        </small>
                        <RadarPersonalReason signal={personalById?.get(item.id)} />
                      </span>
                    </span>
                    <span className="tv-radar-table__metric">
                      {item.votesCount > 0
                        ? `${item.votesCount} ${item.votesCount === 1 ? "voto" : "voti"}`
                        : "Dato non disponibile"}
                    </span>
                    <span className="tv-radar-table__metric">
                      {item.commentsCount > 0
                        ? `${item.commentsCount} ${item.commentsCount === 1 ? "commento" : "commenti"}`
                        : "Dato non disponibile"}
                    </span>
                    <span className="tv-radar-table__metric tv-radar-table__metric--cta">
                      Apri su Product Hunt
                      <ExternalLink size={15} aria-hidden="true" />
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </>
      ) : (
        <div className="tv-radar-table__state" role="status" aria-live="polite">
          <RadarIcon size={22} aria-hidden="true" />
          <strong>{model.stageTitle}</strong>
          <p>{model.stageBody}</p>
        </div>
      )}
    </section>
  );
}

/**
 * Retry button secondo V2 §18.
 * - default: "Aggiorna i dati"
 * - loading: "Aggiornamento in corso…"
 * Stato "no changes" ed "error" non hanno CTA dedicate — la empty
 * state e la error state usano il pannello con "Riprova".
 */
function RadarRetryButton({
  show,
  isFetching,
  onClick,
}: {
  show: boolean;
  isFetching: boolean;
  onClick: () => void;
}) {
  if (!show) return null;
  return (
    <button
      type="button"
      className="tv-radar__retry"
      disabled={isFetching}
      onClick={onClick}
      aria-label="Aggiorna i dati del Radar"
    >
      <RefreshCw size={15} aria-hidden="true" />
      {isFetching ? "Aggiornamento in corso…" : "Aggiorna i dati"}
    </button>
  );
}

function RadarStatusBar({ model }: { model: RadarUiModel }) {
  return (
    <div className="tv-radar-status-bar" role="group" aria-label="Stato Radar">
      <span className="tv-radar-status-bar__source">Product Hunt</span>
      <span className="tv-radar-status-bar__sep" aria-hidden="true">
        ·
      </span>
      <span className="tv-radar-status-bar__range">{model.rangeLabel}</span>
      <span className="tv-radar-status-bar__sep" aria-hidden="true">
        ·
      </span>
      <span
        className="tv-radar-status-bar__status"
        data-state={model.state}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span aria-hidden="true" className="tv-radar-status-bar__dot" />
        {model.statusLabel}
      </span>
    </div>
  );
}

function RadarProvenance() {
  return (
    <details className="tv-radar-provenance">
      <summary className="tv-radar-provenance__title">
        Informazioni sui dati
      </summary>
      <p className="tv-radar-provenance__body">
        I dati provengono da Product Hunt e vengono organizzati per periodo
        da TooolVibes. Disponibilità, completezza e frequenza di
        aggiornamento dipendono dalla fonte.
      </p>
      <a
        href="https://www.producthunt.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="tv-radar-provenance__link"
      >
        Visita Product Hunt
        <ExternalLink size={14} aria-hidden="true" />
      </a>
    </details>
  );
}


export function RadarExperience({
  initialVisual,
}: {
  initialVisual: RadarDesktopVisual;
}) {
  const [activeRange, setActiveRange] = useState<ProductHuntRange>("day");
  const [activeVisual, setActiveVisual] =
    useState<RadarDesktopVisual>(initialVisual);
  const { payload, isLoading, isFetching, refetch } =
    useProductHuntRadar(activeRange);
  const model = useMemo(
    () => resolveRadarUiModel(payload, activeRange),
    [activeRange, payload],
  );
  const personal = useRadarPersonalLayer(model.items);
  const displayModel = useMemo(() => {
    if (personal.lens !== "personal") return model;
    const items = model.items.filter((item) => personal.byId.has(item.id));
    return {
      ...model,
      items,
      signalCount: items.length,
    };
  }, [model, personal.byId, personal.lens]);
  const personalEmpty =
    personal.lens === "personal" &&
    displayModel.items.length === 0 &&
    !isLoading &&
    model.state !== "error" &&
    model.state !== "missing-token" &&
    model.state !== "empty";

  const isInteractive = !isLoading && !isFetching;

  function handleRetry() {
    if (!isInteractive) return;
    refetch();
  }

  // V2 §14: stale mostra i dati con banner di warning (V2:
  // "Non cancellarli automaticamente se possono ancora essere utili").
  // V2 §12/§13: empty ed error mostrano solo il pannello dedicato.
  const hasErrorState =
    model.state === "empty" ||
    model.state === "error" ||
    model.state === "missing-token";
  const hasStaleBanner = model.state === "stale";

  // Sceglie variant per il pannello (empty / error)
  const statePanelVariant: "empty" | "stale" | "error" =
    model.state === "empty"
      ? "empty"
      : "error";

  return (
    <div className="tv-radar-page" data-state={model.state}>
      {/* ═══ 1. HERO ═══ */}
      <section
        className="tv-radar"
        aria-labelledby="tv-radar-title"
        aria-busy={isLoading}
      data-refreshing={isFetching && !isLoading ? "true" : undefined}
      >
        <header className="tv-radar__header">
          <div className="tv-radar__header-copy">
            <p className="tv-radar__eyebrow">
              <span className="tv-radar__eyebrow-visual" aria-hidden="true">
                <span className="tv-radar__eyebrow-lead">Segnali da </span>Product Hunt · dati reali
              </span>
              <span className="sr-only">
                Segnali da Product Hunt · dati reali
              </span>
            </p>
            <h1 id="tv-radar-title" className="tv-radar__title">
              Segui i lanci. Individua i segnali da approfondire.
            </h1>
            <CatalogoFacetHead active="radar" />
            <p className="tv-radar__lede">
              Segnali organizzati per periodo. Nessun dato simulato.
            </p>
          </div>
        </header>

        <RadarStatusBar model={model} />

        {/* ═══ 3-4. CONTROLLI: PERIODO + VISTA + RETRY ═══ */}
        <section className="tv-radar__controls" aria-label="Controlli Radar">
          <div
            className="tv-radar-control"
            role="group"
            aria-labelledby="tv-radar-range-label"
          >
            <span id="tv-radar-range-label" className="tv-radar-control__label">
              Periodo
            </span>
            <div className="tv-radar-control__buttons">
              {RADAR_RANGE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={activeRange === option.key}
                  aria-label={`Mostra i segnali di ${option.label}`}
                  aria-controls="tv-radar-results"
                  onClick={() => setActiveRange(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div
            className="tv-radar-control"
            role="group"
            aria-labelledby="tv-radar-view-label"
          >
            <span id="tv-radar-view-label" className="tv-radar-control__label">
              Vista
            </span>
            <div className="tv-radar-control__buttons">
              {RADAR_VISUAL_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={activeVisual === option.key}
                  aria-label={option.ariaLabel}
                  aria-controls="tv-radar-results"
                  onClick={() => setActiveVisual(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <RadarLensControl
            lens={personal.lens}
            onSelect={personal.selectLens}
            visible={personal.showLens}
          />
          <RadarRetryButton
            show={model.canRetry}
            isFetching={isFetching}
            onClick={handleRetry}
          />
        </section>

        {/* ═══ 5. RISULTATI: MAPPA O ELENCO ═══ */}
        <div
          id="tv-radar-results"
          className="tv-radar__results"
          data-view={activeVisual}
          aria-live="polite"
          aria-busy={isLoading}
      data-refreshing={isFetching && !isLoading ? "true" : undefined}
        >
          {hasStaleBanner ? (
            <RadarStatePanel
              model={model}
              onRetry={handleRetry}
              isFetching={isFetching}
              variant="stale"
            />
          ) : null}
          {hasErrorState ? (
            <RadarStatePanel
              model={model}
              onRetry={handleRetry}
              isFetching={isFetching}
              variant={statePanelVariant}
            />
          ) : personalEmpty ? (
            <RadarPersonalEmpty />
          ) : activeVisual === "nodes" ? (
            <div className="tv-radar__visual">
              <RadarInstrument model={displayModel} personalById={personal.lens === "personal" ? personal.byId : undefined} />
              {displayModel.state === "live" ? (
                <p className="tv-radar__stage-note" role="status">
                  <strong>{displayModel.stageTitle}</strong>
                  <span>{displayModel.stageBody}</span>
                </p>
              ) : null}
            </div>
          ) : (
            <RadarTable model={displayModel} personalById={personal.lens === "personal" ? personal.byId : undefined} />
          )}
        </div>

        {/* ═══ 6. COMMERCIAL — max one inline TinyAdz, after the first
            substantial block of signals, before provenance. ═══ */}
        <TinyAdzInlineSlot placement="radar-feed" />

        {/* ═══ 7. PROVENANCE SECTION ═══ */}
        <RadarProvenance />
      </section>
    </div>
  );
}


// =====================================================================
// HomeRadarPreview — MVP 1.0 glanceable signal snapshot (NOT a mini /radar)
// Purpose: in ~5 seconds show what is happening now + invite to full Radar.
// =====================================================================
export function HomeRadarPreview() {
  const { payload, isLoading, isFetching } = useProductHuntRadar("day");
  const model = useMemo(
    () => resolveRadarUiModel(payload, "day"),
    [payload],
  );

  const top = model.items.slice(0, 4);
  const maxVotes = top.reduce((m, i) => Math.max(m, i.votesCount), 0) || 1;

  return (
    <div
      className="tv-home-radar tv-home-radar--snapshot"
      data-state={model.state}
      data-refreshing={isFetching && !isLoading ? "true" : undefined}
      aria-busy={isLoading}
      aria-labelledby="tv-home-radar-title"
    >
      <header className="tv-home-radar__header">
        <div className="tv-home-radar__header-main">
          <p className="tv-home-radar__eyebrow">Radar · ora</p>
          <h2 id="tv-home-radar-title">Cosa sta emergendo adesso</h2>
        </div>
        <span className="tv-home-radar__status" data-state={model.state}>
          <span aria-hidden="true" />
          {model.statusLabel}
        </span>
      </header>

      <RadarInstrument model={model} />

      <p className="tv-home-radar__pulse tv-home-radar__rail" aria-label="Sintesi segnali di oggi">
        <span>
          <strong className="tv-home-radar__pulse-value">
            {model.signalCount ?? (isLoading ? "…" : "—")}
          </strong>
          <span className="tv-home-radar__pulse-label"> segnali</span>
        </span>
        <span>
          <span className="tv-home-radar__pulse-label">Aggiornato </span>
          <strong className="tv-home-radar__pulse-value tv-home-radar__pulse-value--sm">
            {model.updatedAtLabel}
          </strong>
        </span>
        <span>
          <span className="tv-home-radar__pulse-label">Fonte </span>
          <strong className="tv-home-radar__pulse-value tv-home-radar__pulse-value--sm">
            Product Hunt
          </strong>
        </span>
      </p>

      {top.length > 0 ? (
        <ol className="tv-home-radar__launches" aria-label="Top lanci del periodo">
          {top.map((item, index) => {
            const intensity = Math.round((item.votesCount / maxVotes) * 100);
            const talk =
              item.votesCount > 0
                ? Math.round((item.commentsCount / item.votesCount) * 100) / 100
                : null;
            return (
              <li key={item.id}>
                <a
                  href={item.productHuntUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tv-home-radar__launch"
                >
                  <span className="tv-home-radar__launch-rank" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="tv-home-radar__launch-body">
                    <strong>{item.name}</strong>
                    <em>{item.tagline || "Lancio su Product Hunt"}</em>
                  </span>
                  <span className="tv-home-radar__launch-metrics">
                    <span>
                      {item.votesCount > 0
                        ? `${item.votesCount} voti`
                        : "voti n/d"}
                    </span>
                    {talk !== null ? (
                      <span title="Commenti per voto (derivato dal set corrente)">
                        {talk.toFixed(2)} disc.
                      </span>
                    ) : null}
                  </span>
                  <span
                    className="tv-home-radar__launch-bar"
                    aria-hidden="true"
                    style={{ ["--intensity" as string]: `${intensity}%` }}
                  />
                </a>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="tv-home-radar__empty" role="status">
          {isLoading
            ? "Lettura segnali in corso…"
            : model.state === "error" || model.state === "missing-token"
              ? "Segnali non disponibili in questo momento. Nessun dato simulato."
              : "Nessun lancio nel periodo. Apri il Radar completo per altri intervalli."}
        </p>
      )}

      <Link
        href="/radar"
        className="tv-home-radar__cta"
        aria-label="Apri il Radar completo dei nuovi lanci"
      >
        Apri il Radar completo
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}
