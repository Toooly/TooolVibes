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

function setup(storage: "new" | "seen" | "dismissed" | "blocked" = "new", observerAvailable = true) {
  vi.useFakeTimers();
  const start = Date.now();
  const dom = new JSDOM(readFileSync(resolve(root, "index.html"), "utf8"), {
    url: "https://servizi.tooolvibes.eu", runScripts: "outside-only", pretendToBeVisual: true,
  });
  documents.push(dom);
  const w = dom.window;
  w.matchMedia = () => ({ matches: true, addEventListener() {} }) as unknown as MediaQueryList;
  w.fetch = vi.fn(async () => new Response(null, { status: 204 }));
  vi.spyOn(w.performance, "now").mockImplementation(() => Date.now() - start);
  vi.spyOn(w.Date, "now").mockImplementation(() => Date.now());
  const observers: Array<{ callback: (entries: unknown[]) => void; targets: Element[]; options?: IntersectionObserverInit }> = [];
  if (observerAvailable) w.IntersectionObserver = class {
    targets: Element[] = [];
    constructor(readonly callback: (entries: unknown[]) => void, readonly options?: IntersectionObserverInit) { observers.push(this); }
    observe(target: Element) { this.targets.push(target); }
    unobserve() {}
  } as unknown as typeof IntersectionObserver;
  if (storage === "seen") w.sessionStorage.setItem("services-availability-seen", "1");
  if (storage === "dismissed") w.sessionStorage.setItem("services-availability-dismissed-until", String(start + 900_000));
  if (storage === "blocked") {
    vi.spyOn(w.Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Storage disabled"); });
    vi.spyOn(w.Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage disabled"); });
  }
  w.eval(readFileSync(resolve(root, "app.js"), "utf8"));
  const notice = w.document.querySelector<HTMLElement>("[data-availability-notice]")!;
  const launcher = w.document.querySelector<HTMLButtonElement>("[data-notice-launcher]")!;
  const serviceObserver = observers.find((observer) => observer.options?.rootMargin === "-15% 0px -15% 0px");
  const blockerObserver = observers.find((observer) => observer.targets.includes(w.document.querySelector(".contact")!));
  const service = (kind: string) => w.document.querySelector(`.service[data-service="${kind}"]`)!;
  const enter = (kind = "web", isIntersecting = true) => serviceObserver?.callback([{ target: service(kind), isIntersecting }]);
  const block = (selector: string, isIntersecting: boolean) => blockerObserver?.callback([{ target: w.document.querySelector(selector), isIntersecting }]);
  const advance = (ms = 8_001) => vi.advanceTimersByTime(ms);
  return { w, notice, launcher, enter, block, advance, service, serviceObserver };
}

describe("Contextual availability notice", () => {
  it("waits for engagement, stays absent in the hero and uses existing availability only", () => {
    const ui = setup();
    ui.advance();
    expect(ui.notice.hidden).toBe(true);
    expect(ui.launcher.hidden).toBe(false);
    ui.enter();
    ui.advance(1_499);
    expect(ui.notice.hidden).toBe(true);
    ui.advance(2);
    expect(ui.notice.hidden).toBe(false);
    expect(ui.notice.textContent).toContain("1 posto per il tuo sito");
    expect(ui.notice.textContent).toContain("Seguiamo fino a 5 nuovi siti al mese.");
    expect(ui.notice.textContent).not.toMatch(/acquistato|prenotato|pochi minuti|persone online/i);
    expect(ui.launcher.hidden).toBe(true);
  });

  it.each(["web", "social", "ai"])("keeps %s data, accent and form context in sync", (kind) => {
    const ui = setup();
    ui.enter(kind);
    ui.advance();
    expect(ui.notice.hidden).toBe(false);
    expect(ui.notice.dataset.service).toBe(kind);
    expect(ui.notice.dataset.available).toBe(kind === "web" ? "1" : kind === "social" ? "3" : "request");
    expect(ui.launcher.dataset.available).toBe(ui.notice.dataset.available);
    const source = ui.service(kind).querySelector(".service-capacity small b")!;
    expect(ui.notice.querySelector("[data-notice-title]")!.textContent).toBe(source.textContent);
    expect(ui.notice.querySelectorAll("[data-notice-slots] i:not(.is-assigned)")).toHaveLength(kind === "web" ? 1 : kind === "social" ? 3 : 0);
    ui.notice.querySelector<HTMLAnchorElement>("[data-notice-cta]")!.click();
    expect(ui.notice.hidden).toBe(true);
    const panel = ui.w.document.querySelector<HTMLDetailsElement>("[data-contact-panel]")!;
    expect(panel.open).toBe(true);
    expect(panel.dataset.step).toBe("1");
    expect(ui.w.document.querySelector<HTMLInputElement>('[name="need"]:checked')!.value).toBe(kind === "ai" ? "automation" : kind);
    expect(ui.w.fetch).not.toHaveBeenCalledWith("/api/contact", expect.anything());
  });

  it("does not cover the contact section, guided method or footer", () => {
    const ui = setup();
    ui.enter();
    for (const selector of [".contact", ".method-frame", ".site-footer"]) {
      ui.block(selector, true);
      ui.advance();
      expect(ui.notice.hidden).toBe(true);
      ui.block(selector, false);
    }
    ui.advance(1_501);
    expect(ui.notice.hidden).toBe(false);
    ui.block(".contact", true);
    expect(ui.notice.hidden).toBe(true);
    ui.block(".contact", false);
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
    ui.advance(1_501);
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
    expect(ui.w.document.activeElement).toBe(ui.launcher);
    ui.enter("social");
    ui.advance();
    expect(ui.notice.hidden).toBe(true);
  });

  it("expires to the launcher and does not exclude returning visitors with the old seen flag", () => {
    const ui = setup();
    ui.enter();
    ui.advance();
    expect(ui.notice.hidden).toBe(false);
    ui.advance(16_001);
    expect(ui.notice.hidden).toBe(true);
    const revisited = setup("seen");
    revisited.enter(); revisited.advance();
    expect(revisited.notice.hidden).toBe(false);
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
    ui.advance(1_501);
    expect(ui.notice.hidden).toBe(false);
  });

  it("keeps manual access working without storage or IntersectionObserver and adds no network requests", () => {
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
    expect(unsupported.launcher.hidden).toBe(false);
    unsupported.launcher.click();
    expect(unsupported.notice.hidden).toBe(false);
  });

  it("can be reopened after dismissal, including a preference remembered from an earlier visit", () => {
    const ui = setup("dismissed");
    ui.enter(); ui.advance();
    expect(ui.notice.hidden).toBe(true);
    expect(ui.launcher.hidden).toBe(false);
    ui.launcher.click();
    expect(ui.notice.hidden).toBe(false);
    expect(ui.launcher.getAttribute("aria-expanded")).toBe("true");
    ui.notice.querySelector<HTMLButtonElement>("[data-notice-close]")!.click();
    expect(ui.w.document.activeElement).toBe(ui.launcher);
    ui.launcher.click();
    expect(ui.notice.hidden).toBe(false);
  });

  it("starts in the explorer rather than waiting until the complete service sections", () => {
    const ui = setup();
    const journey = ui.w.document.querySelector<HTMLElement>("[data-journey]")!;
    journey.dataset.active = "social";
    ui.serviceObserver!.callback([{ target: journey, isIntersecting: true }]);
    ui.advance();
    expect(ui.notice.hidden).toBe(false);
    expect(ui.notice.dataset.service).toBe("social");
  });

  it("limits automatic appearances to two services with at least 45 seconds between them", () => {
    const ui = setup();
    ui.enter(); ui.advance(8_000);
    expect(ui.notice.hidden).toBe(false);
    ui.advance(16_001);
    expect(ui.notice.hidden).toBe(true);
    ui.enter("social"); ui.advance(28_998);
    expect(ui.notice.hidden).toBe(true);
    ui.advance(2);
    expect(ui.notice.hidden).toBe(false);
    expect(ui.notice.dataset.service).toBe("social");
    ui.advance(16_001); ui.enter("ai"); ui.advance(60_000);
    expect(ui.notice.hidden).toBe(true);
    ui.launcher.click();
    expect(ui.notice.dataset.service).toBe("ai");
    expect(ui.notice.hidden).toBe(false);
  });

  it("uses the visible service rather than the explorer when both cross the viewport boundary", () => {
    const ui = setup();
    const journey = ui.w.document.querySelector<HTMLElement>("[data-journey]")!;
    journey.dataset.active = "ai";
    ui.serviceObserver!.callback([{ target: journey, isIntersecting: true }, { target: ui.service("web"), isIntersecting: true }]);
    ui.advance();
    expect(ui.notice.dataset.service).toBe("web");
  });

  it("updates the launcher name and accent for each service and explorer phase", () => {
    const ui = setup("dismissed");
    for (const kind of ["web", "social", "ai"]) {
      ui.enter(kind); ui.advance();
      expect(ui.launcher.hidden).toBe(false);
      expect(ui.launcher.dataset.service).toBe(kind);
      expect(ui.launcher.dataset.available).toBe(kind === "web" ? "1" : kind === "social" ? "3" : "request");
      expect(ui.launcher.querySelector("[data-launcher-service]")!.textContent).toBe(ui.service(kind).querySelector(".service-offer__label")!.textContent);
      ui.enter(kind, false);
    }
    const journey = ui.w.document.querySelector<HTMLElement>("[data-journey]")!;
    ui.serviceObserver!.callback([{ target: journey, isIntersecting: true }]);
    for (const kind of ["social", "ai", "web"]) {
      journey.querySelector<HTMLButtonElement>(`[data-journey-select="${kind}"]`)!.click();
      expect(ui.launcher.dataset.service).toBe(kind);
    }
    expect(ui.w.fetch).not.toHaveBeenCalled();
  });

  it("keeps the next visible section context when resize re-enters a preceding section", () => {
    const ui = setup("dismissed");
    ui.enter("social"); ui.advance();
    ui.enter("web");
    expect(ui.launcher.dataset.service).toBe("social");
    ui.launcher.click();
    expect(ui.notice.dataset.service).toBe("social");
  });
});
