import { cookies } from "next/headers";
import { DefinitiveHome } from "@/components/home/definitive-home";
import { ComingSoonPage } from "@/components/coming-soon/coming-soon-page";
import { releaseFeatures } from "@/lib/config/release-features";
import {
  getPublicToolViews,
  getToolSpotlightView,
} from "@/lib/data/public-tools";
import { gateCookieName } from "@/lib/gate/constants";
import { verifyGateToken } from "@/lib/gate/session";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const gateCookie = cookieStore.get(gateCookieName);
  const isGateOpen =
    !releaseFeatures.publicGate.enabled ||
    (gateCookie ? await verifyGateToken(gateCookie.value) : false);

  if (!isGateOpen) {
    return {
      title: "Coming Soon | TooolVibes",
      description: "TooolVibes sta arrivando. Lascia la tua email per essere avvisato.",
    };
  }

  return {
    title: "TooolVibes | Tool AI, SaaS, no-code e vibe coding",
    description: "Scopri i migliori tool AI, SaaS, no-code e automazioni selezionati senza rumore.",
  };
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const gateCookie = cookieStore.get(gateCookieName);
  const isGateOpen =
    !releaseFeatures.publicGate.enabled ||
    (gateCookie ? await verifyGateToken(gateCookie.value) : false);

  if (!isGateOpen) {
    return <ComingSoonPage />;
  }

  const [tools, spotlightTool] = await Promise.all([
    getPublicToolViews(),
    getToolSpotlightView(),
  ]);

  // PHASE 2.2 (2026-07-24): Definitive Home replaces VibeHomeV2.
  // The new architecture delivers 3+ major visible changes:
  //   1. Editorial single-column hero with brand glyph as decoration
  //   2. Full-width signature Radar instrument (NOT a side panel)
  //   3. Editorial Tool of the Week with score panel + actions
  //   4. Horizontal 3-card Podium (NOT vertical 3D stacked)
  //   5. Horizontal method cards
  return (
    <DefinitiveHome
      tools={tools}
      weeklyTool={spotlightTool}
    />
  );
}
