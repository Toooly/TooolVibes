// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeroDecisionScope } from "@/components/home/hero-decision-scope";

const mocks = vi.hoisted(() => ({
  mount: vi.fn(), active: vi.fn(), dispose: vi.fn(),
}));
vi.mock("@/components/home/hero-decision-scene", () => ({ mountHeroScene: mocks.mount }));

let intersect: IntersectionObserverCallback;
let mediaListener: () => void;
let reduced = false;
beforeEach(() => {
  vi.clearAllMocks(); reduced = false;
  mocks.mount.mockResolvedValue({ setActive: mocks.active, dispose: mocks.dispose });
  vi.stubGlobal("matchMedia", () => ({ get matches() { return reduced; }, addEventListener: (_: string, fn: () => void) => { mediaListener = fn; }, removeEventListener: vi.fn() }));
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { intersect = callback; }
    observe() {} disconnect() {}
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
async function enter(visible = true) {
  await act(async () => { intersect([{ isIntersecting: visible } as IntersectionObserverEntry], {} as IntersectionObserver); });
}

describe("Hero decision scene lifecycle", () => {
  it("shows the static artwork immediately and loads WebGL only on intersection", async () => {
    const { container } = render(<HeroDecisionScope />);
    expect(container.querySelector('img[src="/hero/decision-instrument.webp"]')).toBeTruthy();
    expect(mocks.mount).not.toHaveBeenCalled();
    await enter();
    expect(mocks.mount).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-scene-ready="true"]')).toBeTruthy();
    expect(mocks.active).toHaveBeenLastCalledWith(true);
    await enter(false); expect(mocks.active).toHaveBeenLastCalledWith(false);
  });
  it("starts automatically with no pause or resume control", async () => {
    const { container } = render(<HeroDecisionScope />); await enter();
    expect(mocks.active).toHaveBeenLastCalledWith(true);
    expect(container.querySelector("button")).toBeNull();
    await enter(false); await enter(true);
    expect(mocks.active).toHaveBeenLastCalledWith(true);
    expect(mocks.mount).toHaveBeenCalledTimes(1);
  });
  it("keeps reduced motion completely static and disposes when preference changes", async () => {
    const { container } = render(<HeroDecisionScope />); await enter();
    act(() => { reduced = true; mediaListener(); });
    expect(mocks.dispose).toHaveBeenCalledTimes(1);
    expect(container.querySelector("[data-scene-ready]")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
  it("does not initialize any renderer when reduced motion is already requested", () => {
    reduced = true; render(<HeroDecisionScope />);
    expect(mocks.mount).not.toHaveBeenCalled(); expect(screen.queryByRole("button")).toBeNull();
  });
  it("retains a usable poster if WebGL initialization fails", async () => {
    mocks.mount.mockRejectedValueOnce(new Error("WebGL unavailable"));
    const { container } = render(<HeroDecisionScope />); await enter();
    expect(container.querySelector("img")).toBeTruthy(); expect(container.querySelector("[data-scene-ready]")).toBeNull();
  });
  it("returns to the poster if the GPU context is lost", async () => {
    const { container } = render(<HeroDecisionScope />); await enter();
    act(() => mocks.mount.mock.calls[0][1]());
    expect(container.querySelector("[data-scene-ready]")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
  it("stops rendering while the tab is hidden", async () => {
    const hidden = vi.spyOn(document, "hidden", "get");
    hidden.mockReturnValue(false);
    render(<HeroDecisionScope />); await enter();
    hidden.mockReturnValue(true); fireEvent(document, new Event("visibilitychange"));
    expect(mocks.active).toHaveBeenLastCalledWith(false);
    hidden.mockReturnValue(false); fireEvent(document, new Event("visibilitychange"));
    expect(mocks.active).toHaveBeenLastCalledWith(true);
    hidden.mockRestore();
  });
  it("disposes a scene that finishes loading after navigation away", async () => {
    let finish!: (value: unknown) => void;
    mocks.mount.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const { unmount } = render(<HeroDecisionScope />);
    await enter(); await waitFor(() => expect(mocks.mount).toHaveBeenCalled()); unmount();
    await act(async () => finish({ setActive: mocks.active, dispose: mocks.dispose }));
    expect(mocks.dispose).toHaveBeenCalledTimes(1);
  });
  it("keeps the same artwork and renderer across parent updates", async () => {
    const { rerender, container } = render(<HeroDecisionScope />); await enter();
    const image = container.querySelector("img");
    rerender(<HeroDecisionScope />);
    expect(container.querySelector("img")).toBe(image);
    expect(mocks.mount).toHaveBeenCalledTimes(1);
    expect(mocks.dispose).not.toHaveBeenCalled();
  });
});
