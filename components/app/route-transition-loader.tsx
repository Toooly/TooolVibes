"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { BrandLogo } from "@/components/layout/brand-logo";

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

export function RouteTransitionLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const visibleRef = useRef(false);
  const startedAtRef = useRef(0);
  const intervalRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
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
  }, []);

  const startLoading = useCallback(() => {
    clearTimers();
    startedAtRef.current = performance.now();
    visibleRef.current = true;
    setVisible(true);
    setProgress(8);

    intervalRef.current = window.setInterval(() => {
      setProgress((current) => {
        const lift = Math.max(1.4, (92 - current) * 0.12);
        return Math.min(92, current + lift);
      });
    }, 120);
  }, [clearTimers]);

  const finishLoading = useCallback(() => {
    if (!visibleRef.current) {
      return;
    }

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const elapsed = performance.now() - startedAtRef.current;
    const remaining = Math.max(420, 920 - elapsed);
    setProgress(100);

    hideTimerRef.current = window.setTimeout(() => {
      visibleRef.current = false;
      setVisible(false);
      setProgress(0);
    }, remaining);
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

      if (getInternalDestination(target)) {
        startLoading();
      }
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [startLoading]);

  useEffect(() => {
    if (previousPathRef.current !== pathname) {
      previousPathRef.current = pathname;
      finishLoading();
    }
  }, [finishLoading, pathname]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <div className={`route-transition-loader ${visible ? "is-visible" : ""}`} aria-hidden={!visible}>
      <div className="route-transition-loader__panel" role="status" aria-live="polite">
        <span className="route-transition-loader__logo">
          <BrandLogo size={42} priority={false} />
        </span>
        <span className="route-transition-loader__copy">
          <span>TooolVibes jump</span>
          <strong>Caricamento rotta</strong>
        </span>
        <span className="route-transition-loader__track">
          <span style={{ width: `${progress}%` }} />
        </span>
        <span className="route-transition-loader__value">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}
