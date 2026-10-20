"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Layers3, ScanSearch, Sparkles } from "lucide-react";
import Link from "@/components/ui/app-link";
import { useLocale } from "@/components/i18n/locale-provider";
import { workspaceViewHref } from "@/components/account/workspace/workspace-model";
import type { HeroSceneController } from "./hero-decision-scene";
import { HERO_ARTWORK } from "./hero-decision-motion";
/** Decorative scene: it illustrates a choice and never changes the workspace. */
export function HeroDecisionScope() {
  const { locale } = useLocale();
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<HeroSceneController | null>(null);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const element = host.current;
    if (!element || reduced)
      return;
    if (typeof IntersectionObserver === "undefined") { setFailed(true); return; }
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
          if (!disposed) {
            setFailed(true);
            setReady(false);
          }
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
        if (!disposed) {
          setFailed(true);
          setReady(false);
        }
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
    <div className="hero-instrument" data-scene-ready={ready || undefined} data-scene-failed={failed || undefined}>
      <div className="hero-instrument__art" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-instrument__poster" src={HERO_ARTWORK} alt="" width="1000" height="833" decoding="async" />
        <div className="hero-instrument__canvas" ref={host} />
      </div>
      <ol className="hero-instrument__journey" aria-label={locale === "en" ? "Your next steps" : "I tuoi prossimi passi"}>
        {[
          { label: locale === "en" ? "Discover" : "Scopri", href: "/archivio", Icon: ScanSearch },
          { label: locale === "en" ? "Explore deeper" : "Approfondisci", href: "/posts", Icon: Sparkles },
          { label: locale === "en" ? "Build your stack" : "Crea il tuo stack", href: workspaceViewHref("stack"), Icon: Layers3 },
        ].map(({ label, href, Icon }, index) => (
          <li className="hero-instrument__step" key={href}>
            <Link className="hero-instrument__pill" href={href}>
              <span className="hero-instrument__pill-icon" aria-hidden="true"><Icon size={15} /></span>
              <span className="hero-instrument__pill-number" aria-hidden="true">0{index + 1}</span>
              <span>{label}</span>
              <ArrowUpRight className="hero-instrument__pill-arrow" size={13} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
