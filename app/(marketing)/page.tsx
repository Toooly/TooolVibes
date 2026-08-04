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
    title: "Scegli il tuo stack",
    description:
      "Il workspace decisionale per chi costruisce prodotti digitali: confronta tool AI, SaaS e no-code, scegli il tuo stack e conserva il motivo di ogni scelta.",
    path: "/",
    openGraphTitle: "TooolVibes · Scegli il tuo stack con criterio",
    openGraphDescription:
      "Un sistema decisionale per tool AI, SaaS e no-code: esplora alternative, confronta trade-off e salva decisioni motivate.",
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
