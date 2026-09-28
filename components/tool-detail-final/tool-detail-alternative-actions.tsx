"use client";

import Link from "next/link";

import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

export function ToolDetailAlternativeActions({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const toggleCompare = useToolWorkspaceStore((state) => state.toggleCompare);
  const selected = useToolWorkspaceStore((state) => state.compareSlugs.includes(slug));

  return (
    <div className="td-final-alt-actions">
      <button type="button" aria-pressed={selected} onClick={() => toggleCompare(slug)}>
        {selected ? "In confronto" : "Confronta"}
      </button>
      <Link href={`/toools/${slug}`}>Scheda {name}</Link>
    </div>
  );
}
