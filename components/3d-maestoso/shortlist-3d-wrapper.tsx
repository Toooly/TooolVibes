"use client";

import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import { directoryTools } from "@/lib/data/tooolvibes-directory";
import { Shortlist3DVault } from "./shortlist-3d-vault";

export function Shortlist3DWrapper() {
  const savedSlugs = useToolWorkspaceStore((s) => s.savedSlugs);
  const savedTools = directoryTools.filter((t) => savedSlugs.includes(t.slug));

  return <Shortlist3DVault savedTools={savedTools} />;
}
