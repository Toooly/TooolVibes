import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";

const documents: JSDOM[] = [];
afterEach(() => {
  documents.splice(0).forEach(dom => dom.window.close());
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function setup(site: string, hash = "", observerAvailable = true, dismissed = false) {
  vi.useFakeTimers();
  const started = Date.now();
  const root = resolve(process.cwd(), site, "public");
  const dom = new JSDOM(readFileSync(resolve(root, "index.html"), "utf8"), {
    url: `https://${site === "services-site" ? "servizi" : "progetti"}.tooolvibes.eu/${hash}`,
    runScripts: "outside-only", pretendToBeVisual: true,
  });
  documents.push(dom);
  const w = dom.window;
  vi.spyOn(w.performance, "now").mockImplementation(() => Date.now() - started);
  vi.spyOn(w.Date, "now").mockImplementation(() => Date.now());
  const observers: Array<{ callback: (entries: Array<{ target: Element; isIntersecting: boolean }>) => void; targets: Element[]; options?: IntersectionObserverInit }> = [];
  if (observerAvailable) w.IntersectionObserver = class {
    targets: Element[] = [];
    constructor(readonly callback: (entries: Array<{ target: Element; isIntersecting: boolean }>) => void, readonly options?: IntersectionObserverInit) { observers.push(this); }
    observe(target: Element) { this.targets.push(target); }
  } as unknown as typeof IntersectionObserver;
  if (dismissed) w.sessionStorage.setItem(`${site === "services-site" ? "services" : "projects"}-availability-dismissed-until`, String(started + 900_000));
  w.fetch = vi.fn();
  const source = readFileSync(resolve(root, "app.js"), "utf8");
  const start = source.indexOf("  function initAvailabilityNotice()");
  const end = source.indexOf("  initAvailabilityNotice();", start) + "  initAvailabilityNotice();".length;
  w.eval(`const menuToggle = document.querySelector('[data-menu-toggle]');\n${source.slice(start, end)}`);
  const services = [...w.document.querySelectorAll<HTMLElement>("section.service[data-service]")];
  const notice = w.document.querySelector<HTMLElement>("[data-availability-notice]")!;
  const launcher = w.document.querySelector<HTMLButtonElement>("[data-notice-launcher]")!;
  const serviceObserver = observers.find(observer => observer.options?.rootMargin === "-15% 0px -15% 0px");
  const blockerObserver = observers.find(observer => observer.targets.includes(w.document.querySelector(".contact")!));
  const enter = (index: number, isIntersecting = true) => serviceObserver?.callback([{ target: services[index], isIntersecting }]);
  const block = (selector: string, isIntersecting = true) => blockerObserver?.callback([{ target: w.document.querySelector(selector)!, isIntersecting }]);
  return { w, services, notice, launcher, serviceObserver, blockerObserver, enter, block, advance: (ms: number) => vi.advanceTimersByTime(ms) };
}

describe.each(["services-site", "projects-site"])("%s availability visibility boundaries", site => {
  it("observes only the three real services, never the hero or explorer as a service", () => {
    const ui = setup(site);
    expect(ui.services).toHaveLength(3);
    expect(ui.serviceObserver!.targets).toEqual(ui.services);
    expect(ui.blockerObserver!.options?.rootMargin).toBe("-12% 0px -12% 0px");
    for (const selector of [".hero", "[data-journey]", ".process", ".contact", ".site-footer"]) {
      expect(ui.blockerObserver!.targets).toContain(ui.w.document.querySelector(selector));
    }
  });

  it("never exposes popup or launcher in the hero or explorer, even after engagement", () => {
    const ui = setup(site);
    ui.advance(60_000);
    expect(ui.notice.hidden).toBe(true);
    expect(ui.launcher.hidden).toBe(true);
    ui.serviceObserver!.callback([{ target: ui.w.document.querySelector("[data-journey]")!, isIntersecting: true }]);
    ui.w.document.querySelector("[data-journey]")!.dispatchEvent(new ui.w.Event("servicechange"));
    ui.advance(60_000);
    ui.launcher.click();
    expect(ui.notice.hidden).toBe(true);
    expect(ui.launcher.hidden).toBe(true);
    expect(ui.w.fetch).not.toHaveBeenCalled();
  });

  it("retains engagement delay, service copy, colours, capacity and automatic expiry", () => {
    const ui = setup(site);
    ui.enter(0); ui.advance(4_000);
    expect(ui.launcher.hidden).toBe(false);
    expect(ui.notice.hidden).toBe(true);
    ui.advance(4_001);
    const source = ui.services[0];
    expect(ui.notice.hidden).toBe(false);
    expect(ui.notice.dataset.service).toBe(source.dataset.service);
    expect(ui.notice.dataset.available).toBe(source.querySelector<HTMLElement>(".service-capacity")!.dataset.available);
    expect(ui.notice.querySelector("[data-notice-title]")!.textContent).toBe(source.querySelector(".service-capacity small b")!.textContent);
    expect(ui.notice.querySelector("[data-notice-detail]")!.textContent).toBe(source.querySelector(".service-capacity__limit")!.textContent);
    expect(ui.notice.querySelectorAll("[data-notice-slots] i")).toHaveLength(source.querySelectorAll(".service-capacity__slots i").length);
    expect(ui.launcher.hidden).toBe(true);
    ui.advance(16_001);
    expect(ui.notice.hidden).toBe(true);
    expect(ui.launcher.hidden).toBe(false);
  });

  it("cancels pending notifications when scrolling away and supports returning upwards", () => {
    const ui = setup(site);
    ui.enter(0); ui.advance(4_000); ui.enter(0, false);
    expect(ui.launcher.hidden).toBe(true);
    ui.advance(60_000);
    expect(ui.notice.hidden).toBe(true);
    ui.enter(0); ui.advance(1_501);
    expect(ui.notice.hidden).toBe(false);
    ui.enter(0, false);
    expect(ui.notice.hidden).toBe(true);
    expect(ui.launcher.hidden).toBe(true);
    ui.enter(0);
    expect(ui.launcher.hidden).toBe(false);
    ui.launcher.click();
    expect(ui.notice.hidden).toBe(false);
  });

  it("keeps both surfaces hidden throughout hero, explorer, method, form and footer overlap", () => {
    const ui = setup(site);
    ui.enter(0); ui.advance(4_000);
    for (const selector of [".hero", "[data-journey]", ".process", ".contact", ".site-footer"]) {
      ui.block(selector); ui.advance(10_000); ui.launcher.click();
      expect(ui.notice.hidden, selector).toBe(true);
      expect(ui.launcher.hidden, selector).toBe(true);
      ui.block(selector, false);
    }
    ui.enter(0, false); ui.advance(60_000);
    expect(ui.notice.hidden).toBe(true);
    expect(ui.launcher.hidden).toBe(true);
  });

  it("uses a deep-linked service only after it actually enters the viewport", () => {
    const ui = setup(site, site === "services-site" ? "#contenuti" : "#app");
    ui.advance(8_001);
    expect(ui.launcher.hidden).toBe(true);
    ui.enter(1); ui.advance(1_501);
    expect(ui.notice.hidden).toBe(false);
    expect(ui.notice.dataset.service).toBe(ui.services[1].dataset.service);
    ui.block(".contact");
    expect(ui.notice.hidden).toBe(true);
    expect(ui.launcher.hidden).toBe(true);
  });

  it("stays absent for a direct contact link and when observers are unavailable", () => {
    for (const available of [true, false]) {
      const ui = setup(site, "#contatti", available);
      if (available) ui.block(".contact");
      ui.advance(60_000); ui.launcher.click();
      expect(ui.notice.hidden).toBe(true);
      expect(ui.launcher.hidden).toBe(true);
    }
  });

  it("dismisses stale service copy at boundaries while preserving the automatic cooldown", () => {
    const ui = setup(site);
    ui.enter(0); ui.advance(8_001);
    expect(ui.notice.hidden).toBe(false);
    ui.serviceObserver!.callback([{ target: ui.services[0], isIntersecting: false }, { target: ui.services[1], isIntersecting: true }]);
    expect(ui.notice.hidden).toBe(true);
    expect(ui.launcher.hidden).toBe(false);
    expect(ui.launcher.dataset.service).toBe(ui.services[1].dataset.service);
    ui.advance(44_998);
    expect(ui.notice.hidden).toBe(true);
    ui.advance(2);
    expect(ui.notice.hidden).toBe(false);
    expect(ui.notice.dataset.service).toBe(ui.services[1].dataset.service);
  });

  it("preserves remembered dismissal and manual reopening only inside a real service", () => {
    const ui = setup(site, "", true, true);
    ui.enter(0); ui.advance(8_001);
    expect(ui.notice.hidden).toBe(true);
    expect(ui.launcher.hidden).toBe(false);
    ui.launcher.click();
    expect(ui.notice.hidden).toBe(false);
    ui.notice.querySelector<HTMLButtonElement>("[data-notice-close]")!.click();
    expect(ui.notice.hidden).toBe(true);
    ui.enter(0, false); ui.enter(1); ui.advance(60_000);
    expect(ui.notice.hidden).toBe(true);
    expect(ui.launcher.hidden).toBe(false);
    ui.enter(1, false); ui.launcher.click();
    expect(ui.notice.hidden).toBe(true);
    expect(ui.launcher.hidden).toBe(true);
  });
});
