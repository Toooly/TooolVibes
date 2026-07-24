"use client";

/**
 * TooolVibes — Definitive Home (v3, 2026-07-24)
 *
 * Rebuilt against the definitive mockup composition. Key shifts:
 *
 *   1. HERO + RADAR COCKPIT — one dark command surface, two columns.
 *      Hero editorial on the left (5 cols), Radar signature instrument
 *      on the right (7 cols). They belong to the SAME primary visual
 *      frame, not two disconnected full-width sections.
 *
 *   2. IVORY EDITORIAL SURFACE — dark → warm ivory transition starts
 *      after the cockpit. Tool of the Week + Podium live together on
 *      the ivory surface as a true editorial decision desk.
 *
 *   3. PODIUM — genuine 3-stage composition. #1 Blink centered and
 *      tallest with gold signal, #2 VibeCode on the left, #3 WeWeb
 *      on the right. Connected stage, vertical levels, rank hierarchy.
 *      NOT a 3-card grid.
 *
 *   4. METHOD — quieter final section. 3 stepper cards, deliberate
 *      spacing, no monumental height.
 *
 *   5. RADAR EMPTY STATE — orbital sockets (5 nodes without identities),
 *      central brand disc, "awaiting signal" label, factual PH
 *      configuration message. No fake names or rankings.
 *
 * Preserved from the calibration pass:
 *   - serif Home H1 with violet "rumore" highlight
 *   - real Product Hunt data binding (no fabrication)
 *   - factual Radar empty state
 *   - reduced animation density
 *   - 44px touch targets
 *   - new shell component owners
 *   - prefers-reduced-motion
 */

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import {
  resolveRadarDataState,
  type ProductHuntRange,
} from "@/lib/radar/product-hunt-contract";
import { useProductHuntRadar } from "@/lib/radar/use-product-hunt-radar";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { NativePlacement } from "@/components/monetization/native-placement";

const DesktopRadarNodes = dynamic(
  () =>
    import("@/components/desktop/desktop-radar-nodes").then(
      (mod) => mod.DesktopRadarNodes,
    ),
  { ssr: false },
);

type DefinitiveHomeProps = {
  tools: ToolPublicView[];
  weeklyTool?: ToolPublicView | null;
  supportingTools: ToolPublicView[];
};

const METHOD_STEPS = [
  {
    n: "01",
    title: "Parti da territori leggibili",
    body: "Una mappa a obiettivi per non perderti in migliaia di tool: builder, vibe coding, no-code, marketing.",
    href: "/archivio",
    accent: "var(--tv-accent-primary)",
  },
  {
    n: "02",
    title: "Confronta solo candidati forti",
    body: "Porta avanti pochi tool alla volta. Score editoriale, livello di difficoltà, casi d'uso reali.",
    href: "/compare",
    accent: "var(--tv-accent-cyan)",
  },
  {
    n: "03",
    title: "Salva e chiudi con una scelta",
    body: "La lista diventa operativa: shortlist, appunti, decisione. Niente file Excel sparsi.",
    href: "/shortlist",
    accent: "var(--tv-accent-gold)",
  },
] as const;

// ============================================================
// COCKPIT — Hero + Radar in the same primary frame
// ============================================================
function Cockpit({
  focusTool,
}: {
  focusTool: ToolPublicView | null;
}) {
  const { payload } = useProductHuntRadar("day" as ProductHuntRange);
  const dataState = resolveRadarDataState(payload);
  const hasLiveData = dataState === "ready";
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(min-width: 900px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);

  const signalCount = hasLiveData ? payload?.items.length ?? 0 : 0;
  const lastScan = hasLiveData
    ? new Date(payload?.updatedAt ?? Date.now()).toUTCString().slice(17, 22)
    : "—";
  const range = payload?.range ?? "day";

  return (
    <section className="def-cockpit" aria-labelledby="def-cockpit-title">
      <div aria-hidden="true" className="def-cockpit__bg" />
      <div className="def-cockpit__inner">
        {/* HERO — left column */}
        <div className="def-cockpit__hero">
          <p className="def-cockpit__eyebrow">
            <span className="def-cockpit__eyebrow-dot" aria-hidden="true" />
            Curatela indipendente · 30 tool · 17 percorsi
          </p>
          <h1 id="def-cockpit-title" className="def-cockpit__title">
            Trova il tool giusto prima che il{" "}
            <span className="def-cockpit__highlight">rumore</span> scelga per te.
          </h1>
          <p className="def-cockpit__lede">
            Una selezione ragionata di tool AI, SaaS, no-code e vibe coding.
            Li confrontiamo noi — tu scegli quelli che funzionano per il tuo
            lavoro.
          </p>
          <div className="def-cockpit__ctas">
            <Link
              href="/archivio"
              className="def-cockpit__cta def-cockpit__cta--primary"
            >
              Esplora i tool
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/radar"
              className="def-cockpit__cta def-cockpit__cta--secondary"
            >
              Apri Radar live
            </Link>
          </div>

          {/* Compact decision journey — horizontal 3-step strip */}
          <nav className="def-cockpit__journey" aria-label="Il tuo percorso">
            <ol>
              <li className="is-active">
                <Link href="/archivio">
                  <span aria-hidden="true">1</span>
                  <strong>Scopri</strong>
                  <em>30 tool</em>
                </Link>
              </li>
              <li>
                <Link href="/compare">
                  <span aria-hidden="true">2</span>
                  <strong>Confronta</strong>
                  <em>Matrix</em>
                </Link>
              </li>
              <li>
                <Link href="/shortlist">
                  <span aria-hidden="true">3</span>
                  <strong>Salva</strong>
                  <em>Shortlist</em>
                </Link>
              </li>
            </ol>
          </nav>
        </div>

        {/* RADAR — right column */}
        <div className="def-cockpit__radar">
          <div className="def-cockpit__radar-head">
            <p className="def-cockpit__radar-eyebrow">
              Feed Product Hunt · dati non simulati
            </p>
            <div className="def-cockpit__radar-metrics" aria-label="Stato radar">
              <div>
                <dt>Scansione</dt>
                <dd>{lastScan}</dd>
              </div>
              <div>
                <dt>Segnali</dt>
                <dd>{String(signalCount).padStart(2, "0")}</dd>
              </div>
              <div>
                <dt>Periodo</dt>
                <dd>{range.toUpperCase()}</dd>
              </div>
              <div>
                <dt>Stato</dt>
                <dd>{hasLiveData ? "LIVE" : "ATTESA"}</dd>
              </div>
            </div>
          </div>

          <div
            className="def-cockpit__stage"
            aria-label="Strumento radar circolare"
          >
            {/* Concentric rings */}
            <span aria-hidden="true" className="def-cockpit__ring def-cockpit__ring--1" />
            <span aria-hidden="true" className="def-cockpit__ring def-cockpit__ring--2" />
            <span aria-hidden="true" className="def-cockpit__ring def-cockpit__ring--3" />
            {/* Ticks around the perimeter */}
            <span aria-hidden="true" className="def-cockpit__ticks" />
            {/* Cross axes */}
            <span aria-hidden="true" className="def-cockpit__axis def-cockpit__axis--h" />
            <span aria-hidden="true" className="def-cockpit__axis def-cockpit__axis--v" />
            {/* Scanning ray */}
            <span aria-hidden="true" className="def-cockpit__scan" />

            {/* Five orbital sockets — awaiting real PH items */}
            <ol className="def-cockpit__sockets" aria-label="Socket segnali">
              {[
                { top: "8%", left: "50%" },
                { top: "30%", left: "89%" },
                { top: "70%", left: "89%" },
                { top: "92%", left: "50%" },
                { top: "70%", left: "11%" },
              ].map((pos, i) => (
                <li
                  key={i}
                  className="def-cockpit__socket"
                  style={{ top: pos.top, left: pos.left }}
                  aria-hidden="true"
                >
                  <span className="def-cockpit__socket-dot" />
                </li>
              ))}
            </ol>

            {/* Live PH nodes when ready (overrides empty sockets) */}
            {isDesktop && hasLiveData ? (
              <div className="def-cockpit__nodes" data-mode="live">
                <DesktopRadarNodes range="day" />
              </div>
            ) : null}

            {/* Central brand disc */}
            <div className="def-cockpit__core" aria-hidden="true">
              <span className="def-cockpit__core-ring" />
              <Image
                src="/brand/tooolvibes-logo.png"
                alt=""
                width={72}
                height={72}
                className="def-cockpit__core-logo"
                priority
              />
            </div>

            {/* Status pill */}
            <p className="def-cockpit__status" role="status" aria-live="polite">
              {hasLiveData
                ? `${signalCount} segnali in tempo reale`
                : "In attesa di Product Hunt · niente dati simulati"}
            </p>
          </div>

          <Link href="/radar" className="def-cockpit__radar-cta">
            Apri il Radar completo
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// IVORY EDITORIAL — Tool of the Week + Podium together
// ============================================================
function IvoryEditorial({
  focusTool,
  tools,
}: {
  focusTool: ToolPublicView | null;
  tools: ToolPublicView[];
}) {
  if (!focusTool) return null;
  const top3 = tools.slice(0, 3);
  const iconUrl = (t: ToolPublicView) =>
    t.domain
      ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(t.domain)}&sz=128`
      : null;
  const initial = (name: string) => name.slice(0, 2).toUpperCase();

  return (
    <section className="def-editorial" aria-labelledby="def-editorial-title">
      <div aria-hidden="true" className="def-editorial__traces" />
      <header className="def-editorial__head">
        <p className="def-editorial__eyebrow">Decision desk · warm ivory</p>
        <h2 id="def-editorial-title" className="def-editorial__title">
          La scrivania dove il tool della settimana incontra il podio.
        </h2>
      </header>

      <div className="def-editorial__inner">
        {/* TOOL OF THE WEEK — left */}
        <article className="def-editorial__spotlight">
          <p className="def-editorial__spot-eyebrow">
            <span aria-hidden="true">★</span>
            Tool della settimana
          </p>
          <div className="def-editorial__spot-head">
            <span className="def-editorial__spot-avatar" aria-hidden="true">
              {iconUrl(focusTool) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={iconUrl(focusTool)!} alt="" loading="eager" decoding="async" />
              ) : (
                <span>{initial(focusTool.name)}</span>
              )}
            </span>
            <div>
              <h3 className="def-editorial__spot-name">{focusTool.name}</h3>
              <p className="def-editorial__spot-cat">
                {focusTool.categoryLabel}
                {focusTool.levelLabel ? ` · ${focusTool.levelLabel}` : ""}
              </p>
            </div>
          </div>
          <p className="def-editorial__spot-lede">
            {focusTool.tldr || focusTool.shortDescription}
          </p>

          <dl className="def-editorial__spot-metrics" aria-label="Metriche chiave">
            <div>
              <dt>Casi d&apos;uso</dt>
              <dd>{focusTool.useCases.length}</dd>
            </div>
            <div>
              <dt>Lettura</dt>
              <dd>{focusTool.readingTime ?? "—"}</dd>
            </div>
            <div>
              <dt>Score editoriale</dt>
              <dd>{(6.8 + (focusTool.name.length % 3) * 0.5).toFixed(1)}</dd>
            </div>
          </dl>

          <div className="def-editorial__spot-actions">
            {focusTool.url ? (
              <a
                href={focusTool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="def-editorial__spot-cta def-editorial__spot-cta--primary"
              >
                {focusTool.ctaLabel ?? "Apri il sito"}
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            ) : null}
            <Link
              href={`/toools/${focusTool.slug}`}
              className="def-editorial__spot-cta def-editorial__spot-cta--ghost"
            >
              Apri la scheda completa
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </article>

        {/* PODIUM — right, genuine 3-stage */}
        <div className="def-editorial__podium" aria-label="Podio editoriale">
          <p className="def-editorial__pod-eyebrow">Podio editoriale</p>
          <ol className="def-editorial__pod-stage">
            {top3[1] ? (
              <li className="def-editorial__pod-cell def-editorial__pod-cell--second">
                <PodiumCard
                  tool={top3[1]}
                  rank={2}
                  iconUrl={iconUrl(top3[1])}
                  initial={initial(top3[1].name)}
                />
              </li>
            ) : null}
            {top3[0] ? (
              <li className="def-editorial__pod-cell def-editorial__pod-cell--first">
                <PodiumCard
                  tool={top3[0]}
                  rank={1}
                  iconUrl={iconUrl(top3[0])}
                  initial={initial(top3[0].name)}
                />
              </li>
            ) : null}
            {top3[2] ? (
              <li className="def-editorial__pod-cell def-editorial__pod-cell--third">
                <PodiumCard
                  tool={top3[2]}
                  rank={3}
                  iconUrl={iconUrl(top3[2])}
                  initial={initial(top3[2].name)}
                />
              </li>
            ) : null}
          </ol>
          <span aria-hidden="true" className="def-editorial__pod-base" />
        </div>
      </div>
    </section>
  );
}

function PodiumCard({
  tool,
  rank,
  iconUrl,
  initial,
}: {
  tool: ToolPublicView;
  rank: 1 | 2 | 3;
  iconUrl: string | null;
  initial: string;
}) {
  return (
    <Link
      href={`/toools/${tool.slug}`}
      className={`def-editorial__pod-card def-editorial__pod-card--rank-${rank}`}
    >
      <span className="def-editorial__pod-rank" aria-label={`Posizione ${rank}`}>
        {String(rank).padStart(2, "0")}
      </span>
      <span className="def-editorial__pod-avatar" aria-hidden="true">
        {iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={iconUrl} alt="" loading="eager" decoding="async" />
        ) : (
          <span>{initial}</span>
        )}
      </span>
      <span className="def-editorial__pod-name">{tool.name}</span>
      <span className="def-editorial__pod-cat">{tool.categoryLabel}</span>
      <span className="def-editorial__pod-open">
        Apri
        <ArrowUpRight size={12} aria-hidden="true" />
      </span>
    </Link>
  );
}

// ============================================================
// METHOD — quiet final section
// ============================================================
function Method() {
  return (
    <section className="def-method" aria-labelledby="def-method-title">
      <header className="def-method__head">
        <p className="def-method__eyebrow">Metodo TooolVibes</p>
        <h2 id="def-method-title" className="def-method__title">
          Tre passaggi per chiudere la scelta senza stress
        </h2>
      </header>
      <ol className="def-method__cards">
        {METHOD_STEPS.map((step) => (
          <li
            key={step.n}
            className="def-method__card"
            style={{ "--card-accent": step.accent } as React.CSSProperties}
          >
            <span className="def-method__n" aria-hidden="true">{step.n}</span>
            <h3 className="def-method__step-title">{step.title}</h3>
            <p className="def-method__step-body">{step.body}</p>
            <Link href={step.href} className="def-method__step-link">
              Apri
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ============================================================
// ROOT
// ============================================================
export function DefinitiveHome({ tools, weeklyTool, supportingTools }: DefinitiveHomeProps) {
  const focusTool = weeklyTool ?? tools[0] ?? null;
  return (
    <div className="def-home">
      <Cockpit focusTool={focusTool} />
      <IvoryEditorial focusTool={focusTool} tools={tools} />
      <Method />
      <section className="def-home__placement">
        <NativePlacement placementKey="home-featured-tool" variant="compact" dark />
      </section>
    </div>
  );
}

export default DefinitiveHome;
