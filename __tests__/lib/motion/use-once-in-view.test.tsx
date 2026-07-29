// @vitest-environment jsdom

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useOnceInView } from "@/lib/motion/use-once-in-view";

describe("useOnceInView", () => {
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

  it("marks visible immediately under reduced motion", async () => {
    const { result } = renderHook(() => useOnceInView());
    await waitFor(() => {
      expect(result.current.hasBeenVisible).toBe(true);
    });
  });
});
