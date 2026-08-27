"use client";

import { useDiscoverySnapshot } from "@/lib/discovery/client-store";
import { compactPersonalStatus } from "@/lib/account/workspace-lifecycle";
import { cn } from "@/lib/utils";

export function usePersonalToolStatus(slug: string) {
  const snapshot = useDiscoverySnapshot();
  const saved = snapshot.shortlist.includes(slug);
  const outcome = snapshot.decisionOutcomes?.[slug] ?? null;
  const usage = snapshot.toolUsages?.[slug] ?? null;
  const replacedBy = snapshot.toolReplacedBy?.[slug] ?? null;
  const stage = snapshot.shortlistStages[slug] ?? "saved";

  if (!saved && !outcome && !usage) {
    return null;
  }

  const status = compactPersonalStatus({ usage, outcome, stage });
  return {
    key: status.key,
    label: status.label,
    replacedBy,
  };
}

/**
 * Heart fill already means saved. Catalogo (and other quiet surfaces)
 * must not add a second "Salvato" word beside it.
 */
export function isHeartRedundantPersonalStatus(key: string | null | undefined) {
  return key === "saved";
}

type WorkspacePersonalStatusBadgeProps = {
  slug: string;
  className?: string;
  /** Default true: skip "Salvato" when the heart already communicates it. */
  hideSaved?: boolean;
};

export function WorkspacePersonalStatusBadge({
  slug,
  className,
  hideSaved = true,
}: WorkspacePersonalStatusBadgeProps) {
  const status = usePersonalToolStatus(slug);
  if (!status) return null;
  if (hideSaved && isHeartRedundantPersonalStatus(status.key)) return null;

  return (
    <span
      data-slot="personal-status"
      data-tone={status.key}
      className={cn("tv-personal-status", className)}
    >
      {status.label}
    </span>
  );
}
