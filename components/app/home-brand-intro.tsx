"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/layout/brand-logo";
import { SOUND_PLAY_EVENT } from "@/lib/config/sound";

const INTRO_STORAGE_KEY = "tooolvibes:brand-intro-portal-v1";
const INTRO_DURATION_MS = 3600;
const INTRO_HIDDEN_PATHS = ["/admin", "/api", "/auth"];

function hasPlayedIntro() {
  try {
    return window.sessionStorage.getItem(INTRO_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function markIntroPlayed() {
  try {
    window.sessionStorage.setItem(INTRO_STORAGE_KEY, "true");
  } catch {
    // noop
  }
}

/* ── Static visual data (no hydration mismatch) ── */
const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: 5 + Math.random() * 90,
  y: 5 + Math.random() * 90,
  size: 2 + Math.random() * 3,
  delay: Math.random() * 2,
  duration: 3 + Math.random() * 4,
  opacity: 0.2 + Math.random() * 0.5,
}));

const FRAGMENTS = Array.from({ length: 8 }, (_, i) => {
  const shapes = ["hex", "diamond", "triangle", "blob", "star"] as const;
  const colors = ["#6a3cff", "#39d2f6", "#f3bf4c", "#8b6cff", "#2bb9de"];
  return {
    id: i,
    shape: shapes[i % shapes.length],
    color: colors[i % colors.length],
    orbitRadius: 130 + (i % 3) * 45,
    orbitDuration: 5 + (i % 3) * 2,
    orbitDelay: i * 0.35,
    size: 10 + (i % 3) * 5,
    startAngle: (i / 8) * Math.PI * 2,
  };
});

export function SiteBrandIntro() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"hidden" | "active" | "leaving">("hidden");
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const finishIntro = useCallback(
    (quick = false) => {
      clearTimers();
      setPhase("leaving");
      window.dispatchEvent(
        new CustomEvent(SOUND_PLAY_EVENT, { detail: { kind: "introClose" } }),
      );

      const hideTimer = window.setTimeout(
        () => {
          markIntroPlayed();
          document.documentElement.classList.remove("brand-intro-active");
          window.dispatchEvent(
            new CustomEvent("tooolvibes:brand-intro-finished"),
          );
          window.setTimeout(() => {
            document.documentElement.classList.remove("brand-intro-preflight");
          }, 120);
          setPhase("hidden");
        },
        quick ? 360 : 720,
      );
      timersRef.current.push(hideTimer);
    },
    [clearTimers],
  );

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const alreadyPlayed = hasPlayedIntro();
    const shouldHide = INTRO_HIDDEN_PATHS.some((path) =>
      pathname?.startsWith(path),
    );

    if (shouldHide || prefersReducedMotion || alreadyPlayed) {
      document.documentElement.classList.remove(
        "brand-intro-active",
        "brand-intro-preflight",
      );
      window.dispatchEvent(
        new CustomEvent("tooolvibes:brand-intro-finished"),
      );
      setPhase("hidden");
      return undefined;
    }

    document.documentElement.classList.add("brand-intro-active");
    setPhase("active");
    window.dispatchEvent(
      new CustomEvent(SOUND_PLAY_EVENT, { detail: { kind: "introOpen" } }),
    );

    timersRef.current.push(
      window.setTimeout(() => finishIntro(false), INTRO_DURATION_MS),
    );

    return () => {
      clearTimers();
      document.documentElement.classList.remove(
        "brand-intro-active",
        "brand-intro-preflight",
      );
    };
  }, [clearTimers, finishIntro, pathname]);

  const isLeaving = phase === "leaving";

  /* Reduced motion: skip everything visual, just block briefly */
  if (phase === "hidden") return null;

  return (
    <div
      className={`brand-intro ${isLeaving ? "is-leaving" : ""}`}
      aria-hidden={isLeaving}
    >
      <div className="brand-intro__scene">
        {/* Ambient background glows */}
        <div className="brand-intro__bg-glow" />
        <div className="brand-intro__bg-glow brand-intro__bg-glow--secondary" />

        {/* ── Portal ── */}
        <div className="brand-intro__portal">
          {/* Rings */}
          <div className="brand-intro__ring brand-intro__ring--inner" />
          <div className="brand-intro__ring brand-intro__ring--mid" />
          <div className="brand-intro__ring brand-intro__ring--outer" />

          {/* Core */}
          <div className="brand-intro__core" />
          <div className="brand-intro__core-inner" />

          {/* Orbiting fragments */}
          {FRAGMENTS.map((f) => (
            <div
              key={f.id}
              className={`brand-intro__fragment brand-intro__fragment--${f.shape}`}
              style={{
                ["--orbit-radius" as string]: `${f.orbitRadius}px`,
                ["--orbit-duration" as string]: `${f.orbitDuration}s`,
                ["--orbit-delay" as string]: `${f.orbitDelay}s`,
                ["--fragment-color" as string]: f.color,
                ["--fragment-size" as string]: `${f.size}px`,
                ["--start-angle" as string]: `${f.startAngle}rad`,
              } as React.CSSProperties}
            />
          ))}

          {/* Floating particles */}
          {PARTICLES.map((p) => (
            <div
              key={p.id}
              className="brand-intro__particle"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                opacity: p.opacity,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }}
            />
          ))}
        </div>

        {/* ── Text overlay ── */}
        <div className="brand-intro__overlay">
          <BrandLogo size={64} priority className="brand-intro__logo" />

          <h1 className="brand-intro__title" aria-label="TOOOLVIBES">
            {"TOOOLVIBES".split("").map((char, i) => (
              <span
                key={i}
                style={{ animationDelay: `${1.0 + i * 0.05}s` }}
              >
                {char}
              </span>
            ))}
          </h1>

          <p
            className="brand-intro__caption"
            style={{ animationDelay: "1.55s" }}
          >
            Discover the tools that move the web
          </p>
        </div>

        {/* Explosion light burst */}
        <div className="brand-intro__explosion" />
      </div>

      <button
        type="button"
        className="brand-intro__skip"
        data-sonic-action="introClose"
        onClick={() => finishIntro(true)}
      >
        Salta
      </button>
    </div>
  );
}
