"use client";

/**
 * Phase 4 transport bridge: pulls pending server envelopes into Phase 3 runtime.
 * Mounted only when delivery flags are enabled. No product-action wiring.
 */

import { useEffect, useRef } from "react";

import { useAccount } from "@/components/account/account-provider";
import { useRewardRuntime } from "@/components/rewards/reward-provider";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { parseRewardEnvelope } from "@/lib/rewards/contracts";
import { isGrantAcknowledged } from "@/lib/rewards/acknowledgement";

export function SignalDeliveryBridge({ enabled }: { enabled: boolean }) {
  const { status } = useAccount();
  const { runtimeEnabled, enqueueVerifiedEnvelope } = useRewardRuntime();
  const fetched = useRef(false);

  useEffect(() => {
    if (!enabled || !runtimeEnabled) return;
    if (status !== "authenticated") {
      fetched.current = false;
      return;
    }
    if (fetched.current) return;

    let cancelled = false;

    async function pull() {
      try {
        const client = getBrowserSupabaseClient();
        const session = (await client.auth.getSession()).data.session;
        const token = session?.access_token;
        if (!token || cancelled) return;

        const response = await fetch("/api/signal-progression/pending", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "same-origin",
        });
        if (!response.ok || cancelled) return;
        const payload = (await response.json()) as { envelopes?: unknown[] };
        const list = Array.isArray(payload.envelopes) ? payload.envelopes : [];
        for (const item of list) {
          const parsed = parseRewardEnvelope(item);
          if (parsed.ok) {
            if (isGrantAcknowledged(parsed.envelope.grantId)) continue;
            enqueueVerifiedEnvelope(parsed.envelope);
          }
        }
        fetched.current = true;
      } catch {
        // optional backbone
      }
    }

    void pull();
    return () => {
      cancelled = true;
    };
  }, [enabled, runtimeEnabled, status, enqueueVerifiedEnvelope]);

  return null;
}
