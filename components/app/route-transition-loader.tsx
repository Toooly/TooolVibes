"use client";

import { usePathname } from "next/navigation";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";

import { SOUND_PLAY_EVENT } from "@/lib/config/sound";
import { getPrefersReducedMotion, shouldShowRouteTransitionPresentation } from "@/lib/motion/reduced-motion";

type RouteLoaderConfig = {
  label: string;
  duration: number;
  accentA: string;
  accentB: string;
  accentC: string;
};

const DEFAULT_ROUTE_CONFIG: RouteLoaderConfig = {
  label: "Preparo la rotta",
  duration: 820,
  accentA: "94, 226, 255",
  accentB: "124, 58, 237",
  accentC: "246, 199, 97",
};

const COMPLETION_HOLD_MS = 120;
const SAFETY_TIMEOUT_MS = 1400;

const ROUTE_COPY: Record<string, RouteLoaderConfig> = {
  "/compare": { label: "Allineo il confronto", duration: 980, accentA: "246, 199, 97", accentB: "124, 58, 237", accentC: "94, 226, 255" },
  "/archivio": { label: "Apro il catalogo", duration: 780, accentA: "94, 226, 255", accentB: "106, 60, 255", accentC: "246, 199, 97" },
  "/radar": { label: "Sincronizzo il radar", duration: 860, accentA: "255, 176, 76", accentB: "255, 99, 99", accentC: "124, 58, 237" },
  "/product-hunt": { label: "Sincronizzo il radar", duration: 860, accentA: "255, 176, 76", accentB: "255, 99, 99", accentC: "124, 58, 237" },
  "/collections": { label: "Compongo le raccolte", duration: 860, accentA: "216, 180, 254", accentB: "106, 60, 255", accentC: "94, 226, 255" },
  "/shortlist": { label: "Recupero i salvati", duration: 820, accentA: "246, 199, 97", accentB: "106, 60, 255", accentC: "94, 226, 255" },
  "/wishlist": { label: "Preparo il suggerimento", duration: 760, accentA: "216, 180, 254", accentB: "124, 58, 237", accentC: "94, 226, 255" },
  "/tags": { label: "Ordino le categorie", duration: 720, accentA: "94, 226, 255", accentB: "124, 58, 237", accentC: "246, 199, 97" },
  "/posts": { label: "Apro gli approfondimenti", duration: 820, accentA: "246, 199, 97", accentB: "124, 58, 237", accentC: "216, 180, 254" },
  "/toools": { label: "Carico la scheda", duration: 820, accentA: "94, 226, 255", accentB: "106, 60, 255", accentC: "246, 199, 97" },
  "/account": { label: "Apro il profilo", duration: 760, accentA: "216, 180, 254", accentB: "106, 60, 255", accentC: "94, 226, 255" },
  "/shop": { label: "Accendo lo shop", duration: 720, accentA: "246, 199, 97", accentB: "124, 58, 237", accentC: "94, 226, 255" },
  "/community": { label: "Entro nella community", duration: 760, accentA: "94, 226, 255", accentB: "124, 58, 237", accentC: "246, 199, 97" },
};

function isModifiedNavigation(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function getInternalDestination(anchor: HTMLAnchorElement) {
  if (anchor.target || anchor.hasAttribute("download")) {
    return null;
  }

  const destination = new URL(anchor.href, window.location.href);

  if (destination.origin !== window.location.origin) {
    return null;
  }

  const current = new URL(window.location.href);
  const sameTarget =
    destination.pathname === current.pathname &&
    destination.search === current.search &&
    destination.hash === current.hash;

  return sameTarget ? null : destination;
}

function getRouteLoaderConfig(pathname: string) {
  const match = Object.entries(ROUTE_COPY).find(([path]) => pathname.startsWith(path));
  return match?.[1] ?? DEFAULT_ROUTE_CONFIG;
}

function canShowRouteLoader() {
  return (
    window.matchMedia("(max-width: 767px)").matches &&
    shouldShowRouteTransitionPresentation(getPrefersReducedMotion())
  );
}

export function RouteTransitionLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [routeLabel, setRouteLabel] = useState("Preparo la rotta");
  const [routeTheme, setRouteTheme] = useState(DEFAULT_ROUTE_CONFIG);
  const visibleRef = useRef(false);
  const startedAtRef = useRef(0);
  const durationRef = useRef(1120);
  const intervalRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const samePathTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);
  const previousPathRef = useRef(pathname);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (samePathTimerRef.current) {
      window.clearTimeout(samePathTimerRef.current);
      samePathTimerRef.current = null;
    }

    if (safetyTimerRef.current) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const startLoading = useCallback((destination: URL) => {
    if (!canShowRouteLoader()) {
      return;
    }

    clearTimers();
    const routeConfig = getRouteLoaderConfig(destination.pathname);
    durationRef.current = routeConfig.duration;
    startedAtRef.current = performance.now();
    visibleRef.current = true;
    setRouteLabel(routeConfig.label);
    setRouteTheme(routeConfig);
    setVisible(true);
    setProgress(4);
    window.dispatchEvent(new CustomEvent(SOUND_PLAY_EVENT, { detail: { kind: "route" } }));

    intervalRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startedAtRef.current;
      const nextProgress = Math.min(94, 4 + (elapsed / durationRef.current) * 90);
      setProgress(nextProgress);
    }, 70);

    safetyTimerRef.current = window.setTimeout(() => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setProgress(100);

      hideTimerRef.current = window.setTimeout(() => {
        visibleRef.current = false;
        setVisible(false);
        setProgress(0);
        startedAtRef.current = 0;
      }, COMPLETION_HOLD_MS);
    }, SAFETY_TIMEOUT_MS);
  }, [clearTimers]);

  const finishLoading = useCallback(() => {
    if (!visibleRef.current) {
      return;
    }

    clearTimers();
    setProgress(100);

    hideTimerRef.current = window.setTimeout(() => {
      visibleRef.current = false;
      setVisible(false);
      setProgress(0);
      startedAtRef.current = 0;
    }, COMPLETION_HOLD_MS);
  }, [clearTimers]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (isModifiedNavigation(event)) {
        return;
      }

      const target = event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>("a[href]")
        : null;

      if (!target || target.closest("[data-loader-ignore='true']")) {
        return;
      }

      const destination = getInternalDestination(target);

      if (destination) {
        const current = new URL(window.location.href);
        startLoading(destination);

        if (destination.pathname === current.pathname) {
          samePathTimerRef.current = window.setTimeout(() => {
            samePathTimerRef.current = null;
            finishLoading();
          }, 120);
        }
      }
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [finishLoading, startLoading]);

  useEffect(() => {
    if (previousPathRef.current !== pathname) {
      previousPathRef.current = pathname;
      finishLoading();
    }
  }, [finishLoading, pathname]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <div
      className={`route-transition-loader ${visible ? "is-visible" : ""}`}
      aria-hidden={!visible}
      style={
        {
          "--route-progress": `${progress}%`,
          "--route-accent-a": routeTheme.accentA,
          "--route-accent-b": routeTheme.accentB,
          "--route-accent-c": routeTheme.accentC,
          pointerEvents: "none",
        } as CSSProperties
      }
    >
      <div className="route-transition-loader__stage" role="status" aria-live="polite">
        <span className="route-transition-loader__halo" />
        <span className="route-transition-loader__word" aria-label="TOOOLVIBES" />
        <span className="route-transition-loader__label">{routeLabel}</span>
        <span className="route-transition-loader__track">
          <span />
        </span>
      </div>
    </div>
  );
}
