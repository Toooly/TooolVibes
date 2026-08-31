import { DefinitiveHome } from "@/components/home/definitive-home";
import { ComingSoonPage } from "@/components/coming-soon/coming-soon-page";
import {
  getPublicToolViews,
  getToolSpotlightView,
} from "@/lib/data/public-tools";
import { isPublicProductOpen } from "@/lib/gate/public-product-open";
import { createPublicPageMetadata } from "@/lib/seo/metadata";
import { getHomepageControls } from "@/lib/content/homepage-controls";

export async function generateMetadata() {
  const isGateOpen = isPublicProductOpen();

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
  const isGateOpen = isPublicProductOpen();

  if (!isGateOpen) {
    return <ComingSoonPage />;
  }

  const [tools, spotlightTool] = await Promise.all([
    getPublicToolViews(),
    getToolSpotlightView(),
  ]);
  const homepage = getHomepageControls();
  const featured = homepage.featuredToolSlug
    ? tools.find((tool) => tool.slug === homepage.featuredToolSlug) ?? spotlightTool
    : spotlightTool;

  return (
    <DefinitiveHome
      tools={tools}
      weeklyTool={featured}
      announcement={homepage.announcement.enabled ? homepage.announcement : null}
    />
  );
}
