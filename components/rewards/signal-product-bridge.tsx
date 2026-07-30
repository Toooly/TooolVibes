"use client";

/**
 * Wires meaningful product actions to Signal Progression client.
 * Mount once from marketing layout. Guests / flags OFF: no-op.
 */

import { useEffect, useRef } from "react";

import { useAccount } from "@/components/account/account-provider";
import { useRewardRuntime } from "@/components/rewards/reward-provider";
import {
  configureSignalClient,
  emitToolSaved,
  emitToolUnsaved,
} from "@/lib/signal-progression/client";
import type { SignalClientFlagSnapshot } from "@/lib/signal-progression/client-flags";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

export function SignalProductBridge({ flags }: { flags: SignalClientFlagSnapshot }) {
  const { status } = useAccount();
  const { enqueueVerifiedEnvelope } = useRewardRuntime();
  const enabled = flags.eventWritesEnabled && status === "authenticated";

  useEffect(() => {
    configureSignalClient({
      writesEnabled: enabled,
      onEnvelope: enabled
        ? (envelope) => {
            enqueueVerifiedEnvelope(envelope);
          }
        : null,
    });
    return () => {
      configureSignalClient({ writesEnabled: false, onEnvelope: null });
    };
  }, [enabled, enqueueVerifiedEnvelope]);

  const prevSaved = useRef<Set<string> | null>(null);
  const savedSlugs = useToolWorkspaceStore((s) => s.savedSlugs);

  useEffect(() => {
    if (!enabled) {
      prevSaved.current = null;
      return;
    }
    const next = new Set(savedSlugs);
    const prev = prevSaved.current;
    prevSaved.current = next;
    if (!prev) return;
    for (const slug of next) {
      if (!prev.has(slug)) {
        const isFirstSave = prev.size === 0;
        emitToolSaved(slug, isFirstSave);
      }
    }
    for (const slug of prev) {
      if (!next.has(slug)) {
        emitToolUnsaved(slug);
      }
    }
  }, [savedSlugs, enabled]);

  return null;
}
