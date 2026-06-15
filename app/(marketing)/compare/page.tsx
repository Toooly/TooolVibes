import { MobileCompareView } from "@/components/tools/mobile-compare-view";
import { getPublishedTools } from "@/lib/data/public-tools";
import { directoryTools } from "@/lib/data/tooolvibes-directory";

export default async function ComparePage() {
  const tools = await getPublishedTools();

  return <MobileCompareView directoryTools={directoryTools} legacyTools={tools} />;
}
