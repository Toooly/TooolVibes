"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";

type ProductHuntRange = "day" | "week" | "month";

type ProductHuntItem = {
  id: string;
  name: string;
  tagline: string;
  votesCount: number;
  commentsCount: number;
  productHuntUrl: string;
  thumbnailUrl?: string;
};

type ProductHuntPayload = {
  status: "ok" | "missing-token" | "error";
  range: ProductHuntRange;
  updatedAt: string;
  items: ProductHuntItem[];
  message?: string;
};

const radarTabs: { key: ProductHuntRange; label: string }[] = [
  { key: "day", label: "Giorno" },
  { key: "week", label: "Settimana" },
  { key: "month", label: "Mese" },
];

function formatUpdatedAt(value?: string) {
  if (!value) return "in caricamento";

  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatSignal(item: ProductHuntItem) {
  if (item.votesCount > 0 && item.commentsCount > 0) {
    return `${item.votesCount} voti / ${item.commentsCount} commenti`;
  }

  if (item.votesCount > 0) {
    return `${item.votesCount} voti`;
  }

  return "Segnale in verifica";
}

function DesktopRadarTableSkeleton() {
  return (
    <div className="desktop-radar-table__body" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="desktop-radar-table__row is-loading">
          <span className="desktop-radar-table__rank" />
          <span className="desktop-radar-table__visual" />
          <span className="desktop-radar-table__copy">
            <span />
            <small />
          </span>
          <span className="desktop-radar-table__metric" />
          <span className="desktop-radar-table__open" />
        </div>
      ))}
    </div>
  );
}

export function DesktopRadarTable() {
  const [activeRange, setActiveRange] = useState<ProductHuntRange>("day");
  const [payloads, setPayloads] = useState<Partial<Record<ProductHuntRange, ProductHuntPayload>>>({});
  const [loadingRange, setLoadingRange] = useState<ProductHuntRange | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (payloads[activeRange]) {
      return;
    }

    setLoadingRange(activeRange);

    fetch(`/api/product-hunt?range=${activeRange}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Product Hunt request failed");
        }

        return (await response.json()) as ProductHuntPayload;
      })
      .then((payload) => {
        if (!isMounted) return;
        setPayloads((current) => ({ ...current, [activeRange]: payload }));
      })
      .catch(() => {
        if (!isMounted) return;
        setPayloads((current) => ({
          ...current,
          [activeRange]: {
            status: "error",
            range: activeRange,
            updatedAt: new Date().toISOString(),
            items: [],
            message: "Classifica Product Hunt temporaneamente non disponibile.",
          },
        }));
      })
      .finally(() => {
        if (isMounted) {
          setLoadingRange(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeRange, payloads]);

  const payload = payloads[activeRange];
  const items = useMemo(() => payload?.items ?? [], [payload?.items]);
  const isLoading = loadingRange === activeRange && !payload;

  return (
    <section
      className="desktop-radar-table"
      aria-label="Classifica Product Hunt"
      aria-busy={isLoading}
    >
      <div className="desktop-radar-table__topbar">
        <div className="desktop-radar-table__tabs" role="tablist" aria-label="Periodo classifica">
          {radarTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeRange === tab.key}
              className={activeRange === tab.key ? "is-active" : undefined}
              onClick={() => setActiveRange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="desktop-radar-table__updated">
          Aggiornato: {formatUpdatedAt(payload?.updatedAt)}
        </span>
      </div>

      <div className="desktop-radar-table__head" aria-hidden="true">
        <span>#</span>
        <span>Tool</span>
        <span>Segnale</span>
        <span>Link</span>
      </div>

      {isLoading || !payload ? (
        <DesktopRadarTableSkeleton />
      ) : payload.status === "ok" && items.length > 0 ? (
        <div className="desktop-radar-table__body">
          {items.slice(0, 10).map((item, index) => (
            <a
              key={item.id}
              href={item.productHuntUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="desktop-radar-table__row"
            >
              <span className="desktop-radar-table__rank">#{index + 1}</span>
              <span className="desktop-radar-table__visual">
                {item.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnailUrl} alt="" loading="lazy" />
                ) : (
                  <span>{item.name.slice(0, 2).toUpperCase()}</span>
                )}
              </span>
              <span className="desktop-radar-table__copy">
                <strong>{item.name}</strong>
                <small>{item.tagline}</small>
              </span>
              <span className="desktop-radar-table__metric">{formatSignal(item)}</span>
              <span className="desktop-radar-table__open">
                Apri
                <ExternalLink size={13} aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
      ) : (
        <div className="desktop-radar-table__empty">
          <strong>{payload.message ?? "Classifica Product Hunt non disponibile."}</strong>
          <span>Il radar resta vuoto finche non tornano dati reali.</span>
        </div>
      )}
    </section>
  );
}
