"use client";

import { useEffect, useRef } from "react";
import { getShellScroller } from "@/lib/shell/scroll-port";

/**
 * One-shot card entry reveal using IntersectionObserver.
 * Uses the canonical .marketing-shell scrollport on mobile (not window).
 * Cards animate in once — no replay on scroll-back.
 * Stagger: 28ms per card, capped at 6 cards (168ms total).
 */
export function useCardReveal<T extends HTMLElement>(delayMs = 0) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      el.classList.add("is-visible");
      return;
    }

    el.classList.add("ar4-card-reveal");
    if (delayMs > 0) {
      el.style.setProperty("--ar4-reveal-delay", `${delayMs}ms`);
    }

    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }

    const shellScroller = getShellScroller();
    const root: Element | null =
      shellScroller instanceof Element ? shellScroller : null;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { root, threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delayMs]);

  return ref;
}
