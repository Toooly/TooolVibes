export type AuthGateEventName =
  | "auth_gate_view"
  | "auth_gate_continue"
  | "auth_gate_dismiss"
  | "auth_success_from_gate";

export type AuthGateEvent = {
  name: AuthGateEventName;
  capability: string;
  origin?: string;
  returnContext?: "tool" | "catalog" | "account" | "other";
};

function classifyReturnTo(returnTo: string | undefined): AuthGateEvent["returnContext"] {
  if (!returnTo) return undefined;
  if (returnTo.startsWith("/toools/")) return "tool";
  if (returnTo.startsWith("/archivio")) return "catalog";
  if (returnTo.startsWith("/account")) return "account";
  return "other";
}

export function trackAuthGate(event: AuthGateEvent): void {
  try {
    const payload: AuthGateEvent = {
      name: event.name,
      capability: event.capability,
    };
    if (event.origin) payload.origin = event.origin;
    if (event.returnContext) payload.returnContext = event.returnContext;
    if (process.env.NODE_ENV === "development") {
      console.log("[auth-gate]", payload);
    }
  } catch {
    // non-fatal
  }
}

export function trackAuthGateFromIntent(input: {
  name: AuthGateEventName;
  capability: string;
  origin?: string;
  returnTo?: string;
}) {
  trackAuthGate({
    name: input.name,
    capability: input.capability,
    origin: input.origin,
    returnContext: classifyReturnTo(input.returnTo),
  });
}
