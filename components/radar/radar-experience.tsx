"use client";

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
}> = [
  { key: "nodes", label: "Radar" },
  { key: "table", label: "Tabella" },
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
      aria-label={`Radar Product Hunt: ${model.statusLabel.toLowerCase()}`}
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
            aria-label={`${item.name}. ${formatRadarSignal(item)}. Apri su Product Hunt.`}
          >
            <SignalIdentity item={item} compact />
            <span className="tv-radar-node__label">
              <strong>{item.name}</strong>
              <small>
                {item.votesCount > 0
                  ? `${item.votesCount} voti`
                  : "In verifica"}
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

      {nodes.length === 0 ? (
        <div
          className="tv-radar-instrument__state"
          role="status"
          aria-live="polite"
        >
          <strong>{model.stageTitle}</strong>
          <span>{model.stageBody}</span>
        </div>
      ) : null}
    </div>
  );
}

function RadarSignalIndex({ model }: { model: RadarUiModel }) {
  const signals = model.items.slice(0, 5);

  return (
    <aside className="tv-radar-index" aria-labelledby="tv-radar-index-title">
      <header className="tv-radar-index__header">
        <div>
          <p>Indice segnali</p>
          <h2 id="tv-radar-index-title">Top Product Hunt</h2>
        </div>
        <span>{model.signalCount ?? "—"}</span>
      </header>

      {signals.length > 0 ? (
        <ol className="tv-radar-index__list">
          {signals.map((item, index) => (
            <li key={item.id}>
              <a
                {...signalLinkProps(item)}
                className="tv-radar-index__row"
                aria-label={`${item.name}. ${formatRadarSignal(item)}. Apri su Product Hunt.`}
              >
                <span className="tv-radar-index__rank">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <SignalIdentity item={item} compact />
                <span className="tv-radar-index__copy">
                  <strong>{item.name}</strong>
                  <small>{item.tagline}</small>
                </span>
                <span className="tv-radar-index__metric">
                  {item.votesCount > 0
                    ? `${item.votesCount} voti`
                    : "In verifica"}
                </span>
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            </li>
          ))}
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
          <p>Classifica verificabile</p>
          <h2 id="tv-radar-table-title">Tutti i segnali</h2>
        </div>
        <span>{model.rangeLabel}</span>
      </header>

      {signals.length > 0 ? (
        <>
          <div className="tv-radar-table__head" aria-hidden="true">
            <span>#</span>
            <span>Tool</span>
            <span>Segnale</span>
            <span>Link</span>
          </div>
          <ol className="tv-radar-table__body">
            {signals.map((item, index) => (
              <li key={item.id}>
                <a
                  {...signalLinkProps(item)}
                  className="tv-radar-table__row"
                  aria-label={`${item.name}. ${formatRadarSignal(item)}. Apri su Product Hunt.`}
                >
                  <span className="tv-radar-table__rank">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="tv-radar-table__tool">
                    <SignalIdentity item={item} compact />
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.tagline}</small>
                    </span>
                  </span>
                  <span className="tv-radar-table__metric">
                    {formatRadarSignal(item)}
                  </span>
                  <ExternalLink size={15} aria-hidden="true" />
                </a>
              </li>
            ))}
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

  return (
    <div className="tv-radar-page">
      <section
        className="tv-radar"
        aria-labelledby="tv-radar-title"
        aria-busy={isLoading || isFetching}
      >
        <header className="tv-radar__header">
          <div>
            <p className="tv-radar__eyebrow">Scrivania segnali · Product Hunt</p>
            <h1 id="tv-radar-title">Radar</h1>
            <p className="tv-radar__lede">
              {model.state === "fixture"
                ? "Fixture locale deterministica per verificare ogni breakpoint."
                : "Lanci reali, ordinati per periodo. Nessun dato simulato."}
            </p>
          </div>
          <span
            className="tv-radar__status"
            data-state={model.state}
            role="status"
            aria-live="polite"
          >
            <span aria-hidden="true" />
            {model.statusLabel}
          </span>
        </header>

        <section
          className="tv-radar__panel"
          aria-label="Controlli e risultati Radar"
        >
          <div className="tv-radar__toolbar">
            <div className="tv-radar__provenance">
              <p>{model.sourceLabel}</p>
              <dl>
                <div>
                  <dt>Ultimo scan</dt>
                  <dd>{model.updatedAtLabel}</dd>
                </div>
                <div>
                  <dt>Segnali</dt>
                  <dd>{model.signalCount ?? "—"}</dd>
                </div>
                <div>
                  <dt>Periodo</dt>
                  <dd>{model.rangeLabel}</dd>
                </div>
              </dl>
            </div>

            <div className="tv-radar__controls">
              <div
                className="tv-radar-control"
                role="group"
                aria-labelledby="tv-radar-range-label"
              >
                <span id="tv-radar-range-label">Periodo</span>
                <div>
                  {RADAR_RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      aria-pressed={activeRange === option.key}
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
                <span id="tv-radar-view-label">Vista</span>
                <div>
                  {RADAR_VISUAL_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      aria-pressed={activeVisual === option.key}
                      aria-controls="tv-radar-results"
                      onClick={() => setActiveVisual(option.key)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              {model.canRetry ? (
                <button
                  type="button"
                  className="tv-radar__retry"
                  disabled={isFetching}
                  onClick={refetch}
                >
                  <RefreshCw size={15} aria-hidden="true" />
                  {isFetching ? "Aggiornamento…" : "Aggiorna ora"}
                </button>
              ) : null}
            </div>
          </div>

          <div
            id="tv-radar-results"
            className="tv-radar__results"
            data-view={activeVisual}
          >
            {activeVisual === "nodes" ? (
              <div className="tv-radar__visual">
                <div>
                  <RadarInstrument
                    model={model}
                  />
                  <p className="tv-radar__stage-note" role="status">
                    <strong>{model.stageTitle}</strong>
                    <span>{model.stageBody}</span>
                  </p>
                </div>
                <RadarSignalIndex model={model} />
              </div>
            ) : (
              <RadarTable model={model} />
            )}
          </div>
        </section>
      </section>
    </div>
  );
}

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
          <p>
            {model.state === "fixture"
              ? "Feed Product Hunt · fixture QA simulata"
              : "Feed Product Hunt · dati non simulati"}
          </p>
          <h2>Segnali da verificare, non hype da inseguire.</h2>
        </div>
        <span className="tv-home-radar__status" data-state={model.state}>
          <span aria-hidden="true" />
          {model.statusLabel}
        </span>
      </header>

      <dl className="tv-home-radar__meta">
        <div>
          <dt>Scansione</dt>
          <dd>{model.updatedAtLabel}</dd>
        </div>
        <div>
          <dt>Segnali</dt>
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

      <Link href="/radar" className="tv-home-radar__cta">
        Apri il Radar completo
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}
