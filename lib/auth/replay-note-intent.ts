import { getActiveWorkspaceOwner } from "@/lib/discovery/workspace-owner-storage";
import type { PendingAuthIntent } from "@/lib/auth/pending-auth-intent";
import { openPrivateNoteEditor } from "@/lib/auth/private-note-editor-state";

export type NoteIntentReplayResult =
  | { status: "ok"; returnTo: string; openEditor: boolean }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

export function replayNotePrivateIntent(
  intent: PendingAuthIntent,
): NoteIntentReplayResult {
  if (getActiveWorkspaceOwner().kind !== "account") {
    return { status: "skipped", reason: "not-authenticated" };
  }
  if (intent.capability !== "note.private") {
    return { status: "skipped", reason: "unsupported-capability" };
  }
  return {
    status: "ok",
    returnTo: intent.returnTo,
    openEditor: true,
  };
}

export function maybeOpenNoteEditorAfterReplay(openEditor: boolean, slug: string) {
  if (!openEditor) return;
  openPrivateNoteEditor(slug);
}
