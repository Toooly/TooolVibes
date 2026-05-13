"use client";

import { useEffect, useRef } from "react";

type SoundKind = "tap" | "nav" | "brand" | "menu";

const INTERACTIVE_SELECTOR =
  "a, button, summary, [role='button'], [data-sonic-action]";

function getSoundKind(element: HTMLElement): SoundKind {
  if (element.closest(".group\\/brand, .brand-mark")) {
    return "brand";
  }

  if (
    element.classList.contains("mobile-menu-button") ||
    element.getAttribute("aria-label")?.toLowerCase().includes("menu")
  ) {
    return "menu";
  }

  if (element instanceof HTMLAnchorElement) {
    return "nav";
  }

  return "tap";
}

function addPulse(element: HTMLElement) {
  const targets = [element];
  const brandMark = element.querySelector<HTMLElement>(".brand-mark") ?? element.closest<HTMLElement>(".brand-mark");

  if (brandMark && !targets.includes(brandMark)) {
    targets.push(brandMark);
  }

  targets.forEach((target) => {
    target.classList.remove("is-sonic-tap");
    void target.offsetWidth;
    target.classList.add("is-sonic-tap");
    window.setTimeout(() => target.classList.remove("is-sonic-tap"), 520);
  });
}

function playTone(context: AudioContext, kind: SoundKind) {
  const now = context.currentTime;
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  const primary = context.createOscillator();
  const overtone = context.createOscillator();

  const settings: Record<SoundKind, { attack: number; decay: number; start: number; end: number; volume: number }> = {
    tap: { attack: 0.004, decay: 0.085, start: 520, end: 260, volume: 0.028 },
    nav: { attack: 0.006, decay: 0.13, start: 660, end: 440, volume: 0.026 },
    brand: { attack: 0.01, decay: 0.22, start: 330, end: 660, volume: 0.034 },
    menu: { attack: 0.006, decay: 0.16, start: 420, end: 720, volume: 0.027 },
  };
  const tone = settings[kind];

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, now);
  filter.frequency.exponentialRampToValueAtTime(720, now + tone.decay);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(tone.volume, now + tone.attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.decay);

  primary.type = kind === "brand" ? "triangle" : "sine";
  overtone.type = "sine";
  primary.frequency.setValueAtTime(tone.start, now);
  primary.frequency.exponentialRampToValueAtTime(tone.end, now + tone.decay);
  overtone.frequency.setValueAtTime(tone.start * 1.5, now);
  overtone.frequency.exponentialRampToValueAtTime(tone.end * 1.25, now + tone.decay);

  primary.connect(filter);
  overtone.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);

  primary.start(now);
  overtone.start(now + 0.012);
  primary.stop(now + tone.decay + 0.02);
  overtone.stop(now + tone.decay + 0.02);
}

export function InteractionSoundLayer() {
  const audioRef = useRef<AudioContext | null>(null);
  const lastPlayedRef = useRef(0);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>(INTERACTIVE_SELECTOR)
        : null;

      if (
        !target ||
        target.matches("input, textarea, select") ||
        target.getAttribute("aria-disabled") === "true" ||
        (target instanceof HTMLButtonElement && target.disabled)
      ) {
        return;
      }

      const now = performance.now();
      if (now - lastPlayedRef.current < 70) {
        return;
      }
      lastPlayedRef.current = now;

      addPulse(target);

      const AudioContextConstructor =
        window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) {
        return;
      }

      const context = audioRef.current ?? new AudioContextConstructor();
      audioRef.current = context;

      if (context.state === "suspended") {
        void context.resume();
      }

      playTone(context, getSoundKind(target));
    }

    window.addEventListener("pointerdown", handlePointerDown, { passive: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      void audioRef.current?.close();
      audioRef.current = null;
    };
  }, []);

  return null;
}
