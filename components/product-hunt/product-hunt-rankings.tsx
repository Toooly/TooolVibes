"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { PremiumBadge, PremiumLink } from "@/components/ui/premium";
import { cn } from "@/lib/utils";

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

const tabs: { key: ProductHuntRange; label: string; shortLabel: string }[] = [
  { key: "day", label: "Top del giorno", shortLabel: "Giorno" },
  { key: "week", label: "Top della settimana", shortLabel: "Settimana" },
  { key: "month", label: "Top del mese", shortLabel: "Mese" },
];

function ProductHuntSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-[20px] border border-[rgba(83,63,170,0.08)] bg-white/62 p-3"
        >
          <div className="h-10 w-10 animate-pulse rounded-2xl bg-[rgba(109,59,255,0.1)]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/5 animate-pulse rounded-full bg-[rgba(31,19,93,0.12)]" />
            <div className="h-3 w-4/5 animate-pulse rounded-full bg-[rgba(31,19,93,0.08)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductHuntRankings({
  className,
  variant = "compact",
}: {
  className?: string;
  variant?: "compact" | "wide";
}) {
  const [activeRange, setActiveRange] = useState<ProductHuntRange>("day");
  const [payloads, setPayloads] = useState<Partial<Record<ProductHuntRange, ProductHuntPayload>>>(
    {},
  );
  const [loadingRange, setLoadingRange] = useState<ProductHuntRange | null>("day");

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
        if (!isMounted) {
          return;
        }

        setPayloads((current) => ({ ...current, [activeRange]: payload }));
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setPayloads((current) => ({
          ...current,
          [activeRange]: {
            status: "error",
            range: activeRange,
            updatedAt: new Date().toISOString(),
            items: [],
            message: "Product Hunt ranking temporaneamente non disponibile.",
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

  const activePayload = payloads[activeRange];
  const activeTab = useMemo(
    () => tabs.find((tab) => tab.key === activeRange) ?? tabs[0],
    [activeRange],
  );

  return (
    <section
      id="product-hunt"
      className={cn(
        "premium-card p-4 sm:p-5",
        variant === "wide" && "rounded-[36px] p-5 sm:p-7",
        className,
      )}
      aria-labelledby="product-hunt-title"
      aria-busy={loadingRange === activeRange && !activePayload}
    >
      <div className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        variant === "wide" && "lg:items-end",
      )}>
        <div className={variant === "wide" ? "max-w-[44rem]" : undefined}>
          <PremiumBadge tone="accent">Product Hunt</PremiumBadge>
          <h2
            id="product-hunt-title"
            className={cn(
              "text-display-card mt-3 text-[1.32rem] text-[var(--foreground)]",
              variant === "wide" && "text-[2rem] sm:text-[2.65rem]",
            )}
          >
            Migliori Toools su Product Hunt
          </h2>
          {variant === "wide" ? (
            <p className="mt-3 max-w-[42rem] text-[1rem] leading-7 text-[var(--muted-strong)]">
              Un radar esterno per intercettare i lanci più votati. Se il token non è
              configurato, la sezione mostra uno stato pulito invece di rompersi.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1 sm:items-end">
          <a
            href="https://www.producthunt.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)] transition-colors duration-200 hover:text-[var(--accent-strong)]"
          >
            Powered by Product Hunt
          </a>
          <p className="text-xs text-[var(--muted)]">
            Aggiornato:{" "}
            {activePayload?.updatedAt
              ? new Intl.DateTimeFormat("it-IT", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date(activePayload.updatedAt))
              : "in caricamento"}
          </p>
        </div>
      </div>

      <div
        className="mt-4 grid grid-cols-3 gap-2 rounded-[22px] border border-[rgba(83,63,170,0.08)] bg-[rgba(246,244,255,0.78)] p-1.5"
        role="tablist"
        aria-label="Periodo classifica Product Hunt"
      >
        {tabs.map((tab) => {
          const isActive = activeRange === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveRange(tab.key)}
              className={cn(
                "rounded-[18px] px-2.5 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] transition-all duration-200",
                isActive
                  ? "bg-white text-[var(--accent-strong)] shadow-[0_10px_22px_rgba(42,22,106,0.08)]"
                  : "text-[var(--muted-strong)] hover:text-[var(--foreground)]",
              )}
            >
              {tab.shortLabel}
            </button>
          );
        })}
      </div>

      <div className={cn("mt-4 min-h-[21rem]", variant === "wide" && "lg:min-h-0")}>
        {loadingRange === activeRange && !activePayload ? (
          <ProductHuntSkeleton />
        ) : activePayload?.status === "ok" && activePayload.items.length > 0 ? (
          <div
            className={cn(
              "space-y-3",
              variant === "wide" && "grid gap-3 space-y-0 sm:grid-cols-3 lg:grid-cols-5",
            )}
          >
            <AnimatePresence mode="popLayout">
            {activePayload.items.map((item, index) => (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.025, 0.12) }}
                className={cn(
                  "group flex items-center gap-3 rounded-[20px] border border-[rgba(83,63,170,0.08)] bg-white/78 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(108,76,255,0.22)] hover:bg-white hover:shadow-[0_14px_30px_rgba(35,18,95,0.08)]",
                  variant === "wide" && "lg:flex-col lg:items-start lg:p-4",
                  variant === "wide" && index > 2 && "hidden lg:flex",
                )}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-[rgba(83,63,170,0.1)] bg-[linear-gradient(135deg,#f7f3ff,#eef2ff)] text-sm font-semibold text-[var(--accent-strong)]">
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnailUrl}
                      alt={`${item.name} thumbnail`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span>#{index + 1}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[rgba(109,59,255,0.1)] px-2 py-0.5 text-[0.66rem] font-semibold text-[var(--accent-strong)]">
                      #{index + 1}
                    </span>
                    {index === 0 ? <PremiumBadge tone="warning">Trending</PremiumBadge> : null}
                    <h3 className="truncate text-[0.95rem] font-semibold text-[var(--foreground)]">
                      {item.name}
                    </h3>
                  </div>
                  <p className="text-clamp-2 mt-1 text-sm leading-5 text-[var(--muted-strong)]">
                    {item.tagline}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    <span>{item.votesCount} voti</span>
                    <span>{item.commentsCount} commenti</span>
                  </div>
                </div>

                <PremiumLink
                  href={item.productHuntUrl}
                  external
                  tone="secondary"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  Vedi
                </PremiumLink>
              </motion.article>
            ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="rounded-[24px] border border-[rgba(83,63,170,0.1)] bg-[rgba(246,244,255,0.74)] px-4 py-8 text-center">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              {activeTab.label}
            </p>
            <h3 className="mt-3 text-[1.25rem] leading-tight text-[var(--foreground)]">
              {activePayload?.message ??
                "Product Hunt ranking non configurato. Aggiungi PRODUCTHUNT_TOKEN."}
            </h3>
            <p className="mx-auto mt-3 max-w-[26rem] text-sm leading-6 text-[var(--muted-strong)]">
              La classifica viene caricata dal server, con cache e token protetto. Appena
              configuri la variabile, questa sezione mostra i 5 lanci pi&ugrave; votati.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
