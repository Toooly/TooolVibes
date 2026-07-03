"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";

import { SOUND_PLAY_EVENT } from "@/lib/config/sound";

const HIDDEN_PATHS = ["/admin"];

const experienceProperties = [
  "--tv-scroll-progress",
  "--tv-scroll-depth",
  "--tv-scroll-lift",
  "--tv-scroll-soft",
  "--tv-scroll-rise",
  "--tv-scroll-sweep",
  "--tv-scroll-glow",
  "--tv-depth-opacity",
  "--tv-stage-opacity",
  "--tv-field-opacity",
  "--tv-pointer-x",
  "--tv-pointer-y",
  "--tv-pointer-shift-x",
  "--tv-pointer-shift-y",
  "--tv-pointer-tilt-x",
  "--tv-pointer-tilt-y",
  "--tv-world-primary",
  "--tv-world-secondary",
  "--tv-world-tertiary",
  "--tv-parallax-slow",
  "--tv-parallax-mid",
  "--tv-parallax-fast",
  "--tv-velocity",
  "--tv-scroll-direction",
] as const;

type ExperienceToneKey =
  | "home"
  | "archive"
  | "compare"
  | "radar"
  | "wishlist"
  | "default";

type ExperienceTone = {
  key: ExperienceToneKey;
  primaryCss: string;
  secondaryCss: string;
  tertiaryCss: string;
};

const experienceTones: Record<ExperienceToneKey, ExperienceTone> = {
  home: {
    key: "home",
    primaryCss: "#0f766e",
    secondaryCss: "#2563eb",
    tertiaryCss: "#5b5bd6",
  },
  archive: {
    key: "archive",
    primaryCss: "#0f766e",
    secondaryCss: "#2563eb",
    tertiaryCss: "#111827",
  },
  compare: {
    key: "compare",
    primaryCss: "#2563eb",
    secondaryCss: "#0f766e",
    tertiaryCss: "#5b5bd6",
  },
  radar: {
    key: "radar",
    primaryCss: "#dc6b2f",
    secondaryCss: "#0f766e",
    tertiaryCss: "#2563eb",
  },
  wishlist: {
    key: "wishlist",
    primaryCss: "#5b5bd6",
    secondaryCss: "#0f766e",
    tertiaryCss: "#2563eb",
  },
  default: {
    key: "default",
    primaryCss: "#0f766e",
    secondaryCss: "#2563eb",
    tertiaryCss: "#5b5bd6",
  },
};

function getExperienceTone(pathname?: string | null): ExperienceTone {
  if (!pathname || pathname === "/") {
    return experienceTones.home;
  }

  if (
    pathname.startsWith("/archivio") ||
    pathname.startsWith("/collections") ||
    pathname.startsWith("/tags")
  ) {
    return experienceTones.archive;
  }

  if (pathname.startsWith("/compare") || pathname.startsWith("/shortlist")) {
    return experienceTones.compare;
  }

  if (pathname.startsWith("/product-hunt") || pathname.startsWith("/radar")) {
    return experienceTones.radar;
  }

  if (pathname.startsWith("/wishlist")) {
    return experienceTones.wishlist;
  }

  return experienceTones.default;
}

function clearExperienceState(root: HTMLElement) {
  experienceProperties.forEach((property) =>
    root.style.removeProperty(property)
  );
  root.removeAttribute("data-experience-pointer");
  root.removeAttribute("data-experience-scroll");
  delete root.dataset.experienceDepth;
  delete root.dataset.experienceDevice;
  delete root.dataset.experienceRoute;
}

export function GlobalExperienceLayerV2() {
  const pathname = usePathname();
  const experienceTone = useMemo(
    () => getExperienceTone(pathname),
    [pathname]
  );
  const shouldHide = HIDDEN_PATHS.some((path) =>
    pathname?.startsWith(path)
  );

  useEffect(() => {
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    if (prefersReducedMotion.matches || shouldHide) {
      clearExperienceState(root);
      return undefined;
    }

    root.dataset.experienceRoute = experienceTone.key;
    root.style.setProperty(
      "--tv-world-primary",
      experienceTone.primaryCss
    );
    root.style.setProperty(
      "--tv-world-secondary",
      experienceTone.secondaryCss
    );
    root.style.setProperty(
      "--tv-world-tertiary",
      experienceTone.tertiaryCss
    );

    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      root.style.removeProperty("--tv-pointer-x");
      root.style.removeProperty("--tv-pointer-y");
      root.style.removeProperty("--tv-pointer-shift-x");
      root.style.removeProperty("--tv-pointer-shift-y");
      root.style.removeProperty("--tv-pointer-tilt-x");
      root.style.removeProperty("--tv-pointer-tilt-y");
      root.removeAttribute("data-experience-pointer");
    }

    let scrollFrame = 0;
    let pointerFrame = 0;
    let pointerTimer = 0;
    let pressTimer = 0;
    let scrollTimer = 0;
    let scrollSoundTimer = 0;
    let lastScrollMilestone = -1;
    let hasCompletedInitialScrollSync = false;
    let latestPointer: {
      clientX: number;
      clientY: number;
      state: "active" | "pressed";
    } | null = null;
    let currentPointer: { clientX: number; clientY: number } | null = null;
    let lastScrollY = 0;
    let scrollVelocity = 0;

    const updateScrollProgress = () => {
      scrollFrame = 0;
      const isMobile = window.innerWidth < 768;
      const maxScroll = Math.max(
        1,
        root.scrollHeight - window.innerHeight
      );
      const progress = Math.min(
        1,
        Math.max(0, window.scrollY / maxScroll)
      );
      const milestone = Math.floor(progress * 4);
      const currentY = window.scrollY;
      scrollVelocity = currentY - lastScrollY;
      lastScrollY = currentY;
      const scrollDir = scrollVelocity > 0.5 ? "down" : scrollVelocity < -0.5 ? "up" : "static";

      root.dataset.experienceDevice = isMobile ? "mobile" : "desktop";
      root.style.setProperty("--tv-scroll-progress", progress.toFixed(4));
      root.style.setProperty(
        "--tv-scroll-depth",
        `${(progress * (isMobile ? -46 : -92)).toFixed(2)}px`
      );
      root.style.setProperty(
        "--tv-scroll-lift",
        `${(progress * (isMobile ? -24 : -42)).toFixed(2)}px`
      );
      root.style.setProperty(
        "--tv-scroll-soft",
        `${(progress * (isMobile ? -11 : -18)).toFixed(2)}px`
      );
      root.style.setProperty(
        "--tv-scroll-rise",
        `${(progress * (isMobile ? -12 : -21)).toFixed(2)}px`
      );
      root.style.setProperty(
        "--tv-scroll-sweep",
        `${(progress * (isMobile ? 92 : 180)).toFixed(2)}px`
      );
      root.style.setProperty(
        "--tv-scroll-glow",
        `${(0.04 + progress * (isMobile ? 0.08 : 0.11)).toFixed(3)}`
      );
      root.style.setProperty(
        "--tv-depth-opacity",
        `${(0.1 + Math.sin(progress * Math.PI) * (isMobile ? 0.08 : 0.12)).toFixed(3)}`
      );
      root.style.setProperty(
        "--tv-stage-opacity",
        `${(0.12 + progress * (isMobile ? 0.04 : 0.07)).toFixed(3)}`
      );
      root.style.setProperty(
        "--tv-field-opacity",
        `${((isMobile ? 0.16 : 0.1) + Math.sin(progress * Math.PI) * 0.025 + progress * 0.025).toFixed(3)}`
      );
      if (!isMobile) {
        root.style.setProperty(
          "--tv-parallax-slow",
          `${(progress * -30).toFixed(2)}px`
        );
        root.style.setProperty(
          "--tv-parallax-mid",
          `${(progress * -60).toFixed(2)}px`
        );
        root.style.setProperty(
          "--tv-parallax-fast",
          `${(progress * -120).toFixed(2)}px`
        );
      } else {
        root.style.removeProperty("--tv-parallax-slow");
        root.style.removeProperty("--tv-parallax-mid");
        root.style.removeProperty("--tv-parallax-fast");
      }
      root.style.setProperty(
        "--tv-velocity",
        `${Math.min(1, Math.abs(scrollVelocity) / 50).toFixed(3)}`
      );
      root.style.setProperty("--tv-scroll-direction", scrollDir);
      root.dataset.experienceDepth =
        progress > 0.66 ? "deep" : progress > 0.28 ? "mid" : "near";
      root.setAttribute("data-experience-scroll", "active");

      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        root.removeAttribute("data-experience-scroll");
      }, 520);

      if (
        hasCompletedInitialScrollSync &&
        milestone !== lastScrollMilestone
      ) {
        lastScrollMilestone = milestone;
        window.clearTimeout(scrollSoundTimer);
        scrollSoundTimer = window.setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent(SOUND_PLAY_EVENT, {
              detail: { kind: "reveal" },
            })
          );
        }, 90);
      }

      lastScrollMilestone = milestone;
      hasCompletedInitialScrollSync = true;
    };

    const requestScrollProgress = () => {
      if (!scrollFrame) {
        scrollFrame = window.requestAnimationFrame(updateScrollProgress);
      }
    };

    const applyPointerPosition = () => {
      pointerFrame = 0;

      if (!latestPointer) {
        return;
      }

      currentPointer ??= latestPointer;
      currentPointer = {
        clientX:
          currentPointer.clientX +
          (latestPointer.clientX - currentPointer.clientX) * 0.18,
        clientY:
          currentPointer.clientY +
          (latestPointer.clientY - currentPointer.clientY) * 0.18,
      };

      root.style.setProperty(
        "--tv-pointer-x",
        `${currentPointer.clientX.toFixed(2)}px`
      );
      root.style.setProperty(
        "--tv-pointer-y",
        `${currentPointer.clientY.toFixed(2)}px`
      );
      const pointerX = Math.min(
        1,
        Math.max(-1, (currentPointer.clientX / window.innerWidth - 0.5) * 2)
      );
      const pointerY = Math.min(
        1,
        Math.max(-1, (currentPointer.clientY / window.innerHeight - 0.5) * 2)
      );
      root.style.setProperty(
        "--tv-pointer-shift-x",
        `${(pointerX * 16).toFixed(2)}px`
      );
      root.style.setProperty(
        "--tv-pointer-shift-y",
        `${(pointerY * 11).toFixed(2)}px`
      );
      root.style.setProperty(
        "--tv-pointer-tilt-x",
        `${(pointerY * -3.6).toFixed(2)}deg`
      );
      root.style.setProperty(
        "--tv-pointer-tilt-y",
        `${(pointerX * 4.2).toFixed(2)}deg`
      );
      root.setAttribute("data-experience-pointer", latestPointer.state);

      if (latestPointer.state === "active") {
        window.clearTimeout(pointerTimer);
        pointerTimer = window.setTimeout(() => {
          root.removeAttribute("data-experience-pointer");
        }, 1400);
      }

      const delta =
        Math.abs(latestPointer.clientX - currentPointer.clientX) +
        Math.abs(latestPointer.clientY - currentPointer.clientY);
      if (delta > 0.7) {
        pointerFrame = window.requestAnimationFrame(applyPointerPosition);
      }
    };

    const requestPointerPosition = (
      clientX: number,
      clientY: number,
      state: "active" | "pressed" = "active"
    ) => {
      if (window.innerWidth < 768) {
        return;
      }

      latestPointer = { clientX, clientY, state };

      if (!pointerFrame) {
        pointerFrame = window.requestAnimationFrame(applyPointerPosition);
      }
    };

    const updatePointer = (event: PointerEvent) => {
      if (event.pointerType !== "touch") {
        requestPointerPosition(event.clientX, event.clientY);
      }
    };

    const pressPointer = (event: PointerEvent) => {
      if (
        event.pointerType === "touch" ||
        window.innerWidth < 768
      ) {
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

    window.addEventListener("scroll", requestScrollProgress, {
      passive: true,
    });
    window.addEventListener("resize", requestScrollProgress, {
      passive: true,
    });
    if (!isMobile) {
      window.addEventListener("pointermove", updatePointer, {
        passive: true,
      });
      window.addEventListener("pointerdown", pressPointer, {
        passive: true,
      });
    }

    return () => {
      window.removeEventListener("scroll", requestScrollProgress);
      window.removeEventListener("resize", requestScrollProgress);
      if (!isMobile) {
        window.removeEventListener("pointermove", updatePointer);
        window.removeEventListener("pointerdown", pressPointer);
      }
      window.cancelAnimationFrame(scrollFrame);
      window.cancelAnimationFrame(pointerFrame);
      window.clearTimeout(pointerTimer);
      window.clearTimeout(pressTimer);
      window.clearTimeout(scrollSoundTimer);
      window.clearTimeout(scrollTimer);
      clearExperienceState(root);
    };
  }, [experienceTone, shouldHide]);

  return null;
}
