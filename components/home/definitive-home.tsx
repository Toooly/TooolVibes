"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
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
  tools,
}: {
  toolCount: number;
  tools: ToolPublicView[];
}) {
  return (
    <section className="def-cockpit" aria-labelledby="def-cockpit-title">
      <div className="def-cockpit__inner">
        <div className="def-cockpit__hero">
          <LocalizedAttributes><h1
            id="def-cockpit-title"
            className="def-cockpit__title"
            aria-label="Scegli il tool giusto. Ricorda perché."
          ><LocalizedText>{"Scegli il tool giusto. Ricorda perché. "}</LocalizedText></h1></LocalizedAttributes>
          <p className="def-cockpit__lede">
            <span className="def-cockpit__lede-desktop"><LocalizedText>{"Recensioni indipendenti, confronti chiari e guide pratiche per il tuo lavoro con l'AI. "}</LocalizedText></span>
            <span className="def-cockpit__lede-mobile"><LocalizedText>{"Recensioni indipendenti, confronti chiari e guide pratiche per il tuo lavoro con l'AI. "}</LocalizedText></span>
          </p>
          {toolCount > 0 ? <IntentEntry /> : null}
        </div>
        <div className="def-cockpit__scope" aria-hidden="true">
          <HeroDecisionScope tools={tools} />
        </div>
      </div>
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
              <LocalizedAttributes><img src={announcement.image} alt="" className="def-home__announcement-media" /></LocalizedAttributes>
            ) : null}
            <span><LocalizedText>{announcement.text}</LocalizedText></span>
          </a>
        </p>
      ) : null}
      <Cockpit toolCount={tools.length} tools={tools} />
      <StartHere focusTool={focusTool} tools={tools} stacks={stacks} />
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
    <LocalizedAttributes><section
      className="def-home__sponsor tv-partner-signal"
      aria-label="Partner Experience"
    >
      <p className="tv-partner-signal__label"><LocalizedText>{"Partner Experience · Sponsorizzato"}</LocalizedText></p>
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
    </section></LocalizedAttributes>
  );
}

export default DefinitiveHome;
