import { cookies } from "next/headers";
import { Home3DHero } from "@/components/3d-maestoso/home-3d-hero";
import { VibeHomeV2 } from "@/components/home/vibe-home-v2";
import { ComingSoonPage } from "@/components/coming-soon/coming-soon-page";
import { homeExperience } from "@/lib/config/home-experience";
import { releaseFeatures } from "@/lib/config/release-features";
import {
  getFeaturedToolViews,
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

  const [tools, spotlightTool, featuredTools] = await Promise.all([
    getPublicToolViews(),
    getToolSpotlightView(),
    getFeaturedToolViews(5),
  ]);
  const supportingTools = featuredTools.filter(
    (tool) => tool.slug !== spotlightTool?.slug,
  );

  // BATCH 40 (MOB-704): layout home flaggabile (pattern B04). Default
  // "time-to-value": hero compatto con CTA + chip tool nel primo viewport e
  // discovery stage a flusso; "legacy" ripristina la composizione precedente.
  const homeLayout = homeExperience.layout;

  return (
    <>
      {releaseFeatures.threeD.enabled && (
        <Home3DHero tools={tools} weeklyTool={spotlightTool} />
      )}
      {/* FIX-1: showDiscoveryHero prop rimosso. Il MobileHeroSolar (discovery
          stage) viene SEMPRE renderizzato nella composizione, indipendentemente
          da releaseFeatures.threeD.enabled. La feature 3D desktop (Home3DHero)
          è nascosta da CSS sotto 768px e può coesistere con l'hero mobile nel
          render tree. */}
      <VibeHomeV2
        tools={tools}
        weeklyTool={spotlightTool}
        supportingTools={supportingTools.slice(0, 4)}
        layout={homeLayout}
      />
    </>
  );
}
