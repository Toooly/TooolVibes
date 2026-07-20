"use client";

import { MobileCatalogView } from "./mobile-catalog-view";
import type { ToolFilterGroup, ToolPublicView } from "@/lib/data/tool-public-view";
import type { CatalogLevelFilter } from "./catalog/catalog-controller";

interface FloatingCatalogViewProps {
  tools: ToolPublicView[];
  filterGroups: ToolFilterGroup[];
  initialQuery?: string;
  initialGroup?: string;
  initialTag?: string;
  initialLevel?: CatalogLevelFilter;
  unifiedSearchEnabled?: boolean;
  showIntro?: boolean;
}

export function FloatingCatalogView({
  tools,
  filterGroups,
  initialQuery = "",
  initialGroup = "all",
  initialTag = "",
  initialLevel = "all",
  unifiedSearchEnabled = true,
  showIntro = true,
}: FloatingCatalogViewProps) {
  return (
    <MobileCatalogView
      tools={tools}
      filterGroups={filterGroups}
      initialQuery={initialQuery}
      initialGroup={initialGroup}
      initialTag={initialTag}
      initialLevel={initialLevel}
      unifiedSearchEnabled={unifiedSearchEnabled}
      showIntro={showIntro}
    />
  );
}
