// @vitest-environment jsdom

import { render } from "@testing-library/react";
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
    delete document.documentElement.dataset.motionReady;
    vi.unstubAllGlobals();
  });

  it("marks motion as not ready when reduced motion is preferred", () => {
    render(<MotionObserver />);
    expect(document.documentElement.dataset.motionReady).toBe("false");
  });
});
