"use client";

import { MobileCatalogView } from "./mobile-catalog-view";
import type { ToolFilterGroup, ToolPublicView } from "@/lib/data/tool-public-view";

interface FloatingCatalogViewProps {
  tools: ToolPublicView[];
  filterGroups: ToolFilterGroup[];
  initialQuery?: string;
  initialGroup?: string;
  initialTag?: string;
}

export function FloatingCatalogView({
  tools,
  filterGroups,
  initialQuery = "",
  initialGroup = "all",
  initialTag = "",
}: FloatingCatalogViewProps) {
  return (
    <MobileCatalogView
      tools={tools}
      filterGroups={filterGroups}
      initialQuery={initialQuery}
      initialGroup={initialGroup}
      initialTag={initialTag}
    />
  );
}
