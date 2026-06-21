import type { Metadata } from "next";

import { MobileCompareView } from "@/components/tools/mobile-compare-view";
import { getPublishedTools } from "@/lib/data/public-tools";
import { directoryTools } from "@/lib/data/tooolvibes-directory";

export const metadata: Metadata = {
  title: "Confronto tool",
  description: "Confronta tool salvati e alternative per scegliere lo stack piu adatto.",
  alternates: { canonical: "/compare" },
};

export default async function ComparePage() {
  const tools = await getPublishedTools();

  return <MobileCompareView directoryTools={directoryTools} legacyTools={tools} />;
}
