import { getActiveWorkspaceOwner } from "@/lib/discovery/workspace-owner-storage";
import type { PendingAuthIntent } from "@/lib/auth/pending-auth-intent";
import { queueDeepCompareOpen } from "@/lib/compare/deep-compare-resume";

export type CompareIntentReplayResult =
  | { status: "ok"; returnTo: string; openDeep: true }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

export function replayCompareDeepIntent(
  intent: PendingAuthIntent,
): CompareIntentReplayResult {
  if (getActiveWorkspaceOwner().kind !== "account") {
    return { status: "skipped", reason: "not-authenticated" };
  }
  if (intent.capability !== "compare.deep") {
    return { status: "skipped", reason: "unsupported-capability" };
  }
  if (Object.keys(intent.payload).length > 0) {
    return { status: "failed", reason: "unexpected-payload" };
  }
  return {
    status: "ok",
    returnTo: intent.returnTo || "/compare",
    openDeep: true,
  };
}

export function maybeOpenDeepCompareAfterReplay(openDeep: boolean | undefined) {
  if (!openDeep) return;
  queueDeepCompareOpen();
}
