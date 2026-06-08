"use client";

import { useState, useEffect, useRef, useMemo, useCallback, type CSSProperties } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ChevronUp,
  ExternalLink,
  Activity,
  MessageCircle,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

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
  status: "ok" | "error";
  range: ProductHuntRange;
  updatedAt: string;
  items: ProductHuntItem[];
  message?: string;
};

const tabs: { key: ProductHuntRange; label: string; color: string }[] = [
  { key: "day", label: "Oggi", color: "#6a3cff" },
  { key: "week", label: "Settimana", color: "#39d2f6" },
  { key: "month", label: "Mese", color: "#f3bf4c" },
];

/* ═══════════════════════════════════════════════════════════════
   MobileRadarView — root
   ═══════════════════════════════════════════════════════════════ */

export function MobileRadarView() {
  const [activeRange, setActiveRange] = useState<ProductHuntRange>("day");
  const [payloads, setPayloads] = useState<
    Partial<Record<ProductHuntRange, ProductHuntPayload>>
  >({});
  const [loadingRange, setLoadingRange] = useState<ProductHuntRange | null>(null);
  const [showList, setShowList] = useState(false);

  /* ── Fetch data ── */
  const fetchRange = useCallback(async (range: ProductHuntRange) => {
    if (payloads[range]) return;
    setLoadingRange(range);
    try {
      const res = await fetch(`/api/product-hunt?range=${range}`);
      if (!res.ok) throw new Error("fail");
      const data = (await res.json()) as ProductHuntPayload;
      setPayloads((p) => ({ ...p, [range]: data }));
    } catch {
      setPayloads((p) => ({
        ...p,
        [range]: {
          status: "error",
          range,
          updatedAt: new Date().toISOString(),
          items: [],
          message: "Dati non disponibili",
        },
      }));
    } finally {
      setLoadingRange(null);
    }
  }, [payloads]);

  useEffect(() => {
    fetchRange("day");
    fetchRange("week");
    fetchRange("month");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchRange(activeRange);
  }, [activeRange, fetchRange]);

  useEffect(() => {
    const onVis = () => {
      if (!document.hidden) {
        fetchRange("day");
        fetchRange("week");
        fetchRange("month");
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [fetchRange]);

  /* ── Overlay state for floating layer ── */
  const setOverlayOpen = useMobileUIStore((s) => s.setOverlayOpen);
  useEffect(() => {
    setOverlayOpen(showList);
    return () => setOverlayOpen(false);
  }, [showList, setOverlayOpen]);

  const currentPayload = payloads[activeRange];
  const currentItems = currentPayload?.items ?? [];

  /* ── Canvas animation ── */
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let paused = false;
    let time = 0;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = rect ? rect.width : 320;
      const h = rect ? rect.height : 320;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const render = () => {
      if (paused) return;
      raf = requestAnimationFrame(render);
      time += 0.016;

      const w = canvas.width / Math.min(window.devicePixelRatio, 2);
      const h = canvas.height / Math.min(window.devicePixelRatio, 2);
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(w, h) * 0.46;

      ctx.clearRect(0, 0, w, h);

      // Dark bg
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, w, h);

      // Rings
      const ringColors = [
        "rgba(106, 60, 255, 0.28)",
        "rgba(57, 210, 246, 0.22)",
        "rgba(243, 191, 76, 0.16)",
      ];
      [0.28, 0.52, 0.78].forEach((ratio, i) => {
        const r = maxR * ratio;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = ringColors[i];
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // Grid cross
      ctx.strokeStyle = "rgba(106, 60, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - maxR, cy);
      ctx.lineTo(cx + maxR, cy);
      ctx.moveTo(cx, cy - maxR);
      ctx.lineTo(cx, cy + maxR);
      ctx.stroke();

      // Fast sweep
      const sweepAngle = time * 2.2;
      const sweepLen = maxR * 1.05;
      const sx = cx + Math.cos(sweepAngle) * sweepLen;
      const sy = cy + Math.sin(sweepAngle) * sweepLen;

      const grad = ctx.createLinearGradient(cx, cy, sx, sy);
      grad.addColorStop(0, "rgba(106, 60, 255, 0.55)");
      grad.addColorStop(0.5, "rgba(57, 210, 246, 0.35)");
      grad.addColorStop(1, "rgba(106, 60, 255, 0)");
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Pulsing core
      const pulse = Math.sin(time * 3) * 0.3 + 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 8 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.fill();

      // Core ring
      ctx.beginPath();
      ctx.arc(cx, cy, 16 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(106, 60, 255, ${0.4 * pulse})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Echo ring
      const echoPulse = Math.sin(time * 3 - 0.8) * 0.3 + 1;
      if (echoPulse > 0.9) {
        ctx.beginPath();
        ctx.arc(cx, cy, 28 * echoPulse, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(57, 210, 246, ${0.25 * echoPulse})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    raf = requestAnimationFrame(render);

    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasPaused = paused;
        paused = !entry.isIntersecting;
        if (wasPaused && !paused) {
          raf = requestAnimationFrame(render);
        }
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    return () => {
      paused = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      observer.disconnect();
    };
  }, []);

  /* ── Node positions ── */
  const nodes = useMemo(() => {
    if (!currentItems.length) return [];
    const maxVotes = Math.max(...currentItems.map((i) => i.votesCount), 1);
    const maxComments = Math.max(...currentItems.map((i) => i.commentsCount), 1);
    return currentItems.slice(0, 5).map((item, index) => {
      const angle = (index / 5) * Math.PI * 2;
      // More votes = closer to center (strong signal) — keep a generous minimum radius so nodes never overlap
      const radiusRatio = 0.42 + 0.38 * (1 - item.votesCount / maxVotes);
      const size = 48 + 16 * (item.commentsCount / maxComments);
      return { ...item, angle, radiusRatio, size: Math.min(size, 52) };
    });
  }, [currentItems]);

  const activeTab = tabs.find((t) => t.key === activeRange) ?? tabs[0];

  return (
    <div className="mobile-radar-view relative min-h-screen overflow-hidden bg-[#0a0a1a]">
      {/* Header */}
      <div className="mobile-radar-view__header">
        <span className="mobile-radar-view__live">
          <span className="mobile-radar-view__live-dot" />
          LIVE
        </span>
        <h1>Radar Product Hunt</h1>
        <p>I segnali più forti del momento</p>
      </div>

      {/* Radar Stage */}
      <div className="mobile-radar-view__stage">
        <canvas ref={canvasRef} className="mobile-radar-view__canvas" />

        {/* Real data nodes overlaid */}
        {nodes.map((node) => {
          const style = {
            "--node-angle": `${node.angle}rad`,
            "--node-radius": `${node.radiusRatio * 100}%`,
            "--node-size": `${node.size}px`,
          } as CSSProperties;
          const isHot = node.votesCount > 100;
          return (
            <a
              key={node.id}
              href={node.productHuntUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`mobile-radar-view__node${isHot ? " is-hot" : ""}`}
              style={style}
              aria-label={`${node.name}. ${node.votesCount} voti, ${node.commentsCount} commenti`}
            >
              <span className="mobile-radar-view__node-halo" />
              <span className="mobile-radar-view__node-body">
                {node.thumbnailUrl ? (
                  <img
                    src={node.thumbnailUrl}
                    alt=""
                    loading="lazy"
                    className="mobile-radar-view__node-img"
                  />
                ) : (
                  <span className="mobile-radar-view__node-initials">
                    {node.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </span>
              <span className="mobile-radar-view__node-label">
                <strong>{node.name}</strong>
                <small>{node.votesCount} voti</small>
              </span>
              {isHot && <span className="mobile-radar-view__node-badge">HOT</span>}
            </a>
          );
        })}

        {/* Center badge */}
        <div className="mobile-radar-view__center-info">
          <span>{activeTab.label}</span>
          <strong>{currentItems.length}</strong>
        </div>
      </div>

      {/* Legend */}
      <div className="mobile-radar-view__legend">
        {[
          { icon: Activity, label: "Rank" },
          { icon: MessageCircle, label: "Segnali" },
          { icon: TrendingUp, label: "Trend" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <span key={item.label} className="mobile-radar-view__legend-item">
              <Icon size={12} aria-hidden="true" />
              {item.label}
            </span>
          );
        })}
      </div>

      {/* Content sections */}
      <MobileRadarSections items={currentItems} />

      {/* Open list button */}
      <button
        type="button"
        onClick={() => setShowList(true)}
        className="mobile-radar-view__open-list z-[44]"
        aria-label="Vedi classifica"
      >
        <ChevronUp size={16} />
        <span>Vedi classifica completa</span>
      </button>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {showList && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="mobile-radar-view__sheet z-[55]"
          >
            {/* Sheet header */}
            <div className="mobile-radar-view__sheet-header">
              <span className="mobile-radar-view__sheet-handle" />
              <button
                type="button"
                onClick={() => setShowList(false)}
                className="mobile-radar-view__sheet-close"
                aria-label="Chiudi"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="mobile-radar-view__sheet-tabs" role="tablist">
              {tabs.map((tab) => {
                const isActive = activeRange === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveRange(tab.key)}
                    className={`mobile-radar-view__sheet-tab${isActive ? " is-active" : ""}`}
                    style={{ "--tab-color": tab.color } as CSSProperties}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* List */}
            <div className="mobile-radar-view__sheet-body">
              {!currentPayload || (loadingRange === activeRange && !currentPayload) ? (
                <MobileRadarSkeleton />
              ) : currentPayload.status === "error" || currentItems.length === 0 ? (
                <div className="mobile-radar-view__sheet-empty">
                  <p>{currentPayload.message ?? "Nessun dato disponibile"}</p>
                </div>
              ) : (
                <div className="mobile-radar-view__sheet-list">
                  {currentItems.map((item, index) => (
                    <MobileRadarListItem
                      key={item.id}
                      item={item}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MobileRadarSections — trending & hot content below canvas
   ═══════════════════════════════════════════════════════════════ */

function MobileRadarSections({ items }: { items: ProductHuntItem[] }) {
  if (!items.length) return null;

  const trending = [...items].sort((a, b) => b.votesCount - a.votesCount).slice(0, 3);
  const hot = items.filter((i) => i.votesCount > 50).slice(0, 3);
  const watchlist = items.slice(0, 5);

  return (
    <div className="mobile-radar-sections">
      {trending.length > 0 && (
        <section className="mobile-radar-section">
          <h2>
            <TrendingUp size={14} />
            Trending ora
          </h2>
          <div className="mobile-radar-section__scroll">
            {trending.map((item) => (
              <a
                key={item.id}
                href={item.productHuntUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-radar-section__card"
              >
                <div className="mobile-radar-section__card-visual">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt="" loading="lazy" />
                  ) : (
                    <span>{item.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="mobile-radar-section__card-meta">
                  <strong>{item.name}</strong>
                  <span>{item.votesCount} voti</span>
                </div>
                {item.votesCount > 100 && (
                  <span className="mobile-radar-section__card-badge">HOT</span>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {hot.length > 0 && (
        <section className="mobile-radar-section">
          <h2>
            <Zap size={14} />
            Da tenere d&apos;occhio
          </h2>
          <div className="mobile-radar-section__list">
            {watchlist.map((item, index) => (
              <motion.a
                key={item.id}
                href={item.productHuntUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-radar-section__row"
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="mobile-radar-section__row-rank">#{index + 1}</span>
                <div className="mobile-radar-section__row-visual">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt="" loading="lazy" />
                  ) : (
                    <span>{item.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="mobile-radar-section__row-meta">
                  <strong>{item.name}</strong>
                  <span>{item.tagline}</span>
                </div>
                <span className="mobile-radar-section__row-votes">{item.votesCount} ↑</span>
              </motion.a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MobileRadarListItem
   ═══════════════════════════════════════════════════════════════ */

function MobileRadarListItem({
  item,
  index,
}: {
  item: ProductHuntItem;
  index: number;
}) {
  return (
    <motion.a
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.2) }}
      href={item.productHuntUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mobile-radar-list-item"
    >
      <span className="mobile-radar-list-item__rank">#{index + 1}</span>
      <div className="mobile-radar-list-item__visual">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt="" loading="lazy" />
        ) : (
          <span>{item.name.slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <div className="mobile-radar-list-item__meta">
        <strong>{item.name}</strong>
        <span>{item.tagline}</span>
        <small>
          {item.votesCount} voti · {item.commentsCount} commenti
        </small>
      </div>
      <ExternalLink size={14} className="mobile-radar-list-item__icon" />
    </motion.a>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MobileRadarSkeleton
   ═══════════════════════════════════════════════════════════════ */

function MobileRadarSkeleton() {
  return (
    <div className="mobile-radar-view__sheet-list">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="mobile-radar-list-item is-skeleton">
          <span className="mobile-radar-list-item__rank">#</span>
          <div className="mobile-radar-list-item__visual" />
          <div className="mobile-radar-list-item__meta">
            <div />
            <div />
          </div>
        </div>
      ))}
    </div>
  );
}
