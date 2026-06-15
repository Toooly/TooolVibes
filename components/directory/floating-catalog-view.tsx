"use client";

import { MobileCatalogView } from "./mobile-catalog-view";
import type { DirectoryFilterGroup, DirectoryTool } from "@/lib/data/tooolvibes-directory";

interface FloatingCatalogViewProps {
  tools: DirectoryTool[];
  filterGroups: { key: DirectoryFilterGroup; label: string }[];
  initialQuery?: string;
  initialGroup?: DirectoryFilterGroup;
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
