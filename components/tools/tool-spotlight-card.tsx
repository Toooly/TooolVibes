import type { ToolRecord } from "@/lib/types/tool";

import { ToolCard } from "@/components/tools/tool-card";

export function ToolSpotlightCard({ tool }: { tool: ToolRecord }) {
  return <ToolCard tool={tool} variant="featured" contextLabel="Spotlight archivio" />;
}
