import { describe, expect, it } from "vitest";
import { atlasMobileBodyPx, atlasMobileGlobalIds, atlasStackAgeLabel, planAtlasMicroFocus, planAtlasMobile, type AtlasMobileSignal } from "@/lib/radar/radar-atlas-mobile";

const signals = (count: number, radiusRatio = .02): AtlasMobileSignal[] => Array.from({ length: count }, (_, i) => ({ id: `s${i}`, semanticAngle: i * 13, radiusRatio, radius: 2, attention: count - i, ageHours: .5 }));

describe("mobile Atlas physical layout", () => {
  it("uses separate legible bodies and 48px targets", () => {
    expect(atlasMobileBodyPx("primary", 100, 100)).toBe(42);
    expect(atlasMobileBodyPx("secondary", 25, 100)).toBe(30);
    expect(atlasMobileBodyPx("ambient", 25, 100)).toBe(23);
  });

  it.each([304, 328, 344, 359, 374, 377, 398, 414, 464, 512])("preserves every member and separates all targets at %ipx", width => {
    const input = [...signals(12), ...signals(6, .75).map(s => ({ ...s, id: `outer-${s.id}` }))];
    const plan = planAtlasMobile(input, width);
    expect([...plan.visibleIds, ...plan.stacks.flatMap(s => s.memberIds)].sort()).toEqual(input.map(s => s.id).sort());
    const objects = [...plan.positions.values()];
    for (let i = 0; i < objects.length; i++) for (let j = i + 1; j < objects.length; j++) {
      expect(Math.hypot(objects[i].x - objects[j].x, objects[i].y - objects[j].y) * width / 100).toBeGreaterThanOrEqual(53.99);
    }
    for (const id of plan.visibleIds) {
      const p = plan.positions.get(id)!;
      expect(Math.hypot(p.x - 50, p.y - 50)).toBeCloseTo(input.find(s => s.id === id)!.radiusRatio * 42);
    }
    expect(planAtlasMobile([...input].reverse(), width)).toEqual(plan);
    expect(plan.stacks.some(s => s.memberIds.length > 1)).toBe(true);
  });

  it("opens dense groups in disjoint orbit pages with no lost members", () => {
    const ids = signals(19).map(s => s.id);
    const pages = [0, 1, 2].map(page => planAtlasMicroFocus(ids, page));
    expect(pages.map(p => p.size)).toEqual([8, 8, 3]);
    expect(pages.flatMap(p => [...p.keys()])).toEqual(ids);
    for (const page of pages) {
      const points = [...page.values()];
      for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) {
        expect(Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y) * 304 / 100).toBeGreaterThan(54);
      }
    }
  });

  it("caps Global at one representative per territory, including search results", () => {
    const plan = atlasMobileGlobalIds([{ id: "first", x: 20, y: 20, attention: 3, clusterId: "coding" }, { id: "second", x: 80, y: 80, attention: 2, clusterId: "coding" }, { id: "third", x: 80, y: 20, attention: 1, clusterId: "design" }], 374);
    expect([...plan]).toEqual(["first", "third"]);
  });

  it("describes the group's actual time interval", () => {
    expect(atlasStackAgeLabel(signals(4))).toBe("<1h");
    expect(atlasStackAgeLabel(signals(4).map((s, i) => ({ ...s, ageHours: i + 2 })))).toBe("2–5h");
    expect(atlasStackAgeLabel([{ ...signals(1)[0], ageHours: null }])).toBe("Età mista");
  });
});
