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
  return Math.min(Math.max(index, 0) * 70, 420);
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

export function MotionObserver() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let observer: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    if (reduceMotion) {
      document.documentElement.dataset.motionReady = "false";
      return;
    }

    const startObserver = () => {
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
            }, 860 + delay);

            observer?.unobserve(element);
          });
        },
        {
          rootMargin: "0px 0px -9% 0px",
          threshold: 0.12,
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

    const startTimer = window.setTimeout(startObserver, 700);

    return () => {
      window.clearTimeout(startTimer);
      observer?.disconnect();
      mutationObserver?.disconnect();
      delete document.documentElement.dataset.motionReady;
    };
  }, []);

  return null;
}
