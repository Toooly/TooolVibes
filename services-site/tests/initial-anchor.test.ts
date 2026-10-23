import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";

const documents: JSDOM[] = [];
afterEach(() => documents.splice(0).forEach(dom => dom.window.close()));

function setup(site: string, hash = "#servizi", navigation = "reload", top = 1909) {
  const root = resolve(process.cwd(), site, "public");
  const dom = new JSDOM(readFileSync(resolve(root, "index.html"), "utf8"), {
    url: `https://${site === "services-site" ? "servizi" : "progetti"}.tooolvibes.eu/${hash}`,
    runScripts: "outside-only", pretendToBeVisual: true,
  });
  documents.push(dom);
  const w = dom.window;
  Object.defineProperty(w.document, "readyState", { configurable: true, value: "loading" });
  Object.defineProperty(w.performance, "getEntriesByType", { value: () => [{ type: navigation }] });
  let resolveFonts = () => {};
  Object.defineProperty(w.document, "fonts", { value: { ready: new Promise<void>(resolve => { resolveFonts = resolve; }) } });
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;
  w.requestAnimationFrame = callback => { frames.set(++nextFrame, callback); return nextFrame; };
  w.cancelAnimationFrame = vi.fn(id => frames.delete(id));
  w.document.documentElement.style.scrollPaddingTop = "16px";
  const scroll = vi.fn();
  w.Element.prototype.scrollIntoView = scroll;
  for (const target of w.document.querySelectorAll("section[id],main[id],details[data-contact-panel][id]")) {
    target.getBoundingClientRect = () => ({ top }) as DOMRect;
  }
  const source = readFileSync(resolve(root, "app.js"), "utf8");
  const start = source.indexOf("  function initInitialAnchor()");
  const end = source.indexOf("  initInitialAnchor();", start) + "  initInitialAnchor();".length;
  expect(start).toBeGreaterThanOrEqual(0);
  w.eval(source.slice(start, end));
  const load = () => {
    Object.defineProperty(w.document, "readyState", { configurable: true, value: "complete" });
    w.dispatchEvent(new w.Event("load"));
  };
  const fonts = async () => { resolveFonts(); await Promise.resolve(); };
  const frame = () => {
    const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(0));
  };
  const settle = async () => { load(); await fonts(); frame(); frame(); };
  return { w, scroll, frames, load, fonts, frame, settle };
}

describe.each(["services-site", "projects-site"])("%s one-shot initial fragment alignment", site => {
  it("waits for both load and fonts, then two layout frames before correcting the fragment", async () => {
    const ui = setup(site);
    await ui.fonts(); ui.frame(); ui.frame();
    expect(ui.scroll).not.toHaveBeenCalled();
    ui.load(); ui.frame();
    expect(ui.scroll).not.toHaveBeenCalled();
    ui.frame();
    expect(ui.scroll).toHaveBeenCalledExactlyOnceWith({ block: "start", behavior: "instant" });
    expect(ui.w.document.activeElement).toBe(ui.w.document.body);
    expect(ui.w.location.hash).toBe("#servizi");
    ui.w.dispatchEvent(new ui.w.Event("resize")); ui.load(); ui.frame(); ui.frame();
    expect(ui.scroll).toHaveBeenCalledTimes(1);
  });

  it("aligns only the matching initial service, method or contact target without opening or resetting the form", async () => {
    const hashes = site === "services-site" ? ["#servizi", "#contenuti", "#chatbot", "#processo", "#contatti"] : ["#servizi", "#app", "#software", "#processo", "#contatti"];
    for (const hash of hashes) {
      const ui = setup(site, hash, "navigate");
      const field = ui.w.document.querySelector<HTMLInputElement>('[name="name"]')!;
      const panel = ui.w.document.querySelector<HTMLDetailsElement>("[data-contact-panel]")!;
      field.value = "Test preservazione";
      const open = panel.open;
      await ui.settle();
      expect((ui.scroll.mock.contexts[0] as Element | undefined)?.id, hash).toBe(hash.slice(1));
      expect(field.value).toBe("Test preservazione");
      expect(panel.open).toBe(open);
      expect(ui.w.document.activeElement?.tagName, hash).toBe("BODY");
    }
  });

  it.each(["wheel", "touchstart", "pointerdown", "keydown"])("cancels if the user interacts through %s before alignment", async event => {
    const ui = setup(site);
    ui.w.dispatchEvent(new ui.w.Event(event));
    await ui.settle();
    expect(ui.scroll).not.toHaveBeenCalled();
    expect(ui.frames.size).toBe(0);
  });

  it("cancels when the user focuses the form and preserves that focus", async () => {
    const ui = setup(site);
    const field = ui.w.document.querySelector<HTMLInputElement>('[name="name"]')!;
    field.focus();
    await ui.settle();
    expect(ui.scroll).not.toHaveBeenCalled();
    expect(ui.w.document.activeElement).toBe(field);
  });

  it("does not override a changed hash or a persisted back-forward suspension", async () => {
    const changed = setup(site);
    changed.w.history.replaceState(null, "", "#processo");
    await changed.settle();
    expect(changed.scroll).not.toHaveBeenCalled();
    const suspended = setup(site);
    suspended.load(); await suspended.fonts();
    expect(suspended.frames.size).toBe(1);
    const event = new suspended.w.Event("pagehide");
    Object.defineProperty(event, "persisted", { value: true });
    suspended.w.dispatchEvent(event);
    suspended.frame(); suspended.frame();
    expect(suspended.scroll).not.toHaveBeenCalled();
    expect(suspended.frames.size).toBe(0);
    const restored = setup(site, "#servizi", "back_forward");
    await restored.settle();
    expect(restored.scroll).not.toHaveBeenCalled();
  });

  it("does nothing for aligned, missing, malformed or interactive fragment targets", async () => {
    const aligned = setup(site, "#servizi", "reload", 16);
    await aligned.settle();
    expect(aligned.scroll).not.toHaveBeenCalled();
    for (const hash of ["", "#unknown", "#%E0%A4%A", "#name"]) {
      const ui = setup(site, hash);
      await ui.settle();
      expect(ui.scroll).not.toHaveBeenCalled();
      expect(ui.frames.size).toBe(0);
    }
  });
});

function setupMenu(site: string) {
  const root = resolve(process.cwd(), site, "public");
  const dom = new JSDOM(readFileSync(resolve(root, "index.html"), "utf8"), { runScripts: "outside-only", pretendToBeVisual: true });
  documents.push(dom);
  const w = dom.window;
  const source = readFileSync(resolve(root, "app.js"), "utf8");
  const start = source.indexOf("  function setMenu(");
  const end = source.indexOf("  const serviceScreens =", start);
  w.eval(`const menuToggle = document.querySelector('[data-menu-toggle]'); const mobileNav = document.querySelector('[data-mobile-nav]');\n${source.slice(start, end)}`);
  const toggle = w.document.querySelector<HTMLButtonElement>("[data-menu-toggle]")!;
  const menu = w.document.querySelector<HTMLElement>("[data-mobile-nav]")!;
  const focus = vi.spyOn(toggle, "focus");
  return { w, toggle, menu, focus };
}

describe.each(["services-site", "projects-site"])("%s mobile menu keyboard focus", site => {
  it("closes an open menu with Escape and returns focus to its toggle without scrolling", () => {
    const ui = setupMenu(site);
    ui.toggle.click();
    const link = ui.menu.querySelector<HTMLAnchorElement>("a")!;
    link.focus();
    link.dispatchEvent(new ui.w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(ui.menu.hidden).toBe(true);
    expect(ui.toggle.getAttribute("aria-expanded")).toBe("false");
    expect(ui.w.document.activeElement).toBe(ui.toggle);
    expect(ui.focus).toHaveBeenCalledExactlyOnceWith({ preventScroll: true });
  });

  it("leaves form focus untouched when Escape is pressed while the menu is closed", () => {
    const ui = setupMenu(site);
    const field = ui.w.document.querySelector<HTMLInputElement>('[name="name"]')!;
    field.focus();
    field.dispatchEvent(new ui.w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(ui.menu.hidden).toBe(true);
    expect(ui.w.document.activeElement).toBe(field);
    expect(ui.focus).not.toHaveBeenCalled();
  });

  it("does not close the menu or move focus for unrelated keys", () => {
    const ui = setupMenu(site);
    ui.toggle.click();
    const link = ui.menu.querySelector<HTMLAnchorElement>("a")!;
    link.focus();
    link.dispatchEvent(new ui.w.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    expect(ui.menu.hidden).toBe(false);
    expect(ui.toggle.getAttribute("aria-expanded")).toBe("true");
    expect(ui.w.document.activeElement).toBe(link);
    expect(ui.focus).not.toHaveBeenCalled();
  });
});
