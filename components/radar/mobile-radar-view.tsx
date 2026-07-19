"use client";

import { useState, useEffect, useRef, useMemo, useCallback, type CSSProperties, type MouseEvent } from "react";
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
import { useGamificationSurface } from "@/lib/gamification/release-context";
import {
  formatUtcTimeLabel,
  resolveRadarDataState,
  type ProductHuntItem,
  type ProductHuntRange,
  type RadarDataState,
} from "@/lib/radar/product-hunt-contract";
import { useProductHuntRadar } from "@/lib/radar/use-product-hunt-radar";
import { getUtcContextDate } from "@/supabase/functions/_shared/radar-prediction-resolver";

/* ═══════════════════════════════════════════════════════════════
   Types — contratto condiviso con l'adapter (B36 / FLOW-606)
   ═══════════════════════════════════════════════════════════════ */

const RADAR_NODE_COUNT = 5;
const RADAR_SWEEP_DURATION_MS = 3200;
const RADAR_SCAN_THRESHOLD = 0.18;
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
    name: "Segnale in arrivo",
    tagline: "In attesa dei dati aggiornati",
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

function normaliseAngle(angle: number): number {
  return ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
}

function angleDistance(a: number, b: number): number {
  const diff = Math.abs(normaliseAngle(a) - normaliseAngle(b));
  return Math.min(diff, Math.PI * 2 - diff);
}

const HIDDEN_SIGNAL_STORAGE_KEY = "tv:hidden-signal";

/* ═══════════════════════════════════════════════════════════════
   MobileRadarView — root
   ═══════════════════════════════════════════════════════════════ */

export function MobileRadarView() {
  const hiddenSignalRelease = useGamificationSurface("hiddenSignal");
  const activeRange: ProductHuntRange = "day";
  // Query condivisa (B44 / PERF-1202): una sola request per key su tutte le
  // rappresentazioni Radar; il fallback d'errore è il payload unico di
  // contratto B36. Cache e dedup sono del Query Client, non di stato locale.
  const { payload: currentPayload } = useProductHuntRadar(activeRange);

  /* ── Overlay state for floating layer ── */
  const currentItems = useMemo(
    () => currentPayload?.items ?? [],
    [currentPayload?.items],
  );
  const radarState: RadarDataState = resolveRadarDataState(currentPayload);
  const isStaleFallback = radarState === "ready" && currentPayload?.stale === true;
  // Provenance dichiarata: source + timestamp di origine + fallback esplicito.
  const sourceLabel =
    radarState === "ready"
      ? isStaleFallback
        ? `Ultima sincronizzazione Product Hunt: ${formatUtcTimeLabel(currentPayload?.updatedAt ?? "")}`
        : `Dati live Product Hunt, aggiornati alle ${formatUtcTimeLabel(currentPayload?.updatedAt ?? "")}`
      : radarState === "loading"
        ? "Connessione al feed Product Hunt"
        : "Feed Product Hunt non disponibile";
  const liveLabel =
    radarState === "ready"
      ? isStaleFallback
        ? "Radar (ultima sync)"
        : "Radar live"
      : radarState === "loading"
        ? "Radar in avvio"
        : "Radar in pausa";
  const placeholderNodeLabel =
    radarState === "loading"
      ? "Caricamento"
      : radarState === "empty"
        ? "Nessun segnale"
        : "Radar in pausa";
  const placeholderNodeHint =
    radarState === "loading"
      ? "aggiorno i dati"
      : radarState === "empty"
        ? "riprova più tardi"
        : "dati non disponibili";
  const centerLabel =
    radarState === "ready"
      ? isStaleFallback
        ? "Ultima sync"
        : "Ultima ora"
      : "Aggiorno";

  // Data contesto UTC condivisa con il resolver server (timezone-independent).
  const today = useMemo(() => getUtcContextDate(new Date()), []);
  const [hiddenDiscovered, setHiddenDiscovered] = useState(false);
  const [scanAngle, setScanAngle] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHiddenDiscovered(localStorage.getItem(`${HIDDEN_SIGNAL_STORAGE_KEY}:${today}`) === "1");
  }, [today]);

  useEffect(() => {
    let raf = 0;
    let lastUpdate = 0;
    const start = performance.now();

    const tick = (now: number) => {
      if (now - lastUpdate > 48) {
        lastUpdate = now;
        const progress = ((now - start) % RADAR_SWEEP_DURATION_MS) / RADAR_SWEEP_DURATION_MS;
        setScanAngle(progress * Math.PI * 2);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

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
    let running = false;

    let lastFrameTime = 0;
    const FRAME_INTERVAL = 1000 / 30; // ~30 fps on mobile


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

    const render = (now: number) => {
      if (paused) {
        running = false;
        return;
      }

      // Throttle to ~30 fps to keep mobile canvas light
      if (now - lastFrameTime < FRAME_INTERVAL) {
        raf = requestAnimationFrame(render);
        return;
      }
      lastFrameTime = now;

      raf = requestAnimationFrame(render);
      time += 0.016;

      const w = canvas.width / Math.min(window.devicePixelRatio, 2);
      const h = canvas.height / Math.min(window.devicePixelRatio, 2);
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(w, h) * 0.46;

      ctx.clearRect(0, 0, w, h);

      // Deep void background
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 1.2);
      bgGrad.addColorStop(0, "#0d0d18");
      bgGrad.addColorStop(0.7, "#090914");
      bgGrad.addColorStop(1, "#06060E");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Outer rim glow
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 229, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Concentric rings with depth colors
      const ringColors = [
        "rgba(106, 60, 255, 0.22)",
        "rgba(57, 210, 246, 0.18)",
        "rgba(243, 191, 76, 0.14)",
        "rgba(124, 77, 255, 0.1)",
      ];
      [0.22, 0.45, 0.68, 0.88].forEach((ratio, i) => {
        const r = maxR * ratio;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = ringColors[i];
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // Cross grid lines
      ctx.strokeStyle = "rgba(106, 60, 255, 0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - maxR, cy);
      ctx.lineTo(cx + maxR, cy);
      ctx.moveTo(cx, cy - maxR);
      ctx.lineTo(cx, cy + maxR);
      ctx.stroke();

      // Sweep angle
      const sweepAngle = time * 1.96;
      const sweepLen = maxR * 1.05;
      const sx = cx + Math.cos(sweepAngle) * sweepLen;
      const sy = cy + Math.sin(sweepAngle) * sweepLen;

      // Main sweep glow
      const grad = ctx.createLinearGradient(cx, cy, sx, sy);
      grad.addColorStop(0, "rgba(0, 229, 255, 0.55)");
      grad.addColorStop(0.4, "rgba(57, 210, 246, 0.3)");
      grad.addColorStop(0.8, "rgba(124, 77, 255, 0.1)");
      grad.addColorStop(1, "rgba(124, 77, 255, 0)");
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Sweep echo trail
      const echoAngle = sweepAngle + 0.4;
      const ex = cx + Math.cos(echoAngle) * sweepLen * 0.85;
      const ey = cy + Math.sin(echoAngle) * sweepLen * 0.85;
      const echoGrad = ctx.createLinearGradient(cx, cy, ex, ey);
      echoGrad.addColorStop(0, "rgba(57, 210, 246, 0.25)");
      echoGrad.addColorStop(1, "rgba(57, 210, 246, 0)");
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = echoGrad;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Pulsing core with layered rings
      const pulse = Math.sin(time * 2.5) * 0.3 + 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 7 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 14 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 229, 255, ${0.45 * pulse})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 22 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(124, 77, 255, ${0.25 * pulse})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Echo ring from center
      const echoPulse = Math.sin(time * 2.5 - 0.8) * 0.3 + 1;
      if (echoPulse > 0.9) {
        ctx.beginPath();
        ctx.arc(cx, cy, 32 * echoPulse, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(57, 210, 246, ${0.2 * echoPulse})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const start = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(render);
      }
    };

    start();

    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasPaused = paused;
        paused = !entry.isIntersecting;
        if (wasPaused && !paused) {
          start();
        }
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    return () => {
      paused = true;
      running = false;
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
    if (!hiddenSignalRelease.persistentRewardsEnabled) return null;
    const realNodes = nodes.filter((node) => !node.isPlaceholder);
    if (realNodes.length === 0) return null;
    const index = Math.floor(seededRandom(today) * realNodes.length);
    return realNodes[index]?.id ?? null;
  }, [hiddenSignalRelease.persistentRewardsEnabled, nodes, today]);

  return (
    <div className="mobile-radar-view relative min-h-screen overflow-hidden">
      {/* Header */}
      <div className="mobile-radar-view__header">
        <span className="mobile-radar-view__powered">
          {sourceLabel}
        </span>
        <h1>
          <span className="mobile-radar-view__live">
            <span className="mobile-radar-view__live-dot" />
            {liveLabel}
          </span>
        </h1>
        <p>Scopri i tool migliori di Product Hunt.</p>
      </div>

      {/* Radar Stage */}
      <div className="mobile-radar-view__stage">
        <canvas ref={canvasRef} className="mobile-radar-view__canvas relative z-0" />
        <span className="mobile-radar-view__scan-line" aria-hidden="true" />
        {/* Real data nodes overlaid */}
        {nodes.map((node) => {
          const style = {
            "--node-angle": `${node.angle}rad`,
            "--node-x": `${node.x}%`,
            "--node-y": `${node.y}%`,
            "--node-size": `${node.size}px`,
            "--node-hit-delay": `${(normaliseAngle(node.angle) / (Math.PI * 2)) * (RADAR_SWEEP_DURATION_MS / 1000)}s`,
          } as CSSProperties;
          const isHot = node.votesCount > 100 && !node.isPlaceholder;
          const isHidden = node.id === hiddenNodeId && !hiddenDiscovered;
          const isScanned = angleDistance(node.angle, scanAngle) < RADAR_SCAN_THRESHOLD;
          const nodeSideClass = node.x >= 0 ? " is-right-side" : " is-left-side";
          const nodeClassName = `mobile-radar-view__node${nodeSideClass}${isHot ? " is-hot" : ""}${isScanned ? " is-scanned" : ""}${node.isPlaceholder ? " is-placeholder" : ""}${isHidden ? " is-hidden" : ""}`;
          const displayName = node.isPlaceholder ? placeholderNodeLabel : node.name;
          const displayMeta = node.isPlaceholder ? placeholderNodeHint : `${node.votesCount} voti`;
          const nodeInitials = node.isPlaceholder
            ? "..."
            : node.name.slice(0, 2).toUpperCase();
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
                  // eslint-disable-next-line @next/next/no-img-element -- TODO(B66): migrate this runtime image after the image contract is unified.
                  <img
                    src={node.thumbnailUrl}
                    alt=""
                    loading="lazy"
                    className="mobile-radar-view__node-img"
                  />
                ) : (
                  <span className="mobile-radar-view__node-initials">
                    {nodeInitials}
                  </span>
                )}
              </span>
              <span className="mobile-radar-view__node-label">
                <strong>{displayName}</strong>
                <small>{displayMeta}</small>
              </span>
              {isHot && <span className="mobile-radar-view__node-badge">In crescita</span>}
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
          <span>{centerLabel}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mobile-radar-view__legend">
        {[
          { icon: Activity, label: "Posizione" },
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
      <MobileRadarSections
        items={currentItems}
        state={radarState}
        message={currentPayload?.message}
        stale={isStaleFallback}
        updatedAt={currentPayload?.updatedAt}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MobileRadarSections — trending & hot content below canvas
   ═══════════════════════════════════════════════════════════════ */

function MobileRadarSections({
  items,
  state,
  message,
  stale = false,
  updatedAt,
}: {
  items: ProductHuntItem[];
  state: RadarDataState;
  message?: string;
  stale?: boolean;
  updatedAt?: string;
}) {
  if (!items.length) {
    const emptyCopy: Record<Exclude<RadarDataState, "ready">, { title: string; body: string }> = {
      loading: {
        title: "Aggiorno il radar",
        body: "Sto caricando i segnali reali da Product Hunt. Gli slot nel radar restano neutri finché i dati non arrivano.",
      },
      empty: {
        title: "Nessun segnale disponibile",
        body: "Product Hunt non ha restituito tool per questo intervallo. Riprova più tardi senza dati finti in pagina.",
      },
      "missing-token": {
        title: "Radar in pausa",
        body: message ?? "I dati Product Hunt non sono disponibili in questo momento.",
      },
      error: {
        title: "Radar non disponibile",
        body: message ?? "Il feed Product Hunt non ha risposto. Manteniamo il radar pulito finché i dati reali tornano disponibili.",
      },
    };
    const copy = emptyCopy[state === "ready" ? "empty" : state];

    return (
      <div className="mobile-radar-sections">
        <section className="mobile-radar-section">
          <h2>
            <Activity size={14} />
            {copy.title}
          </h2>
          <p className="rounded-[18px] border border-white/10 bg-white/[0.055] p-4 text-sm leading-6 text-white/70">
            {copy.body}
          </p>
        </section>
      </div>
    );
  }

  const trending = [...items].sort((a, b) => b.votesCount - a.votesCount).slice(0, 3);
  const watchlist = items.slice(0, 8);

  return (
    <div className="mobile-radar-sections">
      {stale && (
        <p
          className="rounded-[18px] border border-white/10 bg-white/[0.055] p-4 text-sm leading-6 text-white/70"
          role="status"
        >
          {message ?? "Aggiornamento live non riuscito."} Ultima classifica reale
          sincronizzata: {formatUtcTimeLabel(updatedAt ?? "")}.
        </p>
      )}
      <section className="mobile-radar-section mobile-radar-section--table">
        <h2>
          <Zap size={14} />
          Classifica radar
        </h2>
        <div className="mobile-radar-section__table-head" aria-hidden="true">
          <span>#</span>
          <span>Tool</span>
          <span>Segnale</span>
        </div>
        <div className="mobile-radar-section__list mobile-radar-section__table">
          {watchlist.map((item, index) => (
            <motion.a
              key={item.id}
              href={item.productHuntUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-radar-section__row mobile-radar-section__row--table"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
            >
              <span className="mobile-radar-section__row-rank">#{index + 1}</span>
              <div className="mobile-radar-section__row-visual">
                {item.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- TODO(B66): migrate this runtime image after the image contract is unified.
                  <img src={item.thumbnailUrl} alt="" loading="lazy" />
                ) : (
                  <span>{item.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="mobile-radar-section__row-meta">
                <strong>{item.name}</strong>
                <span>{item.tagline}</span>
              </div>
              <span className="mobile-radar-section__row-votes">
                <strong>{item.votesCount}</strong>
                <small>{item.commentsCount} commenti</small>
              </span>
            </motion.a>
          ))}
        </div>
      </section>

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
                    // eslint-disable-next-line @next/next/no-img-element -- TODO(B66): migrate this runtime image after the image contract is unified.
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
                  <span className="mobile-radar-section__card-badge">In crescita</span>
                )}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
