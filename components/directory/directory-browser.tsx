"use client";

import { ToolDiscoveryApp } from "@/components/directory/tool-discovery-app";
import type { DirectoryFilterGroup, DirectoryTool } from "@/lib/data/tooolvibes-directory";

type DirectoryBrowserProps = {
  tools: DirectoryTool[];
  title: string;
  description: string;
  eyebrow: string;
  initialQuery?: string;
  initialTag?: string;
  initialGroup?: DirectoryFilterGroup;
  className?: string;
};

export function DirectoryBrowser(props: DirectoryBrowserProps) {
  return <ToolDiscoveryApp {...props} />;
}
