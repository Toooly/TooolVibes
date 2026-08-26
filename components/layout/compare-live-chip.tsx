"use client";

import Link from "next/link";

import { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

export function CompareLiveChip({
  placement,
}: {
  placement: "header" | "dock";
}) {
  const count = useToolWorkspaceStore((state) => state.compareSlugs.length);
  if (count < 1) return null;

  return (
    <Link
      href="/compare"
      prefetch={false}
      className={`tv-loop-chip tv-loop-chip--${placement}`}
      data-compare-live-chip={placement}
      aria-label={`Confronta ${count} su ${MAX_COMPARE_TOOLS}`}
    >
      Confronta {count}/{MAX_COMPARE_TOOLS}
    </Link>
  );
}
