// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InteractionSoundLayerV2 } from "@/components/app/interaction-sound-layer-v2";
import {
  SOUND_MUTED_CHANGE_EVENT,
  SOUND_PLAY_EVENT,
  SOUND_STORAGE_KEY,
} from "@/lib/config/sound";

/* ── Minimal deterministic browser mocks ───────────────────────
   AudioContext fake: records construction and oscillator starts
   (each playTone schedules ≥1 oscillator). matchMedia and
   performance.now are controllable per test. requestAnimationFrame
   runs synchronously so the is-sonic-tap pulse is deterministic.
   ────────────────────────────────────────────────────────────── */

function createAudioParamMock(initialValue = 0) {
  return {
    value: initialValue,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
  };
}

function createAudioNodeMock() {
  return { connect: vi.fn(), disconnect: vi.fn() };
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];

  state: AudioContextState = "running";
  currentTime = 0;
  sampleRate = 8000;
  destination = createAudioNodeMock();
  resume = vi.fn(() => Promise.resolve());
  close = vi.fn(() => Promise.resolve());
  oscillatorStartCount = 0;

  constructor() {
    FakeAudioContext.instances.push(this);
  }

  createGain() {
    return { ...createAudioNodeMock(), gain: createAudioParamMock() };
  }

  createOscillator() {
    return {
      ...createAudioNodeMock(),
      type: "sine" as OscillatorType,
      frequency: createAudioParamMock(),
      start: vi.fn(() => {
        this.oscillatorStartCount += 1;
      }),
      stop: vi.fn(),
    };
  }

  createBiquadFilter() {
    return {
      ...createAudioNodeMock(),
      type: "lowpass" as BiquadFilterType,
      frequency: createAudioParamMock(),
      Q: createAudioParamMock(),
    };
  }

  createBuffer(_channels: number, frameCount: number) {
    return { getChannelData: () => new Float32Array(frameCount) };
  }

  createBufferSource() {
    return { ...createAudioNodeMock(), buffer: null, start: vi.fn(), stop: vi.fn() };
  }
}

let reducedMotionMatches = false;
let nowValue = 1000;

let addSpy: ReturnType<typeof vi.spyOn>;
let removeSpy: ReturnType<typeof vi.spyOn>;

const DOM_LISTENER_TYPES = [
  "pointerdown",
  "pointerover",
  "click",
  "toggle",
  "animationstart",
  "input",
  "change",
] as const;

const ALL_LISTENER_TYPES = [
  SOUND_MUTED_CHANGE_EVENT,
  ...DOM_LISTENER_TYPES,
  SOUND_PLAY_EVENT,
] as const;

function addedTypes() {
  return addSpy.mock.calls.map(([type]) => String(type));
}

/** Ledger listener → type → active count, from add/remove call pairs. */
function activeListenerCounts() {
  const ledger = new Map<EventListener, Map<string, number>>();
  const bump = (listener: EventListener, type: string, delta: number) => {
    const byType = ledger.get(listener) ?? new Map<string, number>();
    byType.set(type, (byType.get(type) ?? 0) + delta);
    ledger.set(listener, byType);
  };
  for (const [type, listener] of addSpy.mock.calls) {
    bump(listener as EventListener, String(type), 1);
  }
  for (const [type, listener] of removeSpy.mock.calls) {
    bump(listener as EventListener, String(type), -1);
  }
  return ledger;
}

function expectNoActiveListeners() {
  const ledger = activeListenerCounts();
  const leftovers: string[] = [];
  for (const [listener, byType] of ledger) {
    for (const [type, count] of byType) {
      if (count !== 0) {
        leftovers.push(`${type} (${count}) ${String(listener).slice(0, 40)}`);
      }
    }
  }
  expect(leftovers).toEqual([]);
}

function dispatchSoundPlay(kind: string) {
  act(() => {
    window.dispatchEvent(
      new CustomEvent(SOUND_PLAY_EVENT, { detail: { kind } })
    );
  });
}

function dispatchMutedChange(muted: boolean) {
  act(() => {
    window.dispatchEvent(
      new CustomEvent(SOUND_MUTED_CHANGE_EVENT, { detail: { muted } })
    );
  });
}

function unlockViaPointerDown(label = "Salva") {
  fireEvent.pointerDown(screen.getByRole("button", { name: label }), {
    button: 0,
    pointerType: "mouse",
  });
}

beforeEach(() => {
  reducedMotionMatches = false;
  nowValue = 1000;
  FakeAudioContext.instances = [];
  window.localStorage.clear();
  delete document.documentElement.dataset.tvSound;

  vi.stubGlobal("AudioContext", FakeAudioContext);
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("prefers-reduced-motion")
      ? reducedMotionMatches
      : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 0;
  });
  vi.spyOn(performance, "now").mockImplementation(() => nowValue);
  addSpy = vi.spyOn(window, "addEventListener");
  removeSpy = vi.spyOn(window, "removeEventListener");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.tvSound;
});

describe("InteractionSoundLayerV2 facade — mount/unmount lifecycle", () => {
  it("registers the nine single listeners exactly once on mount", () => {
    render(<InteractionSoundLayerV2 />);
    const types = addedTypes();
    expect(types).toHaveLength(ALL_LISTENER_TYPES.length);
    expect(new Set(types).size).toBe(types.length);
    for (const expected of ALL_LISTENER_TYPES) {
      expect(types).toContain(expected);
    }
    expect(document.documentElement.dataset.tvSound).toBe("ready");
  });

  it("removes every listener with its own reference on unmount (no leak)", () => {
    const { unmount } = render(<InteractionSoundLayerV2 />);
    unmount();
    expectNoActiveListeners();
    for (const [type, listener] of addSpy.mock.calls) {
      const removals = removeSpy.mock.calls.filter(
        ([removedType, removedListener]) =>
          removedType === type && removedListener === listener
      );
      expect(removals).toHaveLength(1);
    }
    expect(document.documentElement.dataset.tvSound).toBeUndefined();
  });

  it("closes the audio context on unmount after unlock", () => {
    render(
      <>
        <InteractionSoundLayerV2 />
        <button type="button">Salva</button>
      </>
    );
    unlockViaPointerDown();
    expect(FakeAudioContext.instances).toHaveLength(1);
    cleanup();
    expect(FakeAudioContext.instances[0].close).toHaveBeenCalledTimes(1);
    expect(document.documentElement.dataset.tvSound).toBeUndefined();
    expectNoActiveListeners();
  });

  it("supports rapid unmount/remount cycles without duplicate listeners", () => {
    const first = render(<InteractionSoundLayerV2 />);
    first.unmount();
    expectNoActiveListeners();
    const second = render(<InteractionSoundLayerV2 />);
    const ledger = activeListenerCounts();
    for (const byType of ledger.values()) {
      for (const count of byType.values()) {
        expect(count).toBeLessThanOrEqual(1);
      }
    }
    second.unmount();
    expectNoActiveListeners();
  });
});

describe("InteractionSoundLayerV2 facade — interaction playback", () => {
  it("unlocks audio and plays a tone on pointerdown of an interactive element", () => {
    render(
      <>
        <InteractionSoundLayerV2 />
        <button type="button">Salva</button>
      </>
    );
    expect(document.documentElement.dataset.tvSound).toBe("ready");
    unlockViaPointerDown();
    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(
      FakeAudioContext.instances[0].oscillatorStartCount
    ).toBeGreaterThan(0);
    expect(document.documentElement.dataset.tvSound).toBe("on");
    expect(
      screen.getByRole("button", { name: "Salva" }).classList
    ).not.toContain("is-sonic-tap");
  });

  it("plays hover tones after unlock on fine pointers with throttle", () => {
    render(
      <>
        <InteractionSoundLayerV2 />
        <button type="button">Apri</button>
        <a href="/radar">card</a>
      </>
    );
    unlockViaPointerDown("Apri");
    const context = FakeAudioContext.instances[0];
    const baseline = context.oscillatorStartCount;
    const card = screen.getByText("card");

    fireEvent.pointerOver(card, { pointerType: "mouse", relatedTarget: null });
    expect(context.oscillatorStartCount).toBeGreaterThan(baseline);

    const afterFirst = context.oscillatorStartCount;
    fireEvent.pointerOver(card, { pointerType: "mouse", relatedTarget: null });
    expect(context.oscillatorStartCount).toBe(afterFirst);

    nowValue += 300;
    fireEvent.pointerOver(card, { pointerType: "mouse", relatedTarget: null });
    expect(context.oscillatorStartCount).toBeGreaterThan(afterFirst);
  });

  it("plays the update tone on text input after unlock", () => {
    render(
      <>
        <InteractionSoundLayerV2 />
        <button type="button">Apri</button>
        <input aria-label="query" type="text" />
      </>
    );
    unlockViaPointerDown("Apri");
    const context = FakeAudioContext.instances[0];
    const baseline = context.oscillatorStartCount;
    fireEvent.input(screen.getByLabelText("query"), {
      target: { value: "notion" },
    });
    expect(context.oscillatorStartCount).toBeGreaterThan(baseline);
  });
});

describe("InteractionSoundLayerV2 facade — route change and visibility", () => {
  it("plays the route sound after unlock and throttles rapid route changes", () => {
    render(
      <>
        <InteractionSoundLayerV2 />
        <button type="button">Salva</button>
      </>
    );
    unlockViaPointerDown();
    const context = FakeAudioContext.instances[0];
    const baseline = context.oscillatorStartCount;

    dispatchSoundPlay("route");
    expect(context.oscillatorStartCount).toBeGreaterThan(baseline);

    const afterFirst = context.oscillatorStartCount;
    dispatchSoundPlay("route");
    expect(context.oscillatorStartCount).toBe(afterFirst);

    nowValue += 200;
    dispatchSoundPlay("route");
    expect(context.oscillatorStartCount).toBeGreaterThan(afterFirst);
  });

  it("ignores system sound events while audio is locked", () => {
    render(<InteractionSoundLayerV2 />);
    dispatchSoundPlay("route");
    dispatchSoundPlay("toast");
    expect(FakeAudioContext.instances).toHaveLength(0);
  });

  it("registers no visibilitychange listener and stays inert on visibility events", () => {
    render(
      <>
        <InteractionSoundLayerV2 />
        <button type="button">Salva</button>
      </>
    );
    expect(addedTypes()).not.toContain("visibilitychange");
    unlockViaPointerDown();
    const context = FakeAudioContext.instances[0];
    const baseline = context.oscillatorStartCount;
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
      window.dispatchEvent(new Event("visibilitychange"));
    });
    expect(context.oscillatorStartCount).toBe(baseline);
  });
});

describe("InteractionSoundLayerV2 facade — audio off and reduced motion", () => {
  it("stays silent with persisted opt-out and leaves save feedback to the action", () => {
    window.localStorage.setItem(SOUND_STORAGE_KEY, "true");
    render(
      <>
        <InteractionSoundLayerV2 />
        <button type="button">Salva</button>
      </>
    );
    expect(document.documentElement.dataset.tvSound).toBe("muted");
    unlockViaPointerDown();
    expect(
      screen.getByRole("button", { name: "Salva" }).classList
    ).not.toContain("is-sonic-tap");
    expect(FakeAudioContext.instances).toHaveLength(0);
    dispatchSoundPlay("route");
    expect(FakeAudioContext.instances).toHaveLength(0);
  });

  it("defaults to muted under prefers-reduced-motion without stored preference", () => {
    reducedMotionMatches = true;
    render(
      <>
        <InteractionSoundLayerV2 />
        <button type="button">Salva</button>
      </>
    );
    expect(document.documentElement.dataset.tvSound).toBe("muted");
    unlockViaPointerDown();
    expect(FakeAudioContext.instances).toHaveLength(0);
  });

  it("prefers the stored opt-in over the reduced-motion default", () => {
    reducedMotionMatches = true;
    window.localStorage.setItem(SOUND_STORAGE_KEY, "false");
    render(<InteractionSoundLayerV2 />);
    expect(document.documentElement.dataset.tvSound).toBe("ready");
  });

  it("honours the global mute-change contract with close/open edge tones", () => {
    render(
      <>
        <InteractionSoundLayerV2 />
        <button type="button">Salva</button>
      </>
    );
    unlockViaPointerDown();
    const context = FakeAudioContext.instances[0];

    dispatchMutedChange(true);
    expect(document.documentElement.dataset.tvSound).toBe("muted");
    const afterMute = context.oscillatorStartCount;

    nowValue += 500;
    unlockViaPointerDown();
    expect(context.oscillatorStartCount).toBe(afterMute);

    dispatchMutedChange(false);
    expect(document.documentElement.dataset.tvSound).toBe("on");
    expect(context.oscillatorStartCount).toBeGreaterThan(afterMute);

    const afterUnmute = context.oscillatorStartCount;
    nowValue += 500;
    unlockViaPointerDown();
    expect(context.oscillatorStartCount).toBeGreaterThan(afterUnmute);
  });
});
