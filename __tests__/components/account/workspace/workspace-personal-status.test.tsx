// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { WorkspacePersonalStatusBadge } from "@/components/account/workspace/workspace-personal-status";
import { ArchiveV4ToolCard } from "@/components/archive/archive-v4-tool-card";
import { CanonicalToolCard } from "@/components/directory/canonical-tool-card";
import { makeCatalogTool } from "../../directory/catalog-test-fixtures";
import { dispatchWorkspaceChange } from "@/lib/discovery/workspace-events";
import {
  createEmptyWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";
import type { WorkspaceAction } from "@/lib/discovery/types";
import {
  activateToolWorkspaceOwner,
} from "@/lib/stores/tool-workspace-store";

const T0 = "2026-07-17T10:00:00.000Z";

function apply(actions: WorkspaceAction[]) {
  return actions.reduce(
    (state, action) => reduceWorkspaceState(state, action),
    createEmptyWorkspaceState(),
  );
}

function seedWorkspace(actions: WorkspaceAction[] = []) {
  activateToolWorkspaceOwner({ kind: "guest" }, apply(actions));
  dispatchWorkspaceChange({ source: "local", scope: "workspace" });
}

beforeEach(() => {
  window.localStorage.clear();
  seedWorkspace();
});

afterEach(() => {
  cleanup();
});

describe("WorkspacePersonalStatusBadge", () => {
  it("renders nothing for an empty snapshot", () => {
    const { container } = render(
      <WorkspacePersonalStatusBadge slug="cursor" />,
    );

    expect(container.querySelector("[data-slot='personal-status']")).toBeNull();
    expect(container.textContent).toBe("");
  });

  it("shows In uso when the tool is selected and in use", () => {
    seedWorkspace([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/decision", slug: "cursor", outcome: "selected", at: T0 },
      { type: "tool/usage", slug: "cursor", usage: "using", at: T0 },
    ]);

    render(<WorkspacePersonalStatusBadge slug="cursor" />);

    expect(screen.getByText("In uso")).toBeTruthy();
    expect(screen.queryByText("Salvato")).toBeNull();
    expect(screen.queryByText("Scelto")).toBeNull();
  });

  it("keeps Sostituito without a replacement arrow", () => {
    seedWorkspace([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      {
        type: "tool/usage",
        slug: "cursor",
        usage: "replaced",
        replacedBy: "v0",
        at: T0,
      },
    ]);

    const { container } = render(
      <WorkspacePersonalStatusBadge slug="cursor" />,
    );

    expect(screen.getByText("Sostituito")).toBeTruthy();
    expect(container.textContent).not.toContain("→");
    expect(container.textContent).not.toContain("v0");
  });

  it("does not throw for a guest without workspace state", () => {
    window.localStorage.clear();
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());

    expect(() => {
      render(<WorkspacePersonalStatusBadge slug="missing-tool" />);
    }).not.toThrow();

    expect(screen.queryByText("Salvato")).toBeNull();
    expect(screen.queryByText("In uso")).toBeNull();
  });
});

describe("ArchiveV4ToolCard personal status", () => {
  it("does not show a Salvato flag for a guest empty workspace", () => {
    const { container } = render(
      <ArchiveV4ToolCard tool={makeCatalogTool({ slug: "cursor", name: "Cursor" })} />,
    );

    expect(container.querySelector("[data-slot='personal-status']")).toBeNull();
    expect(container.querySelector(".ar4-card__saved-flag")).toBeNull();
    expect(screen.queryByText("Salvato")).toBeNull();
  });

  it("shows In uso instead of a Salvato flag", () => {
    seedWorkspace([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/decision", slug: "cursor", outcome: "selected", at: T0 },
      { type: "tool/usage", slug: "cursor", usage: "using", at: T0 },
    ]);

    const { container } = render(
      <ArchiveV4ToolCard tool={makeCatalogTool({ slug: "cursor", name: "Cursor" })} />,
    );

    expect(screen.getByText("In uso")).toBeTruthy();
    expect(container.querySelector(".ar4-card__saved-flag")).toBeNull();
  });
});

describe("CanonicalToolCard personal status", () => {
  it("does not add a personal status node for a guest empty workspace", () => {
    const { container } = render(
      <CanonicalToolCard tool={makeCatalogTool({ slug: "cursor", name: "Cursor" })} />,
    );

    expect(container.querySelector("[data-slot='personal-status']")).toBeNull();
    expect(screen.queryByText("In uso")).toBeNull();
    expect(screen.queryByText("Scelto")).toBeNull();
  });

  it("shows In uso on the catalog card instead of Salvato", () => {
    seedWorkspace([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/decision", slug: "cursor", outcome: "selected", at: T0 },
      { type: "tool/usage", slug: "cursor", usage: "using", at: T0 },
    ]);

    render(
      <CanonicalToolCard tool={makeCatalogTool({ slug: "cursor", name: "Cursor" })} />,
    );

    expect(screen.getByText("In uso")).toBeTruthy();
    expect(screen.queryByText("Sostituito →")).toBeNull();
  });
});
