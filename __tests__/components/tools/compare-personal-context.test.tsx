/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AccountPreviewProvider } from "@/components/account/account-provider";
import { CompareRanking } from "@/components/tools/compare-ranking";
import { CompareDeepEntry } from "@/components/tools/compare-personal-context";
import { reduceWorkspaceState } from "@/lib/discovery/workspace-contract";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import {
  activateToolWorkspaceOwner,
} from "@/lib/stores/tool-workspace-store";
import type { NormalisedTool } from "@/components/tools/tool-battle-shared";

const T0 = "2026-06-01T10:00:00.000Z";

function accountValue(status: "guest" | "authenticated" | "loading") {
  return {
    authEnabled: true,
    status,
    user:
      status === "authenticated"
        ? {
            id: "u1",
            email: "user@example.com",
            aud: "authenticated",
            app_metadata: {},
            user_metadata: {},
            created_at: "2026-01-01T00:00:00.000Z",
          }
        : null,
    session: null,
    isSendingLink: false,
    isAttaching: false,
    workspaceAttachPending: false,
    hasQuarantinedWorkspace: false,
    isRestoringQuarantinedWorkspace: false,
    authMessage: null,
    sendMagicLink: async () => ({ ok: true, message: "ok" }),
    restoreQuarantinedWorkspace: async () => ({ ok: true, message: "ok" }),
    signOut: async () => {},
    workspaceReadyForIntentReplay: status === "authenticated",
  };
}

function tool(slug: string, name: string): NormalisedTool {
  return {
    slug,
    name,
    category: "ai",
    categoryLabel: "AI",
    score: 8,
    editorialScore: 8,
    battleScore: 8,
    compareScore: {
      version: "compare-score-v3-trust",
      slug,
      name,
      total: 8,
      rank: 1,
      assessment: { state: "verified", missing: [] },
      confidence: { level: "high", coverage: 1, missing: [] },
      components: [],
      explanation: [],
    },
    accentFrom: "#6a3cff",
    accentTo: "#6a3cff",
    tldr: "Public tldr",
    useCase: "Public use",
    review: "Public review",
    highlights: [],
    useCases: [],
    tags: [],
    readingTime: "5 min",
    url: "https://example.com",
    logoUrl: "",
    isDirectory: false,
    useCasesCount: 0,
    weightedDimensions: [],
    objectiveScore: 7,
    objectiveRawScore: 7,
    objectiveRank: 1,
  } as NormalisedTool;
}

function seedNote() {
  const state = reduceWorkspaceState(createEmptyWorkspaceState(), {
    type: "saved/set",
    slug: "cursor",
    saved: true,
    at: T0,
  });
  return reduceWorkspaceState(state, {
    type: "tool/note",
    slug: "cursor",
    note: "SECRET_NOTE_PRICING",
    at: T0,
  });
}

describe("compare personal UI", () => {
  beforeEach(() => {
    activateToolWorkspaceOwner({ kind: "guest" }, seedNote());
  });

  afterEach(() => {
    cleanup();
    activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  });

  it("DEEP-PRIV-01 guest ranking does not show private note", () => {
    render(
      <AccountPreviewProvider value={accountValue("guest")}>
        <CompareRanking
          tools={[tool("cursor", "Cursor"), tool("v0", "v0")]}
          winner={null}
          layoutMode="desktop"
        />
      </AccountPreviewProvider>,
    );
    expect(screen.queryByText("SECRET_NOTE_PRICING")).toBeNull();
    expect(screen.queryByText("Nota presente")).toBeNull();
    expect(screen.queryByText("Il tuo contesto")).toBeNull();
  });

  it("DEEP-AUTH-06 authenticated ranking shows personal chips", () => {
    activateToolWorkspaceOwner(
      { kind: "account", userId: "u1" },
      seedNote(),
    );
    render(
      <AccountPreviewProvider value={accountValue("authenticated")}>
        <CompareRanking
          tools={[tool("cursor", "Cursor"), tool("v0", "v0")]}
          winner={null}
          layoutMode="desktop"
        />
      </AccountPreviewProvider>,
    );
    expect(screen.getByText("Nota presente")).toBeTruthy();
    expect(screen.queryByText("SECRET_NOTE_PRICING")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Nel tuo spazio" }));
    expect(screen.getByText("SECRET_NOTE_PRICING")).toBeTruthy();
  });

  it("DEEP-AUTH-02 guest identity shows Il tuo contesto", () => {
    render(
      <AccountPreviewProvider value={accountValue("guest")}>
        <CompareDeepEntry />
      </AccountPreviewProvider>,
    );
    expect(screen.getByRole("button", { name: "Il tuo contesto" })).toBeTruthy();
  });

  it("DEEP-AUTH-07 loading does not flash the guest entry", () => {
    render(
      <AccountPreviewProvider value={accountValue("loading")}>
        <CompareDeepEntry />
      </AccountPreviewProvider>,
    );
    expect(screen.queryByRole("button", { name: "Il tuo contesto" })).toBeNull();
  });
});
