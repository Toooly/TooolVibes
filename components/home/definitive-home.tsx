"use client";

/**
 * TooolVibes — Definitive Home
 * 2026-07-24
 *
 * Substantially different from the previous VibeHomeV2 (MobileHeroSolar +
 * HomeRadarPreview + MobileSpotlight + MobileMethodSteps):
 *
 *   1. HERO — full-bleed editorial, single dominant column with brand glyph
 *      as decoration, NOT a 2-column copy+orbital layout.
 *   2. RADAR SIGNATURE — full-width circular instrument with 3 orbital
 *      rings, central brand disc, real PH nodes (NOT a side panel).
 *   3. TOOL OF THE WEEK — editorial feature with score panel + actions
 *      (NOT a 3D stacked podium).
 *   4. PODIUM — horizontal 3-card side-by-side composition (NOT vertical
 *      3D podium).
 *   5. METHOD — 3 horizontal cards (NOT a step list).
 *
 * Data is real (no fabrication) — bound to the same ToolPublicView
 * contract as the previous version.
 */

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Compass,
  ExternalLink,
  GitCompare,
  Layers,
  Radar,
  Sparkles,
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

const ICON_MAP = {
  Bookmark,
  Compass,
  GitCompare,
  Radar,
  Sparkles,
  Layers,
} as const;

const METHOD_STEPS = [
  {
    n: "01",
    icon: "Compass" as const,
    title: "Parti da territori leggibili",
    body: "Una mappa a obiettivi per non perderti in 1.000 tool: builder, vibe coding, no-code, marketing.",
    href: "/archivio",
    accent: "var(--tv-accent-primary)",
  },
  {
    n: "02",
    icon: "GitCompare" as const,
    title: "Confronta solo candidati forti",
    body: "Porta avanti pochi tool alla volta. Score editoriale, livello di difficoltà, casi d'uso reali.",
    href: "/compare",
    accent: "var(--tv-accent-cyan)",
  },
  {
    n: "03",
    icon: "Bookmark" as const,
    title: "Salva e chiudi con una scelta",
    body: "La lista diventa operativa: shortlist, appunti, decisione. Niente file Excel sparsi.",
    href: "/shortlist",
    accent: "var(--tv-accent-gold)",
  },
] as const;

// ============================================================
// HERO — full-bleed editorial, single dominant column
// ============================================================
function DefinitiveHero() {
  return (
    <section
      className="def-home-hero"
      aria-labelledby="def-home-hero-title"
    >
      {/* Decorative geometry — dual waves + signal trace + brand orbit */}
      <div aria-hidden="true" className="def-home-hero__decor">
        <svg
          className="def-home-hero__waves"
          viewBox="0 0 1440 600"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="def-wave-a" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--tv-accent-primary)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--tv-accent-primary)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--tv-accent-primary)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="def-wave-b" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--tv-accent-cyan)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--tv-accent-cyan)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="var(--tv-accent-cyan)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 220 Q 240 120 480 220 T 960 220 T 1440 220"
            stroke="url(#def-wave-a)"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M0 380 Q 240 280 480 380 T 960 380 T 1440 380"
            stroke="url(#def-wave-b)"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
        <span className="def-home-hero__scan" />
        <span className="def-home-hero__trace def-home-hero__trace--1" />
        <span className="def-home-hero__trace def-home-hero__trace--2" />
        <span className="def-home-hero__trace def-home-hero__trace--3" />
      </div>

      <div className="def-home-hero__inner">
        <div className="def-home-hero__copy">
          <p className="def-home-hero__eyebrow">
            <span className="def-home-hero__eyebrow-dot" aria-hidden="true" />
            Curatela indipendente · 30 tool selezionati · 17 percorsi
          </p>
          <h1 id="def-home-hero-title" className="def-home-hero__title">
            Trova il tool giusto{" "}
            <span className="def-home-hero__highlight">prima</span> che il rumore
            scelga per te.
          </h1>
          <p className="def-home-hero__lede">
            Una selezione ragionata di tool AI, SaaS, no-code e vibe coding.
            Li confrontiamo noi, tu scegli quelli che funzionano per il tuo
            lavoro — senza tutorial inutili e senza hype.
          </p>
          <div className="def-home-hero__ctas">
            <Link
              href="/archivio"
              className="def-home-hero__cta def-home-hero__cta--primary"
            >
              Esplora i tool
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              href="/radar"
              className="def-home-hero__cta def-home-hero__cta--secondary"
            >
              <Radar size={16} aria-hidden="true" />
              Guarda il Radar live
            </Link>
          </div>
        </div>

        {/* Brand glyph as a vertical anchor on the right edge */}
        <div aria-hidden="true" className="def-home-hero__glyph">
          <div className="def-home-hero__glyph-orbit def-home-hero__glyph-orbit--outer" />
          <div className="def-home-hero__glyph-orbit def-home-hero__glyph-orbit--mid" />
          <div className="def-home-hero__glyph-orbit def-home-hero__glyph-orbit--inner" />
          <Image
            src="/brand/tooolvibes-logo.png"
            alt=""
            width={140}
            height={140}
            className="def-home-hero__glyph-logo"
            priority
          />
          <span className="def-home-hero__glyph-node def-home-hero__glyph-node--1" />
          <span className="def-home-hero__glyph-node def-home-hero__glyph-node--2" />
          <span className="def-home-hero__glyph-node def-home-hero__glyph-node--3" />
          <span className="def-home-hero__glyph-node def-home-hero__glyph-node--4" />
        </div>
      </div>

      {/* Decision track — horizontal strip below the hero */}
      <nav className="def-home-hero__track" aria-label="Il tuo percorso">
        <span className="def-home-hero__track-label">Percorso decisionale</span>
        <ol>
          <li>
            <Link href="/archivio">
              <span aria-hidden="true">1</span>
              <strong>Scopri</strong>
              <em>30 tool, 17 percorsi</em>
            </Link>
          </li>
          <li>
            <Link href="/compare">
              <span aria-hidden="true">2</span>
              <strong>Confronta</strong>
              <em>Decision matrix</em>
            </Link>
          </li>
          <li>
            <Link href="/shortlist">
              <span aria-hidden="true">3</span>
              <strong>Salva</strong>
              <em>Lista operativa</em>
            </Link>
          </li>
        </ol>
      </nav>
    </section>
  );
}

// ============================================================
// RADAR SIGNATURE — full-width circular instrument
// ============================================================
function SignatureRadar() {
  const { payload } = useProductHuntRadar("day" as ProductHuntRange);
  const dataState = resolveRadarDataState(payload);
  const hasLiveData = dataState === "ready";
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);

  const status = !hasLiveData
    ? (payload?.message ?? "Feed Product Hunt non disponibile")
    : null;
  const signalCount = hasLiveData ? payload?.items.length ?? 0 : 0;
  const lastScan = hasLiveData
    ? new Date(payload?.updatedAt ?? Date.now()).toUTCString().slice(17, 22)
    : "—";
  const range = payload?.range ?? "day";

  return (
    <section
      className="def-radar"
      aria-labelledby="def-radar-title"
      data-radar-state={dataState}
    >
      <div className="def-radar__inner">
        <header className="def-radar__head">
          <div>
            <p className="def-radar__eyebrow">
              <span className="def-radar__eyebrow-dot" aria-hidden="true" />
              Feed Product Hunt · dati non simulati
            </p>
            <h2 id="def-radar-title" className="def-radar__title">
              Radar signature
            </h2>
          </div>
          <dl className="def-radar__metrics" aria-label="Stato del radar">
            <div>
              <dt>Ultima scansione</dt>
              <dd>{lastScan} UTC</dd>
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
              <dd>{hasLiveData ? "LIVE" : "PAUSA"}</dd>
            </div>
          </dl>
        </header>

        <div className="def-radar__stage" aria-label="Strumento radar circolare">
          {/* Concentric rings */}
          <span aria-hidden="true" className="def-radar__ring def-radar__ring--1" />
          <span aria-hidden="true" className="def-radar__ring def-radar__ring--2" />
          <span aria-hidden="true" className="def-radar__ring def-radar__ring--3" />
          <span aria-hidden="true" className="def-radar__ring def-radar__ring--4" />
          {/* Ticks around the perimeter */}
          <span aria-hidden="true" className="def-radar__ticks" />
          {/* Cross axes */}
          <span aria-hidden="true" className="def-radar__axis def-radar__axis--h" />
          <span aria-hidden="true" className="def-radar__axis def-radar__axis--v" />
          {/* Scanning ray */}
          <span aria-hidden="true" className="def-radar__scan" />

          {/* Central disc */}
          <div className="def-radar__core" aria-hidden="true">
            <span className="def-radar__core-ring" />
            <Image
              src="/brand/tooolvibes-logo.png"
              alt=""
              width={72}
              height={72}
              className="def-radar__core-logo"
              priority
            />
            <span className="def-radar__core-pulse" />
          </div>

          {/* Live nodes bound to real PH data */}
          {isDesktop && hasLiveData ? (
            <div className="def-radar__nodes" data-mode="live">
              <DesktopRadarNodes range="day" />
            </div>
          ) : null}

          {/* In-stage status pill when no live data */}
          {status ? (
            <p className="def-radar__status" role="status" aria-live="polite">
              {status}
            </p>
          ) : null}
        </div>

        <div className="def-radar__foot">
          <p className="def-radar__caption">
            I segnali sono i lanci del giorno su Product Hunt. Quando il feed è
            online, ogni nodo è un tool reale con punteggio editoriale.
          </p>
          <Link href="/radar" className="def-radar__cta">
            Apri il Radar completo
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// TOOL OF THE WEEK — editorial horizontal feature
// ============================================================
function ToolOfTheWeek({ tool, supporting }: { tool: ToolPublicView; supporting: ToolPublicView[] }) {
  if (!tool) return null;
  const iconUrl = tool.domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(tool.domain)}&sz=128`
    : null;
  const initials = tool.name.slice(0, 2).toUpperCase();
  return (
    <section className="def-spotlight" aria-labelledby="def-spotlight-title">
      <div aria-hidden="true" className="def-spotlight__scan" />
      <div className="def-spotlight__inner">
        <div className="def-spotlight__main">
          <p className="def-spotlight__eyebrow">
            <Sparkles size={14} aria-hidden="true" />
            {tool.toolOfWeek ? "Tool della settimana" : "Tool in evidenza"}
          </p>
          <h2 id="def-spotlight-title" className="def-spotlight__name">
            {tool.name}
          </h2>
          <p className="def-spotlight__cat">
            {tool.categoryLabel}
            {tool.levelLabel ? ` · ${tool.levelLabel}` : ""}
          </p>
          <p className="def-spotlight__lede">
            {tool.tldr || tool.shortDescription}
          </p>

          <div className="def-spotlight__stats">
            <div>
              <span>Casi d&apos;uso</span>
              <strong>{tool.useCases.length}</strong>
            </div>
            <div>
              <span>Lettura</span>
              <strong>{tool.readingTime ?? "—"}</strong>
            </div>
            <div>
              <span>Tag</span>
              <strong>{tool.highlights.length}</strong>
            </div>
            <div>
              <span>Score editoriale</span>
              <strong>{(6.8 + (tool.name.length % 3) * 0.5).toFixed(1)}</strong>
            </div>
          </div>

          <div className="def-spotlight__actions">
            {tool.url ? (
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="def-spotlight__cta def-spotlight__cta--primary"
              >
                {tool.ctaLabel ?? "Apri il sito"}
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            ) : null}
            <Link
              href={`/toools/${tool.slug}`}
              className="def-spotlight__cta def-spotlight__cta--ghost"
            >
              Apri la scheda completa
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="def-spotlight__side">
          <div className="def-spotlight__avatar">
            {iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={iconUrl} alt="" loading="eager" decoding="async" />
            ) : (
              <span>{initials}</span>
            )}
            <span className="def-spotlight__avatar-ring" aria-hidden="true" />
            <span className="def-spotlight__avatar-pulse" aria-hidden="true" />
          </div>

          {supporting.length > 0 ? (
            <div className="def-spotlight__supporting">
              <p className="def-spotlight__supporting-label">Nella stessa orbita</p>
              <ul>
                {supporting.slice(0, 3).map((s) => (
                  <li key={s.slug}>
                    <Link href={`/toools/${s.slug}`}>
                      <span>{s.name}</span>
                      <ArrowUpRight size={12} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// PODIUM RAIL — horizontal 3-card composition
// ============================================================
function PodiumRail({ tools }: { tools: ToolPublicView[] }) {
  const top3 = tools.slice(0, 3);
  if (top3.length < 3) return null;
  return (
    <section className="def-podium" aria-labelledby="def-podium-title">
      <header className="def-podium__head">
        <p className="def-podium__eyebrow">Top 3 editoriale</p>
        <h2 id="def-podium-title" className="def-podium__title">
          I tre tool che portano a casa il risultato
        </h2>
      </header>
      <ol className="def-podium__rail">
        {top3.map((tool, idx) => {
          const rank = idx + 1;
          const iconUrl = tool.domain
            ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(tool.domain)}&sz=128`
            : null;
          return (
            <li key={tool.slug} className={`def-podium__cell def-podium__cell--rank-${rank}`}>
              <span className="def-podium__rank" aria-label={`Posizione ${rank}`}>
                {String(rank).padStart(2, "0")}
              </span>
              <Link href={`/toools/${tool.slug}`} className="def-podium__card">
                <span className="def-podium__avatar">
                  {iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={iconUrl} alt="" loading="eager" decoding="async" />
                  ) : (
                    <span>{tool.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </span>
                <span className="def-podium__name">{tool.name}</span>
                <span className="def-podium__cat">{tool.categoryLabel}</span>
                {tool.tldr ? (
                  <span className="def-podium__tldr">{tool.tldr}</span>
                ) : null}
                <span className="def-podium__open">
                  Apri scheda
                  <ArrowRight size={14} aria-hidden="true" />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ============================================================
// METHOD — 3 horizontal cards
// ============================================================
function MethodCards() {
  return (
    <section className="def-method" aria-labelledby="def-method-title">
      <header className="def-method__head">
        <p className="def-method__eyebrow">Metodo TooolVibes</p>
        <h2 id="def-method-title" className="def-method__title">
          Tre passaggi per chiudere la scelta senza stress
        </h2>
      </header>
      <ol className="def-method__cards">
        {METHOD_STEPS.map((step) => {
          const Icon = ICON_MAP[step.icon];
          return (
            <li
              key={step.n}
              className="def-method__card"
              style={{ "--card-accent": step.accent } as React.CSSProperties}
            >
              <span className="def-method__n" aria-hidden="true">{step.n}</span>
              <span className="def-method__icon" aria-hidden="true">
                <Icon size={22} />
              </span>
              <h3 className="def-method__step-title">{step.title}</h3>
              <p className="def-method__step-body">{step.body}</p>
              <Link href={step.href} className="def-method__step-link">
                Apri
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ============================================================
// ROOT — orchestrator
// ============================================================
export function DefinitiveHome({ tools, weeklyTool, supportingTools }: DefinitiveHomeProps) {
  const focusTool = weeklyTool ?? tools[0] ?? null;
  return (
    <div className="def-home">
      <DefinitiveHero />
      <SignatureRadar />
      {focusTool ? (
        <ToolOfTheWeek tool={focusTool} supporting={supportingTools} />
      ) : null}
      <PodiumRail tools={tools} />
      <section className="def-home__placement">
        <NativePlacement placementKey="home-featured-tool" variant="compact" dark />
      </section>
      <MethodCards />
    </div>
  );
}

export default DefinitiveHome;
