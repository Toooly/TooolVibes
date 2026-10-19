import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";

const root = resolve(process.cwd(), "services-site/public");
const documents: JSDOM[] = [];
afterEach(() => documents.splice(0).forEach((dom) => dom.window.close()));

function setup(height = 844) {
  const dom = new JSDOM(readFileSync(resolve(root, "index.html"), "utf8"), { url: "https://servizi.tooolvibes.eu", runScripts: "outside-only" });
  documents.push(dom);
  const w = dom.window;
  const journey = w.document.querySelector("[data-journey]") as HTMLElement;
  const frame = journey.querySelector(".journey__frame") as HTMLElement;
  const track = journey.querySelector(".journey__track") as HTMLElement;
  const listeners: Array<() => void> = [];
  const preference = { matches: false, addEventListener: (_: string, callback: () => void) => listeners.push(callback) };
  const frames: FrameRequestCallback[] = [];
  const observers: Array<{ callback: (entries: unknown[], observer?: { unobserve: () => void }) => void; elements: Element[] }> = [];
  const animations = new Map<Element, { animationName: string; currentTime: number; pause: ReturnType<typeof vi.fn>; play: ReturnType<typeof vi.fn>; cancel: ReturnType<typeof vi.fn>; effect: { getComputedTiming: () => { endTime: number } } }>();
  w.matchMedia = () => preference as unknown as MediaQueryList;
  w.requestAnimationFrame = (callback) => { frames.push(callback); return frames.length; };
  w.IntersectionObserver = class {
    elements: Element[] = [];
    constructor(readonly callback: (entries: unknown[], observer?: { unobserve: () => void }) => void) { observers.push(this); }
    observe(element: Element) { this.elements.push(element); }
    unobserve() {}
  } as unknown as typeof IntersectionObserver;
  w.Element.prototype.getAnimations = function () {
    if (!animations.has(this)) animations.set(this, { animationName: "scene-content", currentTime: 0, pause: vi.fn(), play: vi.fn(), cancel: vi.fn(), effect: { getComputedTiming: () => ({ endTime: 5000 }) } });
    return [animations.get(this)] as unknown as Animation[];
  };
  w.fetch = vi.fn(async () => new Response(null, { status: 204 }));
  w.scrollTo = vi.fn();
  Object.defineProperty(w, "innerWidth", { value: 390 });
  Object.defineProperty(w, "innerHeight", { value: height });
  Object.defineProperty(frame, "offsetHeight", { value: 558 });
  Object.defineProperty(track, "offsetHeight", { get: () => journey.classList.contains("journey--guided") ? 2358 : 558 });
  track.getBoundingClientRect = () => ({ top: 1000 - w.scrollY }) as DOMRect;
  w.eval(readFileSync(resolve(root, "app.js"), "utf8"));
  function flush() { while (frames.length) frames.shift()!(0); }
  function enter(element: Element) {
    observers.filter((observer) => observer.elements.includes(element)).forEach((observer) => observer.callback([{ target: element, isIntersecting: true }], { unobserve() {} }));
    flush();
  }
  function progress(value: number) {
    const top = Number.parseFloat(journey.style.getPropertyValue("--journey-sticky-top"));
    Object.defineProperty(w, "scrollY", { configurable: true, value: 1000 - top + 1800 * value });
    w.dispatchEvent(new w.Event("scroll"));
    flush();
  }
  return { w, journey, track, preference, listeners, animations, enter, flush, progress };
}

describe("Scroll-paced services motion", () => {
  it("keeps availability text, final counters, arcs and slots in agreement per service", () => {
    const ui = setup();
    for (const [service, available] of [["web", 1], ["social", 3]] as const) {
      const capacity = ui.w.document.querySelector(`[data-service-price="${service}"] .service-capacity`)!;
      expect(capacity.getAttribute("data-available")).toBe(String(available));
      expect(Number(capacity.querySelector(".service-capacity__digits > span:last-child")?.textContent)).toBe(available);
      expect(capacity.querySelectorAll(".service-capacity__slots i:not(.is-assigned)")).toHaveLength(available);
      expect(capacity.querySelectorAll(".service-capacity__orbit circle:not(.is-assigned)")).toHaveLength(available);
      expect(capacity.getAttribute("aria-label")).toContain(`${available} `);
    }
    const chatbot = ui.w.document.querySelector('[data-service-price="ai"] .service-capacity')!;
    expect(chatbot.getAttribute("data-available")).toBe("request");
    expect(chatbot.textContent).toContain("Disponibilità su richiesta");
    expect(chatbot.querySelector(".service-capacity__digits")).toBeNull();
    expect(chatbot.querySelector(".service-capacity__slots")).toBeNull();
  });

  it("holds three readable phases and reverses them with native scrolling", () => {
    const ui = setup();
    ui.enter(ui.track);
    expect(ui.journey.classList.contains("journey--guided")).toBe(true);
    for (const [progress, service] of [[.15, "web"], [.5, "social"], [.86, "ai"], [.5, "social"], [.15, "web"]] as const) {
      ui.progress(progress);
      expect(ui.journey.dataset.active).toBe(service);
      expect(ui.journey.querySelector(`[data-journey-select="${service}"]`)?.getAttribute("aria-pressed")).toBe("true");
      expect((ui.journey.querySelector(`[data-journey-scene="${service}"]`) as HTMLElement).hidden).toBe(false);
    }
    expect(ui.journey.querySelector("[data-journey-description]")?.getAttribute("aria-live")).toBe("off");
  });

  it("keeps direct service choices usable and seeks within the same native track", () => {
    const ui = setup();
    ui.enter(ui.track);
    (ui.journey.querySelector('[data-journey-select="ai"]') as HTMLButtonElement).click();
    expect(ui.w.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: "smooth", top: expect.any(Number) }));
    ui.progress(.8);
    expect(ui.journey.dataset.active).toBe("ai");
  });

  it("falls back to direct choices when motion is reduced or the screen is too short", () => {
    const ui = setup();
    ui.enter(ui.track);
    ui.preference.matches = true;
    ui.listeners.forEach((listener) => listener());
    expect(ui.journey.classList.contains("journey--guided")).toBe(false);
    (ui.journey.querySelector('[data-journey-select="social"]') as HTMLButtonElement).click();
    expect(ui.journey.dataset.active).toBe("social");
    expect(ui.w.scrollTo).not.toHaveBeenCalled();
    expect(setup(600).journey.classList.contains("journey--guided")).toBe(false);
  });

  it("scrubs service artwork interiors rather than letting their animations run ahead", () => {
    const ui = setup();
    const figure = ui.w.document.querySelector(".service-visual") as HTMLElement;
    let top = 700;
    figure.getBoundingClientRect = () => ({ top, height: 300 }) as DOMRect;
    ui.enter(figure);
    const animation = ui.animations.get(figure)!;
    const initialTime = animation.currentTime;
    expect(animation.pause).toHaveBeenCalled();
    top = 300;
    ui.w.dispatchEvent(new ui.w.Event("scroll"));
    ui.flush();
    expect(animation.currentTime).toBeGreaterThan(initialTime);
    top = 700;
    ui.w.dispatchEvent(new ui.w.Event("scroll"));
    ui.flush();
    expect(animation.currentTime).toBe(initialTime);
  });
});
