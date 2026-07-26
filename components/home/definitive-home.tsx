"use client";

/**
 * TooolVibes — Definitive Home (v4, 2026-07-24)
 *
 * v4 — Stronger composition density.
 *
 *   1. HERO + RADAR COCKPIT — one dark command surface, two columns.
 *      v4: tighter min-height (520px desktop), larger Radar stage (640px),
 *      larger brand disc (168px), socket counter, status pill under stage.
 *
 *   2. IVORY EDITORIAL SURFACE — dark → warm ivory transition.
 *      v4: single large surface with a head row (eyebrow + title + actions).
 *      Tool of the Week as a 2-column feature: identity+CTAs left,
 *      winner score panel right.
 *
 *   3. PODIUM — genuine 3-stage tower composition. v4: 320/240/180px cells,
 *      connected base 4px line, score per cell, #1 gold.
 *
 *   4. METHOD — quieter final section, unchanged structure, larger numbers.
 *
 *   5. RADAR EMPTY STATE — orbital sockets (5 nodes without identities),
 *      central brand disc, "awaiting signal" label, socket counter
 *      "0 / 5 · in attesa", factual PH configuration message. No fake
 *      names or rankings.
 *
 * Preserved from earlier passes:
 *   - serif Home H1 with violet "rumore" highlight (v4: clean underlay)
 *   - real Product Hunt data binding (no fabrication)
 *   - factual Radar empty state
 *   - reduced animation density (2 infinite loops above fold)
 *   - 44px touch targets minimum (48px primary CTAs)
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
  Sparkles,
} from "lucide-react";
import {
  resolveRadarDataState,
  type ProductHuntRange,
} from "@/lib/radar/product-hunt-contract";
import { useProductHuntRadar } from "@/lib/radar/use-product-hunt-radar";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { computeEditorialScore } from "@/lib/data/editorial-score";
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

const SOCKET_POSITIONS = [
  { top: "8%", left: "50%" },
  { top: "30%", left: "89%" },
  { top: "70%", left: "89%" },
  { top: "92%", left: "50%" },
  { top: "70%", left: "11%" },
] as const;

// ============================================================
// COCKPIT — Hero + Radar in the same primary frame
// ============================================================
function Cockpit() {
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
  const socketCount = `${String(signalCount).padStart(2, "0")} / 05`;

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

          {/* Complete decision journey — compact and route-driven */}
          <nav className="def-cockpit__journey" aria-label="Il tuo percorso">
            <ol>
              <li className="is-active">
                <Link href="/archivio">
                  <span aria-hidden="true">1</span>
                  <strong>Scopri</strong>
                  <em>Territori</em>
                </Link>
              </li>
              <li>
                <Link href="/archivio?sort=score_desc">
                  <span aria-hidden="true">2</span>
                  <strong>Valuta</strong>
                  <em>Evidence</em>
                </Link>
              </li>
              <li>
                <Link href="/compare">
                  <span aria-hidden="true">3</span>
                  <strong>Confronta</strong>
                  <em>Matrix</em>
                </Link>
              </li>
              <li>
                <Link href="/shortlist">
                  <span aria-hidden="true">4</span>
                  <strong>Salva</strong>
                  <em>Shortlist</em>
                </Link>
              </li>
              <li>
                <Link href="/collections">
                  <span aria-hidden="true">5</span>
                  <strong>Decidi</strong>
                  <em>Percorsi</em>
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
            {/* Socket count pill (top-right) */}
            <p
              className="def-cockpit__socket-count"
              role="status"
              aria-live="polite"
            >
              <span aria-hidden="true" className="def-cockpit__socket-count-dot" />
              {socketCount}
            </p>

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
              {SOCKET_POSITIONS.map((pos, i) => (
                <li
                  key={i}
                  className="def-cockpit__socket"
                  style={{ top: pos.top, left: pos.left }}
                  aria-hidden="true"
                >
                  <span className="def-cockpit__socket-trace" />
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
                width={120}
                height={120}
                className="def-cockpit__core-logo"
                priority
              />
            </div>
          </div>

          {/* Status pill — factual, BELOW stage */}
          <p className="def-cockpit__status" role="status" aria-live="polite">
            <span aria-hidden="true" className="def-cockpit__status-dot" />
            {hasLiveData
              ? `${signalCount} segnali in tempo reale`
              : "In attesa di Product Hunt · niente dati simulati"}
          </p>

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
// v4: spotlight with winner panel, podium with score
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

  const editorialScore = computeEditorialScore(focusTool);
  const winnerFacts = [
    { label: "Lettura", value: focusTool.readingTime ?? "—" },
    { label: "Casi d'uso", value: String(focusTool.useCases.length) },
    { label: "Fascia", value: editorialScore.label },
  ] as const;

  return (
    <section className="def-editorial" aria-labelledby="def-editorial-title">
      <div aria-hidden="true" className="def-editorial__traces" />
      <header className="def-editorial__head">
        <div>
          <p className="def-editorial__eyebrow">Decision desk · warm ivory</p>
          <h2 id="def-editorial-title" className="def-editorial__title">
            La scrivania dove il tool della settimana incontra il podio.
          </h2>
        </div>
        <div className="def-editorial__head-actions">
          <Link
            href="/archivio"
            className="def-editorial__head-link"
          >
            Tutti i 30 tool
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className="def-editorial__inner">
        {/* TOOL OF THE WEEK */}
        <article className="def-editorial__spotlight">
          <div className="def-editorial__spot-body">
            <p className="def-editorial__spot-eyebrow">
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
              <div className="def-editorial__spot-identity">
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
                <dd>{editorialScore.value.toFixed(1)}</dd>
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
          </div>

          {/* Winner visual panel — v4 */}
          <aside className="def-editorial__spot-winner" aria-label="Profilo vincitore">
            <p className="def-editorial__spot-winner-eyebrow">
              <Sparkles size={12} aria-hidden="true" style={{ display: "inline", marginRight: 6, verticalAlign: -1 }} />
              Profilo vincitore
            </p>
            <div className="def-editorial__spot-winner-score">
              <span className="def-editorial__spot-winner-score-num">
                {editorialScore.value.toFixed(1)}
              </span>
              <span className="def-editorial__spot-winner-score-max">/ 10 editoriale</span>
            </div>
            <p className="def-editorial__spot-winner-detail">
              Punteggio editoriale canonico applicato allo stesso profilo in
              Home, Archivio, Confronto e scheda completa.
            </p>
            <div className="def-editorial__spot-winner-bars">
              {winnerFacts.map((fact) => (
                <div className="def-editorial__spot-winner-bar" key={fact.label}>
                  <span className="def-editorial__spot-winner-bar-label">{fact.label}</span>
                  <span className="def-editorial__spot-winner-bar-value">{fact.value}</span>
                </div>
              ))}
            </div>
          </aside>
        </article>

        {/* PODIUM — v4: true 3-stage tower composition */}
        <div className="def-editorial__podium" aria-label="Podio editoriale">
          <div className="def-editorial__pod-head-row">
            <p className="def-editorial__pod-eyebrow">Podio editoriale</p>
            <p className="def-editorial__pod-subtitle">Aggiornato 24 lug · 09:00 UTC</p>
          </div>
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
            <span aria-hidden="true" className="def-editorial__pod-base" />
          </ol>
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
  const score = computeEditorialScore(tool).value.toFixed(1);
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
      <span className="def-editorial__pod-score">
        <span className="def-editorial__pod-score-num">{score}</span>
        <span className="def-editorial__pod-score-max">/ 10</span>
      </span>
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
export function DefinitiveHome({ tools, weeklyTool }: DefinitiveHomeProps) {
  const focusTool = weeklyTool ?? tools[0] ?? null;
  return (
    <div className="def-home">
      <Cockpit />
      <IvoryEditorial focusTool={focusTool} tools={tools} />
      <Method />
      <section className="def-home__placement">
        <NativePlacement placementKey="home-featured-tool" variant="compact" dark />
      </section>
    </div>
  );
}

export default DefinitiveHome;
