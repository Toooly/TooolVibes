// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Confetti import failure must degrade to the static milestone card.
vi.mock("canvas-confetti", () => {
  throw new Error("chunk load failed");
});

vi.mock("@/lib/config/sound", () => ({
  playTooolvibesSound: () => undefined,
}));

vi.mock("@number-flow/react", () => ({
  default: ({ value }: { value: number }) => createElement("span", null, String(value)),
}));

import { MilestoneReveal } from "@/components/rewards/milestone-reveal";
import { makeMilestoneEnvelope } from "@/lib/rewards/test-fixtures";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(cleanup);

describe("MilestoneReveal — confetti import failure", () => {
  it("still communicates the complete milestone statically", async () => {
    render(
      createElement(MilestoneReveal, {
        envelope: makeMilestoneEnvelope(),
        quietMode: false,
        muteRewardSounds: true,
        onDismiss: () => {},
      }),
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Nuovo livello: Stratega")).toBeTruthy();
    expect(screen.getByText("Hai raggiunto il livello Stratega.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continua" })).toBeTruthy();
  });
});
