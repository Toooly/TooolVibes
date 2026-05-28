import { DesktopVibeHome } from "@/components/desktop/desktop-vibe-home";
import { MobileVibeHome } from "@/components/home/mobile-vibe-home";
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
      <DesktopVibeHome tools={directoryTools} weeklyTool={weeklyTool} />
      <MobileVibeHome
        tools={directoryTools}
        weeklyTool={weeklyTool}
        supportingTools={supportingTools.slice(0, 4)}
      />
    </>
  );
}
