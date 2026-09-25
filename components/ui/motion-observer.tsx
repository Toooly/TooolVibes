"use client";

import { useEffect } from "react";

import { MOTION_DURATION_MS } from "@/lib/motion/tokens";
import {
  getPrefersReducedMotion,
  shouldEnableRevealObserver,
} from "@/lib/motion/reduced-motion";

const motionSelectors = [
  ".motion-reveal",
  ".motion-stagger > *",
  "main .page-shell > section",
  "main .page-shell > .premium-panel",
  "main .premium-card",
  "footer .premium-panel",
  "main .tv-page-transition > section:not([hidden])",
  "main .tv-page-transition .def-cockpit, main .tv-page-transition .def-start, main .tv-page-transition .def-editorial",
  "main .tv-page-transition .ar4-intro, main .tv-page-transition .ar4-grid, main .tv-page-transition .ar4-categories",
  "main .tv-page-transition .guides-masthead, main .tv-page-transition .guides-featured",
  "main .tv-page-transition .tv-radar-table, main .tv-page-transition .tv-radar__controls",
  "main .tv-page-transition .tv-home-section, main .tv-page-transition .tv-mod",
  "main .tv-page-transition .cx-stack-flow-v4, main .tv-page-transition .cx-variant-paths-v4",
  ".def-cockpit, .def-start, .def-editorial, .def-home__sponsor",
  ".ar4-intro, .ar4-categories, .ar4-filters, .ar4-grid",
  ".guides-masthead, .guides-featured, .guides-grid-section",
  ".tv-radar__hero, .tv-radar-table, .tv-radar-status-bar",
  ".tv-home-section, .tv-mod, .tv-home__members",
  ".cx-stack-flow-v4, .cx-variant-paths-v4, .cx-scenario-v4",
].join(",");

const STAGGER_STEP_MS = MOTION_DURATION_MS.staggerStep;
const STAGGER_MAX_MS = MOTION_DURATION_MS.standard + MOTION_DURATION_MS.staggerStep * 5;
const REVEAL_CLEANUP_MS = MOTION_DURATION_MS.epic + MOTION_DURATION_MS.staggerStep;

function getMotionDelay(element: HTMLElement) {
  const parent = element.parentElement;

  if (!parent?.classList.contains("motion-stagger")) {
    return 0;
  }

  const index = Array.from(parent.children).indexOf(element);
  return Math.min(Math.max(index, 0) * STAGGER_STEP_MS, STAGGER_MAX_MS);
}

function isInViewport(element: HTMLElement) {
  const rect = element.getBoundingClientRect();

  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight * 0.94 &&
    rect.left < window.innerWidth
  );
}

function isRendered(element: HTMLElement) {
  if (element.getClientRects().length === 0) {
    return false;
  }

  const style = window.getComputedStyle(element);

  return style.display !== "none" && style.visibility !== "hidden";
}

export function MotionObserver() {
  useEffect(() => {
    const reduceMotion = getPrefersReducedMotion();
    let observer: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let startTimer: number | null = null;
    let introFallbackTimer: number | null = null;
    let started = false;
    let startAfterIntro: (() => void) | null = null;

    if (!shouldEnableRevealObserver(reduceMotion)) {
      document.documentElement.dataset.motionReady = "false";
      return;
    }

    const startObserver = () => {
      if (started) {
        return;
      }

      started = true;
      document.documentElement.dataset.motionReady = "true";

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            const element = entry.target as HTMLElement;
            const delay =
              Number.parseInt(element.style.getPropertyValue("--motion-delay"), 10) || 0;

            element.classList.add("is-visible");
            window.setTimeout(() => {
              element.removeAttribute("data-motion-observed");
              element.classList.remove("is-visible");
              element.style.removeProperty("--motion-delay");
            }, REVEAL_CLEANUP_MS + delay);

            observer?.unobserve(element);
          });
        },
        {
          rootMargin: "0px 0px -11% 0px",
          threshold: 0.08,
        },
      );

      const prepareElement = (element: HTMLElement) => {
        if (
          element.dataset.motionObserved ||
          element.closest("[data-no-motion]") ||
          element.closest("[aria-hidden='true']")
        ) {
          return;
        }

        if (!isRendered(element)) {
          return;
        }

        if (isInViewport(element)) {
          return;
        }

        element.dataset.motionObserved = "true";
        const delay = getMotionDelay(element);
        if (delay > 0) {
          element.style.setProperty("--motion-delay", `${delay}ms`);
        }

        observer?.observe(element);
      };

      const prepareRoot = (root: Document | HTMLElement) => {
        if (root instanceof HTMLElement && root.matches(motionSelectors)) {
          prepareElement(root);
        }

        root.querySelectorAll<HTMLElement>(motionSelectors).forEach(prepareElement);
      };

      window.requestAnimationFrame(() => prepareRoot(document));

      mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              prepareRoot(node);
            }
          });
        });
      });

      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    };

    const queueObserverStart = () => {
      if (document.documentElement.classList.contains("brand-intro-active")) {
        startAfterIntro = () => {
          if (introFallbackTimer) {
            window.clearTimeout(introFallbackTimer);
            introFallbackTimer = null;
          }

          startTimer = window.setTimeout(startObserver, MOTION_DURATION_MS.base);
        };

        window.addEventListener("tooolvibes:brand-intro-finished", startAfterIntro, {
          once: true,
        });
        introFallbackTimer = window.setTimeout(startAfterIntro, 5200);
        return;
      }

      startTimer = window.setTimeout(startObserver, MOTION_DURATION_MS.epic);
    };

    if (document.readyState === "complete") {
      queueObserverStart();
    } else {
      window.addEventListener("load", queueObserverStart, { once: true });
    }

    return () => {
      window.removeEventListener("load", queueObserverStart);
      if (startAfterIntro) {
        window.removeEventListener("tooolvibes:brand-intro-finished", startAfterIntro);
      }
      if (startTimer) {
        window.clearTimeout(startTimer);
      }
      if (introFallbackTimer) {
        window.clearTimeout(introFallbackTimer);
      }
      observer?.disconnect();
      mutationObserver?.disconnect();
      delete document.documentElement.dataset.motionReady;
    };
  }, []);

  return null;
}
