import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";

const root = resolve(process.cwd(), "services-site/public");
const documents: JSDOM[] = [];
afterEach(() => documents.splice(0).forEach((dom) => dom.window.close()));

function setup(height = 844, frameHeight = 558, width = 390) {
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
  Object.defineProperty(w, "innerWidth", { configurable: true, value: width });
  Object.defineProperty(w, "innerHeight", { configurable: true, value: height });
  Object.defineProperty(frame, "offsetHeight", { get: () => journey.classList.contains("journey--compact") ? Math.min(frameHeight, 390) : frameHeight });
  Object.defineProperty(track, "offsetHeight", { get: () => journey.classList.contains("journey--guided") ? frame.offsetHeight + 1800 : frame.offsetHeight });
  const trackReads = vi.fn(() => ({ top: 1000 - w.scrollY }) as DOMRect);
  track.getBoundingClientRect = trackReads;
  w.eval(readFileSync(resolve(root, "app.js"), "utf8"));
  function flush() { while (frames.length) frames.shift()!(0); }
  function enter(element: Element, isIntersecting = true) {
    observers.filter((observer) => observer.elements.includes(element)).forEach((observer) => observer.callback([{ target: element, isIntersecting }], { unobserve() {} }));
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
      const digits = [...capacity.querySelectorAll(".service-capacity__digits > span")].map((digit) => Number(digit.textContent));
      expect(digits).toEqual(Array.from({ length: 6 - available }, (_, index) => 5 - index));
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

  it("starts capacity motion only when visible and never resets the completed countdown", () => {
    const ui = setup();
    const capacity = ui.w.document.querySelector('.service-capacity[data-available="1"]')!;
    expect(capacity.classList.contains("has-counted")).toBe(false);
    ui.enter(capacity);
    expect(capacity.classList.contains("is-in-view")).toBe(true);
    expect(capacity.classList.contains("has-counted")).toBe(true);
    ui.enter(capacity, false);
    expect(capacity.classList.contains("is-in-view")).toBe(false);
    expect(capacity.classList.contains("has-counted")).toBe(true);
    ui.enter(capacity);
    expect(capacity.classList.contains("has-counted")).toBe(true);
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
    expect(setup(400).journey.classList.contains("journey--guided")).toBe(false);
  });

  it.each([650, 680])("keeps the guide enabled with Safari browser chrome at %ipx height", (height) => {
    const ui = setup(height, 470);
    expect(ui.journey.classList.contains("journey--guided")).toBe(true);
    expect(ui.journey.querySelector(":scope > #journey-title")).not.toBeNull();
    expect(ui.journey.querySelector(".journey__connection")).toBeNull();
    ui.enter(ui.track);
    ui.progress(.5);
    expect(ui.journey.dataset.active).toBe("social");
  });

  it("uses compact geometry on short phones without duplicating the title or artwork", () => {
    const ui = setup(548, 470);
    expect(ui.journey.classList.contains("journey--compact")).toBe(true);
    expect(ui.journey.classList.contains("journey--guided")).toBe(true);
    expect(ui.journey.querySelectorAll("#journey-title")).toHaveLength(1);
    expect(ui.journey.querySelectorAll("[data-journey-scene]")).toHaveLength(3);
  });

  it("returns the same introduction to the desktop layout after orientation changes", () => {
    const ui = setup(650, 470);
    const title = ui.journey.querySelector("#journey-title");
    Object.defineProperty(ui.w, "innerWidth", { value: 1440 });
    ui.w.dispatchEvent(new ui.w.Event("resize"));
    expect(ui.journey.querySelector(":scope > #journey-title")).toBe(title);
    expect(ui.journey.classList.contains("journey--guided")).toBe(true);
    Object.defineProperty(ui.w, "innerWidth", { value: 390 });
    ui.w.dispatchEvent(new ui.w.Event("resize"));
    expect(ui.journey.querySelector(":scope > #journey-title")).toBe(title);
    expect(ui.journey.querySelectorAll(".journey__connection")).toHaveLength(0);
  });

  it.each([1280, 1440, 1728])("paces the desktop explorer at %ipx with the same reversible phases", (width) => {
    const ui = setup(900, 450, width);
    ui.enter(ui.track);
    expect(ui.journey.classList.contains("journey--guided")).toBe(true);
    expect(ui.journey.querySelector(":scope > #journey-title")).not.toBeNull();
    for (const [progress, service] of [[.15, "web"], [.5, "social"], [.85, "ai"], [.5, "social"]] as const) {
      ui.progress(progress);
      expect(ui.journey.dataset.active).toBe(service);
    }
    expect(ui.animationQueries).not.toHaveBeenCalled();
  });

  it("retains manual choices on tablets and desktop windows too short for a sticky stage", () => {
    for (const ui of [setup(900, 450, 1024), setup(560, 500, 1440)]) {
      expect(ui.journey.classList.contains("journey--guided")).toBe(false);
      (ui.journey.querySelector('[data-journey-select="ai"]') as HTMLButtonElement).click();
      expect(ui.journey.dataset.active).toBe("ai");
      expect(ui.w.scrollTo).not.toHaveBeenCalled();
    }
  });

  it("uses the space freed by the non-fixed header without changing the native scroll phases", () => {
    const ui = setup(600, 500, 1440);
    expect(ui.journey.style.getPropertyValue("--journey-sticky-top")).toBe("12px");
    expect(ui.journey.classList.contains("journey--guided")).toBe(true);
    ui.enter(ui.track);
    ui.progress(.5);
    expect(ui.journey.dataset.active).toBe("social");
  });

  it("rechecks desktop height without changing mobile browser-chrome behavior", () => {
    const ui = setup(900, 450, 1440);
    expect(ui.journey.classList.contains("journey--guided")).toBe(true);
    Object.defineProperty(ui.w, "innerHeight", { value: 500 });
    ui.w.dispatchEvent(new ui.w.Event("resize"));
    expect(ui.journey.classList.contains("journey--guided")).toBe(false);
    Object.defineProperty(ui.w, "innerHeight", { value: 900 });
    ui.w.dispatchEvent(new ui.w.Event("resize"));
    expect(ui.journey.classList.contains("journey--guided")).toBe(true);
  });

  it("closes the mobile menu when entering the desktop navigation layout", () => {
    const ui = setup();
    const toggle = ui.w.document.querySelector<HTMLButtonElement>("[data-menu-toggle]")!;
    toggle.click();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    Object.defineProperty(ui.w, "innerWidth", { value: 1280 });
    ui.w.dispatchEvent(new ui.w.Event("resize"));
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(ui.w.document.querySelector<HTMLElement>("[data-mobile-nav]")!.hidden).toBe(true);
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
