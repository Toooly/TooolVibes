// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MotionObserver } from "@/components/ui/motion-observer";

describe("MotionObserver reduced-motion", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: String(query).includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    cleanup();
    delete document.documentElement.dataset.motionReady;
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("marks motion as not ready when reduced motion is preferred", () => {
    render(<MotionObserver />);
    expect(document.documentElement.dataset.motionReady).toBe("false");
  });

  function prepareOffscreenContent() {
    vi.useFakeTimers();
    const listeners = new Set<() => void>();
    const media = {
      matches: false,
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    };
    vi.stubGlobal("matchMedia", () => media);
    vi.stubGlobal("IntersectionObserver", class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
    vi.spyOn(document, "readyState", "get").mockReturnValue("complete");
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    const view = render(<>
      <section className="motion-reveal"><button>Apri dettaglio</button></section>
      <MotionObserver />
    </>);
    const section = view.container.querySelector("section")!;
    const rect = new DOMRect(0, 2000, 200, 100);
    vi.spyOn(section, "getBoundingClientRect").mockReturnValue(rect);
    vi.spyOn(section, "getClientRects").mockReturnValue([rect] as unknown as DOMRectList);
    act(() => vi.advanceTimersByTime(800));
    expect(section.dataset.motionObserved).toBe("true");
    return { section, view, media, listeners };
  }

  it("reveals offscreen content immediately when keyboard focus enters it", () => {
    const { section } = prepareOffscreenContent();
    fireEvent.focusIn(screen.getByRole("button", { name: "Apri dettaglio" }));
    expect(section.hasAttribute("data-motion-observed")).toBe(false);
  });

  it("releases prepared content when reduced motion changes during a session", () => {
    const { section, media, listeners } = prepareOffscreenContent();
    act(() => {
      media.matches = true;
      listeners.forEach((listener) => listener());
    });
    expect(document.documentElement.dataset.motionReady).toBe("false");
    expect(section.hasAttribute("data-motion-observed")).toBe(false);
  });

  it("leaves content visible if IntersectionObserver is unavailable", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    vi.stubGlobal("IntersectionObserver", undefined);
    render(<MotionObserver />);
    expect(document.documentElement.dataset.motionReady).toBe("false");
  });
});
