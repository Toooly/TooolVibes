// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SignalProgressHub } from "@/lib/signal-progression/hub-contracts";

const { flagsState } = vi.hoisted(() => ({
  flagsState: {
    current: {
      achievementsEnabled: true,
      badgeCabinetEnabled: true,
      milestonesEnabled: true,
    },
  },
}));

vi.mock("@/lib/signal-progression/release-context", () => ({
  useSignalAchievementFlags: () => flagsState.current,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    createElement("a", { href, className }, children),
}));

import { AccountBadgeCabinetSection } from "@/components/account/panel/account-badge-cabinet-section";

function makeHub(overrides: Partial<SignalProgressHub> = {}): SignalProgressHub {
  return {
    balance: 210,
    level: 2,
    levelTitle: "Selezionatore",
    nextLevel: 3,
    nextThreshold: 400,
    progressInLevel: 0.4,
    explanation: "Test",
    missions: [],
    recentGrants: [],
    earnedBadgeCodes: [],
    badges: [],
    achievementProgress: {
      savedCount: 3,
      comparisonCount: 1,
      radarDays: 0,
      collectionJourneysCompleted: 0,
      profileComplete: true,
      level: 2,
    },
    profileContextComplete: true,
    profileContext: null,
    preferences: null,
    rulesVersion: "test",
    ...overrides,
  };
}

const EARNED_BADGE = {
  code: "curator_mark",
  title: "Segno del curatore",
  description: "Hai completato un intero percorso curato, passaggio dopo passaggio.",
  a11yDescription: "Segnalino guadagnato: hai completato un percorso curato completo.",
  iconId: "PenTool",
  rarity: "rare" as const,
  visualIntensity: "elevated" as const,
  sortOrder: 70,
  earnedAt: "2026-07-12T09:00:00.000Z",
};

afterEach(cleanup);

describe("AccountBadgeCabinetSection", () => {
  it("renders nothing when the cabinet flag is OFF", () => {
    flagsState.current = {
      achievementsEnabled: true,
      badgeCabinetEnabled: false,
      milestonesEnabled: true,
    };
    const { container } = render(
      createElement(AccountBadgeCabinetSection, { hub: makeHub(), loading: false }),
    );
    expect(container.firstChild).toBeNull();
    flagsState.current = {
      achievementsEnabled: true,
      badgeCabinetEnabled: true,
      milestonesEnabled: true,
    };
  });

  it("shows an ethical empty state with one useful next action", () => {
    render(
      createElement(AccountBadgeCabinetSection, {
        hub: makeHub({ badges: [] }),
        loading: false,
      }),
    );
    expect(screen.getByText(/raccoglie i segni del tuo percorso/i)).toBeTruthy();
    expect(screen.getByText(/mai da click ripetuti/i)).toBeTruthy();
    const link = screen.getByRole("link", { name: /salva il primo strumento/i });
    expect(link.getAttribute("href")).toBe("/toools");
  });

  it("renders earned badges with meaning, date and textual rarity", () => {
    render(
      createElement(AccountBadgeCabinetSection, {
        hub: makeHub({ badges: [EARNED_BADGE], earnedBadgeCodes: ["curator_mark"] }),
        loading: false,
      }),
    );
    expect(screen.getByText("Segno del curatore")).toBeTruthy();
    expect(screen.getByText(/percorso curato, passaggio dopo passaggio/i)).toBeTruthy();
    // Rarity is text, never colour-only.
    expect(screen.getByText("Raro")).toBeTruthy();
    expect(screen.getByText(/Guadagnato il 12 luglio 2026/i)).toBeTruthy();
  });

  it("never renders a wall of locked badges", () => {
    const { container } = render(
      createElement(AccountBadgeCabinetSection, {
        hub: makeHub({ badges: [EARNED_BADGE] }),
        loading: false,
      }),
    );
    expect(container.querySelectorAll("[aria-disabled], .locked, [data-locked]").length).toBe(0);
    expect(screen.queryByText(/bloccato/i)).toBeNull();
  });

  it("shows at most two truthful trajectory items with real counters", () => {
    render(
      createElement(AccountBadgeCabinetSection, {
        hub: makeHub({
          badges: [],
          achievementProgress: {
            savedCount: 3,
            comparisonCount: 2,
            radarDays: 1,
            collectionJourneysCompleted: 0,
            profileComplete: false,
            level: 1,
          },
        }),
        loading: false,
      }),
    );
    const trajectory = screen.getByRole("list", { name: /Prossimi traguardi/i });
    const items = trajectory.querySelectorAll("li");
    expect(items.length).toBeLessThanOrEqual(2);
    expect(screen.getByText("3/5")).toBeTruthy();
  });

  it("bounds the quiet history to five entries", () => {
    const grants = Array.from({ length: 8 }, (_, i) => ({
      grantId: `grant_hist_${String(i).padStart(4, "0")}`,
      code: "tool_saved",
      title: `Salvataggio ${i + 1}`,
      description: "desc",
      tier: "micro",
      displayDelta: 5,
      createdAt: "2026-07-29T10:00:00.000Z",
    }));
    render(
      createElement(AccountBadgeCabinetSection, {
        hub: makeHub({ badges: [EARNED_BADGE], recentGrants: grants }),
        loading: false,
      }),
    );
    const history = screen.getByRole("list", { name: /Ricompense recenti/i });
    expect(history.querySelectorAll("li").length).toBe(5);
  });

  it("passes axe with earned badges (no critical/serious violations)", async () => {
    const { container } = render(
      createElement(AccountBadgeCabinetSection, {
        hub: makeHub({ badges: [EARNED_BADGE] }),
        loading: false,
      }),
    );
    const results = await axe.run(container);
    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(serious).toEqual([]);
  });
});
