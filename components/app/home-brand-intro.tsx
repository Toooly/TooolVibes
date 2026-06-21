"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { SOUND_PLAY_EVENT, type TooolvibesSoundKind } from "@/lib/gamification/sound-engine";

const INTRO_DURATION_MS = 3800;
const INTRO_EXIT_MS = 700;
const HAS_SEEN_INTRO_KEY = "tooolvibes:brand-intro-mobile-neon-v1";
const LEGACY_HAS_SEEN_INTRO_KEY = "tooolvibes_has_seen_intro";
const MOBILE_BREAKPOINT = 768;
const INTRO_DOM_CLASSES = ["brand-intro-preflight", "brand-intro-active"] as const;

type IntroPhase = "entering" | "playing" | "leaving" | "unmounted";

function clearIntroDomLocks() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove(...INTRO_DOM_CLASSES);
}

function markIntroAsSeen() {
  try {
    sessionStorage.setItem(HAS_SEEN_INTRO_KEY, "true");
    sessionStorage.setItem(LEGACY_HAS_SEEN_INTRO_KEY, "1");
  } catch {
    // Storage can be unavailable in restricted browser modes.
  }
}

function hasSeenIntro() {
  try {
    return (
      sessionStorage.getItem(HAS_SEEN_INTRO_KEY) === "true" ||
      sessionStorage.getItem(LEGACY_HAS_SEEN_INTRO_KEY) === "1"
    );
  } catch {
    return false;
  }
}

function shouldForceIntro() {
  try {
    return new URLSearchParams(window.location.search).get("intro") === "1";
  } catch {
    return false;
  }
}

function dispatchIntroFinished(skipped: boolean) {
  clearIntroDomLocks();
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("tooolvibes:brand-intro-finished", {
      detail: { skipped },
    })
  );
}

function dispatchSound(kind: TooolvibesSoundKind) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SOUND_PLAY_EVENT, {
      detail: { kind },
    })
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isMobile;
}

function StarField() {
  const stars = useRef(
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${2 + Math.random() * 4}s`,
      delay: `${Math.random() * 3}s`,
    }))
  ).current;

  return (
    <div className="brand-intro__stars" aria-hidden="true">
      {stars.map((star) => (
        <span
          key={star.id}
          className="brand-intro__star"
          style={{
            left: star.left,
            top: star.top,
            animationDuration: star.duration,
            animationDelay: star.delay,
          }}
        />
      ))}
    </div>
  );
}

export function HomeBrandIntro({
  onComplete,
}: {
  onComplete?: (skipped: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const [phase, setPhase] = useState<IntroPhase>("entering");
  const [shouldRender, setShouldRender] = useState(false);
  const hasFinished = useRef(false);

  const finishIntro = useCallback(
    (skipped = false) => {
      if (hasFinished.current) return;
      hasFinished.current = true;
      markIntroAsSeen();
      setPhase("leaving");

      window.setTimeout(() => {
        setPhase("unmounted");
        setShouldRender(false);
        dispatchIntroFinished(skipped);
        onComplete?.(skipped);
      }, INTRO_EXIT_MS);
    },
    [onComplete]
  );

  useEffect(() => {
    if (typeof window === "undefined" || isMobile === null) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const introAlreadySeen = hasSeenIntro();
    const forcedIntro = shouldForceIntro();

    if (!isMobile || reducedMotion || (introAlreadySeen && !forcedIntro)) {
      if (introAlreadySeen) {
        markIntroAsSeen();
      }
      setShouldRender(false);
      setPhase("unmounted");
      dispatchIntroFinished(true);
      onComplete?.(true);
      return;
    }

    hasFinished.current = false;
    setPhase("entering");
    setShouldRender(true);
    document.documentElement.classList.add("brand-intro-active");
    document.documentElement.classList.remove("brand-intro-preflight");

    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => dispatchSound("introOpen"), 200),
      window.setTimeout(() => dispatchSound("reveal"), 500),
      window.setTimeout(() => setPhase("playing"), 400),
      window.setTimeout(() => dispatchSound("introClose"), INTRO_DURATION_MS - 400),
      window.setTimeout(() => finishIntro(false), INTRO_DURATION_MS),
      window.setTimeout(() => {
        if (!hasFinished.current) {
          finishIntro(true);
        }
      }, INTRO_DURATION_MS + 1800)
    );

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [finishIntro, onComplete, isMobile]);

  if (!shouldRender || isMobile === false) return null;

  const title = "TooolVibes";

  return (
    <AnimatePresence>
      {phase !== "unmounted" && (
        <motion.div
          className={[
            "brand-intro",
            "brand-intro--mobile",
            `brand-intro--${phase}`,
            phase === "leaving" ? "is-leaving" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          role="dialog"
          aria-label="Introduzione TooolVibes"
          aria-hidden={phase === "leaving"}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onPointerDown={() => finishIntro(true)}
        >
          <StarField />

          <button
            className="brand-intro__skip"
            onClick={() => finishIntro(true)}
            aria-label="Salta introduzione"
            type="button"
          >
            <X size={20} />
          </button>

          <div className="brand-intro__logo-wrapper" aria-hidden="true">
            <div className="brand-intro__logo-stage">
              <span className="brand-intro__logo-halo brand-intro__logo-halo--violet" />
              <span className="brand-intro__logo-halo brand-intro__logo-halo--cyan" />
              <span className="brand-intro__logo-ring" />
              <span className="brand-intro__logo-orbit brand-intro__logo-orbit--one" />
              <span className="brand-intro__logo-orbit brand-intro__logo-orbit--two" />
              <span className="brand-intro__logo-orbit brand-intro__logo-orbit--three" />
              <Image
                className="brand-intro__logo"
                src="/brand/tooolvibes-logo.png"
                alt=""
                width={260}
                height={260}
                priority
                sizes="(max-width: 767px) 72vw, 260px"
              />
              <span className="brand-intro__logo-flare" />
            </div>
          </div>

          <div className="brand-intro__copy">
            <motion.p
              className="brand-intro__welcome"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
            >
              Welcome in
            </motion.p>

            <h1 className="brand-intro__title" aria-label={title}>
              {title.split("").map((char, i) => (
                <motion.span
                  key={i}
                  style={{ display: "inline-block" }}
                  initial={{ opacity: 0, scale: 1.4, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: 0.5 + i * 0.03,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </h1>

            <motion.p
              className="brand-intro__subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              Scopri. Confronta. Vibra.
            </motion.p>
          </div>

          <span className="brand-intro__explosion" aria-hidden="true" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
