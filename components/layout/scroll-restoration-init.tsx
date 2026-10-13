"use client";

import { useEffect } from "react";
import { initScrollRestoration } from "@/lib/shell/scroll-restoration";
import { markDocumentReady } from "@/lib/shell/document-startup-recovery";

/**
 * Mount once to activate exact history scroll restoration.
 * Next owns pending-navigation recovery; loaded-page errors use the boundary.
 */
export function ScrollRestorationInit() {
  useEffect(() => {
    markDocumentReady();
    initScrollRestoration();
  }, []);
  return null;
}
