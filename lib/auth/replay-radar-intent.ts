import { getActiveWorkspaceOwner } from "@/lib/discovery/workspace-owner-storage";
import type { PendingAuthIntent } from "@/lib/auth/pending-auth-intent";
import { queueRadarPersonalOpen } from "@/lib/radar/radar-personal-resume";

export type RadarIntentReplayResult =
  | { status: "ok"; returnTo: string; openPersonal: true }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

export function replayRadarPersonalIntent(
  intent: PendingAuthIntent,
): RadarIntentReplayResult {
  if (getActiveWorkspaceOwner().kind !== "account") {
    return { status: "skipped", reason: "not-authenticated" };
  }
  if (intent.capability !== "radar.personal") {
    return { status: "skipped", reason: "unsupported-capability" };
  }
  if (Object.keys(intent.payload).length > 0) {
    return { status: "failed", reason: "unexpected-payload" };
  }
  return {
    status: "ok",
    returnTo: intent.returnTo || "/radar",
    openPersonal: true,
  };
}

export function maybeOpenRadarPersonalAfterReplay(openPersonal: boolean | undefined) {
  if (!openPersonal) return;
  queueRadarPersonalOpen();
}
