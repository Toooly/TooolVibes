"use client";

import { useEffect, useRef } from "react";

import {
  SOUND_MUTED_CHANGE_EVENT,
  SOUND_PLAY_EVENT,
  SOUND_STORAGE_KEY,
  type TooolvibesSoundKind,
} from "@/lib/config/sound";

type SoundKind = TooolvibesSoundKind;

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
  "a, button, summary, [role='button'], [role='tab'], [cmdk-item], [data-sonic-action]";
const HOVER_SELECTOR =
  ".premium-button, .dynamic-link-card, .dynamic-card, .category-tool-card, .category-tool-card__icon-button, .mobile-bottom-link, summary, [role='tab'], [data-sonic-hover]";
const SOUND_KINDS: readonly SoundKind[] = [
  "tap",
  "nav",
  "brand",
  "menu",
  "save",
  "compare",
  "detail",
  "stack",
  "search",
  "filter",
  "filterApply",
  "open",
  "close",
  "expand",
  "collapse",
  "tab",
  "carousel",
  "hover",
  "drawerOpen",
  "drawerClose",
  "toast",
  "success",
  "warning",
  "update",
  "reveal",
  "introOpen",
  "introClose",
  "route",
];

function getInitialMuted() {
  try {
    const storedValue = window.localStorage.getItem(SOUND_STORAGE_KEY);
    if (storedValue !== null) {
      return storedValue === "true";
    }
  } catch {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isSoundKind(value: string | null | undefined): value is SoundKind {
  return SOUND_KINDS.includes(value as SoundKind);
}

function getSoundKind(element: HTMLElement): SoundKind {
  const explicitKind =
    element.closest<HTMLElement>("[data-sonic-action]")?.dataset.sonicAction;
  if (isSoundKind(explicitKind)) {
    return explicitKind;
  }
  const actionText = `${
    element.getAttribute("aria-label") ?? ""
  } ${element.textContent ?? ""}`.toLowerCase();
  if (element.getAttribute("role") === "tab") {
    return "tab";
  }
  if (element.matches("summary, [data-slot='accordion-trigger']")) {
    return "expand";
  }
  if (
    element.classList.contains("category-tool-carousel__control") ||
    element.classList.contains("category-tool-carousel__dot") ||
    actionText.includes("scorri")
  ) {
    return "carousel";
  }
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
  if (
    actionText.includes("filtra") ||
    actionText.includes("filtro") ||
    actionText.includes("categoria")
  ) {
    return "filterApply";
  }
  if (
    actionText.includes("salva") ||
    actionText.includes("shortlist") ||
    actionText.includes("salvato")
  ) {
    return "save";
  }
  if (actionText.includes("confronta") || actionText.includes("compare")) {
    return "compare";
  }
  if (
    actionText.includes("dettagli") ||
    actionText.includes("scheda") ||
    actionText.includes("dettaglio")
  ) {
    return "detail";
  }
  if (actionText.includes("stack")) {
    return "stack";
  }
  if (
    actionText.includes("segnali") ||
    actionText.includes("mostra") ||
    actionText.includes("altre")
  ) {
    return "expand";
  }
  if (
    actionText.includes("apri") ||
    actionText.includes("esplora") ||
    actionText.includes("entra")
  ) {
    return "open";
  }
  if (element instanceof HTMLAnchorElement) {
    return "nav";
  }
  return "tap";
}

function addPulse(element: HTMLElement) {
  const targets = [element];
  const brandMark =
    element.querySelector<HTMLElement>(".brand-mark") ??
    element.closest<HTMLElement>(".brand-mark");
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

function spawnSingularityAt(
  clientX: number,
  clientY: number,
  kind: SoundKind,
  isTouchLike: boolean
) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  const pulse = document.createElement("span");
  pulse.className = `sonic-singularity sonic-singularity--${kind} ${
    isTouchLike
      ? "sonic-singularity--touch"
      : "sonic-singularity--pointer"
  }`;
  pulse.setAttribute("aria-hidden", "true");
  pulse.style.left = `${clientX}px`;
  pulse.style.top = `${clientY}px`;
  document.body.appendChild(pulse);
  window.setTimeout(() => pulse.remove(), 740);
}

const SOUND_PROFILES: Record<SoundKind, SoundProfile> = {
  tap: {
    filterStart: 2200,
    filterEnd: 900,
    steps: [
      {
        at: 0,
        duration: 0.085,
        frequency: 620,
        endFrequency: 430,
        volume: 0.012,
      },
      {
        at: 0.012,
        duration: 0.075,
        frequency: 930,
        endFrequency: 760,
        volume: 0.006,
        type: "triangle",
      },
    ],
  },
  nav: {
    filterStart: 2600,
    filterEnd: 1200,
    steps: [
      {
        at: 0,
        duration: 0.075,
        frequency: 392,
        endFrequency: 494,
        volume: 0.011,
      },
      {
        at: 0.045,
        duration: 0.09,
        frequency: 587,
        endFrequency: 740,
        volume: 0.012,
        type: "triangle",
      },
    ],
  },
  brand: {
    filterStart: 3200,
    filterEnd: 1600,
    steps: [
      {
        at: 0,
        duration: 0.16,
        frequency: 330,
        endFrequency: 495,
        volume: 0.012,
        type: "triangle",
      },
      {
        at: 0.055,
        duration: 0.18,
        frequency: 660,
        endFrequency: 990,
        volume: 0.014,
        type: "sine",
      },
      {
        at: 0.13,
        duration: 0.22,
        frequency: 1320,
        endFrequency: 1180,
        volume: 0.008,
        type: "sine",
      },
    ],
    noise: {
      at: 0.02,
      duration: 0.05,
      volume: 0.004,
      frequency: 2600,
      q: 8,
    },
  },
  menu: {
    filterStart: 2300,
    filterEnd: 1050,
    steps: [
      {
        at: 0,
        duration: 0.08,
        frequency: 520,
        endFrequency: 440,
        volume: 0.012,
        type: "triangle",
      },
      {
        at: 0.055,
        duration: 0.085,
        frequency: 690,
        endFrequency: 520,
        volume: 0.009,
      },
    ],
  },
  save: {
    filterStart: 3800,
    filterEnd: 1500,
    steps: [
      {
        at: 0,
        duration: 0.08,
        frequency: 660,
        endFrequency: 880,
        volume: 0.012,
        type: "triangle",
      },
      {
        at: 0.06,
        duration: 0.11,
        frequency: 990,
        endFrequency: 1320,
        volume: 0.014,
      },
      {
        at: 0.13,
        duration: 0.1,
        frequency: 1760,
        endFrequency: 1480,
        volume: 0.006,
      },
    ],
    noise: {
      at: 0.02,
      duration: 0.045,
      volume: 0.0038,
      frequency: 3200,
      q: 10,
    },
  },
  compare: {
    filterStart: 2800,
    filterEnd: 980,
    steps: [
      {
        at: 0,
        duration: 0.13,
        frequency: 392,
        endFrequency: 392,
        volume: 0.012,
        type: "triangle",
      },
      {
        at: 0,
        duration: 0.13,
        frequency: 523,
        endFrequency: 523,
        volume: 0.01,
        type: "sine",
      },
      {
        at: 0.095,
        duration: 0.15,
        frequency: 784,
        endFrequency: 659,
        volume: 0.012,
      },
    ],
  },
  detail: {
    filterStart: 3400,
    filterEnd: 1300,
    steps: [
      {
        at: 0,
        duration: 0.12,
        frequency: 880,
        endFrequency: 660,
        volume: 0.011,
      },
      {
        at: 0.07,
        duration: 0.15,
        frequency: 1175,
        endFrequency: 990,
        volume: 0.009,
        type: "triangle",
      },
    ],
    noise: {
      at: 0,
      duration: 0.035,
      volume: 0.003,
      frequency: 2400,
      q: 7,
    },
  },
  stack: {
    filterStart: 2600,
    filterEnd: 1120,
    steps: [
      {
        at: 0,
        duration: 0.07,
        frequency: 440,
        endFrequency: 554,
        volume: 0.011,
        type: "triangle",
      },
      {
        at: 0.052,
        duration: 0.08,
        frequency: 554,
        endFrequency: 659,
        volume: 0.011,
        type: "triangle",
      },
      {
        at: 0.104,
        duration: 0.1,
        frequency: 659,
        endFrequency: 830,
        volume: 0.009,
      },
    ],
  },
  search: {
    filterStart: 4200,
    filterEnd: 1800,
    steps: [
      {
        at: 0,
        duration: 0.07,
        frequency: 1046,
        endFrequency: 880,
        volume: 0.009,
      },
      {
        at: 0.045,
        duration: 0.09,
        frequency: 1318,
        endFrequency: 1175,
        volume: 0.008,
        type: "triangle",
      },
    ],
    noise: {
      at: 0,
      duration: 0.04,
      volume: 0.0035,
      frequency: 3600,
      q: 12,
    },
  },
  filter: {
    filterStart: 2500,
    filterEnd: 980,
    steps: [
      {
        at: 0,
        duration: 0.075,
        frequency: 740,
        endFrequency: 620,
        volume: 0.01,
        type: "triangle",
      },
      {
        at: 0.06,
        duration: 0.08,
        frequency: 494,
        endFrequency: 392,
        volume: 0.009,
      },
    ],
  },
  filterApply: {
    filterStart: 3600,
    filterEnd: 1350,
    steps: [
      {
        at: 0,
        duration: 0.07,
        frequency: 932,
        endFrequency: 740,
        volume: 0.008,
        type: "triangle",
      },
      {
        at: 0.045,
        duration: 0.105,
        frequency: 587,
        endFrequency: 494,
        volume: 0.008,
      },
      {
        at: 0.115,
        duration: 0.09,
        frequency: 1175,
        endFrequency: 988,
        volume: 0.004,
        type: "sine",
      },
    ],
    noise: {
      at: 0.01,
      duration: 0.03,
      volume: 0.0025,
      frequency: 3600,
      q: 11,
    },
  },
  open: {
    filterStart: 3000,
    filterEnd: 1250,
    steps: [
      {
        at: 0,
        duration: 0.12,
        frequency: 523,
        endFrequency: 659,
        volume: 0.012,
        type: "triangle",
      },
      {
        at: 0.08,
        duration: 0.14,
        frequency: 784,
        endFrequency: 1046,
        volume: 0.011,
      },
    ],
  },
  close: {
    filterStart: 2200,
    filterEnd: 760,
    steps: [
      {
        at: 0,
        duration: 0.075,
        frequency: 660,
        endFrequency: 520,
        volume: 0.01,
        type: "triangle",
      },
      {
        at: 0.05,
        duration: 0.08,
        frequency: 440,
        endFrequency: 330,
        volume: 0.008,
      },
    ],
  },
  expand: {
    filterStart: 3400,
    filterEnd: 1550,
    steps: [
      {
        at: 0,
        duration: 0.09,
        frequency: 494,
        endFrequency: 659,
        volume: 0.008,
        type: "triangle",
      },
      {
        at: 0.06,
        duration: 0.11,
        frequency: 784,
        endFrequency: 988,
        volume: 0.007,
        type: "sine",
      },
    ],
  },
  collapse: {
    filterStart: 2400,
    filterEnd: 880,
    steps: [
      {
        at: 0,
        duration: 0.075,
        frequency: 784,
        endFrequency: 622,
        volume: 0.007,
        type: "triangle",
      },
      {
        at: 0.045,
        duration: 0.095,
        frequency: 494,
        endFrequency: 392,
        volume: 0.006,
      },
    ],
  },
  tab: {
    filterStart: 4200,
    filterEnd: 1750,
    steps: [
      {
        at: 0,
        duration: 0.055,
        frequency: 880,
        endFrequency: 1046,
        volume: 0.007,
        type: "triangle",
      },
      {
        at: 0.052,
        duration: 0.09,
        frequency: 1318,
        endFrequency: 1175,
        volume: 0.005,
        type: "sine",
      },
    ],
    noise: {
      at: 0,
      duration: 0.024,
      volume: 0.002,
      frequency: 4200,
      q: 12,
    },
  },
  carousel: {
    filterStart: 3000,
    filterEnd: 1250,
    steps: [
      {
        at: 0,
        duration: 0.08,
        frequency: 392,
        endFrequency: 523,
        volume: 0.006,
        type: "triangle",
      },
      {
        at: 0.05,
        duration: 0.1,
        frequency: 659,
        endFrequency: 784,
        volume: 0.006,
        type: "sine",
      },
    ],
  },
  hover: {
    filterStart: 4800,
    filterEnd: 2300,
    steps: [
      {
        at: 0,
        duration: 0.045,
        frequency: 1760,
        endFrequency: 1480,
        volume: 0.0028,
        type: "sine",
      },
      {
        at: 0.018,
        duration: 0.05,
        frequency: 880,
        endFrequency: 988,
        volume: 0.002,
        type: "triangle",
      },
    ],
  },
  drawerOpen: {
    filterStart: 3200,
    filterEnd: 1100,
    steps: [
      {
        at: 0,
        duration: 0.12,
        frequency: 330,
        endFrequency: 494,
        volume: 0.008,
        type: "triangle",
      },
      {
        at: 0.075,
        duration: 0.16,
        frequency: 659,
        endFrequency: 880,
        volume: 0.007,
        type: "sine",
      },
    ],
    noise: {
      at: 0.02,
      duration: 0.045,
      volume: 0.0022,
      frequency: 2400,
      q: 8,
    },
  },
  drawerClose: {
    filterStart: 2200,
    filterEnd: 760,
    steps: [
      {
        at: 0,
        duration: 0.09,
        frequency: 659,
        endFrequency: 523,
        volume: 0.007,
        type: "triangle",
      },
      {
        at: 0.06,
        duration: 0.11,
        frequency: 392,
        endFrequency: 330,
        volume: 0.005,
      },
    ],
  },
  toast: {
    filterStart: 4400,
    filterEnd: 1900,
    steps: [
      {
        at: 0,
        duration: 0.075,
        frequency: 1046,
        endFrequency: 1318,
        volume: 0.006,
        type: "sine",
      },
      {
        at: 0.055,
        duration: 0.11,
        frequency: 1568,
        endFrequency: 1760,
        volume: 0.005,
        type: "triangle",
      },
    ],
    noise: {
      at: 0.012,
      duration: 0.032,
      volume: 0.002,
      frequency: 3900,
      q: 12,
    },
  },
  success: {
    filterStart: 5200,
    filterEnd: 2100,
    steps: [
      {
        at: 0,
        duration: 0.07,
        frequency: 659,
        endFrequency: 880,
        volume: 0.007,
        type: "triangle",
      },
      {
        at: 0.058,
        duration: 0.09,
        frequency: 988,
        endFrequency: 1318,
        volume: 0.007,
        type: "sine",
      },
      {
        at: 0.13,
        duration: 0.08,
        frequency: 1760,
        endFrequency: 1568,
        volume: 0.004,
        type: "sine",
      },
    ],
  },
  warning: {
    filterStart: 2800,
    filterEnd: 960,
    steps: [
      {
        at: 0,
        duration: 0.09,
        frequency: 740,
        endFrequency: 698,
        volume: 0.007,
        type: "triangle",
      },
      {
        at: 0.08,
        duration: 0.1,
        frequency: 523,
        endFrequency: 494,
        volume: 0.006,
      },
    ],
  },
  update: {
    filterStart: 3600,
    filterEnd: 1500,
    steps: [
      {
        at: 0,
        duration: 0.065,
        frequency: 523,
        endFrequency: 659,
        volume: 0.0055,
        type: "triangle",
      },
      {
        at: 0.055,
        duration: 0.075,
        frequency: 784,
        endFrequency: 988,
        volume: 0.0048,
        type: "sine",
      },
      {
        at: 0.105,
        duration: 0.07,
        frequency: 1175,
        endFrequency: 1046,
        volume: 0.0035,
      },
    ],
  },
  reveal: {
    filterStart: 3000,
    filterEnd: 1400,
    steps: [
      {
        at: 0,
        duration: 0.1,
        frequency: 392,
        endFrequency: 494,
        volume: 0.004,
        type: "triangle",
      },
      {
        at: 0.065,
        duration: 0.12,
        frequency: 740,
        endFrequency: 880,
        volume: 0.0035,
        type: "sine",
      },
    ],
    noise: {
      at: 0,
      duration: 0.04,
      volume: 0.0016,
      frequency: 2600,
      q: 9,
    },
  },
  introOpen: {
    filterStart: 3600,
    filterEnd: 1500,
    steps: [
      {
        at: 0,
        duration: 0.18,
        frequency: 247,
        endFrequency: 370,
        volume: 0.008,
        type: "triangle",
      },
      {
        at: 0.08,
        duration: 0.24,
        frequency: 494,
        endFrequency: 740,
        volume: 0.009,
        type: "sine",
      },
      {
        at: 0.22,
        duration: 0.2,
        frequency: 988,
        endFrequency: 1175,
        volume: 0.006,
        type: "sine",
      },
    ],
    noise: {
      at: 0.04,
      duration: 0.055,
      volume: 0.0028,
      frequency: 3400,
      q: 9,
    },
  },
  introClose: {
    filterStart: 3200,
    filterEnd: 980,
    steps: [
      {
        at: 0,
        duration: 0.12,
        frequency: 988,
        endFrequency: 784,
        volume: 0.008,
        type: "sine",
      },
      {
        at: 0.06,
        duration: 0.16,
        frequency: 659,
        endFrequency: 494,
        volume: 0.009,
        type: "triangle",
      },
      {
        at: 0.18,
        duration: 0.14,
        frequency: 392,
        endFrequency: 330,
        volume: 0.006,
      },
    ],
  },
  route: {
    filterStart: 3000,
    filterEnd: 1200,
    steps: [
      {
        at: 0,
        duration: 0.08,
        frequency: 523,
        endFrequency: 622,
        volume: 0.008,
        type: "triangle",
      },
      {
        at: 0.06,
        duration: 0.11,
        frequency: 784,
        endFrequency: 932,
        volume: 0.007,
        type: "sine",
      },
    ],
    noise: {
      at: 0,
      duration: 0.035,
      volume: 0.0024,
      frequency: 2800,
      q: 8,
    },
  },
};

function scheduleStep(
  context: AudioContext,
  output: AudioNode,
  now: number,
  step: SoundStep
) {
  const start = now + step.at;
  const attack = Math.min(0.018, step.duration * 0.32);
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = step.type ?? "sine";
  oscillator.frequency.setValueAtTime(step.frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(
    step.endFrequency ?? step.frequency,
    start + step.duration
  );
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(
    step.volume,
    start + attack
  );
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    start + step.duration
  );
  oscillator.connect(gain);
  gain.connect(output);
  oscillator.start(start);
  oscillator.stop(start + step.duration + 0.025);
}

function scheduleNoise(
  context: AudioContext,
  output: AudioNode,
  now: number,
  profile: NonNullable<SoundProfile["noise"]>
) {
  const sampleRate = context.sampleRate;
  const frameCount = Math.max(
    1,
    Math.floor(sampleRate * profile.duration)
  );
  const buffer = context.createBuffer(1, frameCount, sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < frameCount; index += 1) {
    channel[index] =
      (Math.random() * 2 - 1) * (1 - index / frameCount);
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
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    start + profile.duration
  );
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
  const tail = Math.max(
    ...profile.steps.map((step) => step.at + step.duration),
    profile.noise
      ? profile.noise.at + profile.noise.duration
      : 0
  );
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(profile.filterStart, now);
  filter.frequency.exponentialRampToValueAtTime(
    profile.filterEnd,
    now + tail + 0.04
  );
  master.gain.setValueAtTime(0.72, now);
  master.gain.exponentialRampToValueAtTime(
    0.0001,
    now + tail + 0.08
  );
  filter.connect(master);
  master.connect(context.destination);
  profile.steps.forEach((step) =>
    scheduleStep(context, filter, now, step)
  );
  if (profile.noise) {
    scheduleNoise(context, filter, now, profile.noise);
  }
  window.setTimeout(() => {
    filter.disconnect();
    master.disconnect();
  }, (tail + 0.14) * 1000);
}

/* ── Ambient Drone Engine ── */
class AmbientDrone {
  context: AudioContext | null = null;
  masterGain: GainNode | null = null;
  oscillators: OscillatorNode[] = [];
  filter: BiquadFilterNode | null = null;
  lfo: OscillatorNode | null = null;
  lfoGain: GainNode | null = null;
  running = false;
  baseVolume = 0.004;

  init(ctx: AudioContext) {
    if (this.running) return;
    this.context = ctx;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.baseVolume;
    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 280;
    this.filter.Q.value = 0.6;

    const freqs = [55, 82.5, 110, 165];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 1 / freqs.length;
      osc.connect(g);
      g.connect(this.filter!);
      osc.start();
      this.oscillators.push(osc);
    });

    this.lfo = ctx.createOscillator();
    this.lfo.type = "sine";
    this.lfo.frequency.value = 0.07;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 120;
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.filter.frequency);
    this.lfo.start();

    this.filter.connect(this.masterGain);
    this.masterGain.connect(ctx.destination);
    this.running = true;
  }

  setVolume(v: number) {
    this.baseVolume = v;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        v,
        this.context!.currentTime,
        0.5
      );
    }
  }

  setMuted(muted: boolean) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        muted ? 0.0001 : this.baseVolume,
        this.context!.currentTime,
        muted ? 0.3 : 1.2
      );
    }
  }

  stop() {
    this.oscillators.forEach((o) => {
      try {
        o.stop();
        o.disconnect();
      } catch {
        /* noop */
      }
    });
    this.oscillators = [];
    try {
      this.lfo?.stop();
      this.lfo?.disconnect();
    } catch {
      /* noop */
    }
    try {
      this.filter?.disconnect();
      this.masterGain?.disconnect();
    } catch {
      /* noop */
    }
    this.running = false;
  }
}

export function InteractionSoundLayerV2() {
  const audioRef = useRef<AudioContext | null>(null);
  const audioUnlockedRef = useRef(false);
  const lastPlayedRef = useRef(0);
  const mutedRef = useRef(false);
  const systemLastPlayedRef = useRef<Record<string, number>>({});
  const pendingIntroSoundRef = useRef<{
    kind: SoundKind;
    at: number;
  } | null>(null);
  const droneRef = useRef(new AmbientDrone());

  useEffect(() => {
    function setMuted(muted: boolean) {
      mutedRef.current = muted;
      document.documentElement.dataset.tvSound = muted
        ? "muted"
        : audioUnlockedRef.current
          ? "on"
          : "ready";
      droneRef.current.setMuted(muted);
    }

    function getAudioContext() {
      if (mutedRef.current) {
        return null;
      }
      const AudioContextConstructor =
        window.AudioContext ??
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;
      if (!AudioContextConstructor) {
        return null;
      }
      const context = audioRef.current ?? new AudioContextConstructor();
      audioRef.current = context;
      if (context.state === "suspended") {
        void context.resume();
      }
      return context;
    }

    function playInteractionTone(soundKind: SoundKind) {
      const context = getAudioContext();
      if (!context) {
        return;
      }
      audioUnlockedRef.current = true;
      document.documentElement.dataset.tvSound = "on";
      if (!droneRef.current.running) {
        droneRef.current.init(context);
      }
      playTone(context, soundKind);
      const pendingIntroSound = pendingIntroSoundRef.current;
      if (
        pendingIntroSound &&
        soundKind !== "introClose" &&
        performance.now() - pendingIntroSound.at < 5200 &&
        document.documentElement.classList.contains(
          "brand-intro-active"
        )
      ) {
        pendingIntroSoundRef.current = null;
        window.setTimeout(
          () => playSystemTone(pendingIntroSound.kind, 480, "pending:intro"),
          90
        );
      }
    }

    function playSystemTone(
      soundKind: SoundKind,
      throttleMs = 120,
      key: string = soundKind
    ) {
      if (!audioUnlockedRef.current) {
        return;
      }
      const now = performance.now();
      const lastPlayed = systemLastPlayedRef.current[key] ?? 0;
      if (now - lastPlayed < throttleMs) {
        return;
      }
      systemLastPlayedRef.current[key] = now;
      const context = getAudioContext();
      if (context) {
        playTone(context, soundKind);
      }
    }

    function getEventPoint(
      event: MouseEvent,
      target: HTMLElement
    ) {
      if (event.clientX || event.clientY) {
        return {
          clientX: event.clientX,
          clientY: event.clientY,
        };
      }
      const rect = target.getBoundingClientRect();
      return {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      };
    }

    function handleInteraction(
      target: HTMLElement,
      soundKind: SoundKind,
      clientX: number,
      clientY: number,
      isTouchLike: boolean
    ) {
      addPulse(target);
      if (mutedRef.current) {
        return;
      }
      spawnSingularityAt(clientX, clientY, soundKind, isTouchLike);
      playInteractionTone(soundKind);
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(INTERACTIVE_SELECTOR)
          : null;
      if (
        !target ||
        target.closest("[data-sound-control='true']") ||
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
      const isTouchLike =
        event.pointerType === "touch" ||
        window.innerWidth < 768 ||
        window.matchMedia("(pointer: coarse)").matches;
      handleInteraction(
        target,
        soundKind,
        event.clientX,
        event.clientY,
        isTouchLike
      );
    }

    function handleClick(event: MouseEvent) {
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(INTERACTIVE_SELECTOR)
          : null;
      if (
        !target ||
        target.closest("[data-sound-control='true']") ||
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
      const isTouchLike =
        window.innerWidth < 768 ||
        window.matchMedia("(pointer: coarse)").matches;
      const point = getEventPoint(event, target);
      handleInteraction(
        target,
        soundKind,
        point.clientX,
        point.clientY,
        isTouchLike
      );
    }

    function handleMutedChange(event: Event) {
      const mutedChange = event as CustomEvent<{ muted?: boolean }>;
      const nextMuted = mutedChange.detail?.muted;
      if (typeof nextMuted !== "boolean") {
        return;
      }
      if (
        nextMuted &&
        !mutedRef.current &&
        audioUnlockedRef.current &&
        audioRef.current
      ) {
        playTone(audioRef.current, "close");
      }
      setMuted(nextMuted);
      if (!nextMuted) {
        playInteractionTone("open");
      }
    }

    function handleSystemSound(event: Event) {
      const soundEvent = event as CustomEvent<{ kind?: SoundKind }>;
      const soundKind = soundEvent.detail?.kind;
      if (!soundKind || !(soundKind in SOUND_PROFILES)) {
        return;
      }
      if (!audioUnlockedRef.current && soundKind === "introOpen") {
        pendingIntroSoundRef.current = {
          kind: soundKind,
          at: performance.now(),
        };
        return;
      }
      playSystemTone(soundKind);
    }

    function handleHover(event: PointerEvent) {
      if (
        event.pointerType === "touch" ||
        window.matchMedia("(pointer: coarse)").matches ||
        mutedRef.current ||
        !audioUnlockedRef.current
      ) {
        return;
      }
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(HOVER_SELECTOR)
          : null;
      if (
        !target ||
        target.closest("[data-sound-control='true']") ||
        target.contains(event.relatedTarget as Node | null)
      ) {
        return;
      }
      playSystemTone("hover", 260, "hover");
    }

    function handleDetailsToggle(event: Event) {
      const details = event.target;
      if (!(details instanceof HTMLDetailsElement)) {
        return;
      }
      playSystemTone(
        details.open ? "expand" : "collapse",
        180,
        "details"
      );
    }

    function getAnimationSoundKind(
      animationName: string,
      target: Element
    ): SoundKind | null {
      if (
        animationName.includes("drawer-gravity") ||
        target.matches("[data-slot='drawer-content']")
      ) {
        return "drawerOpen";
      }
      if (
        animationName.includes("toast") ||
        target.matches(".cn-toast, .motion-toast")
      ) {
        return "toast";
      }
      if (
        animationName.includes("details-open") ||
        animationName.includes("mobile-expander-open")
      ) {
        return "expand";
      }
      if (
        animationName.includes("fade-up") ||
        animationName.includes("soft-pop") ||
        animationName.includes("section-stage") ||
        animationName.includes("route-stage")
      ) {
        return "reveal";
      }
      if (
        animationName.includes("card-gravity") ||
        animationName.includes("chip-pop") ||
        animationName.includes("badge-pop")
      ) {
        return "update";
      }
      return null;
    }

    function handleAnimationStart(event: AnimationEvent) {
      if (
        !audioUnlockedRef.current ||
        mutedRef.current ||
        !(event.target instanceof Element)
      ) {
        return;
      }
      const soundKind = getAnimationSoundKind(
        event.animationName,
        event.target
      );
      if (soundKind) {
        playSystemTone(
          soundKind,
          soundKind === "reveal" ? 900 : 240,
          `animation:${soundKind}`
        );
      }
    }

    function handleInput(event: Event) {
      const target = event.target;
      if (
        !(target instanceof HTMLInputElement) &&
        !(target instanceof HTMLTextAreaElement)
      ) {
        return;
      }
      if (target.matches("input[type='hidden'], input[type='password']")) {
        return;
      }
      playSystemTone("update", 420, "input");
    }

    function handleChange(event: Event) {
      const target = event.target;
      if (target instanceof HTMLSelectElement) {
        playSystemTone("tab", 180, "select");
        return;
      }
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        playSystemTone("filterApply", 240, "change");
      }
    }

    setMuted(getInitialMuted());
    window.addEventListener("pointerdown", handlePointerDown, {
      passive: true,
      capture: true,
    });
    window.addEventListener("pointerover", handleHover, {
      passive: true,
      capture: true,
    });
    window.addEventListener("click", handleClick, {
      passive: true,
      capture: true,
    });
    window.addEventListener("toggle", handleDetailsToggle, {
      capture: true,
    });
    window.addEventListener("animationstart", handleAnimationStart, {
      passive: true,
      capture: true,
    });
    window.addEventListener("input", handleInput, {
      passive: true,
      capture: true,
    });
    window.addEventListener("change", handleChange, {
      passive: true,
      capture: true,
    });
    window.addEventListener(SOUND_MUTED_CHANGE_EVENT, handleMutedChange);
    window.addEventListener(SOUND_PLAY_EVENT, handleSystemSound);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, {
        capture: true,
      });
      window.removeEventListener("pointerover", handleHover, {
        capture: true,
      });
      window.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("toggle", handleDetailsToggle, {
        capture: true,
      });
      window.removeEventListener("animationstart", handleAnimationStart, {
        capture: true,
      });
      window.removeEventListener("input", handleInput, { capture: true });
      window.removeEventListener("change", handleChange, { capture: true });
      window.removeEventListener(SOUND_MUTED_CHANGE_EVENT, handleMutedChange);
      window.removeEventListener(SOUND_PLAY_EVENT, handleSystemSound);
      void audioRef.current?.close();
      audioRef.current = null;
      droneRef.current.stop();
      delete document.documentElement.dataset.tvSound;
    };
  }, []);

  return null;
}
