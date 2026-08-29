/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  result: {
    skipped: false as boolean,
    ok: true as boolean,
    experiences: [] as Array<Record<string, unknown>>,
    nextCursor: null as string | null,
  },
}));

vi.mock("@/lib/community/public-read", () => ({
  loadPublishedExperiencesForTool: async () => mocks.result,
}));

vi.mock("@/components/community/experience-load-more", () => ({
  ExperienceLoadMore: ({ initialCursor }: { initialCursor: string }) => (
    <button type="button">Mostra altre esperienze {initialCursor}</button>
  ),
}));

import { ExperienceSection } from "@/components/community/experience-section";

const body =
  "Used this tool daily for client landing pages and kept coming back when the stack already had a builder.";

function published(overrides: Record<string, unknown> = {}) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    toolSlug: "blink",
    displayName: "Gianmaria",
    useCase: "AI coding",
    body,
    pros: ["Fast preview cycle"],
    limits: ["Weak collaboration"],
    durationBucket: "months_6_12",
    switchedFromSlug: "weweb",
    switchedFromLabel: null,
    publishedAt: "2026-08-30T12:00:00.000Z",
    updatedAt: "2026-08-30T12:00:00.000Z",
    ...overrides,
  };
}

async function renderSection() {
  const ui = await ExperienceSection({
    toolSlug: "blink",
    catalogNames: { blink: "Blink", weweb: "WeWeb" },
  });
  return render(ui);
}

describe("ExperienceSection", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mocks.result = {
      skipped: false,
      ok: true,
      experiences: [],
      nextCursor: null,
    };
  });

  it("H4-FLAG-01 returns nothing when skipped", async () => {
    mocks.result.skipped = true;
    const ui = await ExperienceSection({ toolSlug: "blink", catalogNames: {} });
    expect(ui).toBeNull();
  });

  it("H4-UI-10 empty published state", async () => {
    await renderSection();
    expect(screen.getByRole("heading", { name: /Come viene usato davvero/ })).toBeTruthy();
    expect(screen.getByText("Nessuna esperienza pubblicata ancora.")).toBeTruthy();
  });

  it("H4-SEC-07 renders script as text", async () => {
    mocks.result.experiences = [
      published({
        body: `${body} <script>alert(1)</script>`,
        pros: ["<img src=x onerror=alert(1)>"],
        limits: ["<b>html</b>"],
        displayName: "Gianmaria",
      }),
    ];
    await renderSection();
    expect(document.body.innerHTML).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(document.body.innerHTML).not.toContain("<script>alert(1)</script>");
    expect(document.body.textContent).toContain("Gianmaria");
    expect(document.body.textContent).toContain("6–12 mesi");
    expect(document.body.textContent).toContain("Prima usava: WeWeb");
    expect(document.body.innerHTML).toContain("/toools/weweb");
    expect(JSON.stringify(mocks.result.experiences[0])).not.toMatch(/author_id|moderatedBy|@example/);
  });

  it("H4-PAGE-01 shows load more when cursor exists", async () => {
    mocks.result.experiences = [published()];
    mocks.result.nextCursor = "cursor-2";
    await renderSection();
    expect(screen.getByRole("button", { name: /Mostra altre esperienze/ })).toBeTruthy();
  });

  it("H4-UI off-catalog switched label has no link", async () => {
    mocks.result.experiences = [
      published({
        switchedFromSlug: null,
        switchedFromLabel: "Framer",
      }),
    ];
    await renderSection();
    expect(screen.getByText(/Prima usava: Framer/)).toBeTruthy();
    expect(document.body.innerHTML).not.toContain("/toools/framer");
  });
});
