import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

export const ACK_STORAGE_KEY = "tv.reward-acks.v1";
export const MAX_ACK_IDS = 200;

function defaultSessionStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

/**
 * Client half of the celebration-once contract. The server's
 * `signal_reward_deliveries.status` is the durable record, while sessionStorage
 * provides the same-session replay guard.
 */
export function readAcknowledgedGrantIds(
  storage: Storage | null = defaultSessionStorage(),
): Set<string> {
  if (!storage) return new Set<string>();
  try {
    const parsed: unknown = JSON.parse(storage.getItem(ACK_STORAGE_KEY) ?? "null");
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set<string>();
  }
}

export function rememberAcknowledgedGrantId(
  grantId: string,
  storage: Storage | null = defaultSessionStorage(),
): void {
  if (!storage) return;
  try {
    const ids = readAcknowledgedGrantIds(storage);
    ids.delete(grantId);
    ids.add(grantId);
    storage.setItem(ACK_STORAGE_KEY, JSON.stringify(Array.from(ids).slice(-MAX_ACK_IDS)));
  } catch {
    // Browser storage may be unavailable or quota-constrained.
  }
}

export function isGrantAcknowledged(
  grantId: string,
  storage: Storage | null = defaultSessionStorage(),
): boolean {
  return readAcknowledgedGrantIds(storage).has(grantId);
}

export async function acknowledgeSignalRewardGrant(
  grantId: string,
  status: "acknowledged" | "dismissed",
): Promise<void> {
  rememberAcknowledgedGrantId(grantId);
  try {
    const client = getBrowserSupabaseClient();
    const session = (await client.auth.getSession()).data.session;
    const token = session?.access_token;
    if (!token) return;
    await fetch("/api/signal-progression/acknowledge", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ grantId, status }),
      credentials: "same-origin",
    });
  } catch {
    // Settling the local guard is sufficient to keep the UI responsive offline.
  }
}
