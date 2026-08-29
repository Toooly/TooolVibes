import { getActiveWorkspaceOwner } from "@/lib/discovery/workspace-owner-storage";
import type { PendingAuthIntent } from "@/lib/auth/pending-auth-intent";
import { openPersonalInsightLayer } from "@/lib/auth/personal-insight-layer-state";

export type InsightIntentReplayResult =
  | { status: "ok"; returnTo: string; openLayer: boolean }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

export function replayInsightPersonalIntent(
  intent: PendingAuthIntent,
): InsightIntentReplayResult {
  if (getActiveWorkspaceOwner().kind !== "account") {
    return { status: "skipped", reason: "not-authenticated" };
  }
  if (intent.capability !== "insight.personal") {
    return { status: "skipped", reason: "unsupported-capability" };
  }
  if (!("toolSlug" in intent.payload) || !intent.payload.toolSlug) {
    return { status: "failed", reason: "missing-slug" };
  }
  return {
    status: "ok",
    returnTo: intent.returnTo,
    openLayer: true,
  };
}

export function maybeOpenInsightLayerAfterReplay(openLayer: boolean, slug: string) {
  if (!openLayer || !slug) return;
  openPersonalInsightLayer(slug);
}
