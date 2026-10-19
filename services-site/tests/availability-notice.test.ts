import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";

const root = resolve(process.cwd(), "services-site/public");
const documents: JSDOM[] = [];
afterEach(() => {
  documents.splice(0).forEach((dom) => dom.window.close());
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function setup(storage: "new" | "seen" | "blocked" = "new", observerAvailable = true) {
  vi.useFakeTimers();
  const dom = new JSDOM(readFileSync(resolve(root, "index.html"), "utf8"), {
    url: "https://servizi.tooolvibes.eu", runScripts: "outside-only", pretendToBeVisual: true,
  });
  documents.push(dom);
  const w = dom.window;
  w.matchMedia = () => ({ matches: true, addEventListener() {} }) as unknown as MediaQueryList;
  w.fetch = vi.fn(async () => new Response(null, { status: 204 }));
  const observers: Array<{ callback: (entries: unknown[]) => void; targets: Element[]; options?: IntersectionObserverInit }> = [];
  if (observerAvailable) w.IntersectionObserver = class {
    targets: Element[] = [];
    constructor(readonly callback: (entries: unknown[]) => void, readonly options?: IntersectionObserverInit) { observers.push(this); }
    observe(target: Element) { this.targets.push(target); }
    unobserve() {}
  } as unknown as typeof IntersectionObserver;
  if (storage === "seen") w.sessionStorage.setItem("services-availability-seen", "1");
  if (storage === "blocked") {
    vi.spyOn(w.Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Storage disabled"); });
    vi.spyOn(w.Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage disabled"); });
  }
  w.eval(readFileSync(resolve(root, "app.js"), "utf8"));
  const notice = w.document.querySelector<HTMLElement>("[data-availability-notice]")!;
  const serviceObserver = observers.find((observer) => observer.options?.rootMargin === "-20% 0px -35% 0px");
  const blockerObserver = observers.find((observer) => observer.targets.includes(w.document.querySelector("#contatti")!));
  const service = (kind: string) => w.document.querySelector(`[data-service="${kind}"]`)!;
  const enter = (kind = "web", isIntersecting = true) => serviceObserver?.callback([{ target: service(kind), isIntersecting }]);
  const block = (selector: string, isIntersecting: boolean) => blockerObserver?.callback([{ target: w.document.querySelector(selector), isIntersecting }]);
  const advance = (ms = 21_000) => vi.advanceTimersByTime(ms);
  return { w, notice, enter, block, advance, service };
}

describe("Contextual availability notice", () => {
  it("waits for engagement, stays absent in the hero and uses existing availability only", () => {
    const ui = setup();
    ui.advance();
    expect(ui.notice.hidden).toBe(true);
    ui.enter();
    ui.advance(4_999);
    expect(ui.notice.hidden).toBe(true);
    ui.advance(2);
    expect(ui.notice.hidden).toBe(false);
    expect(ui.notice.textContent).toContain("1 sito disponibile");
    expect(ui.notice.textContent).toContain("Fino a 5 nuovi siti al mese.");
    expect(ui.notice.textContent).not.toMatch(/acquistato|prenotato|pochi minuti|persone online/i);
    expect(ui.w.sessionStorage.getItem("services-availability-seen")).toBe("1");
  });

  it.each(["web", "social", "ai"])("keeps %s data, accent and form context in sync", (kind) => {
    const ui = setup();
    ui.enter(kind);
    ui.advance();
    expect(ui.notice.hidden).toBe(false);
    expect(ui.notice.dataset.service).toBe(kind);
    const source = ui.service(kind).querySelector(".service-capacity small b")!;
    expect(ui.notice.querySelector("[data-notice-title]")!.textContent).toBe(source.textContent);
    ui.notice.querySelector<HTMLAnchorElement>("[data-notice-cta]")!.click();
    expect(ui.notice.hidden).toBe(true);
    const panel = ui.w.document.querySelector<HTMLDetailsElement>("[data-contact-panel]")!;
    expect(panel.open).toBe(true);
    expect(panel.dataset.step).toBe("1");
    expect(ui.w.document.querySelector<HTMLInputElement>('[name="need"]:checked')!.value).toBe(kind === "ai" ? "automation" : kind);
    expect(ui.w.fetch).not.toHaveBeenCalledWith("/api/contact", expect.anything());
  });

  it("does not show against visible pricing actions, contact section or footer", () => {
    const ui = setup();
    ui.enter();
    for (const selector of [".service-offer .button", "#contatti", ".site-footer"]) {
      ui.block(selector, true);
      ui.advance();
      expect(ui.notice.hidden).toBe(true);
      ui.block(selector, false);
    }
    ui.advance(5_001);
    expect(ui.notice.hidden).toBe(false);
    ui.block("#contatti", true);
    expect(ui.notice.hidden).toBe(true);
    ui.block("#contatti", false);
    ui.advance();
    expect(ui.notice.hidden).toBe(true);
  });

  it("suppresses the notification for open navigation and form input", () => {
    const ui = setup();
    const menu = ui.w.document.querySelector<HTMLButtonElement>("[data-menu-toggle]")!;
    menu.click();
    ui.enter();
    ui.advance();
    expect(ui.notice.hidden).toBe(true);
    menu.click();
    ui.advance(5_001);
    expect(ui.notice.hidden).toBe(false);
    ui.w.document.querySelector<HTMLInputElement>('[name="name"]')!.focus();
    expect(ui.notice.hidden).toBe(true);
  });

  it("supports keyboard dismissal and never interrupts focus or reappears", () => {
    const ui = setup();
    const initialFocus = ui.w.document.activeElement;
    ui.enter();
    ui.advance();
    expect(ui.w.document.activeElement).toBe(initialFocus);
    const close = ui.notice.querySelector<HTMLButtonElement>("[data-notice-close]")!;
    close.focus();
    ui.advance(15_000);
    expect(ui.notice.hidden).toBe(false);
    close.dispatchEvent(new ui.w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(ui.notice.hidden).toBe(true);
    expect(ui.w.document.activeElement).toBe(ui.service("web").querySelector("h2"));
    ui.enter("social");
    ui.advance();
    expect(ui.notice.hidden).toBe(true);
  });

  it("expires once and respects the session limit after reload", () => {
    const ui = setup();
    ui.enter();
    ui.advance();
    expect(ui.notice.hidden).toBe(false);
    ui.advance(12_001);
    expect(ui.notice.hidden).toBe(true);
    const revisited = setup("seen");
    revisited.enter(); revisited.advance();
    expect(revisited.notice.hidden).toBe(true);
  });

  it("cancels stale pending notices and suppresses hidden-tab interruptions", () => {
    const ui = setup();
    ui.enter(); ui.enter("web", false); ui.advance();
    expect(ui.notice.hidden).toBe(true);
    Object.defineProperty(ui.w.document, "hidden", { configurable: true, value: true });
    ui.enter("social"); ui.advance();
    expect(ui.notice.hidden).toBe(true);
    Object.defineProperty(ui.w.document, "hidden", { configurable: true, value: false });
    ui.w.document.dispatchEvent(new ui.w.Event("visibilitychange"));
    ui.advance(5_001);
    expect(ui.notice.hidden).toBe(false);
  });

  it("fails quietly without storage or IntersectionObserver and adds no network requests", () => {
    const ui = setup("blocked");
    ui.enter(); ui.advance();
    expect(ui.notice.hidden).toBe(false);
    ui.notice.querySelector<HTMLButtonElement>("[data-notice-close]")!.click();
    ui.enter("social"); ui.advance();
    expect(ui.notice.hidden).toBe(true);
    expect(ui.w.fetch).not.toHaveBeenCalled();
    const unsupported = setup("new", false);
    unsupported.advance();
    expect(unsupported.notice.hidden).toBe(true);
  });
});
