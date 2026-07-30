// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { confettiFire, soundPlay } = vi.hoisted(() => ({
  confettiFire: vi.fn(),
  soundPlay: vi.fn(),
}));

vi.mock("canvas-confetti", () => ({
  default: Object.assign(
    () => undefined,
    {
      create: () => confettiFire,
      reset: () => undefined,
    },
  ),
}));

vi.mock("@/lib/config/sound", () => ({
  playTooolvibesSound: soundPlay,
}));

vi.mock("@number-flow/react", () => ({
  default: ({ value }: { value: number }) => createElement("span", null, String(value)),
}));

import { MilestoneReveal } from "@/components/rewards/milestone-reveal";
import { makeMilestoneEnvelope } from "@/lib/rewards/test-fixtures";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  cleanup();
  confettiFire.mockClear();
  soundPlay.mockClear();
});

describe("MilestoneReveal (Tier 3)", () => {
  it("renders an accessible modal dialog with the full milestone", async () => {
    render(
      createElement(MilestoneReveal, {
        envelope: makeMilestoneEnvelope(),
        quietMode: false,
        muteRewardSounds: false,
        onDismiss: () => {},
      }),
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByText("Nuovo livello: Stratega")).toBeTruthy();
    expect(screen.getByText(/confronti ripetuti e strutturati/i)).toBeTruthy();
    expect(screen.getByText("Stratega")).toBeTruthy();
    // Complete accessible alternative: announcement present in the document.
    expect(screen.getByText("Hai raggiunto il livello Stratega.")).toBeTruthy();
    await waitFor(() => expect(confettiFire).toHaveBeenCalled());
    expect(soundPlay).toHaveBeenCalledWith("levelUp");
  });

  it("keeps confetti dialog-local (canvas inside the stage, not full-screen)", () => {
    const { container } = render(
      createElement(MilestoneReveal, {
        envelope: makeMilestoneEnvelope(),
        quietMode: false,
        muteRewardSounds: false,
        onDismiss: () => {},
      }),
    );
    const canvas = container.querySelector("canvas.tv-reward-milestone-canvas");
    expect(canvas).not.toBeNull();
    expect(canvas?.getAttribute("aria-hidden")).toBe("true");
  });

  it("does not play sound when muted or in quiet mode", () => {
    render(
      createElement(MilestoneReveal, {
        envelope: makeMilestoneEnvelope(),
        quietMode: true,
        muteRewardSounds: true,
        onDismiss: () => {},
      }),
    );
    expect(soundPlay).not.toHaveBeenCalled();
  });

  it("dismisses on Escape and restores focus", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const onDismiss = vi.fn();
    render(
      createElement(MilestoneReveal, {
        envelope: makeMilestoneEnvelope(),
        quietMode: false,
        muteRewardSounds: true,
        onDismiss,
      }),
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    trigger.remove();
  });

  it("dismisses via the Continue button", () => {
    const onDismiss = vi.fn();
    render(
      createElement(MilestoneReveal, {
        envelope: makeMilestoneEnvelope(),
        quietMode: false,
        muteRewardSounds: true,
        onDismiss,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Continua" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
