"use client";

import { usePathname } from "next/navigation";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";

const ROUTE_COPY: Record<string, { label: string; duration: number }> = {
  "/compare": { label: "Allineo il confronto", duration: 1680 },
  "/archivio": { label: "Apro il catalogo", duration: 1080 },
  "/product-hunt": { label: "Sincronizzo il radar", duration: 1320 },
  "/collections": { label: "Compongo la collection", duration: 1260 },
  "/shortlist": { label: "Recupero la shortlist", duration: 1180 },
  "/wishlist": { label: "Preparo il suggerimento", duration: 1040 },
  "/tags": { label: "Ordino le categorie", duration: 980 },
  "/posts": { label: "Apro gli approfondimenti", duration: 1160 },
  "/toools": { label: "Carico la scheda", duration: 1180 },
  "/account": { label: "Apro il profilo", duration: 1040 },
  "/shop": { label: "Accendo lo shop", duration: 980 },
  "/community": { label: "Entro nella community", duration: 1040 },
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
  return match?.[1] ?? { label: "Preparo la rotta", duration: 1120 };
}

function canShowRouteLoader() {
  return window.matchMedia("(max-width: 767px)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function RouteTransitionLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [routeLabel, setRouteLabel] = useState("Preparo la rotta");
  const visibleRef = useRef(false);
  const startedAtRef = useRef(0);
  const durationRef = useRef(1120);
  const intervalRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const completeTimerRef = useRef<number | null>(null);
  const samePathTimerRef = useRef<number | null>(null);
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

    if (completeTimerRef.current) {
      window.clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }

    if (samePathTimerRef.current) {
      window.clearTimeout(samePathTimerRef.current);
      samePathTimerRef.current = null;
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
    setVisible(true);
    setProgress(4);

    intervalRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startedAtRef.current;
      const nextProgress = Math.min(94, 4 + (elapsed / durationRef.current) * 90);
      setProgress(nextProgress);
    }, 70);
  }, [clearTimers]);

  const finishLoading = useCallback(() => {
    if (!visibleRef.current) {
      return;
    }

    const elapsed = performance.now() - startedAtRef.current;
    const remaining = Math.max(0, durationRef.current - elapsed);

    hideTimerRef.current = window.setTimeout(() => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setProgress(100);

      completeTimerRef.current = window.setTimeout(() => {
        visibleRef.current = false;
        setVisible(false);
        setProgress(0);
      }, 420);
    }, Math.max(180, remaining));
  }, []);

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
      style={{ "--route-progress": `${progress}%` } as CSSProperties}
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
