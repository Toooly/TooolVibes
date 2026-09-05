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

import { DecisionJourney } from "@/components/home/decision-journey";
import { IntentEntry } from "@/components/home/intent-entry";
import { formatDecisionLifecycle } from "@/lib/product/decision-lifecycle";
import {
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { computeEditorialScore } from "@/lib/data/editorial-score";
import { useOnceInView } from "@/lib/motion/use-once-in-view";
import { TinyAdzInlineSlot } from "@/components/ads/tinyadz-inline-slot";
import {
  FeaturedPartner,
  SponsorOpportunityLink,
} from "@/components/monetization/partner-placements";
import { resolvePublicMonetizationPlacement } from "@/lib/monetization/placements";
import { useCommercialNow } from "@/components/monetization/commercial-clock";
import { HomeRadarPreview } from "@/components/radar/radar-experience";

export function formatHomeAnalysisTime(raw: string | null | undefined) {
  const value = raw?.trim() ?? "";
  if (!value) return "—";
  if (/min/i.test(value)) return value;
  return `${value} min`;
}


type DefinitiveHomeProps = {
  tools: ToolPublicView[];
  weeklyTool?: ToolPublicView | null;
  announcement?: { text: string; href: string; image?: string | null } | null;
  stacks?: HomeStackPreview[];
};

const METHOD_STEPS = [
  {
    n: "01",
    title: "Scopri e valuta",
    body: "Parti da un obiettivo, non da una categoria. Riduci i candidati e leggi cosa è per te.",
    cta: "Apri il catalogo",
    href: "/archivio",
    accent: "var(--tv-accent-primary)",
  },
  {
    n: "02",
    title: "Confronta i trade-off",
    body: "Due-cinque tool, differenze e limiti visibili. Niente tabelle infinite.",
    cta: "Apri il confronto",
    href: "/compare",
    accent: "var(--tv-accent-cyan)",
  },
  {
    n: "03",
    title: "Decidi e ricorda il perché",
    body: "Salvare è una shortlist. Decidere è scegliere un tool, rispetto ad altri, per un motivo.",
    cta: "Vai ai salvati",
    href: "/shortlist",
    accent: "var(--tv-accent-gold)",
  },
] as const;

export type HomeStackPreview = {
  slug: string;
  title: string;
  kicker: string;
  description: string;
};

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
      ? `Per chi costruisce prodotti digitali · ${toolCount} tool nel catalogo`
      : "Per chi costruisce prodotti digitali";
  const eyebrowMobile = toolCount > 0 ? `${toolCount} tool da valutare` : "Catalogo in arrivo";
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
            aria-label="Scegli il tool giusto. Ricordati perché."
          >
            Scegli il tool giusto. Ricordati perché.
          </h1>
          <p className="def-cockpit__lede">
            Catalogo curato, confronti onesti e uno spazio dove le tue
            decisioni restano. Per chi costruisce prodotti, non liste.
          </p>
          {toolCount > 0 ? <IntentEntry /> : null}

          <div className="def-cockpit__ctas">
            <Link
              href={toolCount > 0 ? "/archivio" : "/metodo"}
              className="def-cockpit__cta def-cockpit__cta--primary"
              aria-label={toolCount > 0 ? "Esplora il catalogo dei tool" : "Scopri il metodo TooolVibes"}
            >
              {toolCount > 0 ? "Esplora il catalogo" : "Scopri il metodo"}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/collections"
              className="def-cockpit__cta def-cockpit__cta--secondary"
              aria-label="Sfoglia gli stack curati"
            >
              Parti da uno stack
            </Link>
          </div>

          <p className="def-cockpit__promise">{formatDecisionLifecycle()}</p>

          <DecisionJourney />
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
            In evidenza
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
                "Scelta per il taglio, non per il punteggio."}
            </p>

            <ul className="def-editorial__spot-rail" aria-label="Dettagli editoriali">
              <li>
                <span>Valutazione editoriale</span>
                <strong>
                  {editorialScore.status === "assessed" && editorialScore.value !== null
                    ? `${editorialScore.value.toFixed(1)} / 10`
                    : "In preparazione"}
                </strong>
              </li>
              <li>
                <span>Casi d&apos;uso</span>
                <strong>{focusTool.useCases.length}</strong>
              </li>
              <li>
                <span>Tempo di analisi</span>
                <strong>{formatHomeAnalysisTime(focusTool.readingTime)}</strong>
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
  const evaluated = tools
    .map((tool) => ({
      tool,
      score: computeEditorialScore({ publicTool: tool.publicTool, cautions: tool.cautions }),
    }))
    .filter((item) => item.score.status === "assessed" && item.score.value !== null)
    .sort((left, right) => (right.score.value ?? 0) - (left.score.value ?? 0))
    .map((item) => item.tool);
  const isPodium = evaluated.length >= 3;
  const top3 = isPodium ? evaluated.slice(0, 3) : tools.slice(0, 3);

  if (isPodium) {
    return (
      <div className="def-editorial__podium" role="region" aria-label="Valutazioni editoriali">
        <div className="def-editorial__pod-head-row">
          <p className="def-editorial__pod-eyebrow">Valutazioni editoriali</p>
          <p className="def-editorial__pod-subtitle">
            Ordinate per valutazione della redazione, non per un ranking di mercato.
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
      <ExploratoryPodium top3={top3} iconUrl={iconUrl} initial={initial} />
    </div>
  );
}

// ============================================================
// PODIUM GEOMETRY (Stato B) — "Tre tool da esplorare".
// Ripristina la silhouette da podio (card centrale elevata, due
// laterali più basse) recuperata dalla struttura storica, MA senza
// mostrare punteggi numerici, posizioni o ranking. Il blocco resta
// una selezione dal catalogo, non una classifica basata su score.
// ============================================================
function ExploratoryPodium({
  top3,
  iconUrl,
  initial,
}: {
  top3: ToolPublicView[];
  iconUrl: (tool: ToolPublicView) => string | null;
  initial: (name: string) => string;
}) {
  return (
    <ol className="def-editorial__pod-stage def-editorial__exploratory-stage">
      {top3[0] ? (
        <li className="def-editorial__pod-cell def-editorial__pod-cell--first">
          <ExploratoryCard
            tool={top3[0]}
            iconUrl={iconUrl(top3[0])}
            initial={initial(top3[0].name)}
          />
        </li>
      ) : null}
      {top3[1] ? (
        <li className="def-editorial__pod-cell def-editorial__pod-cell--second">
          <ExploratoryCard
            tool={top3[1]}
            iconUrl={iconUrl(top3[1])}
            initial={initial(top3[1].name)}
          />
        </li>
      ) : null}
      {top3[2] ? (
        <li className="def-editorial__pod-cell def-editorial__pod-cell--third">
          <ExploratoryCard
            tool={top3[2]}
            iconUrl={iconUrl(top3[2])}
            initial={initial(top3[2].name)}
          />
        </li>
      ) : null}
    </ol>
  );
}

function ExploratoryCard({
  tool,
  iconUrl,
  initial,
}: {
  tool: ToolPublicView;
  iconUrl: string | null;
  initial: string;
}) {
  return (
    <Link
      href={`/toools/${tool.slug}`}
      className="def-editorial__exploratory-card"
      aria-label={`Apri la scheda di ${tool.name}`}
    >
      <span className="def-editorial__exploratory-avatar" aria-hidden="true">
        {iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={iconUrl} alt="" loading="lazy" decoding="async" />
        ) : (
          <span>{initial}</span>
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
      <span className="def-editorial__pod-rank" aria-label={`Valutazione editoriale ${rank}`}>
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
          conta e conservare il motivo della tua scelta.{" "}
          <Link href="/metodo">Come valutiamo</Link>
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
function HomeStacks({ stacks }: { stacks: HomeStackPreview[] }) {
  if (stacks.length === 0) return null;
  return (
    <section className="def-stacks" aria-labelledby="def-stacks-title">
      <header className="def-stacks__head">
        <p className="def-stacks__eyebrow">Stack curati</p>
        <h2 id="def-stacks-title">Se ti serve una combinazione, parti da qui.</h2>
        <p className="def-stacks__lede">
          Raccolte operative: ruolo di ogni tool, limiti e quando non usarle.
        </p>
      </header>
      <ul className="def-stacks__grid">
        {stacks.map((stack) => (
          <li key={stack.slug}>
            <Link href={`/collections/${stack.slug}`} className="def-stacks__card">
              <span>{stack.kicker}</span>
              <strong>{stack.title}</strong>
              <em>{stack.description}</em>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/collections" className="def-stacks__more">
        Tutte le raccolte
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </section>
  );
}

export function DefinitiveHome({
  tools,
  weeklyTool,
  announcement = null,
  stacks = [],
}: DefinitiveHomeProps) {
  const focusTool = weeklyTool ?? tools[0] ?? null;
  return (
    <div className="def-home">
      {announcement ? (
        <p className="def-home__announcement">
          <a href={announcement.href}>
            {announcement.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={announcement.image} alt="" className="def-home__announcement-media" />
            ) : null}
            <span>{announcement.text}</span>
          </a>
        </p>
      ) : null}
      <Cockpit toolCount={tools.length} />
      <HomeStacks stacks={stacks} />
      <IvoryEditorial focusTool={focusTool} tools={tools} />
      <TinyAdzInlineSlot placement="home-editorial" />
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
  const now = useCommercialNow();
  // Resolve directly so we can hide the whole section if no real partner.
  const placement = resolvePublicMonetizationPlacement(placementKey, { now });
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
          trackerRoute="/"
        />
      </div>
      <div className="def-home__sponsor-opportunity">
        <SponsorOpportunityLink placementId="home-sponsor-opportunity" route="/" />
      </div>
    </section>
  );
}

export default DefinitiveHome;
