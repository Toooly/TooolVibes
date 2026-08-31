"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { SOUND_PLAY_EVENT } from "@/lib/config/sound";
import {
  getPrefersReducedMotion,
  shouldShowRouteTransitionPresentation,
} from "@/lib/motion/reduced-motion";

const HOLD_MS = 480;
const SAFETY_MS = 900;

const ROUTE_LABELS: Record<string, string> = {
  "/": "Home",
  "/compare": "Confronto",
  "/archivio": "Catalogo",
  "/radar": "Radar",
  "/product-hunt": "Radar",
  "/collections": "Raccolte",
  "/shortlist": "Salvati",
  "/wishlist": "Suggerisci",
  "/tags": "Tag",
  "/posts": "Guide",
  "/toools": "Scheda tool",
  "/account": "Il tuo spazio",
  "/shop": "Shop",
  "/contributi": "Contributi",
  "/studio": "Studio",
  "/metodo": "Metodo",
  "/chi-siamo": "Chi siamo",
  "/affiliati": "Affiliati",
};

function isModifiedNavigation(event: MouseEvent) {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
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

function labelForPath(pathname: string) {
  if (pathname === "/") return ROUTE_LABELS["/"];
  const match = Object.entries(ROUTE_LABELS).find(
    ([path]) => path !== "/" && pathname.startsWith(path),
  );
  return match?.[1] ?? "TooolVibes";
}

function canShow() {
  return shouldShowRouteTransitionPresentation(getPrefersReducedMotion());
}

export function RouteTransitionLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [label, setLabel] = useState("TooolVibes");
  const visibleRef = useRef(false);
  const hideTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);
  const previousPathRef = useRef(pathname);
  const startedAtRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (safetyTimerRef.current) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    if (!visibleRef.current) return;
    clearTimers();
    const hold = Math.max(0, HOLD_MS - (performance.now() - startedAtRef.current));
    hideTimerRef.current = window.setTimeout(() => {
      visibleRef.current = false;
      setVisible(false);
    }, hold);
  }, [clearTimers]);

  const start = useCallback(
    (destination: URL) => {
      if (!canShow()) return;
      clearTimers();
      startedAtRef.current = performance.now();
      visibleRef.current = true;
      setLabel(labelForPath(destination.pathname));
      setVisible(true);
      window.dispatchEvent(
        new CustomEvent(SOUND_PLAY_EVENT, { detail: { kind: "route" } }),
      );
      safetyTimerRef.current = window.setTimeout(() => {
        finish();
      }, SAFETY_MS);
    },
    [clearTimers, finish],
  );

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (isModifiedNavigation(event)) return;
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (!target || target.closest("[data-loader-ignore='true']")) return;
      const destination = getInternalDestination(target);
      if (!destination) return;
      start(destination);
    }
    document.addEventListener("click", handleClick, { capture: true });
    return () =>
      document.removeEventListener("click", handleClick, { capture: true });
  }, [start]);

  useEffect(() => {
    if (previousPathRef.current !== pathname) {
      previousPathRef.current = pathname;
      finish();
    }
  }, [finish, pathname]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <div
      className={visible ? "tv-route-guide is-visible" : "tv-route-guide"}
      data-testid="tv-route-guide"
      aria-hidden={visible ? undefined : true}
    >
      <div className="tv-route-guide__veil" aria-hidden="true" />
      <div
        className="tv-route-guide__card"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={visible ? `Verso ${label}` : undefined}
      >
        <p className="tv-route-guide__kicker">Verso</p>
        <p className="tv-route-guide__title">{label}</p>
      </div>
    </div>
  );
}
