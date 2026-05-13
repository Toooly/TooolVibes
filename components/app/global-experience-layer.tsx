"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const HIDDEN_PATHS = ["/admin"];

export function GlobalExperienceLayer() {
  const pathname = usePathname();
  const shouldHide = HIDDEN_PATHS.some((path) => pathname?.startsWith(path));

  useEffect(() => {
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (prefersReducedMotion.matches || shouldHide) {
      root.style.removeProperty("--tv-scroll-progress");
      root.style.removeProperty("--tv-pointer-x");
      root.style.removeProperty("--tv-pointer-y");
      root.removeAttribute("data-experience-pointer");
      return;
    }

    let frame = 0;
    let pointerTimer = 0;

    const updateScrollProgress = () => {
      frame = 0;
      const maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      root.style.setProperty("--tv-scroll-progress", progress.toFixed(4));
    };

    const requestScrollProgress = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(updateScrollProgress);
    };

    const updatePointer = (event: PointerEvent) => {
      if (event.pointerType === "touch" || window.innerWidth < 768) {
        return;
      }

      root.style.setProperty("--tv-pointer-x", `${event.clientX}px`);
      root.style.setProperty("--tv-pointer-y", `${event.clientY}px`);
      root.setAttribute("data-experience-pointer", "active");

      window.clearTimeout(pointerTimer);
      pointerTimer = window.setTimeout(() => {
        root.removeAttribute("data-experience-pointer");
      }, 1400);
    };

    updateScrollProgress();

    window.addEventListener("scroll", requestScrollProgress, { passive: true });
    window.addEventListener("resize", requestScrollProgress, { passive: true });
    window.addEventListener("pointermove", updatePointer, { passive: true });

    return () => {
      window.removeEventListener("scroll", requestScrollProgress);
      window.removeEventListener("resize", requestScrollProgress);
      window.removeEventListener("pointermove", updatePointer);
      window.cancelAnimationFrame(frame);
      window.clearTimeout(pointerTimer);
      root.style.removeProperty("--tv-scroll-progress");
      root.style.removeProperty("--tv-pointer-x");
      root.style.removeProperty("--tv-pointer-y");
      root.removeAttribute("data-experience-pointer");
    };
  }, [shouldHide]);

  if (shouldHide) {
    return null;
  }

  return (
    <div className="experience-orbit-layer" aria-hidden="true">
      <span className="experience-orbit-layer__cursor" />
      <span className="experience-orbit-layer__progress" />
      <span className="experience-orbit-layer__comet experience-orbit-layer__comet--one" />
      <span className="experience-orbit-layer__comet experience-orbit-layer__comet--two" />
      <span className="experience-orbit-layer__comet experience-orbit-layer__comet--three" />
      <span className="experience-orbit-layer__radar" />
    </div>
  );
}
