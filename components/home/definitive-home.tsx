"use client";

import Link from "next/link";

import { CollectionsTeaser } from "@/components/home/collections-teaser";
import { DecisionSystem } from "@/components/home/decision-system";
import { HeroDecisionScope } from "@/components/home/hero-decision-scope";
import { IntentEntry } from "@/components/home/intent-entry";
import { RadarTeaser } from "@/components/home/radar-teaser";
import {
  StartHere,
  type HomeStackPreview,
} from "@/components/home/start-here";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { TinyAdzInlineSlot } from "@/components/ads/tinyadz-inline-slot";
import {
  FeaturedPartner,
  SponsorOpportunityLink,
} from "@/components/monetization/partner-placements";
import { resolvePublicMonetizationPlacement } from "@/lib/monetization/placements";
import { useCommercialNow } from "@/components/monetization/commercial-clock";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import type { MouseEvent } from "react";

export { formatHomeAnalysisTime, type HomeStackPreview } from "@/components/home/start-here";

type DefinitiveHomeProps = {
  tools: ToolPublicView[];
  weeklyTool?: ToolPublicView | null;
  announcement?: { text: string; href: string; image?: string | null } | null;
  stacks?: HomeStackPreview[];
};

const HERO_DESTINATIONS = [
  { href: "/archivio", label: "Catalogo", hint: "Scopri" },
  { href: "/compare", label: "Confronta", hint: "Decidi", primary: true },
  { href: "/collections", label: "Stack", hint: "Costruisci" },
  { href: "/radar", label: "Radar", hint: "Segnali" },
  { href: "/posts", label: "Guide", hint: "Leggi" },
] as const;

function ExploreCue() {
  const reduced = useReducedMotion();
  function onExplore(event: MouseEvent<HTMLAnchorElement>) {
    const target = document.getElementById("explore");
    if (!target) return;
    event.preventDefault();
    document.documentElement.dataset.tvHomeStory = "enter";
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    window.setTimeout(() => {
      delete document.documentElement.dataset.tvHomeStory;
    }, reduced ? 0 : 720);
  }
  return (
    <a className="def-cockpit__explore" href="#explore" onClick={onExplore}>
      Esplora TooolVibes
      <span aria-hidden="true">↓</span>
    </a>
  );
}

function Cockpit({
  toolCount,
  stackCount,
  tools,
}: {
  toolCount: number;
  stackCount: number;
  tools: ToolPublicView[];
}) {
  const eyebrowDesktop =
    toolCount > 0
      ? `Per chi costruisce prodotti digitali · ${toolCount} tool nel catalogo`
      : "Per chi costruisce prodotti digitali";
  return (
    <section className="def-cockpit" aria-labelledby="def-cockpit-title">
      <div aria-hidden="true" className="def-cockpit__bg">
        <span className="tv-brand-cartograph" />
      </div>
      <div className="def-cockpit__inner">
        <div className="def-cockpit__hero">
          <p className="def-cockpit__eyebrow">
            <span className="def-cockpit__eyebrow-dot" aria-hidden="true" />
            <span className="def-cockpit__eyebrow-desktop">{eyebrowDesktop}</span>
          </p>
          <h1
            id="def-cockpit-title"
            className="def-cockpit__title tv-type-hero"
            aria-label="Scegli il tool giusto. Ricordati perché."
          >
            <span className="def-cockpit__title-display">Scegli il tool giusto.</span>{" "}
            <span className="def-cockpit__title-quiet">Ricordati perché.</span>
          </h1>
          <p className="def-cockpit__lede tv-type-lead">
            <span className="def-cockpit__lede-desktop">
              Catalogo curato, confronti onesti e uno spazio dove le tue
              decisioni restano. Per chi costruisce prodotti, non liste.
            </span>
            <span className="def-cockpit__lede-mobile">
              Trova e confronta il software giusto per quello che devi fare.
            </span>
          </p>
          {toolCount > 0 ? <IntentEntry /> : null}
          <nav className="def-cockpit__destinations" aria-label="Parti da qui">
            {HERO_DESTINATIONS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "primary" in item && item.primary
                    ? "def-cockpit__dest def-cockpit__dest--primary"
                    : "def-cockpit__dest"
                }
              >
                <span className="def-cockpit__dest-hint">{item.hint}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <dl className="def-cockpit__system" aria-label="TooolVibes in numeri">
            <div className="def-cockpit__system-node">
              <dd className="def-cockpit__system-value">{toolCount}</dd>
              <dt className="def-cockpit__system-label">
                <Link href="/archivio">Tool in catalogo</Link>
              </dt>
            </div>
            <div className="def-cockpit__system-node">
              <dd className="def-cockpit__system-value">{stackCount}</dd>
              <dt className="def-cockpit__system-label">
                <Link href="/collections">Stack curati</Link>
              </dt>
            </div>
            <div className="def-cockpit__system-node def-cockpit__system-node--live">
              <dd className="def-cockpit__system-value">
                <span className="def-cockpit__system-pulse" aria-hidden="true" />
                Live
              </dd>
              <dt className="def-cockpit__system-label">
                <Link href="/radar">Segnali Radar</Link>
              </dt>
            </div>
          </dl>
        </div>
        <div className="def-cockpit__scope" aria-hidden="true">
          <HeroDecisionScope tools={tools} />
        </div>
      </div>
      <ExploreCue />
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
      <Cockpit toolCount={tools.length} stackCount={stacks.length} tools={tools} />
      <StartHere focusTool={focusTool} tools={tools} />
      <DecisionSystem tools={tools} />
      <RadarTeaser />
      <CollectionsTeaser stacks={stacks} />
      <TinyAdzInlineSlot placement="home-editorial" />
      <SponsorSection placementKey="home-featured-tool" />
    </div>
  );
}

function SponsorSection({
  placementKey,
}: {
  placementKey: Parameters<typeof FeaturedPartner>[0]["placementKey"];
}) {
  const now = useCommercialNow();
  const placement = resolvePublicMonetizationPlacement(placementKey, { now });
  if (!placement) return null;
  return (
    <section
      className="def-home__sponsor tv-partner-signal"
      aria-label="Partner Experience"
    >
      <p className="tv-partner-signal__label">Partner Experience · Sponsorizzato</p>
      <div className="def-home__sponsor-frame tv-partner-signal__shell">
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
