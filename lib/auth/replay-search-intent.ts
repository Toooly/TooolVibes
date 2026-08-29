import { getActiveWorkspaceOwner } from "@/lib/discovery/workspace-owner-storage";
import type { PendingAuthIntent } from "@/lib/auth/pending-auth-intent";
import { queuePersonalSearchResume } from "@/lib/search/personal-search-resume";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

export type SearchIntentReplayResult =
  | { status: "ok"; returnTo: string; query: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

export function replaySearchPersonalIntent(
  intent: PendingAuthIntent,
): SearchIntentReplayResult {
  if (getActiveWorkspaceOwner().kind !== "account") {
    return { status: "skipped", reason: "not-authenticated" };
  }
  if (intent.capability !== "search.personal") {
    return { status: "skipped", reason: "unsupported-capability" };
  }
  const query =
    "query" in intent.payload && typeof intent.payload.query === "string"
      ? intent.payload.query
      : "";
  if (!query) {
    return { status: "failed", reason: "missing-query" };
  }
  return { status: "ok", returnTo: intent.returnTo, query };
}

export function maybeResumePersonalSearchAfterReplay(
  query: string | undefined,
) {
  if (!query) return;
  queuePersonalSearchResume(query);
  useToolWorkspaceStore.getState().setCommandOpen(true);
}
