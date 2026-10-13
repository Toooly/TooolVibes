"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, TrendingUp } from "lucide-react";

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

const tabs: { key: ProductHuntRange; label: string }[] = [
  { key: "day", label: "Oggi" },
  { key: "week", label: "Settimana" },
  { key: "month", label: "Mese" },
];

function formatSignal(item: ProductHuntItem) {
  if (item.votesCount > 0 && item.commentsCount > 0) {
    return `${item.votesCount} voti · ${item.commentsCount} commenti`;
  }
  if (item.votesCount > 0) {
    return `${item.votesCount} voti`;
  }
  return "Segnale in verifica";
}

export function CompareTrendList() {
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
    <LocalizedAttributes><section
      className="compare-trend-list"
      aria-label="Tool in trend"
      aria-busy={isLoading}
      data-loading={isLoading}
    >
      <div className="compare-trend-list__header">
        <div className="compare-trend-list__title">
          <TrendingUp className="size-4" />
          <span><LocalizedText>{"Lanci in trend"}</LocalizedText></span>
        </div>
        <LocalizedAttributes><div className="compare-trend-list__tabs" role="tablist" aria-label="Periodo">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeRange === tab.key}
              className={activeRange === tab.key ? "is-active" : undefined}
              onClick={() => setActiveRange(tab.key)}
            >
              <LocalizedText>{tab.label}</LocalizedText>
            </button>
          ))}
        </div></LocalizedAttributes>
      </div>

      {isLoading || !payload ? (
        <div className="compare-trend-list__body" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="compare-trend-list__row is-loading">
              <span className="compare-trend-list__rank" />
              <span className="compare-trend-list__visual" />
              <span className="compare-trend-list__copy">
                <span />
                <small />
              </span>
              <span className="compare-trend-list__open" />
            </div>
          ))}
        </div>
      ) : payload.status === "ok" && items.length > 0 ? (
        <div className="compare-trend-list__body">
          {items.slice(0, 10).map((item, index) => (
            <a
              key={item.id}
              href={item.productHuntUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="compare-trend-list__row"
            >
              <span className="compare-trend-list__rank">#{index + 1}</span>
              <span className="compare-trend-list__visual">
                {item.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- TODO(B66): migrate this runtime image after the image contract is unified.
                  <LocalizedAttributes><img src={item.thumbnailUrl} alt="" loading="lazy" /></LocalizedAttributes>
                ) : (
                  <span>{item.name.slice(0, 2).toUpperCase()}</span>
                )}
              </span>
              <span className="compare-trend-list__copy">
                <strong>{item.name}</strong>
                <small><LocalizedText>{formatSignal(item)}</LocalizedText></small>
              </span>
              <span className="compare-trend-list__open"><LocalizedText>{"Apri scheda "}</LocalizedText><ExternalLink size={13} aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
      ) : (
        <div className="compare-trend-list__empty" role="status">
          <strong><LocalizedText>{payload.message ?? "Classifica Product Hunt non disponibile."}</LocalizedText></strong>
          <span><LocalizedText>{"Il radar resta vuoto finché non tornano dati reali."}</LocalizedText></span>
        </div>
      )}
    </section></LocalizedAttributes>
  );
}
