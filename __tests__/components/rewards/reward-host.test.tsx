// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

import { RewardHost } from "@/components/rewards/reward-host";
import { RewardRuntimeProvider } from "@/components/rewards/reward-provider";

describe("RewardHost dormancy", () => {
  it("renders nothing when runtime flag is off", () => {
    const { container } = render(
      <RewardRuntimeProvider runtimeEnabled={false}>
        <RewardHost />
      </RewardRuntimeProvider>,
    );
    expect(container.querySelector("[data-reward-host]")).toBeNull();
    expect(screen.queryByText("Passo registrato")).toBeNull();
  });
});
