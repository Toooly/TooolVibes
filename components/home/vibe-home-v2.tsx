"use client";

import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import { HomeHeroSection } from "./home-hero-section";
import { HomeRoutesSection } from "./home-routes-section";
import { HomeDiscoverSection } from "./home-discover-section";
import { HomeWeeklySection } from "./home-weekly-section";
import { HomeLevelsSection } from "./home-levels-section";
import { HomeFinalSection } from "./home-final-section";

type VibeHomeV2Props = {
  tools: DirectoryTool[];
  weeklyTool?: DirectoryTool | null;
  supportingTools: DirectoryTool[];
};

export function VibeHomeV2({ tools, weeklyTool, supportingTools }: VibeHomeV2Props) {
  return (
    <div className="relative">
      <HomeHeroSection tools={tools} weeklyTool={weeklyTool} supportingTools={supportingTools} />
      <HomeRoutesSection />
      <HomeDiscoverSection />
      <HomeWeeklySection tool={weeklyTool} />
      <HomeLevelsSection tools={tools} />
      <HomeFinalSection />
    </div>
  );
}
