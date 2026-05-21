"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";

import { BrandLogo } from "@/components/layout/brand-logo";
import { SOUND_PLAY_EVENT } from "@/lib/config/sound";

const INTRO_STORAGE_KEY = "tooolvibes:brand-intro-reactor-v1";
const INTRO_DURATION_MS = 3640;

const reactorNodes = [
  { label: "AI app", x: -18, y: -11, z: 7, rotate: -10 },
  { label: "Vibe code", x: 18, y: -10, z: 11, rotate: 8 },
  { label: "No-code", x: -15, y: 11, z: 14, rotate: 7 },
  { label: "Automation", x: 16, y: 12, z: 5, rotate: -8 },
];

const reactorRings = [
  { scale: 0.62, z: -34, delay: 0 },
  { scale: 0.88, z: -12, delay: 120 },
  { scale: 1.12, z: 12, delay: 240 },
  { scale: 1.34, z: 34, delay: 360 },
];

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
    // Storage can be unavailable in private or embedded browser contexts.
  }
}

export function HomeBrandIntro() {
  const [phase, setPhase] = useState<"hidden" | "active" | "leaving">("active");
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const finishIntro = useCallback((quick = false) => {
    clearTimers();
    setPhase("leaving");
    window.dispatchEvent(new CustomEvent(SOUND_PLAY_EVENT, { detail: { kind: "introClose" } }));

    const hideTimer = window.setTimeout(
      () => {
        markIntroPlayed();
        document.documentElement.classList.remove("brand-intro-active", "brand-intro-preflight");
        window.dispatchEvent(new CustomEvent("tooolvibes:brand-intro-finished"));
        setPhase("hidden");
      },
      quick ? 360 : 620,
    );
    timersRef.current.push(hideTimer);
  }, [clearTimers]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alreadyPlayed = hasPlayedIntro();

    if (prefersReducedMotion || alreadyPlayed) {
      document.documentElement.classList.remove("brand-intro-active", "brand-intro-preflight");
      window.dispatchEvent(new CustomEvent("tooolvibes:brand-intro-finished"));
      setPhase("hidden");
      return undefined;
    }

    document.documentElement.classList.add("brand-intro-active");
    document.documentElement.classList.remove("brand-intro-preflight");
    setPhase("active");
    window.dispatchEvent(new CustomEvent(SOUND_PLAY_EVENT, { detail: { kind: "introOpen" } }));

    timersRef.current.push(
      window.setTimeout(() => finishIntro(false), INTRO_DURATION_MS),
    );

    return () => {
      clearTimers();
      document.documentElement.classList.remove("brand-intro-active", "brand-intro-preflight");
    };
  }, [clearTimers, finishIntro]);

  if (phase === "hidden") {
    return null;
  }

  return (
    <div className={`brand-intro ${phase === "leaving" ? "is-leaving" : ""}`}>
      <div className="brand-intro__scene" aria-hidden="true">
        <span className="brand-intro__backdrop" />
        <span className="brand-intro__reactor-grid" />

        <span className="brand-intro__reactor-rings">
          {reactorRings.map((ring, index) => (
            <i
              key={index}
              style={
                {
                  "--intro-ring-scale": ring.scale,
                  "--intro-ring-z": `${ring.z}px`,
                  "--intro-ring-delay": `${ring.delay}ms`,
                } as CSSProperties
              }
            />
          ))}
        </span>

        <span className="brand-intro__tool-cloud">
          {reactorNodes.map((node, index) => (
            <i
              key={node.label}
              style={
                {
                  "--intro-node-x": `${node.x * 0.72}rem`,
                  "--intro-node-y": `${node.y * 0.58}rem`,
                  "--intro-node-z": `${node.z}rem`,
                  "--intro-node-rotate": `${node.rotate}deg`,
                  "--intro-node-delay": `${260 + index * 90}ms`,
                } as CSSProperties
              }
            >
              {node.label}
            </i>
          ))}
        </span>

        <span className="brand-intro__core">
          <span className="brand-intro__core-shell" />
          <BrandLogo size={116} priority className="brand-intro__logo" />
          <span className="brand-intro__core-line brand-intro__core-line--one" />
          <span className="brand-intro__core-line brand-intro__core-line--two" />
        </span>

        <span className="brand-intro__title" aria-label="TOOOLVIBES">
          <span>TOOOL</span>
          <span>VIBES</span>
        </span>
        <span className="brand-intro__caption">3D AI tools reactor</span>
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
