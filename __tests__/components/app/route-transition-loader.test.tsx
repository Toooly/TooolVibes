// @vitest-environment jsdom

import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RouteTransitionLoader } from "@/components/app/route-transition-loader";

const { pathnameState } = vi.hoisted(() => ({
  pathnameState: { current: "/" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.current,
}));

describe("RouteTransitionLoader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pathnameState.current = "/";
    window.history.replaceState({}, "", "/");
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("max-width"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("never captures pointer input and closes promptly when the route changes", () => {
    const view = render(
      <>
        <a href="/radar" onClick={(event) => event.preventDefault()}>Radar</a>
        <RouteTransitionLoader />
      </>,
    );

    fireEvent.click(view.getByText("Radar"));
    let loader = view.container.querySelector(".route-transition-loader");

    expect(loader?.classList.contains("is-visible")).toBe(true);
    expect((loader as HTMLElement).style.pointerEvents).toBe("none");

    pathnameState.current = "/radar";
    view.rerender(
      <>
        <a href="/radar" onClick={(event) => event.preventDefault()}>Radar</a>
        <RouteTransitionLoader />
      </>,
    );

    act(() => {
      vi.advanceTimersByTime(119);
    });
    expect(loader?.classList.contains("is-visible")).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    loader = view.container.querySelector(".route-transition-loader");
    expect(loader?.classList.contains("is-visible")).toBe(false);
  });
});
