import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";

const documents: JSDOM[] = [];
afterEach(() => documents.splice(0).forEach(dom => dom.window.close()));

function setup(site: string, reduced = false, supported = true) {
  const dom = new JSDOM('<main><div class="hero"><a id="cta" href="#esplora">Servizi</a><a id="cue" href="#esplora">Scorri</a><a id="contact" href="#contatti">Contatti</a></div><a id="outside" href="#esplora">Altro</a><section id="esplora"><h2>Da dove vuoi iniziare?</h2></section></main>', { url: "https://example.com/?preview=1", runScripts: "outside-only" });
  documents.push(dom);
  const w = dom.window;
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;
  let y = 0;
  let targetTop = 800;
  let height = 2000;
  let viewportWidth = 390;
  let viewportHeight = 844;
  let hidden = false;
  const listeners = new Set<() => void>();
  const preference = { matches: reduced, addEventListener: (_: string, handler: () => void) => listeners.add(handler), removeEventListener: (_: string, handler: () => void) => listeners.delete(handler) };
  w.matchMedia = () => preference as unknown as MediaQueryList;
  if (supported) {
    w.requestAnimationFrame = callback => { frames.set(++nextFrame, callback); return nextFrame; };
    w.cancelAnimationFrame = vi.fn(id => frames.delete(id));
  }
  Object.defineProperty(w, "scrollY", { get: () => y });
  Object.defineProperty(w, "scrollX", { value: 0 });
  Object.defineProperty(w, "innerWidth", { get: () => viewportWidth });
  Object.defineProperty(w, "innerHeight", { get: () => viewportHeight });
  Object.defineProperty(w.document.documentElement, "scrollHeight", { get: () => height });
  Object.defineProperty(w.document.body, "scrollHeight", { get: () => height });
  Object.defineProperty(w.document, "hidden", { get: () => hidden });
  w.scrollTo = vi.fn(options => { y = (options as ScrollToOptions).top!; });
  w.document.documentElement.style.scrollPaddingTop = "16px";
  const target = w.document.getElementById("esplora")!;
  target.style.scrollMarginTop = "8px";
  const rect = vi.fn(() => ({ top: targetTop - y }) as DOMRect);
  target.getBoundingClientRect = rect;
  const history = vi.spyOn(w.history, "pushState");
  const source = readFileSync(resolve(process.cwd(), site, "public/app.js"), "utf8");
  const start = source.indexOf("  function initHeroNavigation()");
  const end = source.indexOf("  initHeroNavigation();", start) + "  initHeroNavigation();".length;
  w.eval(source.slice(start, end));
  const click = (id = "cta", options: MouseEventInit = {}) => {
    const event = new w.MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...options });
    w.document.getElementById(id)!.dispatchEvent(event);
    return event;
  };
  const advance = (time: number) => {
    for (const [id, callback] of [...frames]) {
      frames.delete(id);
      callback(time);
    }
  };
  const pagehide = (persisted: boolean) => {
    const event = new w.Event("pagehide");
    Object.defineProperty(event, "persisted", { value: persisted });
    w.dispatchEvent(event);
  };
  const resize = (width: number, height: number) => {
    viewportWidth = width;
    viewportHeight = height;
    w.dispatchEvent(new w.Event("resize"));
  };
  return { w, frames, preference, listeners, target, rect, history, click, advance, pagehide, resize, position: () => y, setHeight: (value: number) => { height = value; }, setTarget: (value: number) => { targetTop = value; }, setHidden: () => { hidden = true; w.document.dispatchEvent(new w.Event("visibilitychange")); } };
}

describe.each(["services-site", "projects-site"])("%s deliberate hero navigation", site => {
  it.each(["cta", "cue"])("paces %s with a C2 quintic easing without per-frame layout reads", id => {
    const ui = setup(site);
    expect(ui.click(id).defaultPrevented).toBe(true);
    expect(ui.frames.size).toBe(1);
    const end = 800 - 16 - 8;
    const duration = 1300 + end * .8;
    ui.advance(0);
    ui.advance(duration / 4);
    expect(ui.position()).toBeCloseTo(end * .103515625);
    ui.advance(duration / 2);
    expect(ui.position()).toBeCloseTo(end / 2);
    ui.advance(duration * .75);
    expect(ui.position()).toBeCloseTo(end * .896484375);
    ui.advance(duration);
    expect(ui.position()).toBe(end);
    expect(ui.rect).toHaveBeenCalledTimes(1);
    expect(ui.frames.size).toBe(0);
    expect(ui.listeners.size).toBe(0);
    expect(ui.history).toHaveBeenCalledTimes(1);
    expect(ui.w.location.search).toBe("?preview=1");
    expect(ui.w.location.hash).toBe("#esplora");
    expect(ui.w.document.activeElement).toBe(ui.target.querySelector("h2"));
    expect(ui.target.querySelector("h2")!.getAttribute("tabindex")).toBe("-1");
    expect(ui.w.scrollTo).toHaveBeenLastCalledWith({ top: end, left: 0, behavior: "instant" });
  });

  it("preserves an existing destination tabindex and does not duplicate a matching hash", () => {
    const ui = setup(site);
    ui.target.querySelector("h2")!.tabIndex = 0;
    ui.w.history.replaceState(null, "", "#esplora");
    ui.click(); ui.advance(0); ui.advance(2200);
    expect(ui.history).not.toHaveBeenCalled();
    expect(ui.target.querySelector("h2")!.tabIndex).toBe(0);
  });

  it.each(["outside", "contact"])("leaves %s navigation unchanged", id => {
    const ui = setup(site);
    expect(ui.click(id).defaultPrevented).toBe(false);
    expect(ui.frames.size).toBe(0);
    expect(ui.w.scrollTo).not.toHaveBeenCalled();
  });

  it.each([{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { shiftKey: true }, { button: 1 }])("preserves browser modified-click semantics: %j", options => {
    const ui = setup(site);
    expect(ui.click("cta", options).defaultPrevented).toBe(false);
    expect(ui.frames.size).toBe(0);
  });

  it.each([["target", "_blank"], ["download", ""]])("does not intercept links with %s", (attribute, value) => {
    const ui = setup(site);
    ui.w.document.getElementById("cta")!.setAttribute(attribute, value);
    expect(ui.click().defaultPrevented).toBe(false);
    expect(ui.frames.size).toBe(0);
  });

  it.each([[true, true], [false, false]])("keeps native anchor fallback for reduced motion %s / frame support %s", (reduced, supported) => {
    const ui = setup(site, reduced, supported);
    expect(ui.click().defaultPrevented).toBe(false);
    expect(ui.frames.size).toBe(0);
    expect(ui.w.scrollTo).not.toHaveBeenCalled();
  });

  it.each(["wheel", "touchstart", "pointerdown", "keydown", "hashchange", "popstate"])("cancels immediately on %s without changing hash or focus", name => {
    const ui = setup(site);
    ui.click(); ui.advance(0); ui.advance(700);
    const before = ui.position();
    ui.w.dispatchEvent(new ui.w.Event(name));
    ui.advance(2200);
    expect(ui.position()).toBe(before);
    expect(ui.frames.size).toBe(0);
    expect(ui.listeners.size).toBe(0);
    expect(ui.history).not.toHaveBeenCalled();
    expect(ui.w.document.activeElement).toBe(ui.w.document.body);
  });

  it("cancels when mobile orientation changes the viewport width", () => {
    const ui = setup(site);
    ui.click(); ui.advance(0); ui.advance(700);
    const before = ui.position();
    ui.resize(844, 390); ui.advance(2200);
    expect(ui.position()).toBe(before);
    expect(ui.frames.size).toBe(0);
    expect(ui.listeners.size).toBe(0);
    expect(ui.history).not.toHaveBeenCalled();
  });

  it("continues through mobile browser-chrome height changes", () => {
    const ui = setup(site);
    ui.click(); ui.advance(0); ui.advance(700);
    ui.resize(390, 932);
    expect(ui.frames.size).toBe(1);
    ui.advance(2200);
    expect(ui.position()).toBe(776);
    expect(ui.history).toHaveBeenCalledTimes(1);
    expect(ui.rect).toHaveBeenCalledTimes(1);
  });

  it("cancels when a desktop window changes height", () => {
    const ui = setup(site);
    ui.resize(1440, 1000);
    ui.click(); ui.advance(0); ui.advance(700);
    const before = ui.position();
    ui.resize(1440, 900); ui.advance(2200);
    expect(ui.position()).toBe(before);
    expect(ui.frames.size).toBe(0);
    expect(ui.listeners.size).toBe(0);
    expect(ui.history).not.toHaveBeenCalled();
  });

  it("cancels when hidden or when reduced motion changes mid-flight", () => {
    for (const interrupt of ["hidden", "preference"]) {
      const ui = setup(site);
      ui.click(); ui.advance(0);
      if (interrupt === "hidden") ui.setHidden();
      else { ui.preference.matches = true; [...ui.listeners].forEach(listener => listener()); }
      expect(ui.frames.size).toBe(0);
      expect(ui.listeners.size).toBe(0);
      expect(ui.history).not.toHaveBeenCalled();
    }
  });

  it("keeps only one flight on rapid repeated clicks", () => {
    const ui = setup(site);
    ui.click(); ui.advance(0); ui.advance(700);
    ui.click("cue");
    expect(ui.frames.size).toBe(1);
    expect(ui.listeners.size).toBe(1);
    ui.advance(710); ui.advance(3000);
    expect(ui.position()).toBe(776);
    expect(ui.history).toHaveBeenCalledTimes(1);
    expect(ui.frames.size).toBe(0);
  });

  it("clamps to document limits and completes short distances without a flight", () => {
    const ui = setup(site);
    ui.setHeight(1500);
    ui.click(); ui.advance(0); ui.advance(2200);
    expect(ui.position()).toBe(656);
    ui.setTarget(-40);
    ui.click(); ui.advance(2300); ui.advance(4500);
    expect(ui.position()).toBe(0);
    ui.setTarget(24);
    ui.click();
    expect(ui.frames.size).toBe(0);
    expect(ui.position()).toBe(0);
  });

  it("cancels on BFCache suspension without resuming, but remains usable after restoration", () => {
    const ui = setup(site);
    ui.click(); ui.advance(0);
    ui.pagehide(true);
    expect(ui.frames.size).toBe(0);
    expect(ui.listeners.size).toBe(0);
    ui.advance(2200);
    expect(ui.history).not.toHaveBeenCalled();
    ui.click(); ui.advance(2300); ui.advance(4500);
    expect(ui.position()).toBe(776);
    expect(ui.history).toHaveBeenCalledTimes(1);
  });

  it("removes click listeners and pending work on real navigation", () => {
    const ui = setup(site);
    ui.click(); ui.advance(0);
    ui.pagehide(false);
    expect(ui.frames.size).toBe(0);
    expect(ui.listeners.size).toBe(0);
    expect(ui.click().defaultPrevented).toBe(false);
    expect(ui.frames.size).toBe(0);
  });
});
