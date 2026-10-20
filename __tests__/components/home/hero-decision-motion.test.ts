import { describe, expect, it } from "vitest";
import { dampHeroScroll, getHeroJourneyStep, getHeroScrollProgress } from "@/components/home/hero-decision-motion";

describe("Hero scroll pacing", () => {
  it("reveals the journey in order and hides it in reverse when scrolling back", () => {
    expect([0, 0.03, 0.1, 0.2, 0.1, 0.03, 0].map(getHeroJourneyStep)).toEqual([0, 1, 2, 3, 2, 1, 0]);
  });
  it("is confined to the hero traversal and reverses with native scroll", () => {
    expect(getHeroScrollProgress(0, 40, 600)).toBe(0);
    expect(getHeroScrollProgress(40, 40, 600)).toBe(0);
    expect(getHeroScrollProgress(340, 40, 600)).toBeCloseTo(0.5);
    expect(getHeroScrollProgress(900, 40, 600)).toBe(1);
    expect(getHeroScrollProgress(100, 40, 600)).toBeCloseTo(0.1);
  });
  it("does not jump when a large scroll gesture arrives", () => {
    const next = dampHeroScroll(0, 1, 1 / 60);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(0.1);
    expect(dampHeroScroll(1, 0, 1 / 60)).toBeGreaterThan(0.9);
  });
  it("settles at the same pace on 30, 60 and 120Hz displays", () => {
    const settled = [30, 60, 120].map(hz => {
      let progress = 0;
      for (let frame = 0; frame < hz / 2; frame++) progress = dampHeroScroll(progress, 1, 1 / hz);
      return progress;
    });
    expect(settled[0]).toBeGreaterThan(0.93);
    expect(settled[0]).toBeCloseTo(settled[1], 8);
    expect(settled[1]).toBeCloseTo(settled[2], 8);
  });
  it("never overshoots or advances while time is paused", () => {
    expect(dampHeroScroll(0.6, 0.2, 0)).toBe(0.6);
    const next = dampHeroScroll(0.6, 0.2, 0.08);
    expect(next).toBeGreaterThan(0.2);
    expect(next).toBeLessThan(0.6);
  });
});
