import { getActiveWorkspaceOwner } from "@/lib/discovery/workspace-owner-storage";
import type { PendingAuthIntent } from "@/lib/auth/pending-auth-intent";
import { openExperienceForm } from "@/lib/community/owner-form-state";

export type CommunityWriteReplayResult =
  | { status: "ok"; returnTo: string; openForm: boolean }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

export function replayCommunityWriteIntent(
  intent: PendingAuthIntent,
): CommunityWriteReplayResult {
  if (getActiveWorkspaceOwner().kind !== "account") {
    return { status: "skipped", reason: "not-authenticated" };
  }
  if (intent.capability !== "community.write") {
    return { status: "skipped", reason: "unsupported-capability" };
  }
  return {
    status: "ok",
    returnTo: intent.returnTo,
    openForm: true,
  };
}

export function maybeOpenExperienceFormAfterReplay(openForm: boolean, slug: string) {
  if (!openForm || !slug) return;
  openExperienceForm(slug);
}
