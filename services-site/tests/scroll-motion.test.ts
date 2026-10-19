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
  const animationQueries = vi.fn(() => [] as Animation[]);
  w.matchMedia = () => preference as unknown as MediaQueryList;
  w.requestAnimationFrame = (callback) => { frames.push(callback); return frames.length; };
  w.IntersectionObserver = class {
    elements: Element[] = [];
    constructor(readonly callback: (entries: unknown[], observer?: { unobserve: () => void }) => void) { observers.push(this); }
    observe(element: Element) { this.elements.push(element); }
    unobserve() {}
  } as unknown as typeof IntersectionObserver;
  w.Element.prototype.getAnimations = animationQueries;
  w.fetch = vi.fn(async () => new Response(null, { status: 204 }));
  w.scrollTo = vi.fn();
  Object.defineProperty(w, "innerWidth", { configurable: true, value: 390 });
  Object.defineProperty(w, "innerHeight", { configurable: true, value: height });
  Object.defineProperty(frame, "offsetHeight", { value: 558 });
  Object.defineProperty(track, "offsetHeight", { get: () => journey.classList.contains("journey--guided") ? 2358 : 558 });
  const trackReads = vi.fn(() => ({ top: 1000 - w.scrollY }) as DOMRect);
  track.getBoundingClientRect = trackReads;
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
  return { w, journey, track, preference, listeners, animationQueries, trackReads, enter, flush, progress };
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

  it("does not seek native animations, read layout or rewrite choice styles on each scroll frame", () => {
    const ui = setup();
    ui.enter(ui.track);
    ui.progress(.15);
    const reads = ui.trackReads.mock.calls.length;
    const styles = vi.spyOn(ui.w.CSSStyleDeclaration.prototype, "setProperty");
    for (const progress of [.16, .17, .18, .19]) ui.progress(progress);
    expect(ui.trackReads).toHaveBeenCalledTimes(reads);
    expect(styles.mock.calls.filter(([property]) => property === "--choice-progress")).toHaveLength(0);
    const figure = ui.w.document.querySelector(".service-visual") as HTMLElement;
    ui.enter(figure);
    ui.w.dispatchEvent(new ui.w.Event("scroll"));
    ui.flush();
    expect(ui.animationQueries).not.toHaveBeenCalled();
    styles.mockRestore();
  });

  it("does not collapse the mobile track when the address bar changes viewport height", () => {
    const ui = setup();
    ui.enter(ui.track);
    ui.progress(.5);
    for (const height of [650, 700, 844]) {
      Object.defineProperty(ui.w, "innerHeight", { value: height });
      ui.w.dispatchEvent(new ui.w.Event("resize"));
      ui.flush();
      expect(ui.journey.classList.contains("journey--guided")).toBe(true);
      expect(ui.journey.dataset.active).toBe("social");
    }
  });

  it("caches method geometry and limits continuous progress styling to its rail", () => {
    const ui = setup();
    const method = ui.w.document.querySelector(".method-track") as HTMLElement;
    const frame = method.querySelector(".method-frame") as HTMLElement;
    const reads = vi.fn(() => ({ top: 5000 - ui.w.scrollY }) as DOMRect);
    method.getBoundingClientRect = reads;
    Object.defineProperty(method, "offsetHeight", { value: 2500 });
    Object.defineProperty(frame, "offsetHeight", { value: 500 });
    ui.enter(method);
    const initialReads = reads.mock.calls.length;
    for (const [progress, phase] of [[.1, "0"], [.4, "1"], [.7, "2"], [.9, "3"], [.4, "1"]] as const) {
      Object.defineProperty(ui.w, "scrollY", { value: 5000 + 2000 * progress });
      ui.w.dispatchEvent(new ui.w.Event("scroll"));
      ui.flush();
      expect(ui.w.document.querySelector(".process")?.getAttribute("data-phase")).toBe(phase);
    }
    expect(reads).toHaveBeenCalledTimes(initialReads);
    expect(method.querySelector<HTMLElement>(".method-rail")?.style.getPropertyValue("--method-progress")).toBe("0.400");
    expect(ui.w.document.querySelector<HTMLElement>(".process")?.style.getPropertyValue("--method-progress")).toBe("");
    ui.flush();
  });
});
