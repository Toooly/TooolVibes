"use client";

import { useState, useEffect, useRef, useMemo, useCallback, type CSSProperties, type MouseEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Activity,
  ExternalLink,
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
const RADAR_RANGE_OPTIONS: { key: ProductHuntRange; label: string }[] = [
  { key: "day", label: "Giorno" },
  { key: "week", label: "Settimana" },
  { key: "month", label: "Mese" },
];
const RADAR_NODE_LAYOUT = [
  { angle: -0.2, radiusRatio: 0.54 },
  { angle: 1.08, radiusRatio: 0.7 },
  { angle: 2.48, radiusRatio: 0.74 },
  { angle: 3.8, radiusRatio: 0.68 },
  { angle: 5.27, radiusRatio: 0.76 },
];

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
  const prefersReducedMotion = useReducedMotion() === true;
  const hiddenSignalRelease = useGamificationSurface("hiddenSignal");
  const [activeRange, setActiveRange] = useState<ProductHuntRange>("day");
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
  const centerLabel =
    radarState === "ready"
      ? isStaleFallback
        ? "Ultima sync"
        : "Ultima ora"
      : radarState === "loading"
        ? "Aggiorno"
        : radarState === "empty"
          ? "Nessun dato"
          : "In pausa";
  const stageStatus =
    radarState === "loading"
      ? "Connessione ai segnali Product Hunt…"
      : radarState === "empty"
        ? "Nessun segnale disponibile per questo periodo."
        : "Radar in pausa. I dati reali compariranno qui quando il feed sarà disponibile.";

  // Data contesto UTC condivisa con il resolver server (timezone-independent).
  const today = useMemo(() => getUtcContextDate(new Date()), []);
  const [hiddenDiscovered, setHiddenDiscovered] = useState(false);
  const [scanAngle, setScanAngle] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHiddenDiscovered(localStorage.getItem(`${HIDDEN_SIGNAL_STORAGE_KEY}:${today}`) === "1");
  }, [today]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setScanAngle(0);
      return;
    }

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
  }, [prefersReducedMotion]);

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


    const drawFrame = (frameTime: number) => {
      const w = canvas.width / Math.min(window.devicePixelRatio, 2);
      const h = canvas.height / Math.min(window.devicePixelRatio, 2);
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(w, h) * 0.46;

      ctx.clearRect(0, 0, w, h);

      // Opaque instrument surface: no visual data is simulated by the canvas.
      ctx.fillStyle = "#0f0f12";
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
      const sweepAngle = frameTime * 1.96;
      const sweepLen = maxR * 1.05;
      const sx = cx + Math.cos(sweepAngle) * sweepLen;
      const sy = cy + Math.sin(sweepAngle) * sweepLen;

      // Main sweep line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = "rgba(57, 210, 246, 0.58)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Sweep echo line
      const echoAngle = sweepAngle + 0.4;
      const ex = cx + Math.cos(echoAngle) * sweepLen * 0.85;
      const ey = cy + Math.sin(echoAngle) * sweepLen * 0.85;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = "rgba(57, 210, 246, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Pulsing core with layered rings
      const pulse = Math.sin(frameTime * 2.5) * 0.3 + 1;
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
      const echoPulse = Math.sin(frameTime * 2.5 - 0.8) * 0.3 + 1;
      if (echoPulse > 0.9) {
        ctx.beginPath();
        ctx.arc(cx, cy, 32 * echoPulse, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(57, 210, 246, ${0.2 * echoPulse})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

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
      drawFrame(time);
    };
    resize();

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    if (prefersReducedMotion) {
      return () => ro.disconnect();
    }

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
      drawFrame(time);
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
  }, [prefersReducedMotion]);

  /* ── Node positions ── */
  const nodes = useMemo(() => {
    const items = currentItems.slice(0, RADAR_NODE_COUNT);
    const voteCounts = items.map((item) => item.votesCount);
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
      const radiusRatio = 0.38 + (1 - voteScore) * 0.42;
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
      };
    });
  }, [currentItems]);

  const hiddenNodeId = useMemo(() => {
    if (!hiddenSignalRelease.persistentRewardsEnabled) return null;
    if (nodes.length === 0) return null;
    const index = Math.floor(seededRandom(today) * nodes.length);
    return nodes[index]?.id ?? null;
  }, [hiddenSignalRelease.persistentRewardsEnabled, nodes, today]);

  return (
    <div className="radar-mobile">
      <header className="radar-mobile__header">
        <div className="radar-mobile__title-row">
          <h1>Radar</h1>
          <span className="radar-mobile__live" data-state={radarState}>
            <span className="radar-mobile__live-dot" aria-hidden="true" />
            {liveLabel}
          </span>
        </div>
        <p className="radar-mobile__source" role="status" aria-live="polite">
          {sourceLabel}
        </p>
        <p className="radar-mobile__description">
          Lanci Product Hunt ordinati per periodo, senza dati simulati.
        </p>
        <div className="radar-mobile__ranges" role="group" aria-label="Periodo classifica">
          {RADAR_RANGE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className="radar-mobile__range"
              aria-pressed={activeRange === option.key}
              aria-controls="radar-mobile-results"
              onClick={() => setActiveRange(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <div
        className="radar-mobile__stage"
        role="region"
        aria-label="Radar visuale Product Hunt"
        aria-busy={radarState === "loading"}
      >
        <canvas
          ref={canvasRef}
          className="radar-mobile__canvas"
          aria-hidden="true"
        />
        {nodes.map((node) => {
          const style = {
            "--node-angle": `${node.angle}rad`,
            "--node-x": `${node.x}%`,
            "--node-y": `${node.y}%`,
            "--node-size": `${node.size}px`,
            "--node-hit-delay": `${(normaliseAngle(node.angle) / (Math.PI * 2)) * (RADAR_SWEEP_DURATION_MS / 1000)}s`,
          } as CSSProperties;
          const isHidden = node.id === hiddenNodeId && !hiddenDiscovered;
          const isScanned =
            !prefersReducedMotion &&
            angleDistance(node.angle, scanAngle) < RADAR_SCAN_THRESHOLD;
          const nodeSideClass = node.x >= 0 ? " is-right" : " is-left";
          const nodeClassName = `radar-mobile__node${nodeSideClass}${isScanned ? " is-scanned" : ""}${isHidden ? " is-hidden" : ""}`;

          return (
            <a
              key={node.id}
              href={node.productHuntUrl}
              target={node.productHuntUrl.startsWith("http") ? "_blank" : undefined}
              rel={node.productHuntUrl.startsWith("http") ? "noopener noreferrer" : undefined}
              className={nodeClassName}
              style={style}
              aria-label={`${node.name}. ${node.votesCount} voti, ${node.commentsCount} commenti. Apri su Product Hunt.`}
              onClick={isHidden ? (event) => handleHiddenNodeClick(node, event) : undefined}
            >
              {isHidden ? <span className="radar-mobile__hidden-marker" aria-hidden="true" /> : null}
              <span className="radar-mobile__node-body">
                {node.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- TODO(B66): migrate this runtime image after the image contract is unified.
                  <img className="radar-mobile__node-img" src={node.thumbnailUrl} alt="" loading="lazy" />
                ) : (
                  <span className="radar-mobile__node-initials">{node.name.slice(0, 2).toUpperCase()}</span>
                )}
              </span>
              <span className="radar-mobile__node-label">
                <strong>{node.name}</strong>
                <small>{node.votesCount > 0 ? `${node.votesCount} voti` : "In verifica"}</small>
              </span>
            </a>
          );
        })}

        {radarState === "ready" ? (
          <div className="radar-mobile__center-info" aria-hidden="true">
            <span>{centerLabel}</span>
            <strong>{nodes.length}</strong>
          </div>
        ) : (
          <p className="radar-mobile__stage-status" role="status" aria-live="polite">
            {stageStatus}
          </p>
        )}
      </div>

      <div id="radar-mobile-results">
        <MobileRadarSections
          items={currentItems}
          state={radarState}
          message={currentPayload?.message}
          stale={isStaleFallback}
          updatedAt={currentPayload?.updatedAt}
          reducedMotion={prefersReducedMotion}
        />
      </div>
    </div>
  );
}

/* Ranked Product Hunt signals below the mobile instrument. */

function MobileRadarSections({
  items,
  state,
  message,
  stale = false,
  updatedAt,
  reducedMotion,
}: {
  items: ProductHuntItem[];
  state: RadarDataState;
  message?: string;
  stale?: boolean;
  updatedAt?: string;
  reducedMotion: boolean;
}) {
  if (!items.length) {
    const emptyCopy: Record<Exclude<RadarDataState, "ready">, { title: string; body: string }> = {
      loading: {
        title: "Aggiorno il radar",
        body: "Sto caricando i segnali reali da Product Hunt. La classifica comparirà solo quando il feed risponde.",
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
      <div className="radar-mobile-sections">
        <section
          className="radar-mobile-section radar-mobile-section--empty"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-busy={state === "loading"}
        >
          <div className="radar-mobile-section__header">
            <Activity size={18} aria-hidden="true" />
            <h2>{copy.title}</h2>
          </div>
          <p className="radar-mobile__notice">
            {copy.body}
          </p>
        </section>
      </div>
    );
  }

  const watchlist = items.slice(0, 8);

  return (
    <div className="radar-mobile-sections">
      {stale && (
        <p
          className="radar-mobile__notice"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {message ?? "Aggiornamento live non riuscito."} Ultima classifica reale
          sincronizzata: {formatUtcTimeLabel(updatedAt ?? "")}.
        </p>
      )}
      <section className="radar-mobile-section radar-mobile-section--table">
        <div className="radar-mobile-section__header">
          <Zap size={18} aria-hidden="true" />
          <h2>Classifica radar</h2>
          <span>{watchlist.length} segnali</span>
        </div>
        <div className="radar-mobile-section__table-head" aria-hidden="true">
          <span>#</span>
          <span>Tool</span>
          <span>Segnale</span>
        </div>
        <div className="radar-mobile-section__list">
          {watchlist.map((item, index) => (
            <motion.a
              key={item.id}
              href={item.productHuntUrl}
              target={item.productHuntUrl.startsWith("http") ? "_blank" : undefined}
              rel={item.productHuntUrl.startsWith("http") ? "noopener noreferrer" : undefined}
              className="radar-mobile-section__row"
              aria-label={`${item.name}. ${item.votesCount} voti, ${item.commentsCount} commenti. Apri su Product Hunt.`}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={reducedMotion ? undefined : { once: true }}
              transition={reducedMotion ? undefined : { delay: index * 0.04 }}
            >
              <span className="radar-mobile-section__rank">#{index + 1}</span>
              <div className="radar-mobile-section__visual">
                {item.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- TODO(B66): migrate this runtime image after the image contract is unified.
                  <img src={item.thumbnailUrl} alt="" loading="lazy" />
                ) : (
                  <span>{item.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="radar-mobile-section__copy">
                <strong>{item.name}</strong>
                <small>{item.tagline}</small>
              </div>
              <span className="radar-mobile-section__signal">
                <strong>{item.votesCount} voti</strong>
                <small>{item.commentsCount} commenti</small>
                <ExternalLink size={13} aria-hidden="true" />
              </span>
            </motion.a>
          ))}
        </div>
      </section>
    </div>
  );
}
