"use client";

import { useState, useEffect, useRef, useMemo, useCallback, type CSSProperties, type MouseEvent } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Torus, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "motion/react";
import {
  Activity,
  MessageCircle,
  TrendingUp,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { claimHiddenSignal } from "@/lib/gamification/actions";

function Radar3DOverlay() {
  const torusRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!torusRef.current) return;
    const s = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
    torusRef.current.scale.set(s, s, s);
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight color="#39d2f6" intensity={20} />
      <Torus ref={torusRef} args={[1.5, 0.02, 8, 64]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#39d2f6" transparent opacity={0.4} />
      </Torus>
      <Sphere args={[0.06]} position={[1.2, 0.6, 0]}>
        <meshBasicMaterial color="#6a3cff" />
      </Sphere>
      <Sphere args={[0.05]} position={[-1.0, -0.5, 0.2]}>
        <meshBasicMaterial color="#f3bf4c" />
      </Sphere>
      <Sphere args={[0.05]} position={[0.4, 1.1, -0.2]}>
        <meshBasicMaterial color="#39d2f6" />
      </Sphere>
    </>
  );
}

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
const RADAR_SWEEP_SPEED = 2.2;
const RADAR_SWEEP_SECONDS = (Math.PI * 2) / RADAR_SWEEP_SPEED;
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
      const normalizedAngle = (layout.angle + Math.PI * 2) % (Math.PI * 2);
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
        hitDelay: normalizedAngle / RADAR_SWEEP_SPEED,
        isPlaceholder,
      };
    });
  }, [currentItems]);
  const radarClockKey = nodes.map((node) => node.id).join("|");

  const hiddenNodeId = useMemo(() => {
    const realNodes = nodes.filter((node) => !node.isPlaceholder);
    if (realNodes.length === 0) return null;
    const index = Math.floor(seededRandom(today) * realNodes.length);
    return realNodes[index]?.id ?? null;
  }, [nodes, today]);

  return (
    <div className="mobile-radar-view relative min-h-screen overflow-hidden bg-[#0a0a1a]">
      {/* Header */}
      <div className="mobile-radar-view__header">
        <span className="mobile-radar-view__powered">
          Powered by <strong>Product Hunt</strong>
        </span>
        <h1>
          <span className="mobile-radar-view__live">
            <span className="mobile-radar-view__live-dot" />
            Live Radar
          </span>
        </h1>
        <p>Scopri i tool migliori di Product Hunt.</p>
      </div>

      {/* Radar Stage */}
      <div
        className="mobile-radar-view__stage"
        style={
          {
            "--radar-sweep-duration": `${RADAR_SWEEP_SECONDS}s`,
          } as CSSProperties
        }
      >
        <div className="pointer-events-none absolute inset-0 z-10">
          <Canvas
            dpr={[1, 1]}
            gl={{ antialias: false, alpha: true }}
            camera={{ position: [0, 0, 4], fov: 50 }}
            style={{ width: "100%", height: "100%" }}
          >
            <Radar3DOverlay />
          </Canvas>
        </div>
        <canvas ref={canvasRef} className="mobile-radar-view__canvas relative z-0" />
        <span
          key={radarClockKey}
          className="mobile-radar-view__sweep"
          aria-hidden="true"
        />
        {/* Real data nodes overlaid */}
        {nodes.map((node) => {
          const style = {
            "--node-angle": `${node.angle}rad`,
            "--node-x": `${node.x}%`,
            "--node-y": `${node.y}%`,
            "--node-size": `${node.size}px`,
            "--node-hit-delay": `${node.hitDelay}s`,
          } as CSSProperties;
          const isHot = node.votesCount > 100 && !node.isPlaceholder;
          const isHidden = node.id === hiddenNodeId && !hiddenDiscovered;
          const nodeClassName = `mobile-radar-view__node${isHot ? " is-hot" : ""}${node.isPlaceholder ? " is-placeholder" : ""}${isHidden ? " is-hidden" : ""}`;
          const nodeContent = (
            <>
              <span className="mobile-radar-view__node-halo" />
              {isHidden && (
                <span
                  className="pointer-events-none absolute inset-[-0.55rem] z-0 rounded-full border-2 border-dashed border-emerald-400/70 shadow-[0_0_18px_rgba(52,211,153,0.45)] animate-[spin_4s_linear_infinite]"
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

        {/* Center badge */}
        <div className="mobile-radar-view__center-info">
          <span>Ultima ora</span>
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
