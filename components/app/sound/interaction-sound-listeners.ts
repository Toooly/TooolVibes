import {
  SOUND_MUTED_CHANGE_EVENT,
  SOUND_PLAY_EVENT,
} from "@/lib/config/sound";

import {
  addPulse,
  getAnimationSoundKind,
  getSoundKind,
  HOVER_SELECTOR,
  INTERACTIVE_SELECTOR,
} from "./sound-mapping";
import {
  playInteractionTone,
  playSystemTone,
} from "./interaction-sound-playback";
import { playTone } from "./sound-playback";
import { SOUND_PROFILES, type SoundKind } from "./sound-profiles";
import {
  applySoundMuted,
  type InteractionSoundState,
} from "./interaction-sound-state";

/* ═══════════════════════════════════════════════════════════════
   interaction-sound-listeners — handler tipizzati e attach dei
   listener singoli (B26). Ogni listener è registrato da un
   descriptor esplicito e rimosso con lo stesso capture nel
   cleanup: nessun listener duplicato, cleanup verificabile.
   Handler portati 1:1 dalle closure del monolite.
   ═══════════════════════════════════════════════════════════════ */

type InteractionListenerDescriptor = {
  type: string;
  listener: EventListener;
  options?: AddEventListenerOptions;
};

function handleInteraction(
  state: InteractionSoundState,
  target: HTMLElement,
  soundKind: SoundKind
) {
  addPulse(target);
  if (state.muted) {
    return;
  }
  playInteractionTone(state, soundKind);
}

function isGuardedTarget(target: HTMLElement | null): target is HTMLElement {
  if (
    !target ||
    target.closest("[data-sound-control='true']") ||
    target.matches("input, textarea, select") ||
    target.getAttribute("aria-disabled") === "true" ||
    (target instanceof HTMLButtonElement && target.disabled)
  ) {
    return false;
  }
  return true;
}

function resolveInteractiveTarget(event: Event) {
  return event.target instanceof Element
    ? event.target.closest<HTMLElement>(INTERACTIVE_SELECTOR)
    : null;
}

export function createInteractionSoundHandlers(
  state: InteractionSoundState
) {
  function handlePointerDown(event: PointerEvent) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    const target = resolveInteractiveTarget(event);
    if (!isGuardedTarget(target)) {
      return;
    }
    const now = performance.now();
    if (now - state.lastPlayedAt < 70) {
      return;
    }
    state.lastPlayedAt = now;
    const soundKind = getSoundKind(target);
    handleInteraction(state, target, soundKind);
  }

  function handleClick(event: MouseEvent) {
    const target = resolveInteractiveTarget(event);
    if (!isGuardedTarget(target)) {
      return;
    }
    const now = performance.now();
    if (now - state.lastPlayedAt < 260) {
      return;
    }
    state.lastPlayedAt = now;
    const soundKind = getSoundKind(target);
    handleInteraction(state, target, soundKind);
  }

  function handleHover(event: PointerEvent) {
    if (
      event.pointerType === "touch" ||
      window.matchMedia("(pointer: coarse)").matches ||
      state.muted ||
      !state.audioUnlocked
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
    playSystemTone(state, "hover", 260, "hover");
  }

  function handleDetailsToggle(event: Event) {
    const details = event.target;
    if (!(details instanceof HTMLDetailsElement)) {
      return;
    }
    playSystemTone(
      state,
      details.open ? "expand" : "collapse",
      180,
      "details"
    );
  }

  function handleAnimationStart(event: AnimationEvent) {
    if (
      !state.audioUnlocked ||
      state.muted ||
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
        state,
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
    playSystemTone(state, "update", 420, "input");
  }

  function handleChange(event: Event) {
    const target = event.target;
    if (target instanceof HTMLSelectElement) {
      playSystemTone(state, "tab", 180, "select");
      return;
    }
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    ) {
      playSystemTone(state, "filterApply", 240, "change");
    }
  }

  return {
    handlePointerDown,
    handleHover,
    handleClick,
    handleDetailsToggle,
    handleAnimationStart,
    handleInput,
    handleChange,
  };
}

export function handleSoundMutedChange(
  state: InteractionSoundState,
  event: Event
) {
  const mutedChange = event as CustomEvent<{ muted?: boolean }>;
  const nextMuted = mutedChange.detail?.muted;
  if (typeof nextMuted !== "boolean") {
    return;
  }
  if (
    nextMuted &&
    !state.muted &&
    state.audioUnlocked &&
    state.audio
  ) {
    playTone(state.audio, "close");
  }
  applySoundMuted(state, nextMuted);
  if (!nextMuted) {
    playInteractionTone(state, "open");
  }
}

export function handleSystemSoundEvent(
  state: InteractionSoundState,
  event: Event
) {
  const soundEvent = event as CustomEvent<{ kind?: SoundKind }>;
  const soundKind = soundEvent.detail?.kind;
  if (!soundKind || !(soundKind in SOUND_PROFILES)) {
    return;
  }
  if (!state.audioUnlocked && soundKind === "introOpen") {
    state.pendingIntroSound = {
      kind: soundKind,
      at: performance.now(),
    };
    return;
  }
  playSystemTone(state, soundKind);
}

function attachListenerDescriptors(
  descriptors: InteractionListenerDescriptor[]
) {
  descriptors.forEach(({ type, listener, options }) => {
    window.addEventListener(type, listener, options);
  });
  return () => {
    descriptors.forEach(({ type, listener, options }) => {
      window.removeEventListener(type, listener, {
        capture: Boolean(options?.capture),
      });
    });
  };
}

export function attachInteractionSoundListeners(
  state: InteractionSoundState
) {
  const handlers = createInteractionSoundHandlers(state);
  return attachListenerDescriptors([
    {
      type: "pointerdown",
      listener: handlers.handlePointerDown as EventListener,
      options: { passive: true, capture: true },
    },
    {
      type: "pointerover",
      listener: handlers.handleHover as EventListener,
      options: { passive: true, capture: true },
    },
    {
      type: "click",
      listener: handlers.handleClick as EventListener,
      options: { passive: true, capture: true },
    },
    {
      type: "toggle",
      listener: handlers.handleDetailsToggle as EventListener,
      options: { capture: true },
    },
    {
      type: "animationstart",
      listener: handlers.handleAnimationStart as EventListener,
      options: { passive: true, capture: true },
    },
    {
      type: "input",
      listener: handlers.handleInput as EventListener,
      options: { passive: true, capture: true },
    },
    {
      type: "change",
      listener: handlers.handleChange as EventListener,
      options: { passive: true, capture: true },
    },
  ]);
}

export function attachSoundMutedChangeListener(
  state: InteractionSoundState
) {
  return attachListenerDescriptors([
    {
      type: SOUND_MUTED_CHANGE_EVENT,
      listener: (event) => handleSoundMutedChange(state, event),
    },
  ]);
}

export function attachSystemSoundListener(state: InteractionSoundState) {
  return attachListenerDescriptors([
    {
      type: SOUND_PLAY_EVENT,
      listener: (event) => handleSystemSoundEvent(state, event),
    },
  ]);
}
