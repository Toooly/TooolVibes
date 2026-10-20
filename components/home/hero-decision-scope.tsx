"use client";
import { useEffect, useRef, useState } from "react";
import type { HeroSceneController } from "./hero-decision-scene";
import { HERO_ARTWORK } from "./hero-decision-motion";
/** Decorative scene: it illustrates a choice and never changes the workspace. */
export function HeroDecisionScope() {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<HeroSceneController | null>(null);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const element = host.current;
    if (!element || reduced || typeof IntersectionObserver === "undefined")
      return;
    let disposed = false;
    let loading = false;
    let visible = false;
    const sync = () => controller.current?.setActive(visible && !document.hidden);
    const observer = new IntersectionObserver(async ([entry]) => {
      visible = entry.isIntersecting;
      sync();
      if (!visible || loading)
        return;
      loading = true;
      try {
        const { mountHeroScene } = await import("./hero-decision-scene");
        if (disposed)
          return;
        const scene = await mountHeroScene(element, () => {
          if (!disposed)
            setReady(false);
        });
        if (disposed) {
          scene.dispose();
          return;
        }
        controller.current = scene;
        sync();
        setReady(true);
      }
      catch {
        // Decorative rendering must never interrupt navigation or search.
        if (!disposed)
          setReady(false);
      }
    }, { rootMargin: "80px" });
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      controller.current?.dispose();
      controller.current = null;
      setReady(false);
    };
  }, [reduced]);
  return (
    <div className="hero-instrument" data-scene-ready={ready || undefined}>
      <div className="hero-instrument__art" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-instrument__poster" src={HERO_ARTWORK} alt="" width="1000" height="833" decoding="async" />
        <div className="hero-instrument__canvas" ref={host} />
      </div>
    </div>
  );
}
