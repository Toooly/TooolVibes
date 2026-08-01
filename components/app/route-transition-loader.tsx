"use client";

import { usePathname } from "next/navigation";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { SOUND_PLAY_EVENT } from "@/lib/config/sound";
import {
  getPrefersReducedMotion,
  shouldShowRouteTransitionPresentation,
} from "@/lib/motion/reduced-motion";

type RouteSignalConfig = {
  label: string;
  coordinate: string;
  accentA: string;
  accentB: string;
};

/** Perceptual route feedback — never artificial waiting. */
const SIGNAL_MS = 240;
const SAFETY_MS = 420;

const DEFAULT_ROUTE: RouteSignalConfig = {
  label: "Nuova regione",
  coordinate: "TV-00",
  accentA: "106, 60, 255",
  accentB: "57, 210, 246",
};

const ROUTE_COPY: Record<string, RouteSignalConfig> = {
  "/": { label: "Home", coordinate: "TV-01", accentA: "106, 60, 255", accentB: "57, 210, 246" },
  "/compare": { label: "Confronto", coordinate: "TV-CF", accentA: "243, 191, 76", accentB: "106, 60, 255" },
  "/archivio": { label: "Catalogo", coordinate: "TV-CT", accentA: "57, 210, 246", accentB: "106, 60, 255" },
  "/radar": { label: "Radar", coordinate: "TV-RD", accentA: "57, 210, 246", accentB: "255, 176, 76" },
  "/product-hunt": { label: "Radar", coordinate: "TV-RD", accentA: "57, 210, 246", accentB: "255, 176, 76" },
  "/collections": { label: "Raccolte", coordinate: "TV-RC", accentA: "216, 180, 254", accentB: "106, 60, 255" },
  "/shortlist": { label: "Salvati", coordinate: "TV-SV", accentA: "243, 191, 76", accentB: "106, 60, 255" },
  "/wishlist": { label: "Suggerisci", coordinate: "TV-SG", accentA: "216, 180, 254", accentB: "124, 58, 237" },
  "/tags": { label: "Tag", coordinate: "TV-TG", accentA: "57, 210, 246", accentB: "124, 58, 237" },
  "/posts": { label: "Guide", coordinate: "TV-GD", accentA: "243, 191, 76", accentB: "124, 58, 237" },
  "/toools": { label: "Scheda tool", coordinate: "TV-TL", accentA: "57, 210, 246", accentB: "106, 60, 255" },
  "/account": { label: "Account", coordinate: "TV-AC", accentA: "216, 180, 254", accentB: "106, 60, 255" },
  "/shop": { label: "Shop", coordinate: "TV-SH", accentA: "243, 191, 76", accentB: "124, 58, 237" },
  "/contributi": { label: "Contributi", coordinate: "TV-CN", accentA: "57, 210, 246", accentB: "124, 58, 237" },
  "/studio": { label: "Studio", coordinate: "TV-ST", accentA: "216, 180, 254", accentB: "124, 58, 237" },
  "/metodo": { label: "Metodo", coordinate: "TV-MT", accentA: "106, 60, 255", accentB: "243, 191, 76" },
  "/chi-siamo": { label: "Chi siamo", coordinate: "TV-CS", accentA: "243, 191, 76", accentB: "106, 60, 255" },
  "/affiliati": { label: "Affiliati", coordinate: "TV-AF", accentA: "57, 210, 246", accentB: "106, 60, 255" },
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

function getRouteSignalConfig(pathname: string): RouteSignalConfig {
  if (pathname === "/") return ROUTE_COPY["/"];
  const match = Object.entries(ROUTE_COPY).find(
    ([path]) => path !== "/" && pathname.startsWith(path),
  );
  return match?.[1] ?? DEFAULT_ROUTE;
}

function canShowRouteSignal() {
  return shouldShowRouteTransitionPresentation(getPrefersReducedMotion());
}

export function RouteTransitionLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [routeTheme, setRouteTheme] = useState(DEFAULT_ROUTE);
  const visibleRef = useRef(false);
  const hideTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const previousPathRef = useRef(pathname);

  const clearTimers = useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (safetyTimerRef.current) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const finishSignal = useCallback(() => {
    if (!visibleRef.current) return;
    clearTimers();
    setProgress(100);
    hideTimerRef.current = window.setTimeout(() => {
      visibleRef.current = false;
      setVisible(false);
      setProgress(0);
    }, 80);
  }, [clearTimers]);

  const startSignal = useCallback(
    (destination: URL) => {
      if (!canShowRouteSignal()) return;

      clearTimers();
      const config = getRouteSignalConfig(destination.pathname);
      const startedAt = performance.now();
      visibleRef.current = true;
      setRouteTheme(config);
      setVisible(true);
      setProgress(12);
      window.dispatchEvent(
        new CustomEvent(SOUND_PLAY_EVENT, { detail: { kind: "route" } }),
      );

      const tick = (now: number) => {
        const elapsed = now - startedAt;
        // Ease toward 88% while navigation resolves — never invent a long wait.
        const next = Math.min(88, 12 + (elapsed / SIGNAL_MS) * 76);
        setProgress(next);
        if (elapsed < SIGNAL_MS && visibleRef.current) {
          rafRef.current = window.requestAnimationFrame(tick);
        }
      };
      rafRef.current = window.requestAnimationFrame(tick);

      safetyTimerRef.current = window.setTimeout(() => {
        finishSignal();
      }, SAFETY_MS);
    },
    [clearTimers, finishSignal],
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

      const current = new URL(window.location.href);
      startSignal(destination);

      if (destination.pathname === current.pathname) {
        hideTimerRef.current = window.setTimeout(() => {
          finishSignal();
        }, 100);
      }
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () =>
      document.removeEventListener("click", handleClick, { capture: true });
  }, [finishSignal, startSignal]);

  useEffect(() => {
    if (previousPathRef.current !== pathname) {
      previousPathRef.current = pathname;
      finishSignal();
    }
  }, [finishSignal, pathname]);

  useEffect(() => clearTimers, [clearTimers]);

  const liveLabel = visible
    ? `Navigazione verso ${routeTheme.label}`
    : undefined;

  return (
    <div
      className={`route-transition-signal ${visible ? "is-visible" : ""}`}
      aria-hidden={visible ? undefined : true}
      style={
        {
          "--route-progress": `${progress}%`,
          "--route-accent-a": routeTheme.accentA,
          "--route-accent-b": routeTheme.accentB,
        } as CSSProperties
      }
    >
      <div
        className="route-transition-signal__bar"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={liveLabel}
      >
        <span className="route-transition-signal__fill" aria-hidden="true" />
        <span className="route-transition-signal__meta" aria-hidden="true">
          <span className="route-transition-signal__coord">
            {routeTheme.coordinate}
          </span>
          <span className="route-transition-signal__label">
            {routeTheme.label}
          </span>
          <span className="route-transition-signal__pulse" />
        </span>
      </div>
    </div>
  );
}
