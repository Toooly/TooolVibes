"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";

import { BrandLogo } from "@/components/layout/brand-logo";

const INTRO_STORAGE_KEY = "tooolvibes:brand-intro-v5";
const INTRO_TEXT = "TOOOLVIBES";
const INTRO_DURATION_MS = 4680;

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

    const hideTimer = window.setTimeout(
      () => {
        window.sessionStorage.setItem(INTRO_STORAGE_KEY, "true");
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
    const alreadyPlayed = window.sessionStorage.getItem(INTRO_STORAGE_KEY) === "true";

    if (prefersReducedMotion || alreadyPlayed) {
      document.documentElement.classList.remove("brand-intro-active", "brand-intro-preflight");
      setPhase("hidden");
      return undefined;
    }

    document.documentElement.classList.add("brand-intro-active");
    document.documentElement.classList.remove("brand-intro-preflight");
    setPhase("active");

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
      <div className="brand-intro__field" aria-hidden="true">
        <span className="brand-intro__starfield brand-intro__starfield--one" />
        <span className="brand-intro__starfield brand-intro__starfield--two" />
        <span className="brand-intro__aurora brand-intro__aurora--one" />
        <span className="brand-intro__aurora brand-intro__aurora--two" />
        <span className="brand-intro__prism">
          <span className="brand-intro__prism-ring brand-intro__prism-ring--one" />
          <span className="brand-intro__prism-ring brand-intro__prism-ring--two" />
          <span className="brand-intro__prism-ring brand-intro__prism-ring--three" />
          <span className="brand-intro__prism-core" />
        </span>
        <span className="brand-intro__word" aria-label="TOOOLVIBES">
          {INTRO_TEXT.split("").map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className="brand-intro__letter"
              style={
                {
                  "--intro-index": index,
                  "--intro-drift": (INTRO_TEXT.length - 1) / 2 - index,
                  "--intro-lane": (index % 3) - 1,
                  "--intro-tilt": index % 2 === 0 ? "-1" : "1",
                  "--intro-angle": `${index * 34 - 154}deg`,
                  "--intro-angle-inverse": `${154 - index * 34}deg`,
                  "--intro-radius": `${Math.abs((INTRO_TEXT.length - 1) / 2 - index) * 0.42 + 1.4}rem`,
                } as CSSProperties
              }
            >
              {letter}
            </span>
          ))}
        </span>
        <span className="brand-intro__logo-reveal">
          <span className="brand-intro__logo-pulse" />
          <BrandLogo size={126} priority className="brand-intro__logo" />
        </span>
        <span className="brand-intro__caption">AI tools discovery platform</span>
      </div>

      <button
        type="button"
        className="brand-intro__skip"
        onClick={() => finishIntro(true)}
      >
        Salta
      </button>
    </div>
  );
}
