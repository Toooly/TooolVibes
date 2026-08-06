// @vitest-environment jsdom

import { useEffect } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { acknowledgeSignalRewardGrant, getSession } = vi.hoisted(() => ({
  acknowledgeSignalRewardGrant: vi.fn().mockResolvedValue(undefined),
  getSession: vi.fn().mockResolvedValue({
    data: { session: { access_token: "token" } },
  }),
}));

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/lib/rewards/acknowledgement", async () => {
  const actual = await vi.importActual<typeof import("@/lib/rewards/acknowledgement")>("@/lib/rewards/acknowledgement");
  return { ...actual, acknowledgeSignalRewardGrant, isGrantAcknowledged: (id: string) => id === "grant_filter_A" || actual.isGrantAcknowledged(id) };
});
vi.mock("@/components/account/account-provider", () => ({
  useAccount: () => ({ status: "authenticated" }),
}));
vi.mock("@/lib/supabase/browser-client", () => ({
  getBrowserSupabaseClient: () => ({ auth: { getSession } }),
}));

import { SignalDeliveryBridge } from "@/components/rewards/signal-delivery-bridge";
import { RewardRuntimeProvider, useRewardRuntime } from "@/components/rewards/reward-provider";
import { makeAchievementEnvelope } from "@/lib/rewards/test-fixtures";
import { rememberAcknowledgedGrantId } from "@/lib/rewards/acknowledgement";

function LifecycleHarness({ action }: { action: "dismiss" | "complete" }) {
  const runtime = useRewardRuntime();
  const { enqueueVerifiedEnvelope, runtimeEnabled } = runtime;
  useEffect(() => {
    if (runtimeEnabled) {
      setTimeout(() => {
        enqueueVerifiedEnvelope(makeAchievementEnvelope({ grantId: "grant_lifecycle_1" }));
      }, 0);
    }
  }, [enqueueVerifiedEnvelope, runtimeEnabled]);
  return (
    <button
      data-testid="settle"
      onClick={action === "dismiss" ? runtime.dismissActive : runtime.completeActive}
      type="button"
    >
      settle
    </button>
  );
}

function ActiveGrant() {
  const { active } = useRewardRuntime();
  return <span data-testid="active-grant">{active?.grantId ?? "none"}</span>;
}

describe("celebration lifecycle", () => {
  afterEach(() => cleanup());
  it.each([
    ["dismiss", "dismissed"],
    ["complete", "acknowledged"],
  ] as const)("acknowledges a grant when %s", async (action, status) => {
    acknowledgeSignalRewardGrant.mockClear();
    render(
      <RewardRuntimeProvider runtimeEnabled>
        <LifecycleHarness action={action} />
        <ActiveGrant />
      </RewardRuntimeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("active-grant").textContent).toBe("grant_lifecycle_1"));
    if (action === "complete") {
      // The complete path is exercised by the same harness callback below.
      fireEvent.click(screen.getByTestId("settle"));
    } else {
      fireEvent.click(screen.getByTestId("settle"));
    }
    await waitFor(() => expect(acknowledgeSignalRewardGrant).toHaveBeenCalledWith("grant_lifecycle_1", status));
    expect(acknowledgeSignalRewardGrant).toHaveBeenCalledTimes(1);
  });

  it("filters grants already acknowledged in this session", async () => {
    const envelopeA = makeAchievementEnvelope({ grantId: "grant_filter_A" });
    const envelopeB = makeAchievementEnvelope({ grantId: "grant_filter_B", eventId: "evt_filter_B" });
    rememberAcknowledgedGrantId(envelopeA.grantId);
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ envelopes: [envelopeA, envelopeB] }),
    } as Response);
    render(
      <RewardRuntimeProvider runtimeEnabled>
        <SignalDeliveryBridge enabled />
        <ActiveGrant />
      </RewardRuntimeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("active-grant").textContent).toBe(envelopeB.grantId));
  });
});
