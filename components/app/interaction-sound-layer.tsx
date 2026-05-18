"use client";

import { useEffect, useRef } from "react";

type SoundKind =
  | "tap"
  | "nav"
  | "brand"
  | "menu"
  | "save"
  | "compare"
  | "detail"
  | "stack"
  | "search"
  | "filter"
  | "open"
  | "close";

type SoundStep = {
  at: number;
  duration: number;
  frequency: number;
  endFrequency?: number;
  volume: number;
  type?: OscillatorType;
};

type SoundProfile = {
  filterStart: number;
  filterEnd: number;
  steps: SoundStep[];
  noise?: {
    at: number;
    duration: number;
    volume: number;
    frequency: number;
    q: number;
  };
};

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

  if (actionText.includes("chiudi") || actionText.includes("close")) {
    return "close";
  }

  if (actionText.includes("cerca") || actionText.includes("search")) {
    return "search";
  }

  if (actionText.includes("filtra") || actionText.includes("filtro") || actionText.includes("categoria")) {
    return "filter";
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

  if (actionText.includes("apri") || actionText.includes("esplora") || actionText.includes("entra")) {
    return "open";
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
      window.setTimeout(() => target.classList.remove("is-sonic-tap"), 560);
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
  window.setTimeout(() => pulse.remove(), 740);
}

function spawnSingularity(event: PointerEvent, kind: SoundKind) {
  const isTouchLike =
    event.pointerType === "touch" ||
    window.innerWidth < 768 ||
    window.matchMedia("(pointer: coarse)").matches;

  spawnSingularityAt(event.clientX, event.clientY, kind, isTouchLike);
}

const SOUND_PROFILES: Record<SoundKind, SoundProfile> = {
  tap: {
    filterStart: 2200,
    filterEnd: 900,
    steps: [
      { at: 0, duration: 0.085, frequency: 620, endFrequency: 430, volume: 0.012 },
      { at: 0.012, duration: 0.075, frequency: 930, endFrequency: 760, volume: 0.006, type: "triangle" },
    ],
  },
  nav: {
    filterStart: 2600,
    filterEnd: 1200,
    steps: [
      { at: 0, duration: 0.075, frequency: 392, endFrequency: 494, volume: 0.011 },
      { at: 0.045, duration: 0.09, frequency: 587, endFrequency: 740, volume: 0.012, type: "triangle" },
    ],
  },
  brand: {
    filterStart: 3200,
    filterEnd: 1600,
    steps: [
      { at: 0, duration: 0.16, frequency: 330, endFrequency: 495, volume: 0.012, type: "triangle" },
      { at: 0.055, duration: 0.18, frequency: 660, endFrequency: 990, volume: 0.014, type: "sine" },
      { at: 0.13, duration: 0.22, frequency: 1320, endFrequency: 1180, volume: 0.008, type: "sine" },
    ],
    noise: { at: 0.02, duration: 0.05, volume: 0.004, frequency: 2600, q: 8 },
  },
  menu: {
    filterStart: 2300,
    filterEnd: 1050,
    steps: [
      { at: 0, duration: 0.08, frequency: 520, endFrequency: 440, volume: 0.012, type: "triangle" },
      { at: 0.055, duration: 0.085, frequency: 690, endFrequency: 520, volume: 0.009 },
    ],
  },
  save: {
    filterStart: 3800,
    filterEnd: 1500,
    steps: [
      { at: 0, duration: 0.08, frequency: 660, endFrequency: 880, volume: 0.012, type: "triangle" },
      { at: 0.06, duration: 0.11, frequency: 990, endFrequency: 1320, volume: 0.014 },
      { at: 0.13, duration: 0.1, frequency: 1760, endFrequency: 1480, volume: 0.006 },
    ],
    noise: { at: 0.02, duration: 0.045, volume: 0.0038, frequency: 3200, q: 10 },
  },
  compare: {
    filterStart: 2800,
    filterEnd: 980,
    steps: [
      { at: 0, duration: 0.13, frequency: 392, endFrequency: 392, volume: 0.012, type: "triangle" },
      { at: 0, duration: 0.13, frequency: 523, endFrequency: 523, volume: 0.01, type: "sine" },
      { at: 0.095, duration: 0.15, frequency: 784, endFrequency: 659, volume: 0.012 },
    ],
  },
  detail: {
    filterStart: 3400,
    filterEnd: 1300,
    steps: [
      { at: 0, duration: 0.12, frequency: 880, endFrequency: 660, volume: 0.011 },
      { at: 0.07, duration: 0.15, frequency: 1175, endFrequency: 990, volume: 0.009, type: "triangle" },
    ],
    noise: { at: 0, duration: 0.035, volume: 0.003, frequency: 2400, q: 7 },
  },
  stack: {
    filterStart: 2600,
    filterEnd: 1120,
    steps: [
      { at: 0, duration: 0.07, frequency: 440, endFrequency: 554, volume: 0.011, type: "triangle" },
      { at: 0.052, duration: 0.08, frequency: 554, endFrequency: 659, volume: 0.011, type: "triangle" },
      { at: 0.104, duration: 0.1, frequency: 659, endFrequency: 830, volume: 0.009 },
    ],
  },
  search: {
    filterStart: 4200,
    filterEnd: 1800,
    steps: [
      { at: 0, duration: 0.07, frequency: 1046, endFrequency: 880, volume: 0.009 },
      { at: 0.045, duration: 0.09, frequency: 1318, endFrequency: 1175, volume: 0.008, type: "triangle" },
    ],
    noise: { at: 0, duration: 0.04, volume: 0.0035, frequency: 3600, q: 12 },
  },
  filter: {
    filterStart: 2500,
    filterEnd: 980,
    steps: [
      { at: 0, duration: 0.075, frequency: 740, endFrequency: 620, volume: 0.01, type: "triangle" },
      { at: 0.06, duration: 0.08, frequency: 494, endFrequency: 392, volume: 0.009 },
    ],
  },
  open: {
    filterStart: 3000,
    filterEnd: 1250,
    steps: [
      { at: 0, duration: 0.12, frequency: 523, endFrequency: 659, volume: 0.012, type: "triangle" },
      { at: 0.08, duration: 0.14, frequency: 784, endFrequency: 1046, volume: 0.011 },
    ],
  },
  close: {
    filterStart: 2200,
    filterEnd: 760,
    steps: [
      { at: 0, duration: 0.075, frequency: 660, endFrequency: 520, volume: 0.01, type: "triangle" },
      { at: 0.05, duration: 0.08, frequency: 440, endFrequency: 330, volume: 0.008 },
    ],
  },
};

function scheduleStep(context: AudioContext, output: AudioNode, now: number, step: SoundStep) {
  const start = now + step.at;
  const attack = Math.min(0.018, step.duration * 0.32);
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = step.type ?? "sine";
  oscillator.frequency.setValueAtTime(step.frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(step.endFrequency ?? step.frequency, start + step.duration);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(step.volume, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + step.duration);

  oscillator.connect(gain);
  gain.connect(output);
  oscillator.start(start);
  oscillator.stop(start + step.duration + 0.025);
}

function scheduleNoise(context: AudioContext, output: AudioNode, now: number, profile: NonNullable<SoundProfile["noise"]>) {
  const sampleRate = context.sampleRate;
  const frameCount = Math.max(1, Math.floor(sampleRate * profile.duration));
  const buffer = context.createBuffer(1, frameCount, sampleRate);
  const channel = buffer.getChannelData(0);

  for (let index = 0; index < frameCount; index += 1) {
    channel[index] = (Math.random() * 2 - 1) * (1 - index / frameCount);
  }

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const start = now + profile.at;

  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(profile.frequency, start);
  filter.Q.setValueAtTime(profile.q, start);
  gain.gain.setValueAtTime(profile.volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + profile.duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  source.start(start);
  source.stop(start + profile.duration + 0.01);
}

function playTone(context: AudioContext, kind: SoundKind) {
  const now = context.currentTime;
  const master = context.createGain();
  const filter = context.createBiquadFilter();
  const profile = SOUND_PROFILES[kind];
  const tail = Math.max(...profile.steps.map((step) => step.at + step.duration), profile.noise ? profile.noise.at + profile.noise.duration : 0);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(profile.filterStart, now);
  filter.frequency.exponentialRampToValueAtTime(profile.filterEnd, now + tail + 0.04);

  master.gain.setValueAtTime(0.86, now);
  master.gain.exponentialRampToValueAtTime(0.0001, now + tail + 0.08);

  filter.connect(master);
  master.connect(context.destination);
  profile.steps.forEach((step) => scheduleStep(context, filter, now, step));

  if (profile.noise) {
    scheduleNoise(context, filter, now, profile.noise);
  }

  window.setTimeout(() => {
    filter.disconnect();
    master.disconnect();
  }, (tail + 0.14) * 1000);
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
