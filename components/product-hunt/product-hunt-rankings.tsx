"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Sparkles, ExternalLink } from "lucide-react";

import { PremiumBadge } from "@/components/ui/premium";
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
          className="v-ph-skeleton-card flex items-center gap-3"
        >
          <div className="h-10 w-10 rounded-2xl bg-white/5" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/5 rounded-full bg-white/8" />
            <div className="h-3 w-4/5 rounded-full bg-white/5" />
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

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function openRankingHref(href: string) {
  if (isExternalHref(href)) {
    window.open(href, "_blank", "noopener,noreferrer");
    return;
  }

  window.location.assign(href);
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
  const [loadingRange, setLoadingRange] = useState<ProductHuntRange | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || shouldLoad) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "360px 0px" },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [shouldLoad]);

  useEffect(() => {
    let isMounted = true;

    if (!shouldLoad || payloads[activeRange]) {
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
  }, [activeRange, payloads, shouldLoad]);

  useEffect(() => {
    setExpandedItemId(null);
  }, [activeRange]);

  const activePayload = payloads[activeRange];
  const activeTab = useMemo(
    () => tabs.find((tab) => tab.key === activeRange) ?? tabs[0],
    [activeRange],
  );

  return (
    <section
      ref={sectionRef}
      id="product-hunt"
      className={cn(
        "v-ph-section rounded-[2rem] p-5 text-white sm:p-6",
        variant === "wide" && "p-6 sm:p-8",
        className,
      )}
      aria-labelledby="product-hunt-title"
      aria-busy={shouldLoad && loadingRange === activeRange && !activePayload}
    >
      {/* Header */}
      <div className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        variant === "wide" && "lg:items-end",
      )}>
        <div className={variant === "wide" ? "max-w-[44rem]" : undefined}>
          <PremiumBadge tone="accent">Product Hunt</PremiumBadge>
          <h2
            id="product-hunt-title"
            className={cn(
              "mt-3 text-[1.35rem] font-bold leading-tight text-[var(--foreground)] sm:text-[1.5rem]",
              variant === "wide" && "text-[2rem] sm:text-[2.65rem]",
            )}
          >
            Migliori tool su Product Hunt
          </h2>
          {variant === "wide" ? (
            <p className="mt-3 max-w-[42rem] text-[0.95rem] leading-7 text-[var(--muted-strong)]">
              Un radar esterno per intercettare i lanci pi&ugrave; votati. Se i dati non sono
              disponibili, la sezione resta leggibile e ti avvisa senza mostrare risultati finti.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1 sm:items-end">
          <a
            href="https://www.producthunt.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--v-text-muted)] transition-colors duration-200 hover:text-[var(--v-text)]"
          >
            Dati da Product Hunt
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
          <p className="text-xs text-[var(--v-text-dim)]">
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

      {/* Tabs */}
      <div
        className="v-ph-tabs mt-5"
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
              data-sonic-action="tab"
              onClick={() => setActiveRange(tab.key)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 460, damping: 34, mass: 0.72 }}
              className={cn("v-ph-tab", isActive && "v-ph-tab--active")}
            >
              <span className="relative z-10">{tab.shortLabel}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Content */}
      <div className={cn("mt-5 min-h-[12rem] sm:min-h-[21rem]", variant === "wide" && "lg:min-h-0")}>
        {!shouldLoad && !activePayload ? (
          <ProductHuntSkeleton />
        ) : shouldLoad && loadingRange === activeRange && !activePayload ? (
          <ProductHuntSkeleton />
        ) : activePayload?.status === "ok" && activePayload.items.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRange}
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
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
                whileHover={{ y: -4, scale: 1.008 }}
                whileTap={{ scale: 0.992 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.035, 0.16) }}
                role="link"
                tabIndex={0}
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest("a, button")) {
                    return;
                  }

                  openRankingHref(item.productHuntUrl);
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") {
                    return;
                  }

                  event.preventDefault();
                  openRankingHref(item.productHuntUrl);
                }}
                className={cn(
                  "v-ph-card group flex flex-col items-start gap-3 sm:flex-row sm:items-center",
                  variant === "wide" && "sm:min-h-[12.5rem] sm:flex-col sm:items-start",
                  variant === "wide" && index > 0 && "hidden sm:flex",
                )}
              >
                {/* Glow effect */}
                <div className="v-ph-card-glow" aria-hidden="true" />

                {/* Visual */}
                <div className="v-ph-visual">
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnailUrl}
                      alt={`Anteprima di ${item.name}`}
                      loading="lazy"
                    />
                  ) : (
                    <span>#{index + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className={cn("v-ph-rank", index === 0 && "v-ph-rank--lead")}>
                      #{index + 1}
                    </span>
                    {index === 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--v-amber)]/20 bg-[var(--v-amber)]/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--v-amber)]">
                        <Sparkles className="size-3" aria-hidden="true" />
                        In crescita
                      </span>
                    ) : null}
                    <h3 className="v-ph-name min-w-0 truncate">
                      {item.name}
                    </h3>
                  </div>
                  <p className="v-ph-tagline mt-1 line-clamp-2">
                    {item.tagline}
                  </p>
                  <div className="v-ph-metrics mt-2">
                    {formatMetrics(item)}
                  </div>
                  {variant === "wide" ? (
                    <div className="v-ph-signal-meter" aria-hidden="true">
                      <span style={{ "--signal-strength": `${Math.min(100, Math.max(18, item.votesCount || 18))}%` } as CSSProperties} />
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="v-ph-expand-btn mt-3"
                    aria-expanded={expandedItemId === item.id}
                    data-sonic-action={expandedItemId === item.id ? "collapse" : "expand"}
                    onClick={() =>
                      setExpandedItemId((current) => (current === item.id ? null : item.id))
                    }
                  >
                    Segnali
                    <ChevronDown
                      className={cn(
                        "size-3.5 transition-transform duration-200",
                        expandedItemId === item.id && "rotate-180",
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {expandedItemId === item.id ? (
                      <motion.div
                        className="v-ph-popover mt-3 w-full p-3"
                        initial={{ opacity: 0, height: 0, y: -4 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -4 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="grid size-8 shrink-0 place-items-center rounded-[14px] bg-[rgba(106,60,255,0.1)] text-[var(--v-purple-soft)]">
                            <Sparkles className="size-3.5" aria-hidden="true" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-[var(--v-text)]">
                              Perché guardarlo
                            </p>
                            <p className="mt-1 text-xs leading-5 text-[var(--v-text-muted)]">
                              {item.votesCount > 0
                                ? `${item.votesCount} voti danno un segnale di interesse reale.`
                                : "Segnale ancora in verifica: apri il lancio per leggere la pagina."}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="rounded-[14px] border border-[var(--v-glass-border)] bg-[rgba(10,10,24,0.6)] px-3 py-2">
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[var(--v-text-muted)]">
                              Voti
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[var(--v-text)]">
                              {item.votesCount || "In verifica"}
                            </p>
                          </div>
                          <div className="rounded-[14px] border border-[var(--v-glass-border)] bg-[rgba(10,10,24,0.6)] px-3 py-2">
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[var(--v-text-muted)]">
                              Commenti
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[var(--v-text)]">
                              {item.commentsCount || "In verifica"}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                {/* Link */}
                <a
                  href={item.productHuntUrl}
                  target={isExternalHref(item.productHuntUrl) ? "_blank" : undefined}
                  rel={isExternalHref(item.productHuntUrl) ? "noopener noreferrer" : undefined}
                  className="v-ph-link mt-3 self-start sm:mt-auto"
                >
                  Apri lancio
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              </motion.article>
            ))}
            {variant === "wide" && activePayload.items.length > 1 ? (
              <details className="v-ph-accordion col-span-full px-4 py-3 sm:hidden">
                <summary className="text-sm font-semibold text-[var(--v-text)] cursor-pointer">Altri tool Product Hunt</summary>
                <div className="mt-3 grid gap-2">
                  {activePayload.items.slice(1).map((item, index) => (
                    <a
                      key={item.id}
                      href={item.productHuntUrl}
                      target={isExternalHref(item.productHuntUrl) ? "_blank" : undefined}
                      rel={isExternalHref(item.productHuntUrl) ? "noopener noreferrer" : undefined}
                      className="flex items-center justify-between gap-3 rounded-[1rem] border border-[rgba(124,77,255,0.1)] bg-[rgba(26,26,51,0.6)] px-3 py-2.5 transition hover:border-[rgba(124,77,255,0.2)] hover:bg-[rgba(26,26,51,0.8)] active:scale-[0.99]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[var(--v-text)]">
                          #{index + 2} {item.name}
                        </span>
                        <span className="block truncate text-xs text-[var(--v-text-muted)]">
                          {formatMetrics(item)}
                        </span>
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--v-text-dim)]">
                        Apri
                      </span>
                    </a>
                  ))}
                </div>
              </details>
            ) : null}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="v-ph-empty rounded-[1.5rem] px-4 py-8 text-center">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--v-purple-soft)]">
              {activeTab.label}
            </p>
            <h3 className="mt-3 text-[1.25rem] leading-tight font-bold text-[var(--v-text)]">
              {activePayload?.message ??
                "Classifica Product Hunt non disponibile in questo momento."}
            </h3>
            <p className="mx-auto mt-3 max-w-[26rem] text-sm leading-6 text-[var(--v-text-muted)]">
              Appena i dati tornano disponibili, questa sezione mostra i 5 lanci pi&ugrave;
              votati senza riempire la pagina con informazioni inventate.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
