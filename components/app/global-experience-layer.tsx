"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const HIDDEN_PATHS = ["/admin"];
const INTERACTIVE_SELECTOR = "a, button, summary, [role='button'], [data-sonic-action]";

function spawnMobileTapBurst(clientX: number, clientY: number) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const burst = document.createElement("span");
  burst.className = "mobile-tap-burst";
  burst.setAttribute("aria-hidden", "true");
  burst.style.left = `${clientX}px`;
  burst.style.top = `${clientY}px`;

  document.body.appendChild(burst);
  window.setTimeout(() => burst.remove(), 780);
}

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

    let frame = 0;
    let pointerTimer = 0;
    let pressTimer = 0;
    let scrollTimer = 0;
    let tapTimer = 0;

    const updateScrollProgress = () => {
      frame = 0;
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
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(updateScrollProgress);
    };

    const setPointerPosition = (clientX: number, clientY: number) => {
      if (window.innerWidth < 768) {
        return;
      }

      root.style.setProperty("--tv-pointer-x", `${clientX}px`);
      root.style.setProperty("--tv-pointer-y", `${clientY}px`);
      root.setAttribute("data-experience-pointer", "active");

      window.clearTimeout(pointerTimer);
      pointerTimer = window.setTimeout(() => {
        root.removeAttribute("data-experience-pointer");
      }, 1400);
    };

    const updatePointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        return;
      }

      setPointerPosition(event.clientX, event.clientY);
    };

    const updateMousePointer = (event: MouseEvent) => {
      setPointerPosition(event.clientX, event.clientY);
    };

    const pressPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch" || window.innerWidth < 768) {
        return;
      }

      root.style.setProperty("--tv-pointer-x", `${event.clientX}px`);
      root.style.setProperty("--tv-pointer-y", `${event.clientY}px`);
      root.setAttribute("data-experience-pointer", "pressed");

      window.clearTimeout(pointerTimer);
      window.clearTimeout(pressTimer);
      pressTimer = window.setTimeout(() => {
        root.setAttribute("data-experience-pointer", "active");
        pointerTimer = window.setTimeout(() => {
          root.removeAttribute("data-experience-pointer");
        }, 900);
      }, 360);
    };

    const pressMousePointer = (event: MouseEvent) => {
      if (window.innerWidth < 768 || event.button !== 0) {
        return;
      }

      root.style.setProperty("--tv-pointer-x", `${event.clientX}px`);
      root.style.setProperty("--tv-pointer-y", `${event.clientY}px`);
      root.setAttribute("data-experience-pointer", "pressed");

      window.clearTimeout(pointerTimer);
      window.clearTimeout(pressTimer);
      pressTimer = window.setTimeout(() => {
        root.setAttribute("data-experience-pointer", "active");
        pointerTimer = window.setTimeout(() => {
          root.removeAttribute("data-experience-pointer");
        }, 900);
      }, 360);
    };

    const handleMobileTouch = (event: TouchEvent) => {
      if (window.innerWidth >= 768) {
        return;
      }

      const touch = event.changedTouches[0];
      const target = event.target instanceof Element
        ? event.target.closest(INTERACTIVE_SELECTOR)
        : null;

      if (!touch || !target) {
        return;
      }

      window.clearTimeout(tapTimer);
      tapTimer = window.setTimeout(() => {
        spawnMobileTapBurst(touch.clientX, touch.clientY);
      }, 0);
    };

    const handleMobileClick = (event: MouseEvent) => {
      if (window.innerWidth >= 768 || event.detail === 0) {
        return;
      }

      const target = event.target instanceof Element
        ? event.target.closest(INTERACTIVE_SELECTOR)
        : null;

      if (!target) {
        return;
      }

      spawnMobileTapBurst(event.clientX, event.clientY);
    };

    updateScrollProgress();

    window.addEventListener("scroll", requestScrollProgress, { passive: true });
    window.addEventListener("resize", requestScrollProgress, { passive: true });
    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("mousemove", updateMousePointer, { passive: true });
    window.addEventListener("pointerdown", pressPointer, { passive: true });
    window.addEventListener("mousedown", pressMousePointer, { passive: true });
    window.addEventListener("touchstart", handleMobileTouch, { passive: true, capture: true });
    window.addEventListener("click", handleMobileClick, { passive: true, capture: true });

    return () => {
      window.removeEventListener("scroll", requestScrollProgress);
      window.removeEventListener("resize", requestScrollProgress);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("mousemove", updateMousePointer);
      window.removeEventListener("pointerdown", pressPointer);
      window.removeEventListener("mousedown", pressMousePointer);
      window.removeEventListener("touchstart", handleMobileTouch, { capture: true });
      window.removeEventListener("click", handleMobileClick, { capture: true });
      window.cancelAnimationFrame(frame);
      window.clearTimeout(pointerTimer);
      window.clearTimeout(pressTimer);
      window.clearTimeout(scrollTimer);
      window.clearTimeout(tapTimer);
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
