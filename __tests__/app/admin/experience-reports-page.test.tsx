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

vi.mock("@/lib/community/report-repository", () => ({
  listExperienceReports: async () => mocks.list,
}));

vi.mock("@/lib/community/catalog", () => ({
  resolveCatalogToolLabels: async () => mocks.labels,
}));

vi.mock("@/app/(admin)/admin/actions/experience-reports", () => ({
  resolveExperienceReportAction: vi.fn(),
  hideExperienceFromReportAction: vi.fn(),
}));

import ExperienceReportsPage from "@/app/(admin)/admin/(protected)/experiences/reports/page";

function report(overrides: Record<string, unknown> = {}) {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    experienceId: "11111111-1111-4111-8111-111111111111",
    reason: "spam",
    details: null as string | null,
    status: "open",
    reportedAt: "2026-08-30T09:00:00.000Z",
    resolvedAt: null,
    resolvedBy: null,
    resolutionNote: null,
    experience: {
      id: "11111111-1111-4111-8111-111111111111",
      toolSlug: "blink",
      displayName: "Gianmaria",
      status: "published",
      updatedAt: "2026-08-30T10:00:00.000Z",
    },
    ...overrides,
  };
}

async function renderPage(scope = "open", page?: string) {
  const ui = await ExperienceReportsPage({
    searchParams: Promise.resolve(page ? { scope, page } : { scope }),
  });
  return render(ui);
}

describe("H6 admin reports page", () => {
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

  it("H6-ADMIN-03 defaults to open queue with filters", async () => {
    await renderPage();
    expect(screen.getByText("Nessuna segnalazione aperta.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Aperte" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Risolte" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ignorate" })).toBeTruthy();
  });

  it("H6-PRIV-03 renders a report without reporter identity", async () => {
    mocks.list.page = [
      report({
        details: "Pubblicità continua <script>alert(1)</script>",
      }),
    ];
    mocks.list.total = 1;
    await renderPage();
    expect(screen.getByText("Spam")).toBeTruthy();
    expect(screen.getByText(/Pubblicità continua/)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/reporter_id|@example\.com/);
    expect(document.body.innerHTML).not.toContain("<script>alert(1)</script>");
  });

  it("H6-ADMIN-09 missing experience renders safely with actions kept", async () => {
    mocks.list.page = [report({ experience: null })];
    mocks.list.total = 1;
    await renderPage();
    expect(screen.getByText("Esperienza eliminata")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Risolvi" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ignora" })).toBeTruthy();
  });

  it("H6-ADMIN-02 open row offers resolve, dismiss and H3 hide", async () => {
    mocks.list.page = [report()];
    mocks.list.total = 1;
    await renderPage();
    expect(screen.getByRole("button", { name: "Risolvi" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ignora" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Nascondi esperienza" })).toBeTruthy();
  });

  it("H6-ADMIN-04 resolved scope shows resolution metadata, no actions", async () => {
    mocks.list.page = [
      report({
        status: "resolved",
        resolvedAt: "2026-08-30T11:00:00.000Z",
        resolvedBy: "founder-admin",
        resolutionNote: "Verificato",
      }),
    ];
    mocks.list.total = 1;
    await renderPage("resolved");
    expect(screen.getByText(/Nota: Verificato/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Risolvi" })).toBeNull();
  });

  it("H6-ADMIN-06 pagination renders", async () => {
    mocks.list.total = 45;
    await renderPage("open");
    expect(screen.getByText("Pagina 1 di 3")).toBeTruthy();
  });
});
