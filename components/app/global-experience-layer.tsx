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
      root.removeAttribute("data-experience-scroll");
      return;
    }

    let scrollFrame = 0;
    let pointerFrame = 0;
    let pointerTimer = 0;
    let pressTimer = 0;
    let scrollTimer = 0;
    let latestPointer: { clientX: number; clientY: number; state: "active" | "pressed" } | null = null;

    const updateScrollProgress = () => {
      scrollFrame = 0;
      const maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      root.style.setProperty("--tv-scroll-progress", progress.toFixed(4));
      root.setAttribute("data-experience-scroll", "active");
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        root.removeAttribute("data-experience-scroll");
      }, 520);
    };

    const requestScrollProgress = () => {
      if (scrollFrame) {
        return;
      }
      scrollFrame = window.requestAnimationFrame(updateScrollProgress);
    };

    const applyPointerPosition = () => {
      pointerFrame = 0;

      if (!latestPointer) {
        return;
      }

      root.style.setProperty("--tv-pointer-x", `${latestPointer.clientX}px`);
      root.style.setProperty("--tv-pointer-y", `${latestPointer.clientY}px`);
      root.setAttribute("data-experience-pointer", latestPointer.state);

      if (latestPointer.state === "active") {
        window.clearTimeout(pointerTimer);
        pointerTimer = window.setTimeout(() => {
          root.removeAttribute("data-experience-pointer");
        }, 1400);
      }
    };

    const requestPointerPosition = (clientX: number, clientY: number, state: "active" | "pressed" = "active") => {
      if (window.innerWidth < 768) {
        return;
      }

      latestPointer = { clientX, clientY, state };

      if (pointerFrame) {
        return;
      }

      pointerFrame = window.requestAnimationFrame(applyPointerPosition);
    };

    const updatePointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        return;
      }

      requestPointerPosition(event.clientX, event.clientY);
    };

    const pressPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch" || window.innerWidth < 768) {
        return;
      }

      requestPointerPosition(event.clientX, event.clientY, "pressed");

      window.clearTimeout(pointerTimer);
      window.clearTimeout(pressTimer);
      pressTimer = window.setTimeout(() => {
        root.setAttribute("data-experience-pointer", "active");
        pointerTimer = window.setTimeout(() => {
          root.removeAttribute("data-experience-pointer");
        }, 900);
      }, 360);
    };

    updateScrollProgress();

    window.addEventListener("scroll", requestScrollProgress, { passive: true });
    window.addEventListener("resize", requestScrollProgress, { passive: true });
    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("pointerdown", pressPointer, { passive: true });

    return () => {
      window.removeEventListener("scroll", requestScrollProgress);
      window.removeEventListener("resize", requestScrollProgress);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("pointerdown", pressPointer);
      window.cancelAnimationFrame(scrollFrame);
      window.cancelAnimationFrame(pointerFrame);
      window.clearTimeout(pointerTimer);
      window.clearTimeout(pressTimer);
      window.clearTimeout(scrollTimer);
      root.style.removeProperty("--tv-scroll-progress");
      root.style.removeProperty("--tv-pointer-x");
      root.style.removeProperty("--tv-pointer-y");
      root.removeAttribute("data-experience-pointer");
      root.removeAttribute("data-experience-scroll");
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
