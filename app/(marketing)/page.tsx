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
    title: "TooolVibes | Catalogo di tool AI, SaaS e no-code",
    description:
      "Scopri, confronta e salva tool AI, SaaS e no-code selezionati dalla redazione. Riduci il rumore e scegli con più contesto.",
    path: "/",
    openGraphTitle: "TooolVibes · Trova e confronta i tool giusti",
    openGraphDescription:
      "Un catalogo editoriale di tool AI, SaaS e no-code per esplorare alternative, confrontare differenze e salvare decisioni motivate.",
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
