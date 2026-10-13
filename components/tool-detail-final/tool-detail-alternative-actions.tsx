"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";

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
        <LocalizedText>{selected ? "In confronto" : "Confronta"}</LocalizedText>
      </button>
      <Link href={`/toools/${slug}`}><LocalizedText>{"Scheda "}</LocalizedText><LocalizedText>{name}</LocalizedText></Link>
    </div>
  );
}
