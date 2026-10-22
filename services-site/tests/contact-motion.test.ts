import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";

const documents: JSDOM[] = [];
afterEach(async () => {
  // Flush native details toggle tasks before JSDOM removes its document.
  await new Promise(resolve => setTimeout(resolve, 0));
  documents.splice(0).forEach(dom => dom.window.close());
  vi.restoreAllMocks();
});

function setup(reduced = false) {
  const root = resolve(process.cwd(), "services-site/public");
  const dom = new JSDOM(readFileSync(resolve(root, "index.html"), "utf8"), { url: "http://localhost/", runScripts: "outside-only" });
  documents.push(dom);
  const w = dom.window;
  const mediaListeners = new Set<() => void>();
  const preference = { matches: reduced, addEventListener: (_: string, fn: () => void) => mediaListeners.add(fn), removeEventListener: (_: string, fn: () => void) => mediaListeners.delete(fn) };
  w.matchMedia = () => preference as unknown as MediaQueryList;
  w.fetch = vi.fn(async () => new Response("{}"));
  w.requestAnimationFrame = vi.fn(() => 0);
  w.cancelAnimationFrame = vi.fn();
  const panel = w.document.querySelector<HTMLDetailsElement>("[data-contact-panel]")!;
  const summary = panel.querySelector("summary")!;
  const reveal = w.document.getElementById("contact-reveal")!;
  const form = panel.querySelector("form")!;
  let naturalHeight = 500;
  const rect = (height: number) => ({ height, top: 0, bottom: height, left: 0, right: 340, width: 340, x: 0, y: 0, toJSON() {} }) as DOMRect;
  form.getBoundingClientRect = () => rect(naturalHeight);
  reveal.getBoundingClientRect = () => rect(parseFloat(reveal.style.height) || 0);
  const observers: Array<{ callback: () => void; observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }> = [];
  w.ResizeObserver = class {
    observe = vi.fn(); disconnect = vi.fn(); unobserve = vi.fn();
    constructor(callback: () => void) { observers.push({ callback, observe: this.observe, disconnect: this.disconnect }); }
  } as unknown as typeof ResizeObserver;
  const animations: Array<{ element: HTMLElement; frames: Keyframe[]; options: KeyframeAnimationOptions; canceled: boolean; onfinish: (() => void) | null; cancel: () => void; finish: () => void }> = [];
  w.HTMLElement.prototype.animate = function(frames, options) {
    const listeners: Record<string, Array<() => void>> = {};
    const animation = {
      element: this, frames: frames as Keyframe[], options: options as KeyframeAnimationOptions, canceled: false, onfinish: null as (() => void) | null,
      addEventListener(event: string, fn: () => void) { (listeners[event] ||= []).push(fn); },
      cancel() { this.canceled = true; listeners.cancel?.forEach(fn => fn()); },
      finish() { if (this.canceled) return; listeners.finish?.forEach(fn => fn()); this.onfinish?.(); },
    };
    animations.push(animation);
    return animation as unknown as Animation;
  };
  w.eval(readFileSync(resolve(root, "app.js"), "utf8"));
  const heights = () => animations.filter(a => a.element === reveal);
  const finish = () => animations.filter(a => !a.canceled).forEach(a => a.finish());
  const resize = (height: number) => { naturalHeight = height; observers.forEach(o => o.callback()); };
  return { w, panel, summary, reveal, form, preference, mediaListeners, observers, animations, heights, finish, resize };
}

describe("Premium contact reveal", () => {
  it("measures opening, staggers content and closes without keeping controls accessible", () => {
    const ui = setup();
    expect(ui.summary.getAttribute("aria-controls")).toBe("contact-reveal");
    expect(ui.reveal.hasAttribute("inert")).toBe(true);
    ui.summary.click();
    expect(ui.panel.open).toBe(true);
    expect(ui.summary.getAttribute("aria-expanded")).toBe("true");
    expect(ui.heights().at(-1)!.options.duration).toBe(400);
    expect(ui.heights().at(-1)!.frames).toEqual([{ height: "0px" }, { height: "500px" }]);
    const entries = ui.animations.filter(a => a.options.fill === "backwards");
    expect(entries.length).toBeGreaterThan(5);
    expect(entries.map(a => a.options.delay)).toEqual([...entries.map(a => a.options.delay)].sort((a, b) => Number(a) - Number(b)));
    ui.finish();
    ui.summary.click();
    expect(ui.panel.open).toBe(true);
    expect(ui.summary.getAttribute("aria-expanded")).toBe("false");
    expect(ui.reveal.hasAttribute("inert")).toBe(true);
    expect(ui.heights().at(-1)!.options.duration).toBe(300);
    ui.finish();
    expect(ui.panel.open).toBe(false);
    expect(ui.reveal.style.height).toBe("0px");
  });

  it("retargets repeated rapid toggles and ignores the queued native toggle while closing", () => {
    const ui = setup();
    ui.summary.click(); ui.summary.click();
    ui.panel.dispatchEvent(new ui.w.Event("toggle"));
    expect(ui.summary.getAttribute("aria-expanded")).toBe("false");
    ui.summary.click(); ui.summary.click(); ui.summary.click();
    ui.finish();
    expect(ui.panel.open).toBe(true);
    expect(ui.summary.getAttribute("aria-expanded")).toBe("true");
    expect(ui.reveal.hasAttribute("inert")).toBe(false);
    expect(ui.heights().filter(a => !a.canceled)).toHaveLength(0);
  });

  it("animates real content growth, including errors and textarea resizing", () => {
    const ui = setup();
    ui.summary.click(); ui.finish();
    ui.resize(735);
    expect(ui.heights().at(-1)!.frames).toEqual([{ height: "500px" }, { height: "735px" }]);
    ui.finish();
    expect(ui.reveal.style.height).toBe("735px");
    ui.resize(460); ui.finish();
    expect(ui.reveal.style.height).toBe("460px");
  });

  it("reverses step direction, preserves drafts, keeps outgoing controls inert and restores focus", () => {
    const ui = setup();
    ui.summary.click(); ui.finish();
    const radio = ui.form.querySelector<HTMLInputElement>('[name="need"]')!;
    radio.click();
    ui.form.querySelector<HTMLButtonElement>("[data-step-next]")!.click();
    expect(ui.panel.dataset.step).toBe("1");
    expect(ui.form.querySelector('[data-form-step="0"]')!.hasAttribute("inert")).toBe(true);
    expect(ui.animations.at(-1)!.frames[0].transform).toBe("translateX(16px)");
    expect(ui.w.document.activeElement?.tagName).toBe("H3");
    ui.finish();
    const message = ui.form.elements.namedItem("message") as HTMLTextAreaElement;
    message.value = "Una bozza da conservare durante ogni transizione.";
    ui.form.querySelector<HTMLButtonElement>("[data-step-next]")!.click();
    ui.form.querySelector<HTMLButtonElement>("[data-step-back]")!.click();
    expect(ui.animations.at(-1)!.frames[0].transform).toBe("translateX(-16px)");
    ui.finish();
    expect(message.value).toBe("Una bozza da conservare durante ogni transizione.");
    ui.summary.click(); ui.finish(); ui.summary.click(); ui.finish();
    expect(ui.panel.dataset.step).toBe("1");
    expect(radio.checked).toBe(true);
    expect(message.value).toContain("Una bozza");
    expect(ui.form.querySelectorAll('[data-form-step]:not([hidden])')).toHaveLength(1);
  });

  it("does not bypass validation and keeps the selection single", () => {
    const ui = setup();
    ui.summary.click(); ui.finish();
    ui.form.querySelector<HTMLButtonElement>("[data-step-next]")!.click();
    expect(ui.panel.dataset.step).toBe("0");
    expect(ui.form.querySelector('[name="need"]')!.getAttribute("aria-invalid")).toBe("true");
    const radios = ui.form.querySelectorAll<HTMLInputElement>('[name="need"]');
    radios[0].click(); radios[1].click();
    expect(ui.form.querySelectorAll('[name="need"]:checked')).toHaveLength(1);
    expect(radios[1].checked).toBe(true);
  });

  it("opens from contextual CTAs without replaying the first step", () => {
    const ui = setup();
    ui.w.document.querySelector<HTMLAnchorElement>('.service a[href="#contatti"].button')!.click();
    expect(ui.panel.open).toBe(true);
    expect(ui.panel.dataset.step).toBe("1");
    expect(ui.reveal.hasAttribute("inert")).toBe(false);
    expect(ui.form.querySelectorAll('[name="need"]:checked')).toHaveLength(1);
  });

  it("honors reduced motion immediately and responds to preference changes", () => {
    const ui = setup(true);
    ui.summary.click();
    expect(ui.panel.open).toBe(true);
    expect(ui.animations).toHaveLength(0);
    ui.summary.click();
    expect(ui.panel.open).toBe(false);
    ui.preference.matches = false;
    ui.summary.click();
    expect(ui.animations.length).toBeGreaterThan(0);
    ui.preference.matches = true;
    ui.mediaListeners.forEach(fn => fn());
    expect(ui.reveal.style.height).toBe("500px");
    expect(ui.animations.every(a => a.canceled)).toBe(true);
  });

  it("disconnects observers and animations on pagehide, then restores bfcache observation", () => {
    const ui = setup();
    ui.summary.click();
    const contactObserver = ui.observers.find(o => o.observe.mock.calls.some(([element]) => element === ui.form))!;
    const previousListeners = ui.mediaListeners.size;
    ui.w.dispatchEvent(new ui.w.Event("pagehide"));
    expect(contactObserver.disconnect).toHaveBeenCalledOnce();
    expect(ui.animations.every(a => a.canceled)).toBe(true);
    expect(ui.mediaListeners.size).toBe(previousListeners - 1);
    ui.w.dispatchEvent(new ui.w.PageTransitionEvent("pageshow", { persisted: true }));
    expect(ui.mediaListeners.size).toBe(previousListeners);
    expect(contactObserver.observe).toHaveBeenCalledTimes(2);
  });
});
