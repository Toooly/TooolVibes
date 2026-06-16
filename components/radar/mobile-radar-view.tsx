"use client";

import { useState, useEffect, useRef, useMemo, useCallback, type CSSProperties, type MouseEvent } from "react";
import { motion } from "motion/react";
import { TrendingUp, Zap } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { claimHiddenSignal } from "@/lib/gamification/actions";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

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
  status: "ok" | "missing-token" | "error";
  range: ProductHuntRange;
  updatedAt: string;
  items: ProductHuntItem[];
  message?: string;
};

const RADAR_NODE_COUNT = 5;
const RADAR_NODE_LAYOUT = [
  { angle: -0.2, radiusRatio: 0.54 },
  { angle: 1.08, radiusRatio: 0.7 },
  { angle: 2.48, radiusRatio: 0.74 },
  { angle: 3.8, radiusRatio: 0.68 },
  { angle: 5.27, radiusRatio: 0.76 },
];

const fallbackRadarItems: ProductHuntItem[] = Array.from(
  { length: RADAR_NODE_COUNT },
  (_, index) => ({
    id: `radar-placeholder-${index + 1}`,
    name: `Tool radar ${index + 1}`,
    tagline: "Segnale in acquisizione",
    votesCount: 0,
    commentsCount: 0,
    productHuntUrl: "#",
  }),
);

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: string): number {
  return hashString(seed) / 4294967296;
}

const HIDDEN_SIGNAL_STORAGE_KEY = "tv:hidden-signal";

function hexToRgba(hex: string, alpha: number): string {
  const sanitized = hex.replace("#", "");
  if (sanitized.length === 3) {
    const [r, g, b] = sanitized.split("").map((c) => parseInt(c + c, 16));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ═══════════════════════════════════════════════════════════════
   MobileRadarView — root
   ═══════════════════════════════════════════════════════════════ */

export function MobileRadarView() {
  const activeRange: ProductHuntRange = "day";
  const [payloads, setPayloads] = useState<
    Partial<Record<ProductHuntRange, ProductHuntPayload>>
  >({});
  const [, setLoadingRange] = useState<ProductHuntRange | null>(null);

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchRange(activeRange);
  }, [activeRange, fetchRange]);

  useEffect(() => {
    const onVis = () => {
      if (!document.hidden) {
        fetchRange("day");
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [fetchRange]);

  /* ── Overlay state for floating layer ── */
  const currentPayload = payloads[activeRange];
  const currentItems = useMemo(
    () => currentPayload?.items ?? [],
    [currentPayload?.items],
  );

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [hiddenDiscovered, setHiddenDiscovered] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHiddenDiscovered(localStorage.getItem(`${HIDDEN_SIGNAL_STORAGE_KEY}:${today}`) === "1");
  }, [today]);

  const handleHiddenNodeClick = useCallback(
    async (node: { id: string; productHuntUrl: string }, event: MouseEvent<HTMLAnchorElement>) => {
      if (hiddenDiscovered) return;

      event.preventDefault();

      const candidateSlugs = currentItems.slice(0, RADAR_NODE_COUNT).map((item) => item.id);

      try {
        await claimHiddenSignal(today, node.id, candidateSlugs);
        localStorage.setItem(`${HIDDEN_SIGNAL_STORAGE_KEY}:${today}`, "1");
        setHiddenDiscovered(true);
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 },
          disableForReducedMotion: true,
        });
        toast.success("Segnale nascosto!", { description: "+25 XP" });
      } catch (error) {
        toast.error("Segnale non registrato", {
          description: error instanceof Error ? error.message : "Riprova più tardi.",
        });
      }

      window.open(node.productHuntUrl, "_blank", "noopener,noreferrer");
    },
    [hiddenDiscovered, today, currentItems],
  );

  const reducedMotion = useReducedMotion();

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

    const rootStyles = getComputedStyle(document.documentElement);
    const brandPrimary =
      rootStyles.getPropertyValue("--tv-brand-primary").trim() || "#7C5CFF";
    const brandSecondary =
      rootStyles.getPropertyValue("--tv-brand-secondary").trim() || "#4DB7FF";
    const warning =
      rootStyles.getPropertyValue("--tv-warning").trim() || "#FFB648";
    const bg = rootStyles.getPropertyValue("--tv-bg").trim() || "#07111F";

    const drawFrame = (t: number) => {
      const w = canvas.width / Math.min(window.devicePixelRatio, 2);
      const h = canvas.height / Math.min(window.devicePixelRatio, 2);
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(w, h) * 0.46;

      ctx.clearRect(0, 0, w, h);

      // Design-system background
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Rings
      const ringColors = [
        hexToRgba(brandPrimary, 0.28),
        hexToRgba(brandSecondary, 0.22),
        hexToRgba(warning, 0.16),
      ];
      [0.28, 0.52, 0.78].forEach((ratio, i) => {
        const r = maxR * ratio;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = ringColors[i];
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // Pulsing core
      const pulse = Math.sin(t * 3) * 0.3 + 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 8 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.fill();

      // Core ring
      ctx.beginPath();
      ctx.arc(cx, cy, 16 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba(brandPrimary, 0.4 * pulse);
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Echo ring
      const echoPulse = Math.sin(t * 3 - 0.8) * 0.3 + 1;
      if (echoPulse > 0.9) {
        ctx.beginPath();
        ctx.arc(cx, cy, 28 * echoPulse, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(brandSecondary, 0.25 * echoPulse);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    if (reducedMotion) {
      drawFrame(0);
      return () => {
        ro.disconnect();
      };
    }

    const render = () => {
      if (paused) return;
      raf = requestAnimationFrame(render);
      time += 0.016;
      drawFrame(time);
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
  }, [reducedMotion]);

  /* ── Node positions ── */
  const nodes = useMemo(() => {
    const visibleItems = currentItems.slice(0, RADAR_NODE_COUNT);
    const items =
      visibleItems.length >= RADAR_NODE_COUNT
        ? visibleItems
        : [
            ...visibleItems,
            ...fallbackRadarItems.slice(visibleItems.length, RADAR_NODE_COUNT),
          ];
    const voteCounts = visibleItems.map((item) => item.votesCount);
    const minVotes = voteCounts.length ? Math.min(...voteCounts) : 0;
    const maxVotes = voteCounts.length ? Math.max(...voteCounts) : 1;
    const voteRange = Math.max(1, maxVotes - minVotes);

    return items.map((item, index) => {
      const layout = RADAR_NODE_LAYOUT[index] ?? {
        angle: (index / RADAR_NODE_COUNT) * Math.PI * 2,
        radiusRatio: 0.68,
      };
      const voteScore = item.votesCount
        ? (item.votesCount - minVotes) / voteRange
        : 0;
      const isPlaceholder = item.id.startsWith("radar-placeholder-");
      const radiusRatio = isPlaceholder
        ? layout.radiusRatio
        : 0.38 + (1 - voteScore) * 0.42;
      const x = Math.cos(layout.angle) * radiusRatio * 46;
      const y = Math.sin(layout.angle) * radiusRatio * 46;
      const size = item.votesCount
        ? 43 + 9 * voteScore
        : 42;

      return {
        ...item,
        angle: layout.angle,
        radiusRatio,
        x,
        y,
        size: Math.min(size, 52),
        isPlaceholder,
      };
    });
  }, [currentItems]);

  const hiddenNodeId = useMemo(() => {
    const realNodes = nodes.filter((node) => !node.isPlaceholder);
    if (realNodes.length === 0) return null;
    const index = Math.floor(seededRandom(today) * realNodes.length);
    return realNodes[index]?.id ?? null;
  }, [nodes, today]);

  type RadarTab = "rank" | "segnali" | "trend";
  const [activeTab, setActiveTab] = useState<RadarTab>("rank");

  return (
    <div className="radar-page">
      <header className="radar-header">
        <span className="radar-header__meta">Dati Product Hunt</span>
        <h1>Radar</h1>
      </header>

      <nav className="radar-segmented" aria-label="Vista radar">
        {/* TODO: collegare filtri Rank/Segnali/Trend */}
        {(
          [
            { id: "rank", label: "Rank" },
            { id: "segnali", label: "Segnali" },
            { id: "trend", label: "Trend" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={activeTab === tab.id}
            className={cn(
              "radar-segmented__item",
              activeTab === tab.id && "is-active",
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <MobileRadarSections items={currentItems} />

      <section className="radar-mini-chart" aria-hidden="true">
        <canvas ref={canvasRef} className="mobile-radar-view__canvas" />
        {/* Real data nodes overlaid */}
        {nodes.map((node) => {
          const style = {
            "--node-angle": `${node.angle}rad`,
            "--node-x": `${node.x}%`,
            "--node-y": `${node.y}%`,
            "--node-size": `${node.size}px`,
          } as CSSProperties;
          const isHot = node.votesCount > 100 && !node.isPlaceholder;
          const isHidden = node.id === hiddenNodeId && !hiddenDiscovered;
          const nodeClassName = `mobile-radar-view__node${isHot ? " is-hot" : ""}${node.isPlaceholder ? " is-placeholder" : ""}${isHidden ? " is-hidden" : ""}`;
          const nodeContent = (
            <>
              <span className="mobile-radar-view__node-halo" />
              {isHidden && (
                <span
                  className={cn(
                    "pointer-events-none absolute inset-[-0.55rem] z-0 rounded-full border-2 border-dashed border-emerald-400/70 shadow-[0_0_18px_rgba(52,211,153,0.45)]",
                    !reducedMotion && "radar-hidden-signal",
                  )}
                  aria-hidden="true"
                />
              )}
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
                <small>
                  {node.isPlaceholder ? "in attesa" : `${node.votesCount} voti`}
                </small>
              </span>
              {isHot && <span className="mobile-radar-view__node-badge">HOT</span>}
            </>
          );

          if (node.isPlaceholder) {
            return (
              <span
                key={node.id}
                className={nodeClassName}
                style={style}
                aria-hidden="true"
              >
                {nodeContent}
              </span>
            );
          }

          return (
            <a
              key={node.id}
              href={node.productHuntUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={nodeClassName}
              style={style}
              aria-label={`${node.name}. ${node.votesCount} voti, ${node.commentsCount} commenti`}
              onClick={isHidden ? (event) => handleHiddenNodeClick(node, event) : undefined}
            >
              {nodeContent}
            </a>
          );
        })}
      </section>
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
