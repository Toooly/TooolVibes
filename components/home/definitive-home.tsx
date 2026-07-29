"use client";

/**
 * TooolVibes — Definitive Home (v4, 2026-07-24)
 *
 * v4 — Stronger composition density.
 *
 *   1. HERO + RADAR COCKPIT — one dark command surface, two columns.
 *      The compact Radar consumes the same truthful state model and responsive
 *      instrument as the full route.
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
 * Preserved from earlier passes:
 *   - monumental Home H1 with a restrained violet emphasis on "rumore"
 *   - real Product Hunt data binding (no fabrication)
 *   - factual Radar empty state
 *   - state-meaningful motion only while the feed is genuinely live
 *   - 44px touch targets minimum (48px primary CTAs)
 *   - new shell component owners
 *   - prefers-reduced-motion
 */

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { computeEditorialScore } from "@/lib/data/editorial-score";
import { FeaturedPartner } from "@/components/monetization/partner-placements";
import { HomeRadarPreview } from "@/components/radar/radar-experience";

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

function hasAffiliateSignal(href: string | null | undefined) {
  if (!href) return false;

  try {
    const url = new URL(href);
    return ["aff", "affiliate", "ref", "referral", "via"].some((key) =>
      url.searchParams.has(key),
    );
  } catch {
    return false;
  }
}

// ============================================================
// COCKPIT — Hero + Radar in the same primary frame
// ============================================================
function Cockpit({ toolCount }: { toolCount: number }) {
  return (
    <section className="def-cockpit" aria-labelledby="def-cockpit-title">
      <div aria-hidden="true" className="def-cockpit__bg" />
      <div className="def-cockpit__inner">
        {/* HERO — left column */}
        <div className="def-cockpit__hero">
          <p className="def-cockpit__eyebrow">
            <span className="def-cockpit__eyebrow-dot" aria-hidden="true" />
            {toolCount > 0
              ? `Curatela indipendente · ${toolCount} tool verificati`
              : "Curatela indipendente · catalogo in aggiornamento"}
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
              Apri Radar
            </Link>
          </div>

          {/* Complete decision journey — compact and route-driven */}
          <nav className="def-cockpit__journey" aria-label="Il tuo percorso">
            <ol>
              <li className="is-active">
                <Link href="/archivio">
                  <span aria-hidden="true">1</span>
                  <strong>Scopri</strong>
                  <em>Catalogo</em>
                </Link>
              </li>
              <li>
                <Link href="/archivio?sort=score_desc">
                  <span aria-hidden="true">2</span>
                  <strong>Valuta</strong>
                  <em>Prove</em>
                </Link>
              </li>
              <li>
                <Link href="/compare">
                  <span aria-hidden="true">3</span>
                  <strong>Confronta</strong>
                  <em>Differenze</em>
                </Link>
              </li>
              <li>
                <Link href="/shortlist">
                  <span aria-hidden="true">4</span>
                  <strong>Salva</strong>
                  <em>Lista</em>
                </Link>
              </li>
              <li>
                <Link href="/collections">
                  <span aria-hidden="true">5</span>
                  <strong>Decidi</strong>
                  <em>Raccolte</em>
                </Link>
              </li>
            </ol>
          </nav>
        </div>

        <div className="def-cockpit__radar">
          <HomeRadarPreview />
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
  const isAffiliateLink =
    Boolean(focusTool.affiliateUrl) || hasAffiliateSignal(focusTool.url);
  return (
    <section className="def-editorial" aria-labelledby="def-editorial-title">
      <div aria-hidden="true" className="def-editorial__traces" />
      <header className="def-editorial__head">
        <div>
          <p className="def-editorial__eyebrow">
            Verdetto editoriale · selezione settimanale
          </p>
          <h2 id="def-editorial-title" className="def-editorial__title">
            La scrivania dove il tool della settimana incontra il podio.
          </h2>
        </div>
        <div className="def-editorial__head-actions">
          <Link
            href="/archivio"
            className="def-editorial__head-link"
          >
            {tools.length > 0 ? `Tutti i ${tools.length} tool` : "Apri il catalogo"}
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
            <p className="def-editorial__distinction">
              Il focus settimanale è una scelta contestuale della redazione:
              non coincide automaticamente con il primo posto del podio.
            </p>

            <ul className="def-editorial__spot-rail" aria-label="Metriche chiave">
              <li>
                <span>Score</span>
                <strong>{editorialScore.value.toFixed(1)}</strong>
              </li>
              <li>
                <span>Casi d&apos;uso</span>
                <strong>{focusTool.useCases.length}</strong>
              </li>
              <li>
                <span>Lettura</span>
                <strong>{focusTool.readingTime ?? "—"}</strong>
              </li>
              <li>
                <span>Fascia</span>
                <strong>{editorialScore.label}</strong>
              </li>
            </ul>

            <div className="def-editorial__spot-actions">
              <Link
                href={`/toools/${focusTool.slug}`}
                className="def-editorial__spot-cta def-editorial__spot-cta--primary"
              >
                Apri la scheda
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
              {focusTool.url ? (
                <a
                  href={focusTool.url}
                  target="_blank"
                  rel={
                    isAffiliateLink
                      ? "sponsored noopener noreferrer"
                      : "noopener noreferrer"
                  }
                  className="def-editorial__spot-cta def-editorial__spot-cta--ghost"
                >
                  {focusTool.ctaLabel ?? "Sito ufficiale"}
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              ) : null}
            </div>
            {isAffiliateLink ? (
              <p className="def-editorial__spot-disclosure">
                Link partner: potremmo ricevere una commissione senza costi
                extra per te.
              </p>
            ) : null}
          </div>
        </article>

        {/* PODIUM — v4: true 3-stage tower composition */}
        <div className="def-editorial__podium" role="region" aria-label="Podio editoriale">
          <div className="def-editorial__pod-head-row">
            <p className="def-editorial__pod-eyebrow">Podio editoriale</p>
            <p className="def-editorial__pod-subtitle">
              Ranking del catalogo attivo, con lo score di ogni profilo.
            </p>
          </div>
          <ol className="def-editorial__pod-stage">
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
      <ol className="def-method__rail">
        {METHOD_STEPS.map((step, index) => (
          <li
            key={step.n}
            className="def-method__step"
            style={{ "--card-accent": step.accent } as React.CSSProperties}
          >
            <span className="def-method__n" aria-hidden="true">{step.n}</span>
            <div className="def-method__copy">
              <h3 className="def-method__step-title">{step.title}</h3>
              <p className="def-method__step-body">{step.body}</p>
              <Link href={step.href} className="def-method__step-link">
                Continua
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            {index < METHOD_STEPS.length - 1 ? (
              <span className="def-method__divider" aria-hidden="true" />
            ) : null}
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
      <Cockpit toolCount={tools.length} />
      <IvoryEditorial focusTool={focusTool} tools={tools} />
      <Method />
      <FeaturedPartner
        placementKey="home-featured-tool"
        className="def-home__placement"
      />
    </div>
  );
}

export default DefinitiveHome;
