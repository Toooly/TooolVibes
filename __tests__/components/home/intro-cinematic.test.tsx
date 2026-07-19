// @vitest-environment jsdom

import { createElement, type ReactNode } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { INTRO_TIMELINES } from "@/components/3d-maestoso/intro-cinematic";

/* Layer 3D (three/@react-three/fiber) non oggetto del test: Canvas mockata,
   come nel pattern dei test desktop radar. */
vi.mock("@react-three/fiber", () => ({
  Canvas: () => createElement("div", { "data-testid": "intro-canvas-mock" }),
  useFrame: () => null,
}));

/* Motion mock: strip delle props di animazione per assertion deterministiche
   (pattern condiviso con i test catalog B25). */
const MOTION_ONLY_PROPS = new Set([
  "initial",
  "animate",
  "exit",
  "transition",
  "whileTap",
  "whileHover",
  "whileInView",
  "viewport",
  "layout",
  "layoutId",
  "variants",
]);

type MotionProps = Record<string, unknown> & { children?: ReactNode };

function stripMotionProps(props: MotionProps): MotionProps {
  const clean: MotionProps = {};
  for (const key of Object.keys(props)) {
    if (!MOTION_ONLY_PROPS.has(key)) clean[key] = props[key];
  }
  return clean;
}

vi.mock("motion/react", () => {
  const cache = new Map<string, (props: MotionProps) => ReactNode>();
  const motionProxy = new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        if (!cache.has(tag)) {
          cache.set(tag, (props: MotionProps) =>
            createElement(tag, stripMotionProps(props)),
          );
        }
        return cache.get(tag);
      },
    },
  );
  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: { children?: ReactNode }) => children,
  };
});

import { IntroCinematic3D } from "@/components/3d-maestoso/intro-cinematic";

const HAS_SEEN_INTRO_KEY = "tooolvibes:intro-3d-v1";
const INTRO_FINISHED_EVENT = "tooolvibes:brand-intro-finished";

function mockMatchMedia(reducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reducedMotion,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
}

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
      region: { enabled: false },
    },
  });
  expect(results.violations).toEqual([]);
}

describe("B40 IntroCinematic3D — intro non blocca (MOB-704)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.sessionStorage.clear();
    mockMatchMedia(false);
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("first session compact: overlay con skip subito disponibile, chiusura automatica breve", () => {
    const onComplete = vi.fn();
    const finished = vi.fn();
    window.addEventListener(INTRO_FINISHED_EVENT, finished);

    const { container } = render(
      <IntroCinematic3D mode="compact" onComplete={onComplete} />,
    );

    // Brand moment preservato: logo testuale e scena (mockata) presenti.
    const overlay = container.querySelector("[data-intro-mode='compact']");
    expect(overlay).not.toBeNull();
    expect(screen.getByText("TooolVibes")).toBeTruthy();
    expect(screen.getByTestId("intro-canvas-mock")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Salta introduzione" }),
    ).toBeTruthy();

    // Prima della fine della timeline breve l'intro e' ancora montata.
    act(() => {
      vi.advanceTimersByTime(INTRO_TIMELINES.compact.durationMs - 1);
    });
    expect(container.querySelector("[data-intro-mode='compact']")).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(1 + INTRO_TIMELINES.compact.exitMs);
    });
    expect(container.querySelector("[data-intro-mode]")).toBeNull();
    expect(window.sessionStorage.getItem(HAS_SEEN_INTRO_KEY)).toBe("true");
    expect(onComplete).toHaveBeenCalledWith(false);
    expect(finished).toHaveBeenCalledTimes(1);
  });

  it("first session cinematic: timeline legacy invariata (4000ms + exit 800ms)", () => {
    const { container } = render(<IntroCinematic3D mode="cinematic" />);

    expect(
      container.querySelector("[data-intro-mode='cinematic']"),
    ).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(INTRO_TIMELINES.cinematic.durationMs - 1);
    });
    expect(
      container.querySelector("[data-intro-mode='cinematic']"),
    ).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(1 + INTRO_TIMELINES.cinematic.exitMs);
    });
    expect(container.querySelector("[data-intro-mode]")).toBeNull();
  });

  it("compact: wheel/touchmove/keydown chiudono subito l'intro (nessuna attesa obbligatoria)", () => {
    const onComplete = vi.fn();
    const { container } = render(
      <IntroCinematic3D mode="compact" onComplete={onComplete} />,
    );

    act(() => {
      window.dispatchEvent(new Event("wheel"));
    });
    act(() => {
      vi.advanceTimersByTime(INTRO_TIMELINES.compact.exitMs);
    });

    expect(container.querySelector("[data-intro-mode]")).toBeNull();
    expect(onComplete).toHaveBeenCalledWith(true);
    expect(window.sessionStorage.getItem(HAS_SEEN_INTRO_KEY)).toBe("true");
  });

  it.each(["touchmove", "keydown"])(
    "compact: %s chiude l'intro entro la sola exit",
    (eventName) => {
      const { container } = render(<IntroCinematic3D mode="compact" />);

      act(() => {
        window.dispatchEvent(new Event(eventName));
      });
      act(() => {
        vi.advanceTimersByTime(INTRO_TIMELINES.compact.exitMs);
      });

      expect(container.querySelector("[data-intro-mode]")).toBeNull();
    },
  );

  it("cinematic: wheel NON chiude l'intro (comportamento legacy preservato)", () => {
    const { container } = render(<IntroCinematic3D mode="cinematic" />);

    act(() => {
      window.dispatchEvent(new Event("wheel"));
    });

    expect(
      container.querySelector("[data-intro-mode='cinematic']"),
    ).not.toBeNull();
  });

  it("skip button: chiusura immediata in entrambe le modalita'", () => {
    const onComplete = vi.fn();
    const { container } = render(
      <IntroCinematic3D mode="compact" onComplete={onComplete} />,
    );

    act(() => {
      screen.getByRole("button", { name: "Salta introduzione" }).click();
    });
    act(() => {
      vi.advanceTimersByTime(INTRO_TIMELINES.compact.exitMs);
    });

    expect(container.querySelector("[data-intro-mode]")).toBeNull();
    expect(onComplete).toHaveBeenCalledWith(true);
  });

  it("repeat session: intro non renderizzata e evento finished(skipped) emesso", () => {
    window.sessionStorage.setItem(HAS_SEEN_INTRO_KEY, "true");
    const onComplete = vi.fn();
    const finished = vi.fn();
    window.addEventListener(INTRO_FINISHED_EVENT, finished);

    const { container } = render(
      <IntroCinematic3D mode="compact" onComplete={onComplete} />,
    );

    expect(container.querySelector("[data-intro-mode]")).toBeNull();
    expect(container.firstChild).toBeNull();
    expect(onComplete).toHaveBeenCalledWith(true);
    expect(finished).toHaveBeenCalledTimes(1);
  });

  it("repeat session con ?intro=1: replay forzato dell'intro", () => {
    window.sessionStorage.setItem(HAS_SEEN_INTRO_KEY, "true");
    window.history.replaceState({}, "", "/?intro=1");

    const { container } = render(<IntroCinematic3D mode="compact" />);

    expect(container.querySelector("[data-intro-mode='compact']")).not.toBeNull();
  });

  it("reduced motion: intro mai montata, nessuna attesa", () => {
    mockMatchMedia(true);
    const onComplete = vi.fn();

    const { container } = render(
      <IntroCinematic3D mode="compact" onComplete={onComplete} />,
    );

    expect(container.querySelector("[data-intro-mode]")).toBeNull();
    expect(onComplete).toHaveBeenCalledWith(true);
  });

  it("compact: nessuna violazione axe sull'overlay del brand moment", async () => {
    const { container } = render(<IntroCinematic3D mode="compact" />);
    // axe usa timer reali internamente: esce dal fake-timer scope del suite.
    vi.useRealTimers();
    await expectNoAxeViolations(container);
  });
});
