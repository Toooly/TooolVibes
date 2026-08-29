/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  adminEnabled: true,
  list: {
    ok: true as boolean,
    page: [] as Array<Record<string, unknown>>,
    pageNumber: 1,
    pageSize: 20,
    total: 0,
    hasMore: false,
  },
  labels: {} as Record<string, { name: string; missing: boolean }>,
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/admin/tool-queries", () => ({
  isSupabaseAdminEnabled: () => mocks.adminEnabled,
}));

vi.mock("@/lib/community/repository", () => ({
  listExperiencesForModeration: async () => mocks.list,
}));

vi.mock("@/lib/community/catalog", () => ({
  resolveCatalogToolLabels: async () => mocks.labels,
}));

vi.mock("@/app/(admin)/admin/actions/experiences", () => ({
  moderateExperienceAction: vi.fn(),
}));

import ExperiencesPage from "@/app/(admin)/admin/(protected)/experiences/page";

const body =
  "Used this tool daily for client landing pages and kept coming back when the stack already had a builder.";

function experience(overrides: Record<string, unknown> = {}) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    toolSlug: "blink",
    displayName: "Gianmaria",
    useCase: "AI coding",
    body,
    pros: ["Fast preview cycle"],
    limits: ["Weak collaboration"],
    durationBucket: "months_1_3",
    switchedFromSlug: null,
    switchedFromLabel: null,
    publishedAt: null,
    updatedAt: "2026-08-30T10:00:00.000Z",
    status: "pending",
    createdAt: "2026-08-30T09:00:00.000Z",
    submittedAt: "2026-08-30T09:00:00.000Z",
    moderatedAt: null,
    moderationReason: null,
    moderatedBy: null,
    ...overrides,
  };
}

async function renderPage(status = "pending") {
  const ui = await ExperiencesPage({
    searchParams: Promise.resolve({ status }),
  });
  return render(ui);
}

describe("H3 experiences admin page", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mocks.adminEnabled = true;
    mocks.list = {
      ok: true,
      page: [],
      pageNumber: 1,
      pageSize: 20,
      total: 0,
      hasMore: false,
    };
    mocks.labels = { blink: { name: "Blink", missing: false } };
  });

  it("H3-LIST-01 defaults to empty pending copy", async () => {
    await renderPage();
    expect(screen.getByText("Nessuna esperienza in revisione.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "In revisione" })).toBeTruthy();
  });

  it("H3-SEC-01 renders script body as text", async () => {
    mocks.list.page = [
      experience({
        body: `${body} <script>alert(1)</script>`,
        pros: ["<img src=x onerror=alert(1)>"],
        limits: ["<b>html</b>"],
        moderationReason: "<script>reason</script>xxxx",
        status: "hidden",
      }),
    ];
    mocks.list.total = 1;
    await renderPage("hidden");
    expect(document.body.innerHTML).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(document.body.innerHTML).not.toContain("<script>alert(1)</script>");
    expect(document.body.textContent).not.toMatch(/author_id|@example\.com|SERVICE_ROLE/);
    expect(screen.getByRole("button", { name: "Ripubblica" })).toBeTruthy();
  });

  it("H3-LIST-07 unknown catalog tool stays usable", async () => {
    mocks.list.page = [experience({ toolSlug: "gone-tool" })];
    mocks.list.total = 1;
    mocks.labels = {
      "gone-tool": { name: "Tool non più nel catalogo", missing: true },
    };
    await renderPage();
    expect(screen.getByText("Tool non più nel catalogo")).toBeTruthy();
    expect(screen.getByText("gone-tool")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pubblica" })).toBeTruthy();
  });

  it("shows pending actions not hide", async () => {
    mocks.list.page = [experience()];
    mocks.list.total = 1;
    await renderPage();
    expect(screen.getByRole("button", { name: "Pubblica" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Rifiuta" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Nascondi" })).toBeNull();
  });
});
