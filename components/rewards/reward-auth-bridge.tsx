"use client";

import { useEffect, useRef } from "react";

import { useAccount } from "@/components/account/account-provider";
import { useRewardRuntime } from "@/components/rewards/reward-provider";

/**
 * Mount inside AccountProvider. Clears private reward queue on auth loss.
 */
export function RewardAuthBridge() {
  const { status, authEnabled } = useAccount();
  const { runtimeEnabled, notifyAuthLost } = useRewardRuntime();
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    if (!runtimeEnabled) return;

    if (authEnabled && status === "authenticated") {
      wasAuthenticated.current = true;
      return;
    }

    if (
      wasAuthenticated.current &&
      (status === "guest" || status === "unavailable")
    ) {
      wasAuthenticated.current = false;
      notifyAuthLost();
    }
  }, [authEnabled, status, runtimeEnabled, notifyAuthLost]);

  return null;
}
