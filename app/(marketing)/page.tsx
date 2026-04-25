import { FeaturedWeek } from "@/components/sections/featured-week";
import { HeroSection } from "@/components/sections/hero-section";
import { HomeCollectionsSection } from "@/components/sections/home-collections-section";
import { HomeDiscoveryLayer } from "@/components/sections/home-discovery-layer";
import { getFeaturedCollections } from "@/lib/data/public-collections";
import { getFeaturedTools, getPublishedTools } from "@/lib/data/public-tools";

export default async function HomePage() {
  const [featuredTools, allTools, featuredCollections] = await Promise.all([
    getFeaturedTools(),
    getPublishedTools(),
    getFeaturedCollections(),
  ]);

  return (
    <div className="tone-orient space-y-9 pb-18 sm:space-y-12 sm:pb-22 lg:space-y-[3.75rem]">
      <HeroSection />

      <HomeDiscoveryLayer tools={allTools} />

      <FeaturedWeek tools={featuredTools} />

      <HomeCollectionsSection collections={featuredCollections} />
    </div>
  );
}
