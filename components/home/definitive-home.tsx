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
import { useOnceInView } from "@/lib/motion/use-once-in-view";
import { FeaturedPartner } from "@/components/monetization/partner-placements";
import { resolvePublicMonetizationPlacement } from "@/lib/monetization/placements";
import { HomeRadarPreview } from "@/components/radar/radar-experience";

type DefinitiveHomeProps = {
  tools: ToolPublicView[];
  weeklyTool?: ToolPublicView | null;
};

const METHOD_STEPS = [
  {
    n: "01",
    title: "Trova i candidati giusti",
    body: "Filtra il catalogo per categoria, caso d'uso e livello. Parti da una selezione più piccola e pertinente.",
    cta: "Esplora il catalogo",
    href: "/archivio",
    accent: "var(--tv-accent-primary)",
  },
  {
    n: "02",
    title: "Confronta ciò che conta",
    body: "Affianca pochi tool alla volta e valuta differenze, limiti e aderenza al tuo lavoro.",
    cta: "Apri il confronto",
    href: "/compare",
    accent: "var(--tv-accent-cyan)",
  },
  {
    n: "03",
    title: "Salva la decisione",
    body: "Conserva i candidati, aggiungi una nota e ritrova il motivo per cui hai scelto.",
    cta: "Vai ai salvati",
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

function truncate(str: string, max: number) {
  if (str.length <= max) return str;
  return str.slice(0, max).trimEnd() + "…";
}

// ============================================================
// COCKPIT — Hero + Radar in the same primary frame
// ============================================================
function Cockpit({ toolCount }: { toolCount: number }) {
  const eyebrowDesktop =
    toolCount > 0
      ? `Selezionati dalla redazione · ${toolCount} tool nel catalogo`
      : "Selezionati dalla redazione";
  const eyebrowMobile = toolCount > 0 ? `${toolCount} tool selezionati` : "Catalogo in arrivo";
  return (
    <section className="def-cockpit" aria-labelledby="def-cockpit-title">
      <div aria-hidden="true" className="def-cockpit__bg">
        <span className="tv-brand-cartograph" />
        <span className="def-cockpit__signature-arc" />
        <span className="def-cockpit__signature-node" />
      </div>
      <div className="def-cockpit__inner">
        {/* HERO — left column */}
        <div className="def-cockpit__hero">
          <p className="def-cockpit__eyebrow">
            <span className="def-cockpit__eyebrow-dot" aria-hidden="true" />
            <span className="def-cockpit__eyebrow-desktop">{eyebrowDesktop}</span>
            <span className="def-cockpit__eyebrow-mobile">{eyebrowMobile}</span>
          </p>
          <h1
            id="def-cockpit-title"
            className="def-cockpit__title"
            aria-label="Trova il tool giusto, senza perderti nel rumore."
          >
            Trova il tool giusto, senza perderti nel rumore.
          </h1>
          <p className="def-cockpit__lede">
            Esplora tool AI, SaaS e no-code selezionati e spiegati con criterio.
            Confronta le alternative, salva i candidati e conserva il motivo della
            tua scelta.
          </p>
          <div className="def-cockpit__ctas">
            <Link
              href="/archivio"
              className="def-cockpit__cta def-cockpit__cta--primary"
              aria-label="Esplora il catalogo dei tool"
            >
              Esplora il catalogo
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/compare"
              className="def-cockpit__cta def-cockpit__cta--secondary"
              aria-label="Confronta i tool selezionati"
            >
              Confronta i tool
            </Link>
            <Link
              href="/radar"
              className="def-cockpit__cta def-cockpit__cta--ghost"
              aria-label="Apri il Radar dei nuovi lanci"
            >
              Apri il Radar
            </Link>
          </div>

          {/* Complete decision journey — compact and route-driven */}
          <nav className="def-cockpit__journey" aria-label="Il tuo percorso">
            <ol>
              <li className="is-active">
                <Link href="/archivio">
                  <span aria-hidden="true">1</span>
                  <strong>Esplora</strong>
                  <em>Catalogo</em>
                </Link>
              </li>
              <li>
                <Link href="/toools">
                  <span aria-hidden="true">2</span>
                  <strong>Valuta</strong>
                  <em>Schede</em>
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
                  <em>Candidati</em>
                </Link>
              </li>
              <li>
                <Link href="/shortlist#wishlist">
                  <span aria-hidden="true">5</span>
                  <strong>Decidi</strong>
                  <em>Motivazione</em>
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
            Selezione della redazione
          </p>
          <h2 id="def-editorial-title" className="def-editorial__title">
            Un tool da guardare con più attenzione.
          </h2>
        </div>
        <div className="def-editorial__head-actions">
          <Link
            href="/archivio"
            className="def-editorial__head-link"
            aria-label="Vedi tutti i tool del catalogo"
          >
            {tools.length > 0 ? `Vedi tutti i ${tools.length} tool` : "Apri il catalogo"}
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className="def-editorial__inner">
        {/* TOOL OF THE WEEK → Selezione della redazione (claim "settimanale" rimosso 2026-08-02) */}
        <article className="def-editorial__spotlight">
          <div className="def-editorial__spot-body">
            <p className="def-editorial__spot-eyebrow">
              In primo piano
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
              {focusTool.editorialNote ||
                "Scelto dalla redazione per il taglio, non per il punteggio."}
            </p>

            <ul className="def-editorial__spot-rail" aria-label="Dettagli editoriali">
              <li>
                <span>Valutazione</span>
                <strong>
                  {editorialScore.status === "assessed"
                    ? "Valutazione editoriale"
                    : "Valutazione editoriale / In preparazione"}
                </strong>
              </li>
              <li>
                <span>Casi d&apos;uso</span>
                <strong>{focusTool.useCases.length}</strong>
              </li>
              <li>
                <span>Tempo di lettura</span>
                <strong>{focusTool.readingTime ? `${focusTool.readingTime} min` : "—"}</strong>
              </li>
            </ul>

            <div className="def-editorial__spot-actions">
              <Link
                href={`/toools/${focusTool.slug}`}
                className="def-editorial__spot-cta def-editorial__spot-cta--primary"
                aria-label="Apri la scheda dello strumento selezionato"
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
                  aria-label={
                    isAffiliateLink
                      ? `Prova ${focusTool.name} (link affiliato)`
                      : `Visita ${focusTool.name}`
                  }
                >
                  {focusTool.ctaLabel ??
                    (isAffiliateLink ? `Prova ${focusTool.name}` : `Visita ${focusTool.name}`)}
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              ) : null}
            </div>
            {isAffiliateLink ? (
              <p className="def-editorial__spot-disclosure">
                Link affiliato: potremmo ricevere una commissione, senza costi
                aggiuntivi per te.
              </p>
            ) : null}
          </div>
        </article>

        {/* CLASSIFICA / SELEZIONE ALTERNATIVA — logica condizionale
            Stato A (>= 3 valutati): classifica con rank.
            Stato B (< 3 valutati): tre tool da esplorare, senza rank. */}
        <ClassificaOrAlternativa
          tools={tools}
          iconUrl={iconUrl}
          initial={initial}
        />
      </div>
    </section>
  );
}


// ============================================================
// CLASSIFICA / SELEZIONE ALTERNATIVA — logica A/B
// Stato A: >= 3 tool con valutazione editoriale completa → podio con rank.
// Stato B: < 3 tool valutati → "Tre tool da esplorare" senza rank.
// Regola: non mostrare "Podio editoriale", posizioni, score vuoti o
// ranking quando meno di tre tool dispongono di una valutazione completa.
// ============================================================
function ClassificaOrAlternativa({
  tools,
  iconUrl,
  initial,
}: {
  tools: ToolPublicView[];
  iconUrl: (tool: ToolPublicView) => string | null;
  initial: (name: string) => string;
}) {
  const evaluated = tools.filter(
    (t) => computeEditorialScore({ publicTool: t.publicTool }).status === "assessed",
  );
  const isPodium = evaluated.length >= 3;
  const top3 = isPodium ? evaluated.slice(0, 3) : tools.slice(0, 3);

  if (isPodium) {
    return (
      <div className="def-editorial__podium" role="region" aria-label="Classifica editoriale">
        <div className="def-editorial__pod-head-row">
          <p className="def-editorial__pod-eyebrow">Classifica editoriale</p>
          <p className="def-editorial__pod-subtitle">
            I tool con la valutazione più alta.
          </p>
        </div>
        <PodiumStage top3={top3} iconUrl={iconUrl} initial={initial} />
      </div>
    );
  }

  return (
    <div className="def-editorial__podium" role="region" aria-label="Tre tool da esplorare">
      <div className="def-editorial__pod-head-row">
        <p className="def-editorial__pod-eyebrow">Dal catalogo</p>
        <p className="def-editorial__pod-subtitle">
          Tre tool da esplorare.
        </p>
      </div>
      <ul className="def-editorial__exploratory">
        {top3.map((tool) => (
          <li key={tool.slug}>
            <Link
              href={`/toools/${tool.slug}`}
              className="def-editorial__exploratory-card"
              aria-label={`Apri la scheda di ${tool.name}`}
            >
              <span className="def-editorial__exploratory-avatar" aria-hidden="true">
                {iconUrl(tool) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={iconUrl(tool)!} alt="" loading="lazy" decoding="async" />
                ) : (
                  <span>{initial(tool.name)}</span>
                )}
              </span>
              <span className="def-editorial__exploratory-name">{tool.name}</span>
              <span className="def-editorial__exploratory-cat">{tool.categoryLabel}</span>
              <span className="def-editorial__exploratory-pill">
                {computeEditorialScore({ publicTool: tool.publicTool }).status === "assessed"
                  ? "Valutato"
                  : "In valutazione"}
              </span>
              <span className="def-editorial__exploratory-cta">
                Apri la scheda
                <ArrowUpRight size={12} aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PodiumStage({
  top3,
  iconUrl,
  initial,
}: {
  top3: ToolPublicView[];
  iconUrl: (tool: ToolPublicView) => string | null;
  initial: (name: string) => string;
}) {
  const { ref, hasBeenVisible, preferReducedMotion } = useOnceInView<HTMLOListElement>({
    threshold: 0.28,
    rootMargin: "0px 0px -8% 0px",
  });
  const pending = !preferReducedMotion && !hasBeenVisible;

  return (
    <ol
      ref={ref}
      className="def-editorial__pod-stage"
      data-motion-pending={pending ? "true" : "false"}
    >
      {top3[0] ? (
        <li className="def-editorial__pod-cell def-editorial__pod-cell--first">
          <PodiumCard
            tool={top3[0]}
            rank={1}
            iconUrl={iconUrl(top3[0])}
            initial={initial(top3[0].name)}
            revealed={hasBeenVisible || preferReducedMotion}
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
            revealed={hasBeenVisible || preferReducedMotion}
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
            revealed={hasBeenVisible || preferReducedMotion}
          />
        </li>
      ) : null}
    </ol>
  );
}

function PodiumCard({
  tool,
  rank,
  iconUrl,
  initial,
  revealed = true,
}: {
  tool: ToolPublicView;
  rank: 1 | 2 | 3;
  iconUrl: string | null;
  initial: string;
  revealed?: boolean;
}) {
  const score = computeEditorialScore(tool);
  const rationale = truncate(tool.tldr || tool.shortDescription || "", rank === 1 ? 110 : 90);
  const pills: { label: string; tone: "gold" | "cyan" | "violet" }[] = [
    {
      label: score.status === "assessed" ? "Valutato" : "Da valutare",
      tone: rank === 1 ? "gold" : rank === 2 ? "cyan" : "violet",
    },
  ];
  if (tool.levelLabel) {
    pills.push({ label: tool.levelLabel, tone: rank === 1 ? "gold" : rank === 2 ? "cyan" : "violet" });
  }
  // Cap at 2 pills per card
  const visiblePills = pills.slice(0, 2);

  return (
    <Link
      href={`/toools/${tool.slug}`}
      className={`def-editorial__pod-card def-editorial__pod-card--rank-${rank}${revealed ? " is-revealed" : ""}`}
      data-rank={rank}
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

      {rationale ? (
        <span className="def-editorial__pod-rationale">{rationale}</span>
      ) : null}

      {visiblePills.length > 0 ? (
        <span className="def-editorial__pod-pills" aria-hidden="true">
          {visiblePills.map((pill, i) => (
            <span
              key={i}
              className={`def-editorial__pod-pill def-editorial__pod-pill--${pill.tone}`}
            >
              {pill.label}
            </span>
          ))}
        </span>
      ) : null}

      <span className="def-editorial__pod-score">
        <span className="def-editorial__pod-score-num">
          {score.value !== null ? score.value.toFixed(1) : "—"}
        </span>
        <span className="def-editorial__pod-score-max">
          {score.value !== null ? "/ 10" : "da valutare"}
        </span>
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
        <p className="def-method__eyebrow">Come funziona</p>
        <h2 id="def-method-title" className="def-method__title">
          Dal primo confronto a una scelta motivata.
        </h2>
        <p className="def-method__lede">
          TooolVibes ti aiuta a ridurre le alternative, confrontare ciò che
          conta e conservare il motivo della tua scelta.
        </p>
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
                {step.cta}
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
      <SponsorSection placementKey="home-featured-tool" />
    </div>
  );
}

// ============================================================
// SPONSOR SECTION — wrapper che non renderizza nulla se il partner
// è demo/fixture/placeholder. Mantiene l'eyebrow interno (PartnerMeta)
// come unica fonte di "Contenuto sponsorizzato", evitando spazi vuoti.
// ============================================================
function SponsorSection({
  placementKey,
}: {
  placementKey: Parameters<typeof FeaturedPartner>[0]["placementKey"];
}) {
  // Resolve directly so we can hide the whole section if no real partner.
  const placement = resolvePublicMonetizationPlacement(placementKey);
  if (!placement) return null;
  return (
    <section
      className="def-home__sponsor"
      aria-label="Contenuto sponsorizzato"
    >
      <div className="def-home__sponsor-frame">
        <FeaturedPartner
          placementKey={placementKey}
          className="def-home__placement"
        />
      </div>
    </section>
  );
}

export default DefinitiveHome;
