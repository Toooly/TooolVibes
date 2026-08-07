"use client";

/**
 * TooolVibes — Radar Experience (V2, 2026-08-03)
 *
 * V2 contract for /radar:
 *  - Hero: eyebrow split (desktop/mobile via CSS), H1 "Segui i lanci.
 *    Individua i segnali da approfondire.", lede "Il Radar raccoglie…",
 *    provenance "Fonte: Product Hunt. Disponibilità e frequenza di
 *    aggiornamento dipendono dalla fonte."
 *  - Status rail: Stato / Ultimo aggiornamento / Segnali disponibili /
 *    Periodo (4 dt/dd pairs).
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
 *  - Provenance section finale: "Informazioni sui dati" + body +
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
import type {
  ProductHuntItem,
  ProductHuntRange,
} from "@/lib/radar/product-hunt-contract";
import {
  formatRadarSignal,
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
}: {
  model: RadarUiModel;
  compact?: boolean;
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

function RadarSignalIndex({ model }: { model: RadarUiModel }) {
  const signals = model.items.slice(0, 5);

  return (
    <aside className="tv-radar-index" aria-labelledby="tv-radar-index-title">
      <header className="tv-radar-index__header">
        <div>
          <p>Elenco dei segnali</p>
          <h2 id="tv-radar-index-title">Tutti i segnali del periodo</h2>
        </div>
        <span>{model.signalCount ?? "—"}</span>
      </header>

      {signals.length > 0 ? (
        <ol className="tv-radar-index__list">
          {signals.map((item, index) => {
            const rank = index + 1;
            return (
              <li key={item.id}>
                <a
                  {...signalLinkProps(item)}
                  className="tv-radar-index__row"
                  aria-label={nodeAriaLabel(rank, item)}
                >
                  <span className="tv-radar-index__rank">
                    {String(rank).padStart(2, "0")}
                  </span>
                  <SignalIdentity item={item} compact />
                  <span className="tv-radar-index__copy">
                    <strong>{item.name}</strong>
                    <small>{item.tagline || "Descrizione non disponibile."}</small>
                  </span>
                  <span className="tv-radar-index__metric">
                    {formatRadarSignal(item)}
                  </span>
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="tv-radar-index__state" role="status" aria-live="polite">
          <RadarIcon size={20} aria-hidden="true" />
          <strong>{model.stageTitle}</strong>
          <p>{model.stageBody}</p>
        </div>
      )}
    </aside>
  );
}

function RadarTable({ model }: { model: RadarUiModel }) {
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

/**
 * Status rail V2 (§9): 4 dt/dd pairs: Stato, Ultimo aggiornamento,
 * Segnali disponibili, Periodo. Aria-live polite sul valore Stato.
 */
function RadarStatusRail({ model }: { model: RadarUiModel }) {
  const hasCount = model.signalCount !== null;
  return (
    <dl className="tv-radar-status-rail" aria-label="Stato Radar">
      <div className="tv-radar-status-rail__item">
        <dt>Stato</dt>
        <dd>
          <span
            className="tv-radar-status-rail__status"
            data-state={model.state}
            role="status"
            aria-live="polite"
          >
            <span aria-hidden="true" className="tv-radar-status-rail__dot" />
            {model.statusLabel}
          </span>
        </dd>
      </div>
      <div className="tv-radar-status-rail__item">
        <dt>Ultimo aggiornamento</dt>
        <dd>
          <span
            className="tv-radar-status-rail__mobile-compact"
            data-state={model.state}
          >
            {model.updatedAtLabel}
          </span>
        </dd>
      </div>
      <div className="tv-radar-status-rail__item">
        <dt>Segnali disponibili</dt>
        <dd>
          <span
            className="tv-radar-status-rail__count"
            data-state={model.state}
            aria-live="polite"
            aria-atomic="true"
          >
            {hasCount ? model.signalCount : "—"}
          </span>
        </dd>
      </div>
      <div className="tv-radar-status-rail__item">
        <dt>Periodo</dt>
        <dd>{model.rangeLabel}</dd>
      </div>
    </dl>
  );
}

/**
 * Provenance section V2 (§19): "Informazioni sui dati" + body + link
 * "Visita Product Hunt". No claim su real-time / complete / verified.
 */
function RadarProvenance() {
  return (
    <section className="tv-radar-provenance" aria-labelledby="tv-radar-provenance-title">
      <h2 id="tv-radar-provenance-title" className="tv-radar-provenance__title">
        Informazioni sui dati
      </h2>
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
    </section>
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
        aria-busy={isLoading || isFetching}
      >
        <header className="tv-radar__header">
          <div className="tv-radar__header-copy">
            <p className="tv-radar__eyebrow">
              {/* V2 §6 + closure check: le varianti desktop/mobile
                  sono puramente visuali (CSS swap @ 47.99rem). Solo
                  una label canonica è esposta all'accessibility tree
                  (sr-only) per evitare doppia lettura e hydration
                  mismatch. */}
              <span
                className="tv-radar__eyebrow-desktop"
                aria-hidden="true"
              >
                Segnali da Product Hunt · dati reali
              </span>
              <span
                className="tv-radar__eyebrow-mobile"
                aria-hidden="true"
              >
                Product Hunt · dati reali
              </span>
              <span className="sr-only">
                Segnali da Product Hunt · dati reali
              </span>
            </p>
            <h1 id="tv-radar-title" className="tv-radar__title">
              Segui i lanci. Individua i segnali da approfondire.
            </h1>
            <p className="tv-radar__lede">
              Il Radar raccoglie i lanci di Product Hunt, li organizza per
              periodo e ti aiuta a individuare quelli da approfondire. Nessun
              dato simulato.
            </p>
            <p className="tv-radar__provenance">
              <span aria-hidden="true">Fonte: Product Hunt.</span>{" "}
              Disponibilità e frequenza di aggiornamento dipendono dalla fonte.
            </p>
          </div>
        </header>

        {/* ═══ 2. STATUS RAIL ═══ */}
        <RadarStatusRail model={model} />

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
          aria-busy={isLoading || isFetching}
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
          ) : activeVisual === "nodes" ? (
            <div className="tv-radar__visual">
              <div>
                <RadarInstrument model={model} />
                {model.state === "live" ? (
                  <p className="tv-radar__stage-note" role="status">
                    <strong>{model.stageTitle}</strong>
                    <span>{model.stageBody}</span>
                  </p>
                ) : null}
              </div>
              <RadarSignalIndex model={model} />
            </div>
          ) : (
            <RadarTable model={model} />
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
// HomeRadarPreview — consumato dalla Home V2. NON modificare qui.
// Il copy V2 della home è closed; questo componente resta allineato
// al contratto Home V2 e usa il modello V2 ma con copy coerente alla
// home (eyebrow "Radar · Dati da Product Hunt", H2 dedicato).
// =====================================================================
export function HomeRadarPreview() {
  const { payload, isLoading, isFetching } = useProductHuntRadar("day");
  const model = useMemo(
    () => resolveRadarUiModel(payload, "day"),
    [payload],
  );

  return (
    <div
      className="tv-home-radar"
      data-state={model.state}
      aria-busy={isLoading || isFetching}
    >
      <header className="tv-home-radar__header">
        <div>
          <p>Radar · Dati da Product Hunt</p>
          <h2>Segui i nuovi lanci. Valuta quelli che meritano attenzione.</h2>
          <p className="tv-home-radar__lede">
            Il Radar raccoglie segnali reali da Product Hunt e li organizza
            per periodo. Nessun dato simulato.
          </p>
        </div>
        <span className="tv-home-radar__status" data-state={model.state}>
          <span aria-hidden="true" />
          {model.statusLabel}
        </span>
      </header>

      <dl className="tv-home-radar__meta">
        <div>
          <dt>Stato</dt>
          <dd>{model.statusLabel}</dd>
        </div>
        <div>
          <dt>Ultimo aggiornamento</dt>
          <dd>{model.updatedAtLabel}</dd>
        </div>
        <div>
          <dt>Segnali rilevati</dt>
          <dd>{model.signalCount ?? "—"}</dd>
        </div>
        <div>
          <dt>Periodo</dt>
          <dd>{model.rangeLabel}</dd>
        </div>
      </dl>

      <RadarInstrument model={model} compact />

      <p className="tv-home-radar__source" role="status" aria-live="polite">
        <strong>{model.stageTitle}</strong>
        <span>{model.sourceLabel}</span>
      </p>

      <Link
        href="/radar"
        className="tv-home-radar__cta"
        aria-label="Apri il Radar completo dei nuovi lanci"
      >
        Esplora il Radar
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}
