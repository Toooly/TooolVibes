"use client";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useLocale } from "@/components/i18n/locale-provider";
import type { HeroSceneController } from "./hero-decision-scene";
/** Decorative scene: it illustrates a choice and never changes the workspace. */
export function HeroDecisionScope() {
  const { locale } = useLocale();
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<HeroSceneController | null>(null);
  const pausedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
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
        const scene = await mountHeroScene(element, locale, () => {
          if (!disposed)
            setReady(false);
        });
        if (disposed) {
          scene.dispose();
          return;
        }
        controller.current = scene;
        scene.setPaused(pausedRef.current);
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
  }, [locale, reduced]);
  useEffect(() => { pausedRef.current = paused; controller.current?.setPaused(paused); }, [paused, ready]);
  const toggleMotion = () => {
    const next = !paused;
    pausedRef.current = next;
    controller.current?.setPaused(next);
    setPaused(next);
  };
  const label = locale === "en"
    ? paused ? "Resume hero animation" : "Pause hero animation"
    : paused ? "Riprendi animazione della hero" : "Metti in pausa animazione della hero";
  return (
    <div className="hero-instrument" data-scene-ready={ready || undefined} data-scene-paused={paused || undefined}>
      <div className="hero-instrument__art" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-instrument__poster" src="/hero/decision-instrument.webp" alt="" width="1000" height="848" decoding="async" />
        <div className="hero-instrument__canvas" ref={host} />
      </div>
      {ready && !reduced ? (
        <button className="hero-instrument__motion" type="button" aria-label={label} aria-pressed={paused} onClick={toggleMotion} data-sonic-action="none">
          {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
          <span>{locale === "en" ? paused ? "Resume" : "Pause" : paused ? "Riprendi" : "Pausa"}</span>
        </button>
      ) : null}
    </div>
  );
}
