import { Home3DHero } from "@/components/3d-maestoso/home-3d-hero";
import { VibeHomeV2 } from "@/components/home/vibe-home-v2";
import {
  directoryTools,
  getFeaturedDirectoryTools,
  getToolOfTheWeek,
} from "@/lib/data/tooolvibes-directory";

export default function HomePage() {
  const weeklyTool = getToolOfTheWeek();
  const supportingTools = getFeaturedDirectoryTools(4).filter(
    (tool) => tool.slug !== weeklyTool?.slug,
  );

  return (
    <>
      <Home3DHero tools={directoryTools} weeklyTool={weeklyTool} />
      <VibeHomeV2
        tools={directoryTools}
        weeklyTool={weeklyTool}
        supportingTools={supportingTools.slice(0, 4)}
      />
    </>
  );
}
