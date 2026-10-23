import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";

const documents: JSDOM[] = [];
afterEach(() => documents.splice(0).forEach(dom => dom.window.close()));

function parseRoute(d: string) {
  const values = d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
  const start = values.slice(0, 2);
  const curves: number[][] = [];
  for (let index = 2; index < values.length; index += 6) curves.push(values.slice(index, index + 6));
  return { start, curves };
}

function sampleCurve(start: number[], curve: number[], t: number) {
  const u = 1 - t;
  return [0, 1].map(axis => u ** 3 * start[axis] + 3 * u ** 2 * t * curve[axis] + 3 * u * t ** 2 * curve[axis + 2] + t ** 3 * curve[axis + 4]);
}

function assertContinuousRoute(d: string, width: number, height: number) {
  const { start, curves } = parseRoute(d);
  let pen = start;
  curves.forEach((curve, index) => {
    for (let step = 0; step <= 80; step++) {
      const [x, y] = sampleCurve(pen, curve, step / 80);
      expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(width);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(height);
    }
    if (index) {
      const previous = curves[index - 1];
      const incoming = [previous[4] - previous[2], previous[5] - previous[3]];
      const outgoing = [curve[0] - previous[4], curve[1] - previous[5]];
      expect(Math.hypot(...incoming)).toBeGreaterThan(1);
      incoming.forEach((value, axis) => expect(value).toBeCloseTo(outgoing[axis], 1));
    }
    pen = curve.slice(4);
  });
}

function setup(site: string, reduced = false, supported = true, initialWidth = 390) {
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
  let width = initialWidth;
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
  const start = source.indexOf("  function buildTrailBundle(");
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
    expect(ends.map(point => point[0])).toEqual([350, 40, 350, 40, 195]);
    expect(ends[0][1]).toBeLessThan(ends[1][1]);
    expect(ends[1][1]).toBeLessThan(ends[2][1]);
    expect(ends[4][1]).toBe(759);
    expect(ui.trail.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 390 791");
    expect((ui.trail.querySelector("[data-intro-spot]") as HTMLElement).style.offsetPath).toContain(route.getAttribute("d"));
    expect(ui.trail.classList.contains("is-ready")).toBe(true);
    expect(ui.trail.getAttribute("aria-hidden")).toBe("true");
    expect(ui.w.document.documentElement.classList.contains("intro-guided")).toBe(true);
    assertContinuousRoute(route.getAttribute("d")!, 390, 791);
  });

  it("keeps the actual 375px logo origin independent of the wider turn reserves", () => {
    const ui = setup(site, false, true, 375);
    ui.hero.ownerDocument.querySelector<HTMLElement>(".brand-signal img")!.getBoundingClientRect = () => ({ left: 16, top: 18, width: 40, height: 40 }) as DOMRect;
    ui.flush();
    const d = ui.trail.querySelector("[data-intro-route]")!.getAttribute("d")!;
    expect(d).toMatch(/^M 36 38 C/);
    expect(parseRoute(d).curves[0][4]).toBe(335);
    ui.trail.querySelectorAll<SVGPathElement>("[data-trail-strand]").forEach(strand => {
      expect(parseRoute(strand.getAttribute("d")!).start).toEqual([36, 38]);
    });
  });

  it.each([375, 390, 430, 1440])("keeps one C1-continuous filament fan anchored and bounded at %ipx", (width) => {
    const ui = setup(site, false, true, width);
    if (width > 1024) {
      const copy = ui.hero.querySelector(".hero__copy")!;
      copy.querySelector<HTMLElement>(".button--primary")!.getBoundingClientRect = () => ({ left: 400, right: 710, top: 431, height: 56 }) as DOMRect;
      copy.querySelector<HTMLElement>(".button--secondary")!.getBoundingClientRect = () => ({ left: 730, right: 1040, top: 431, height: 56 }) as DOMRect;
    }
    ui.flush();
    const svg = ui.trail.querySelector("svg")!;
    const center = ui.trail.querySelector("[data-intro-route]")!.getAttribute("d")!;
    const { start, curves } = parseRoute(center);
    const strands = [...svg.querySelectorAll<SVGPathElement>("[data-trail-strand]")];
    const paths = strands.map(strand => strand.getAttribute("d")!);
    expect(strands).toHaveLength(10);
    expect(new Set(paths).size).toBe(10);
    expect(start).toEqual([40, 38]);
    expect(curves.at(-1)!.slice(4)).toEqual([width / 2, 759]);
    expect(curves[0][1]).toBe(start[1]);
    expect(curves.at(-1)![3]).toBe(759);
    for (const path of [center, ...paths]) {
      const strand = parseRoute(path);
      expect(strand.start).toEqual(start);
      expect(strand.curves.at(-1)!.slice(4)).toEqual(curves.at(-1)!.slice(4));
      assertContinuousRoute(path, width, 791);
    }
    let pen = start;
    let previousY = start[1];
    let denseTotal = 0;
    const denseStops = curves.map(curve => {
      let previous = pen;
      for (let step = 1; step <= 192; step++) {
        const point = sampleCurve(pen, curve, step / 192);
        expect(point[1]).toBeGreaterThanOrEqual(previousY - .001);
        previousY = point[1];
        denseTotal += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
        previous = point;
      }
      pen = curve.slice(4);
      return denseTotal;
    });
    const value = (name: string) => parseFloat(ui.w.document.documentElement.style.getPropertyValue(name));
    const build = (ui.w as unknown as { buildTrailBundle: (svg: SVGSVGElement, points: number[][], directions: string[], width: number, height: number) => { total: number; stops: number[] } }).buildTrailBundle;
    const knots = [start, ...curves.map(curve => curve.slice(4))];
    const directions = knots.map((point, index) => {
      const tangent = index < curves.length ? [curves[index][0] - point[0], curves[index][1] - point[1]] : [point[0] - curves[index - 1][2], point[1] - curves[index - 1][3]];
      return Math.abs(tangent[0]) > Math.abs(tangent[1]) ? "horizontal" : "vertical";
    });
    const measured = build(svg, knots, directions, width, 791);
    expect(Math.abs(measured.total - denseTotal) / denseTotal).toBeLessThan(.01);
    measured.stops.forEach((stop, index) => expect(stop).toBeGreaterThan(index ? measured.stops[index - 1] : 0));
    const travel = value("--intro-travel");
    expect(travel).toBeGreaterThan(0);
    expect(travel).toBeLessThanOrEqual(860);
    if (width > 1024) expect(travel).toBeLessThan(560);
    const primaryArrival = measured.stops[2] / measured.total * travel * .92;
    const secondaryArrival = measured.stops[3] / measured.total * travel * .92;
    expect(459 - primaryArrival).toBeGreaterThanOrEqual(56 / 2 + 24);
    expect((width > 1024 ? 459 : 535) - secondaryArrival).toBeGreaterThanOrEqual(56 / 2 + 24);
    expect(value("--intro-primary-from")).toBeCloseTo(denseStops[2] / denseTotal * travel * .92 - 32, 0);
    expect(value("--intro-dock-from")).toBeCloseTo(travel * .92 - 32, 0);
    expect(value("--intro-primary-from")).toBeLessThan(value("--intro-secondary-from"));
    expect(value("--intro-secondary-from")).toBeLessThan(value("--intro-dock-from"));
    expect(value("--intro-dock-to")).toBeLessThan(travel);
    knots.forEach((point, index) => {
      if (directions[index] !== "vertical") return;
      const gap = Math.min(point[1] - knots[index - 1][1], knots[index + 1][1] - point[1]);
      expect((curves[index][1] - point[1]) / gap).toBeCloseTo(.46, 2);
    });
  });

  it("remeasures only on layout changes and coalesces resize callbacks into one frame", () => {
    const ui = setup(site); ui.flush();
    const before = ui.trail.querySelector("[data-intro-route]")!.getAttribute("d");
    for (let i = 0; i < 12; i++) ui.resize(430);
    expect(ui.frames.size).toBe(1);
    expect(ui.trail.querySelector("[data-intro-route]")!.getAttribute("d")).toBe(before);
    ui.flush();
    expect(ui.trail.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 430 791");
    expect(ui.trail.querySelector("[data-intro-route]")!.getAttribute("d")).toContain("390");
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
    const last = curves.at(-1)!;
    const previous = curves.at(-2)!.slice(4);
    expect(last[4]).toBeLessThan(previous[0]);
    expect(last[2]).toBeGreaterThan(last[4]);
    for (let step = 0; step <= 100; step++) {
      expect(sampleCurve(previous, last, step / 100)[0]).toBeGreaterThanOrEqual(last[4] - .001);
    }
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

function setupContact(site: string, reduced = false, width = 390) {
  const ui = setup(site, reduced, true, width);
  ui.flush();
  const section = ui.w.document.querySelector<HTMLElement>(".contact")!;
  const trail = section.querySelector<HTMLElement>("[data-contact-trail]")!;
  const panel = section.querySelector<HTMLDetailsElement>("[data-contact-panel]")!;
  const rect = (left: number, top: number, width: number, height: number) => ({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect;
  Object.defineProperty(section, "clientWidth", { value: width });
  section.getBoundingClientRect = () => rect(0, 160, width, 800);
  section.querySelector<HTMLElement>("h2")!.getBoundingClientRect = () => rect(20, 220, width - 40, 100);
  panel.querySelector<HTMLElement>("summary")!.getBoundingClientRect = () => rect(20, 600, width - 40, 96);
  panel.querySelector<SVGElement>("summary svg")!.getBoundingClientRect = () => rect(width - 80, 620, 40, 40);
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
  it.each([375, 390, 430, 1440])("uses the same anchored, bounded C1 filament fan for contact at %ipx", (width) => {
    for (const expanded of [false, true]) {
      const ui = setupContact(site, false, width);
      if (expanded) {
        ui.panel.dataset.expanded = "true";
        ui.section.querySelector<HTMLElement>("h2")!.getBoundingClientRect = () => ({ top: -150, bottom: -50 }) as DOMRect;
      }
      ui.enter(.7); ui.flush();
      const center = ui.trail.querySelector("[data-contact-route]")!.getAttribute("d")!;
      const paths = [...ui.trail.querySelectorAll<SVGPathElement>("[data-trail-strand]")].map(strand => strand.getAttribute("d")!);
      const { start, curves } = parseRoute(center);
      const expectedStart = expanded ? [40, 448] : [90, 95];
      const expectedEnd = expanded ? [56, 586] : [width - 60, 480];
      expect(paths).toHaveLength(10);
      expect(new Set(paths).size).toBe(10);
      expect(start).toEqual(expectedStart);
      expect(curves.at(-1)!.slice(4)).toEqual(expectedEnd);
      expect(curves[0][1]).toBe(expectedStart[1]);
      expect(curves.at(-1)![3]).toBe(expectedEnd[1]);
      for (const path of [center, ...paths]) {
        const strand = parseRoute(path);
        expect(strand.start).toEqual(start);
        expect(strand.curves.at(-1)!.slice(4)).toEqual(curves.at(-1)!.slice(4));
        assertContinuousRoute(path, width, expectedEnd[1] + 80);
      }
    }
  });

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
