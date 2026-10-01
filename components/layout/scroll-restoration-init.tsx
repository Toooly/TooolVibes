"use client";

import { useEffect } from "react";
import { initScrollRestoration } from "@/lib/shell/scroll-restoration";

/** Mount once to activate exact history scroll restoration across the app. */
export function ScrollRestorationInit() {
  useEffect(() => {
    initScrollRestoration();
  }, []);
  return null;
}
