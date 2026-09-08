import { DefinitiveHome } from "@/components/home/definitive-home";
import { ComingSoonPage } from "@/components/coming-soon/coming-soon-page";
import {
  getPublicToolViews,
  getToolSpotlightView,
} from "@/lib/data/public-tools";
import { isPublicProductOpen } from "@/lib/gate/public-product-open";
import { createPublicPageMetadata } from "@/lib/seo/metadata";
import { getHomepageControls } from "@/lib/content/homepage-controls";
import { getCuratedCollections, getFeaturedCollections } from "@/lib/data/public-collections";

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
    return <ComingSoonPage year={new Date().getFullYear()} />;
  }

  const [tools, spotlightTool, featuredStacks, allStacks] = await Promise.all([
    getPublicToolViews(),
    getToolSpotlightView(),
    getFeaturedCollections(),
    getCuratedCollections(),
  ]);
  const homepage = getHomepageControls();
  const featured = homepage.featuredToolSlug
    ? tools.find((tool) => tool.slug === homepage.featuredToolSlug) ?? spotlightTool
    : spotlightTool;

  const selectedStacks = [...featuredStacks];
  for (const stack of allStacks) {
    if (selectedStacks.length >= 3) break;
    if (!selectedStacks.some((item) => item.slug === stack.slug)) {
      selectedStacks.push(stack);
    }
  }

  return (
    <DefinitiveHome
      tools={tools}
      weeklyTool={featured}
      announcement={homepage.announcement.enabled ? homepage.announcement : null}
      stacks={selectedStacks.slice(0, 3).map((stack) => {
        const cores = stack.included_tools.filter((slot) => slot.is_core).slice(0, 3);
        const nodes = (cores.length >= 2 ? cores : stack.included_tools).slice(0, 3);
        return {
          slug: stack.slug,
          title: stack.title,
          kicker: stack.cover_kicker ?? "Stack",
          description: stack.description,
          outcome: stack.stack_meta?.concise_promise ?? stack.rationale ?? stack.description,
          setupTime: stack.stack_meta?.setup_time ?? null,
          cost: stack.stack_meta?.monthly_cost_band ?? null,
          stages: nodes.map((slot) => ({
            label: slot.stage ?? slot.role,
            name: slot.tool.name,
          })),
        };
      })}
    />
  );
}
