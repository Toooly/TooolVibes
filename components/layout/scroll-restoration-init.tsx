"use client";

import { useEffect } from "react";
import { initScrollRestoration } from "@/lib/shell/scroll-restoration";
import { initChunkRecovery } from "@/lib/shell/chunk-recovery";

/**
 * Mount once to activate exact history scroll restoration and chunk-load
 * error recovery across the app. Both initializers are idempotent.
 */
export function ScrollRestorationInit() {
  useEffect(() => {
    initScrollRestoration();
    initChunkRecovery();
  }, []);
  return null;
}
