"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";

import { BrandLogo } from "@/components/layout/brand-logo";

const INTRO_STORAGE_KEY = "tooolvibes:brand-intro-v1";
const INTRO_TEXT = "TOOOLVIBES";

export function HomeBrandIntro() {
  const [phase, setPhase] = useState<"hidden" | "active" | "leaving">("hidden");
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
        document.documentElement.classList.remove("brand-intro-active");
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
      return undefined;
    }

    document.documentElement.classList.add("brand-intro-active");
    setPhase("active");

    timersRef.current.push(
      window.setTimeout(() => finishIntro(false), 3120),
    );

    return () => {
      clearTimers();
      document.documentElement.classList.remove("brand-intro-active");
    };
  }, [clearTimers, finishIntro]);

  if (phase === "hidden") {
    return null;
  }

  return (
    <div className={`brand-intro ${phase === "leaving" ? "is-leaving" : ""}`}>
      <div className="brand-intro__field" aria-hidden="true">
        <span className="brand-intro__orbit brand-intro__orbit--one" />
        <span className="brand-intro__orbit brand-intro__orbit--two" />
        <span className="brand-intro__singularity" />
        <span className="brand-intro__word" aria-label="TOOOLVIBES">
          {INTRO_TEXT.split("").map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className="brand-intro__letter"
              style={
                {
                  "--intro-index": index,
                  "--intro-drift": (INTRO_TEXT.length - 1) / 2 - index,
                  "--intro-tilt": index % 2 === 0 ? "-1" : "1",
                } as CSSProperties
              }
            >
              {letter}
            </span>
          ))}
        </span>
        <span className="brand-intro__logo-shell">
          <span className="brand-intro__burst" />
          <BrandLogo size={118} priority className="brand-intro__logo" />
        </span>
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
