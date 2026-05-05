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
          className="flex items-center gap-3 rounded-[20px] border border-white/12 bg-white/9 p-3"
        >
          <div className="h-10 w-10 animate-pulse rounded-2xl bg-white/10" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/5 animate-pulse rounded-full bg-white/14" />
            <div className="h-3 w-4/5 animate-pulse rounded-full bg-white/8" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatMetrics(item: ProductHuntItem) {
  const metrics = [];

  if (item.votesCount > 0) {
    metrics.push(`${item.votesCount} voti`);
  }

  if (item.commentsCount > 0) {
    metrics.push(`${item.commentsCount} commenti`);
  }

  return metrics.length > 0 ? metrics.join(" / ") : "Segnale in verifica";
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
        "premium-card motion-reveal p-4 text-white sm:p-5",
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
            Migliori tool su Product Hunt
          </h2>
          {variant === "wide" ? (
            <p className="mt-3 max-w-[42rem] text-[1rem] leading-7 text-[var(--muted-strong)]">
              Un radar esterno per intercettare i lanci pi&ugrave; votati. Se il token non &egrave;
              configurato, la sezione mostra uno stato pulito invece di rompersi.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1 sm:items-end">
          <a
            href="https://www.producthunt.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="animated-link text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-white/58 transition-colors duration-200 hover:text-white"
          >
            Powered by Product Hunt
          </a>
          <p className="text-xs text-white/46">
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
        className="mt-4 grid grid-cols-3 gap-2 rounded-[22px] border border-white/12 bg-white/9 p-1.5"
        role="tablist"
        aria-label="Periodo classifica Product Hunt"
      >
        {tabs.map((tab) => {
          const isActive = activeRange === tab.key;

          return (
            <motion.button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveRange(tab.key)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 520, damping: 32 }}
              className={cn(
                "relative overflow-hidden rounded-[18px] px-2.5 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] transition-all duration-200",
                isActive ? "text-white" : "text-white/64 hover:bg-white/8 hover:text-white",
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="product-hunt-active-tab"
                  className="absolute inset-0 rounded-[18px] bg-[linear-gradient(135deg,rgba(167,139,250,0.95),rgba(82,104,255,0.88))] shadow-[0_12px_26px_rgba(99,102,241,0.24)]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span className="relative z-10">{tab.shortLabel}</span>
            </motion.button>
          );
        })}
      </div>

      <div className={cn("mt-4 min-h-[21rem]", variant === "wide" && "lg:min-h-0")}>
        {loadingRange === activeRange && !activePayload ? (
          <ProductHuntSkeleton />
        ) : activePayload?.status === "ok" && activePayload.items.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRange}
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "space-y-3",
                variant === "wide" && "grid gap-3 space-y-0 sm:grid-cols-2 xl:grid-cols-3",
              )}
            >
            {activePayload.items.map((item, index) => (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.985 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                whileHover={{ y: -6, scale: 1.012 }}
                whileTap={{ scale: 0.992 }}
                transition={{ duration: 0.22, delay: Math.min(index * 0.035, 0.16) }}
                className={cn(
                  "group flex flex-col items-start gap-3 rounded-[20px] border border-white/12 bg-white/9 p-3 transition-all duration-200 hover:-translate-y-1 hover:border-violet-200/34 hover:bg-white/13 hover:shadow-[0_14px_34px_rgba(8,14,38,0.2)] sm:flex-row sm:items-center",
                  variant === "wide" && "sm:min-h-[12.5rem] sm:flex-col sm:items-start sm:p-4",
                )}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-white/10 text-sm font-semibold text-white">
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
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="rounded-full border border-violet-200/20 bg-violet-400/12 px-2 py-0.5 text-[0.66rem] font-semibold text-violet-100">
                      #{index + 1}
                    </span>
                    {index === 0 ? <PremiumBadge tone="warning">Trending</PremiumBadge> : null}
                    <h3 className="min-w-0 truncate text-[0.95rem] font-semibold text-white">
                      {item.name}
                    </h3>
                  </div>
                  <p className="text-clamp-2 mt-1 text-sm leading-5 text-white/64">
                    {item.tagline}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white/44">
                    <span>{formatMetrics(item)}</span>
                  </div>
                </div>

                <PremiumLink
                  href={item.productHuntUrl}
                  external
                  tone="secondary"
                  size="sm"
                  className="mt-3 self-start sm:mt-auto"
                >
                  Apri lancio
                </PremiumLink>
              </motion.article>
            ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="rounded-[24px] border border-white/12 bg-white/9 px-4 py-8 text-center">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              {activeTab.label}
            </p>
            <h3 className="mt-3 text-[1.25rem] leading-tight text-white">
              {activePayload?.message ??
                "Product Hunt ranking non configurato. Aggiungi PRODUCTHUNT_TOKEN."}
            </h3>
            <p className="mx-auto mt-3 max-w-[26rem] text-sm leading-6 text-white/62">
              La classifica viene caricata dal server, con cache e token protetto. Appena
              configuri la variabile, questa sezione mostra i 5 lanci pi&ugrave; votati.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
