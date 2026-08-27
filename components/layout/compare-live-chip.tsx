"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MAX_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

export function CompareLiveChip({
  placement,
}: {
  placement: "header" | "dock";
}) {
  const count = useToolWorkspaceStore((state) => state.compareSlugs.length);
  const pathname = usePathname();
  if (count < 1) return null;

  const onCompare = pathname === "/compare";

  return (
    <Link
      href="/compare"
      prefetch={false}
      className={`tv-loop-chip tv-loop-chip--${placement}`}
      data-compare-live-chip={placement}
      data-active={onCompare ? "true" : undefined}
      aria-current={onCompare ? "page" : undefined}
      aria-label={`Confronta ${count} su ${MAX_COMPARE_TOOLS}`}
    >
      Confronta {count}/{MAX_COMPARE_TOOLS}
    </Link>
  );
}
