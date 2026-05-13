"use client";

import { useEffect, useRef } from "react";

type SoundKind = "tap" | "nav" | "brand" | "menu" | "save" | "compare" | "detail" | "stack";

const INTERACTIVE_SELECTOR =
  "a, button, summary, [role='button'], [data-sonic-action]";

function getSoundKind(element: HTMLElement): SoundKind {
  const actionText = `${element.getAttribute("aria-label") ?? ""} ${element.textContent ?? ""}`.toLowerCase();

  if (element.closest(".group\\/brand, .brand-mark")) {
    return "brand";
  }

  if (
    element.classList.contains("mobile-menu-button") ||
    element.getAttribute("aria-label")?.toLowerCase().includes("menu")
  ) {
    return "menu";
  }

  if (actionText.includes("salva") || actionText.includes("shortlist") || actionText.includes("salvato")) {
    return "save";
  }

  if (actionText.includes("confronta") || actionText.includes("compare")) {
    return "compare";
  }

  if (actionText.includes("dettagli") || actionText.includes("scheda") || actionText.includes("dettaglio")) {
    return "detail";
  }

  if (actionText.includes("stack")) {
    return "stack";
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

  window.requestAnimationFrame(() => {
    targets.forEach((target) => {
      if (!target.isConnected) {
        return;
      }

      target.classList.remove("is-sonic-tap");
      void target.offsetWidth;
      target.classList.add("is-sonic-tap");
      window.setTimeout(() => target.classList.remove("is-sonic-tap"), 520);
    });
  });
}

function spawnSingularityAt(clientX: number, clientY: number, kind: SoundKind, isTouchLike: boolean) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const pulse = document.createElement("span");
  pulse.className = `sonic-singularity sonic-singularity--${kind} ${
    isTouchLike ? "sonic-singularity--touch" : "sonic-singularity--pointer"
  }`;
  pulse.setAttribute("aria-hidden", "true");
  pulse.style.left = `${clientX}px`;
  pulse.style.top = `${clientY}px`;

  document.body.appendChild(pulse);
  window.setTimeout(() => pulse.remove(), 820);
}

function spawnSingularity(event: PointerEvent, kind: SoundKind) {
  const isTouchLike =
    event.pointerType === "touch" ||
    window.innerWidth < 768 ||
    window.matchMedia("(pointer: coarse)").matches;

  spawnSingularityAt(event.clientX, event.clientY, kind, isTouchLike);
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
    save: { attack: 0.006, decay: 0.16, start: 720, end: 960, volume: 0.03 },
    compare: { attack: 0.006, decay: 0.18, start: 360, end: 620, volume: 0.032 },
    detail: { attack: 0.008, decay: 0.2, start: 240, end: 720, volume: 0.03 },
    stack: { attack: 0.006, decay: 0.15, start: 580, end: 390, volume: 0.028 },
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
    function playInteractionTone(soundKind: SoundKind) {
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

      playTone(context, soundKind);
    }

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

      const soundKind = getSoundKind(target);

      addPulse(target);
      spawnSingularity(event, soundKind);
      playInteractionTone(soundKind);
    }

    function handleTouchStart(event: TouchEvent) {
      const touch = event.changedTouches[0];
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>(INTERACTIVE_SELECTOR)
        : null;

      if (
        !touch ||
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

      const soundKind = getSoundKind(target);

      addPulse(target);
      spawnSingularityAt(touch.clientX, touch.clientY, soundKind, true);
      playInteractionTone(soundKind);
    }

    function handleClick(event: MouseEvent) {
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
      if (now - lastPlayedRef.current < 260) {
        return;
      }
      lastPlayedRef.current = now;

      const soundKind = getSoundKind(target);
      const isTouchLike = window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches;

      addPulse(target);
      spawnSingularityAt(event.clientX, event.clientY, soundKind, isTouchLike);
      playInteractionTone(soundKind);
    }

    window.addEventListener("pointerdown", handlePointerDown, { passive: true, capture: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true, capture: true });
    window.addEventListener("click", handleClick, { passive: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      window.removeEventListener("touchstart", handleTouchStart, { capture: true });
      window.removeEventListener("click", handleClick, { capture: true });
      void audioRef.current?.close();
      audioRef.current = null;
    };
  }, []);

  return null;
}
