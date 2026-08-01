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
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const gateCookie = cookieStore.get(gateCookieName);
  const isGateOpen =
    !releaseFeatures.publicGate.enabled ||
    (gateCookie ? await verifyGateToken(gateCookie.value) : false);

  if (!isGateOpen) {
    return {
      title: "Coming Soon",
      description: "TooolVibes sta arrivando. Lascia la tua email per essere avvisato.",
      robots: { index: false, follow: false },
    };
  }

  return createPublicPageMetadata({
    title: "Tool AI, SaaS, no-code e vibe coding",
    description:
      "Scopri i migliori tool AI, SaaS, no-code e automazioni selezionati senza rumore.",
    path: "/",
    openGraphTitle: "TooolVibes | Tool AI, SaaS, no-code e vibe coding",
  });
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

  return (
    <DefinitiveHome
      tools={tools}
      weeklyTool={spotlightTool}
    />
  );
}
