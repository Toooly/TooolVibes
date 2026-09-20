"use client";

import Link from "next/link";

import { DecisionJourney } from "@/components/home/decision-journey";
import { HeroDecisionScope } from "@/components/home/hero-decision-scope";
import { IntentEntry } from "@/components/home/intent-entry";
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

export { formatHomeAnalysisTime, type HomeStackPreview } from "@/components/home/start-here";

type DefinitiveHomeProps = {
  tools: ToolPublicView[];
  weeklyTool?: ToolPublicView | null;
  announcement?: { text: string; href: string; image?: string | null } | null;
  stacks?: HomeStackPreview[];
};

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
            className="def-cockpit__title"
            aria-label="Scegli il tool giusto. Ricorda perché."
          >
            Scegli il tool giusto. Ricorda perché.
          </h1>
          <p className="def-cockpit__lede">
            <span className="def-cockpit__lede-desktop">
              Scopri tool AI, SaaS e no-code selezionati, confronta alternative
              e trade-off, costruisci il tuo stack e conserva il motivo di ogni
              scelta.
            </span>
            <span className="def-cockpit__lede-mobile">
              Trova e confronta il software giusto per quello che devi fare.
            </span>
          </p>
          {toolCount > 0 ? <IntentEntry /> : null}
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
                <Link href="/collections">Raccolte curate</Link>
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
    </section>
  );
}

function Method() {
  return (
    <section className="def-method" aria-labelledby="def-method-title">
      <header className="def-method__head">
        <h2 id="def-method-title" className="def-method__title">
          Dal primo confronto a una scelta motivata.
        </h2>
        <p className="def-method__lede">
          Cinque tappe. Una sola attiva.{" "}
          <Link href="/metodo">Come valutiamo</Link>
        </p>
      </header>
      <DecisionJourney />
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
      <StartHere focusTool={focusTool} tools={tools} stacks={stacks} />
      <TinyAdzInlineSlot placement="home-editorial" />
      <Method />
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
