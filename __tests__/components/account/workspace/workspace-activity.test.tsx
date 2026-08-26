// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";

const catalogRuntime = vi.hoisted(() => ({
  value: [] as PublicToolCatalogItem[],
}));

vi.mock("@/lib/data/public-tool-catalog-context", () => ({
  usePublicToolCatalog: () => catalogRuntime.value,
}));

import { WorkspaceActivity } from "@/components/account/workspace/workspace-activity";

describe("WorkspaceActivity", () => {
  beforeEach(() => {
    catalogRuntime.value = [
      {
        slug: "cursor",
        name: "Cursor",
        categoryLabel: "Coding",
        shortDescription: "",
        featured: false,
        toolOfWeek: false,
        tags: [],
        levelLabel: null,
      },
    ];
  });

  afterEach(() => {
    cleanup();
  });

  it("labels the view Recenti and keeps empty copy calm", () => {
    render(createElement(WorkspaceActivity, { state: workspaceTestFixtures.guestEmpty }));

    expect(screen.getAllByText("Recenti").length).toBeGreaterThan(0);
    expect(screen.queryByText("Attività")).toBeNull();
    expect(screen.getByText("Ancora niente di recente")).toBeTruthy();
  });

  it("turns recent rows into destination links", () => {
    render(createElement(WorkspaceActivity, { state: workspaceTestFixtures.mature }));

    expect(screen.getAllByText("Recenti").length).toBeGreaterThan(0);
    expect(screen.queryByText("Attività")).toBeNull();

    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs).toContain("/account?view=salvati");
    expect(hrefs).toContain("/compare");
    expect(hrefs).toContain("/account?view=decisioni");
    expect(hrefs).toContain("/account?view=stack");
  });
});
