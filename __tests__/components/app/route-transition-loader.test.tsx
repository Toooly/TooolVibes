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
      matches: query.includes("prefers-reduced-motion") ? false : false,
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

  it("shows a non-blocking signal and closes promptly when the route changes", () => {
    const view = render(
      <>
        <a href="/radar" onClick={(event) => event.preventDefault()}>
          Radar
        </a>
        <RouteTransitionLoader />
      </>,
    );

    fireEvent.click(view.getByText("Radar"));
    let loader = view.container.querySelector(".route-transition-signal");

    expect(loader?.classList.contains("is-visible")).toBe(true);

    pathnameState.current = "/radar";
    view.rerender(
      <>
        <a href="/radar" onClick={(event) => event.preventDefault()}>
          Radar
        </a>
        <RouteTransitionLoader />
      </>,
    );

    act(() => {
      vi.advanceTimersByTime(79);
    });
    expect(loader?.classList.contains("is-visible")).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    loader = view.container.querySelector(".route-transition-signal");
    expect(loader?.classList.contains("is-visible")).toBe(false);
  });

  it("stays quiet under reduced motion", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const view = render(
      <>
        <a href="/radar" onClick={(event) => event.preventDefault()}>
          Radar
        </a>
        <RouteTransitionLoader />
      </>,
    );

    fireEvent.click(view.getByText("Radar"));
    const loader = view.container.querySelector(".route-transition-signal");
    expect(loader?.classList.contains("is-visible")).toBe(false);
  });
});
