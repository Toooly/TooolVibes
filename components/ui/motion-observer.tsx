"use client";

import { useEffect } from "react";

const motionSelectors = [
  ".motion-reveal",
  ".motion-stagger > *",
  "main .page-shell > section",
  "main .page-shell > .premium-panel",
  "main .premium-card",
  "main .category-tool-carousel",
  "footer .premium-panel",
].join(",");

function getMotionDelay(element: HTMLElement) {
  const parent = element.parentElement;

  if (!parent?.classList.contains("motion-stagger")) {
    return 0;
  }

  const index = Array.from(parent.children).indexOf(element);
  return Math.min(Math.max(index, 0) * 52, 260);
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
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let observer: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let startTimer: number | null = null;
    let introFallbackTimer: number | null = null;
    let started = false;
    let startAfterIntro: (() => void) | null = null;

    if (reduceMotion) {
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
            }, 760 + delay);

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

          startTimer = window.setTimeout(startObserver, 180);
        };

        window.addEventListener("tooolvibes:brand-intro-finished", startAfterIntro, {
          once: true,
        });
        introFallbackTimer = window.setTimeout(startAfterIntro, 5200);
        return;
      }

      startTimer = window.setTimeout(startObserver, 720);
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
