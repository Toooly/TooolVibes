import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";

const documents: JSDOM[] = [];
afterEach(() => documents.splice(0).forEach(dom => dom.window.close()));

function setup(site: string, reduced = false, supported = true) {
  const root = resolve(process.cwd(), site, "public");
  const dom = new JSDOM(readFileSync(resolve(root, "index.html"), "utf8"), { runScripts: "outside-only" });
  documents.push(dom);
  const w = dom.window;
  const hero = w.document.querySelector<HTMLElement>(".hero")!;
  const trail = hero.querySelector<HTMLElement>("[data-intro-trail]")!;
  const copy = hero.querySelector<HTMLElement>(".hero__copy")!;
  const mediaListeners = new Set<() => void>();
  const preference = { matches: reduced, addEventListener: (_: string, fn: () => void) => mediaListeners.add(fn), removeEventListener: (_: string, fn: () => void) => mediaListeners.delete(fn) };
  w.matchMedia = () => preference as unknown as MediaQueryList;
  Object.defineProperty(w, "CSS", { value: { supports: () => supported } });
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;
  w.requestAnimationFrame = callback => { frames.set(++nextFrame, callback); return nextFrame; };
  w.cancelAnimationFrame = vi.fn(id => frames.delete(id));
  const observers: Array<{ callback: () => void; observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }> = [];
  w.ResizeObserver = class {
    observe = vi.fn(); disconnect = vi.fn(); unobserve = vi.fn();
    constructor(callback: () => void) { observers.push({ callback, observe: this.observe, disconnect: this.disconnect }); }
  } as unknown as typeof ResizeObserver;
  let width = 390;
  Object.defineProperty(hero, "clientWidth", { get: () => width });
  Object.defineProperty(hero, "clientHeight", { value: 660 });
  hero.style.paddingLeft = "20px";
  hero.getBoundingClientRect = () => ({ left: 0, top: 0 }) as DOMRect;
  hero.ownerDocument.querySelector<HTMLElement>(".brand-signal img")!.getBoundingClientRect = () => ({ left: 20, top: 18, width: 40, height: 40 }) as DOMRect;
  Object.defineProperty(copy, "offsetTop", { value: 91 });
  for (const [selector, top, height] of [["h1", 0, 160], [":scope > p", 188, 120], [".hero__actions", 340, 128]] as const) {
    const element = copy.querySelector<HTMLElement>(selector)!;
    Object.defineProperty(element, "offsetTop", { value: top });
    Object.defineProperty(element, "offsetHeight", { value: height });
  }
  const buttonRect = (top: number) => ({ left: 20, right: width - 20, top, bottom: top + 56, width: width - 40, height: 56 }) as DOMRect;
  copy.querySelector<HTMLElement>(".button--primary")!.getBoundingClientRect = () => buttonRect(431);
  copy.querySelector<HTMLElement>(".button--secondary")!.getBoundingClientRect = () => buttonRect(507);
  w.document.getElementById("journey-title")!.getBoundingClientRect = () => ({ left: 20, right: width - 20, top: 700, bottom: 748, width: width - 40, height: 48 }) as DOMRect;
  const source = readFileSync(resolve(root, "app.js"), "utf8");
  const start = source.indexOf("  function initIntroTrail()");
  const end = source.indexOf("  initIntroTrail();", start) + "  initIntroTrail();".length;
  const listeners = vi.spyOn(w, "addEventListener");
  w.eval(source.slice(start, end));
  const flush = () => { for (const [id, callback] of frames) { frames.delete(id); callback(0); } };
  const pagehide = (persisted: boolean) => { const event = new w.Event("pagehide"); Object.defineProperty(event, "persisted", { value: persisted }); w.dispatchEvent(event); };
  return { w, hero, trail, preference, mediaListeners, frames, observers, listeners, flush, pagehide, resize: (value: number) => { width = value; observers.forEach(observer => observer.callback()); } };
}

describe.each(["services-site", "projects-site"])("%s responsive intro trail", site => {
  it("starts at the real logo, sweeps through both CTAs and docks under the explorer heading", () => {
    const ui = setup(site); ui.flush();
    const route = ui.trail.querySelector("[data-intro-route]")!;
    expect(route.getAttribute("d")).toMatch(/^M 40 38 C/);
    const ends = [...route.getAttribute("d")!.matchAll(/C [\d.-]+ [\d.-]+ [\d.-]+ [\d.-]+ ([\d.-]+) ([\d.-]+)/g)].map(match => [Number(match[1]), Number(match[2])]);
    expect(ends.map(point => point[0])).toEqual([362, 28, 362, 28, 195]);
    expect(ends[0][1]).toBeLessThan(ends[1][1]);
    expect(ends[1][1]).toBeLessThan(ends[2][1]);
    expect(ends[4][1]).toBe(759);
    expect(ui.trail.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 390 791");
    expect((ui.trail.querySelector("[data-intro-spot]") as HTMLElement).style.offsetPath).toContain(route.getAttribute("d"));
    expect(ui.trail.classList.contains("is-ready")).toBe(true);
    expect(ui.trail.getAttribute("aria-hidden")).toBe("true");
    expect(ui.w.document.documentElement.classList.contains("intro-guided")).toBe(true);
    // Adjacent cubic tangents must continue in the same direction, without a cusp.
    const points = [...route.getAttribute("d")!.matchAll(/C ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+)/g)].map(match => match.slice(1).map(Number));
    for (let index = 1; index < points.length; index++) {
      const previous = points[index - 1];
      const incoming = [previous[4] - previous[2], previous[5] - previous[3]];
      const outgoing = [points[index][0] - previous[4], points[index][1] - previous[5]];
      expect(incoming[0] * outgoing[1] - incoming[1] * outgoing[0]).toBeCloseTo(0, 1);
      expect(incoming[0] * outgoing[0] + incoming[1] * outgoing[1]).toBeGreaterThan(0);
    }
  });

  it("remeasures only on layout changes and coalesces resize callbacks into one frame", () => {
    const ui = setup(site); ui.flush();
    const before = ui.trail.querySelector("[data-intro-route]")!.getAttribute("d");
    for (let i = 0; i < 12; i++) ui.resize(430);
    expect(ui.frames.size).toBe(1);
    expect(ui.trail.querySelector("[data-intro-route]")!.getAttribute("d")).toBe(before);
    ui.flush();
    expect(ui.trail.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 430 791");
    expect(ui.trail.querySelector("[data-intro-route]")!.getAttribute("d")).toContain("402");
    expect(ui.listeners.mock.calls.some(([event]) => event === "scroll")).toBe(false);
  });

  it("synchronizes button emphasis and the final orbit with measured curve lengths", () => {
    const ui = setup(site); ui.flush();
    const value = (name: string) => parseFloat(ui.w.document.documentElement.style.getPropertyValue(name));
    expect(value("--intro-primary-from")).toBeGreaterThan(0);
    expect(value("--intro-primary-to")).toBeGreaterThan(value("--intro-primary-from"));
    expect(value("--intro-secondary-from")).toBeGreaterThan(value("--intro-primary-from"));
    expect(value("--intro-secondary-to")).toBeGreaterThan(value("--intro-secondary-from"));
    expect(value("--intro-dock-to")).toBeGreaterThan(value("--intro-dock-from"));
    expect(value("--intro-dock-to")).toBeLessThan(value("--intro-travel"));
  });

  it("keeps a forward horizontal handoff when desktop CTAs sit side by side", () => {
    const ui = setup(site);
    const copy = ui.hero.querySelector(".hero__copy")!;
    copy.querySelector<HTMLElement>(".button--primary")!.getBoundingClientRect = () => ({ left: 400, right: 710, top: 431, height: 56 }) as DOMRect;
    copy.querySelector<HTMLElement>(".button--secondary")!.getBoundingClientRect = () => ({ left: 730, right: 1040, top: 431, height: 56 }) as DOMRect;
    ui.resize(1440); ui.flush();
    const curves = [...ui.trail.querySelector("[data-intro-route]")!.getAttribute("d")!.matchAll(/C ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+)/g)].map(match => match.slice(1).map(Number));
    expect(curves[2].slice(4)).toEqual([684, 459]);
    expect(curves[3].slice(4)).toEqual([756, 459]);
    expect(curves[3][0]).toBeGreaterThan(684);
    expect(curves[3][2]).toBeLessThan(756);
    expect(curves[3][1]).toBe(459);
    expect(curves[3][3]).toBe(459);
  });

  it("disables the trail and geometry observer when reduced motion is requested", () => {
    const ui = setup(site, true); ui.flush();
    expect(ui.trail.classList.contains("is-ready")).toBe(false);
    expect(ui.w.document.documentElement.classList.contains("intro-guided")).toBe(false);
    expect(ui.observers[0].observe).not.toHaveBeenCalled();
    ui.preference.matches = false; ui.mediaListeners.forEach(fn => fn()); ui.flush();
    expect(ui.trail.classList.contains("is-ready")).toBe(true);
    ui.preference.matches = true; ui.mediaListeners.forEach(fn => fn());
    expect(ui.trail.classList.contains("is-ready")).toBe(false);
    expect(ui.frames.size).toBe(0);
  });

  it("leaves unsupported browsers with the unchanged static hero and no observers", () => {
    const ui = setup(site, false, false);
    expect(ui.observers).toHaveLength(0);
    expect(ui.frames.size).toBe(0);
    expect(ui.trail.classList.contains("is-ready")).toBe(false);
  });

  it("disconnects its observer, preference handler and pending frame on real navigation", () => {
    const ui = setup(site); ui.flush(); ui.resize(430);
    expect(ui.frames.size).toBe(1);
    ui.pagehide(false);
    expect(ui.frames.size).toBe(0);
    expect(ui.mediaListeners.size).toBe(0);
    expect(ui.observers[0].disconnect).toHaveBeenCalled();
    ui.resize(450);
    expect(ui.frames.size).toBe(0);
  });

  it("preserves the component across a back-forward cache suspension", () => {
    const ui = setup(site); ui.flush(); ui.pagehide(true); ui.resize(430); ui.flush();
    expect(ui.trail.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 430 791");
    expect(ui.mediaListeners.size).toBe(1);
  });
});

function setupContact(site: string, reduced = false) {
  const ui = setup(site, reduced);
  ui.flush();
  const section = ui.w.document.querySelector<HTMLElement>(".contact")!;
  const trail = section.querySelector<HTMLElement>("[data-contact-trail]")!;
  const panel = section.querySelector<HTMLDetailsElement>("[data-contact-panel]")!;
  const rect = (left: number, top: number, width: number, height: number) => ({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect;
  Object.defineProperty(section, "clientWidth", { value: 390 });
  section.getBoundingClientRect = () => rect(0, 160, 390, 800);
  section.querySelector<HTMLElement>("h2")!.getBoundingClientRect = () => rect(20, 220, 350, 100);
  panel.querySelector<HTMLElement>("summary")!.getBoundingClientRect = () => rect(20, 600, 350, 96);
  panel.querySelector<SVGElement>("summary svg")!.getBoundingClientRect = () => rect(310, 620, 40, 40);
  panel.querySelector<HTMLElement>('[aria-current="step"] > span')!.getBoundingClientRect = () => rect(40, 730, 32, 32);
  let enter: (ratio: number) => void = () => {};
  const observe = vi.fn();
  const disconnect = vi.fn();
  ui.w.IntersectionObserver = class {
    observe = observe; disconnect = disconnect; unobserve = vi.fn();
    constructor(callback: IntersectionObserverCallback) {
      enter = ratio => callback([{ isIntersecting: ratio > 0, intersectionRatio: ratio } as IntersectionObserverEntry], {} as IntersectionObserver);
    }
  } as unknown as typeof IntersectionObserver;
  const source = readFileSync(resolve(process.cwd(), site, "public/app.js"), "utf8");
  const start = source.indexOf("  function initContactTrail()");
  const end = source.indexOf("  initContactTrail();", start) + "  initContactTrail();".length;
  ui.w.eval(source.slice(start, end));
  return { ...ui, section, trail, panel, observe, disconnect, enter: (ratio: number) => enter(ratio) };
}

describe.each(["services-site", "projects-site"])("%s contact light guidance", site => {
  it("waits until the summary is visible, then guides toward the actual opening control", () => {
    const ui = setupContact(site);
    ui.enter(.3); ui.flush();
    expect(ui.trail.classList.contains("is-playing")).toBe(false);
    ui.enter(.7); ui.flush();
    const d = ui.trail.querySelector("[data-contact-route]")!.getAttribute("d")!;
    expect(d).toMatch(/^M 90 95 C/);
    expect(d).toMatch(/330 480$/);
    expect((d.match(/C/g) || [])).toHaveLength(3);
    expect(ui.trail.classList.contains("is-playing")).toBe(true);
    expect(ui.trail.getAttribute("aria-hidden")).toBe("true");
    expect(ui.listeners.mock.calls.some(([event]) => event === "scroll")).toBe(false);
  });

  it("cleans up the light after one pass and never loops on repeated intersections", () => {
    const ui = setupContact(site); ui.enter(.7); ui.flush();
    ui.trail.querySelector(".intro-trail__head")!.dispatchEvent(new ui.w.Event("animationend", { bubbles: true }));
    expect(ui.trail.classList.contains("is-ready")).toBe(false);
    ui.enter(.9); ui.flush();
    expect(ui.trail.classList.contains("is-playing")).toBe(false);
    expect(ui.frames.size).toBe(0);
  });

  it("stops immediately when the visitor starts typing and leaves focus untouched", () => {
    const ui = setupContact(site); ui.enter(.7); ui.flush();
    const field = ui.panel.querySelector<HTMLInputElement>('[name="name"]')!;
    field.focus();
    expect(ui.w.document.activeElement).toBe(field);
    expect(ui.trail.classList.contains("is-playing")).toBe(false);
  });

  it("respects reduced motion and cancels a pending cue on real navigation", () => {
    const ui = setupContact(site, true);
    expect(ui.observe).not.toHaveBeenCalled();
    ui.preference.matches = false; ui.mediaListeners.forEach(fn => fn()); ui.flush();
    expect(ui.observe).toHaveBeenCalled();
    ui.enter(.7);
    expect(ui.frames.size).toBe(1);
    ui.pagehide(false); ui.flush();
    expect(ui.trail.classList.contains("is-playing")).toBe(false);
    expect(ui.mediaListeners.size).toBe(0);
    expect(ui.frames.size).toBe(0);
  });

  it("targets the active step when arriving through a CTA into the expanded form", () => {
    const ui = setupContact(site);
    ui.panel.dataset.expanded = "true";
    ui.section.querySelector<HTMLElement>("h2")!.getBoundingClientRect = () => ({ top: -150, bottom: -50 }) as DOMRect;
    ui.enter(.7); ui.flush();
    const d = ui.trail.querySelector("[data-contact-route]")!.getAttribute("d")!;
    expect(d).toMatch(/^M 40 448 C/);
    expect(d).toMatch(/56 586$/);
  });
});
