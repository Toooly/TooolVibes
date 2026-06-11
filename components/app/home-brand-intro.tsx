"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import { SOUND_PLAY_EVENT } from "@/lib/config/sound";

const INTRO_STORAGE_KEY = "tooolvibes:brand-intro-mobile-neon-v1";
const INTRO_DURATION_MS = 5600;
const INTRO_HIDDEN_PATHS = ["/admin", "/api", "/auth"];
const MOBILE_INTRO_QUERY = "(max-width: 767px)";
const INTRO_TITLE = "TooolVibes";

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

const SPARKS = Array.from({ length: 38 }, (_, i) => {
  const angle = (i / 38) * Math.PI * 2;
  const radius = 22 + (i % 8) * 4.4;

  return {
    id: i,
    x: 50 + Math.cos(angle) * radius,
    y: 36 + Math.sin(angle) * radius * 0.58,
    driftX: Math.cos(angle) * (12 + (i % 5) * 4),
    driftY: Math.sin(angle) * (8 + (i % 4) * 3),
    size: 1.6 + (i % 4) * 0.7,
    delay: 0.08 + (i % 10) * 0.055,
    duration: 2.4 + (i % 6) * 0.28,
    color:
      i % 5 === 0
        ? "255, 213, 94"
        : i % 3 === 0
          ? "90, 229, 255"
          : "136, 91, 255",
  };
});

export function SiteBrandIntro() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"hidden" | "active" | "leaving">(
    "hidden",
  );
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
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const mobileIntroQuery = window.matchMedia(MOBILE_INTRO_QUERY);
    const shouldHide = INTRO_HIDDEN_PATHS.some((path) =>
      pathname?.startsWith(path),
    );
    let hasStarted = false;
    let retryTimer = 0;

    const skipIntro = (announceFinished = true) => {
      document.documentElement.classList.remove(
        "brand-intro-active",
        "brand-intro-preflight",
      );
      if (announceFinished) {
        window.dispatchEvent(
          new CustomEvent("tooolvibes:brand-intro-finished"),
        );
      }
      setPhase("hidden");
    };

    const tryStartIntro = () => {
      if (hasStarted) return;

      const alreadyPlayed = hasPlayedIntro();

      if (shouldHide || reducedMotionQuery.matches || alreadyPlayed) {
        skipIntro();
        return;
      }

      if (!mobileIntroQuery.matches) {
        skipIntro(false);
        return;
      }

      hasStarted = true;
      document.documentElement.classList.add("brand-intro-active");
      setPhase("active");
      window.dispatchEvent(
        new CustomEvent(SOUND_PLAY_EVENT, { detail: { kind: "introOpen" } }),
      );

      timersRef.current.push(
        window.setTimeout(() => finishIntro(false), INTRO_DURATION_MS),
      );
    };

    tryStartIntro();
    retryTimer = window.setTimeout(tryStartIntro, 180);
    mobileIntroQuery.addEventListener("change", tryStartIntro);

    return () => {
      window.clearTimeout(retryTimer);
      mobileIntroQuery.removeEventListener("change", tryStartIntro);
      clearTimers();
      document.documentElement.classList.remove(
        "brand-intro-active",
        "brand-intro-preflight",
      );
    };
  }, [clearTimers, finishIntro, pathname]);

  const isLeaving = phase === "leaving";

  if (phase === "hidden") return null;

  return (
    <div
      className={`brand-intro brand-intro--mobile ${isLeaving ? "is-leaving" : ""}`}
      aria-hidden={isLeaving}
    >
      <div className="brand-intro__scene">
        <div className="brand-intro__grain" />
        <div className="brand-intro__aurora" />
        <div className="brand-intro__spark-field" aria-hidden="true">
          {SPARKS.map((spark) => (
            <span
              key={spark.id}
              className="brand-intro__spark"
              style={
                {
                  "--spark-x": `${spark.x}%`,
                  "--spark-y": `${spark.y}%`,
                  "--spark-drift-x": `${spark.driftX}px`,
                  "--spark-drift-y": `${spark.driftY}px`,
                  "--spark-size": `${spark.size}px`,
                  "--spark-color": spark.color,
                  "--spark-delay": `${spark.delay}s`,
                  "--spark-duration": `${spark.duration}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>

        <div className="brand-intro__logo-stage" aria-hidden="true">
          <div className="brand-intro__logo-halo brand-intro__logo-halo--violet" />
          <div className="brand-intro__logo-halo brand-intro__logo-halo--cyan" />
          <div className="brand-intro__logo-ring" />
          <Image
            src="/brand/tooolvibes-logo.png"
            alt=""
            width={360}
            height={360}
            priority
            className="brand-intro__logo"
          />
        </div>

        <div className="brand-intro__copy">
          <p className="brand-intro__welcome">Welcome in</p>

          <h1 className="brand-intro__title" aria-label={INTRO_TITLE}>
            {INTRO_TITLE.split("").map((char, i) => (
              <span
                key={i}
                aria-hidden="true"
                style={{ animationDelay: `${1.72 + i * 0.04}s` }}
              >
                {char}
              </span>
            ))}
          </h1>
        </div>

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
