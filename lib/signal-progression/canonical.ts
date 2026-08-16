import type { WorkspaceAction } from "@/lib/discovery/types";
import type { SignalClientFlagSnapshot } from "@/lib/signal-progression/client-flags";
import type { SignalProgressHub } from "@/lib/signal-progression/hub-contracts";
import type { SignalEventType } from "@/lib/signal-progression/rules";

export const ACCOUNT_PROGRESSION_SYSTEM = "signal" as const;

export const FORBIDDEN_ACCOUNT_CURRENCIES = [
  "xp",
  "karma",
  "vibe-rush-score",
] as const;

export function canRenderAccountSignal(
  flags: Pick<SignalClientFlagSnapshot, "progressionUiEnabled">,
  hub: SignalProgressHub | null,
) {
  return Boolean(flags.progressionUiEnabled && hub);
}

export function isAccountSignalQuiet(hub: SignalProgressHub | null) {
  return hub?.preferences?.quietMode === true;
}

export function workspaceActionToSignalEvent(
  action: WorkspaceAction,
): SignalEventType | null {
  if (action.type === "saved/set") {
    return action.saved ? "tool_saved" : "tool_unsaved";
  }

  return null;
}

export function assertAccountProgressionIsSignal(
  currency: string,
): currency is typeof ACCOUNT_PROGRESSION_SYSTEM {
  return currency === ACCOUNT_PROGRESSION_SYSTEM;
}
