import { describe, expect, it } from "vitest";

import {
  EMPTY_REWARD_QUEUE,
  clearAllRewardSession,
  dequeueReward,
  enqueueReward,
  peekReward,
} from "@/lib/rewards/queue";
import { makeAchievementEnvelope, makeMicroEnvelope } from "@/lib/rewards/test-fixtures";
import { REWARD_PRESENTATION_CAPS } from "@/lib/rewards/caps";

describe("reward queue", () => {
  it("dedupes by grant id", () => {
    const first = enqueueReward(EMPTY_REWARD_QUEUE, makeMicroEnvelope());
    expect(first.ok && first.enqueued).toBe(true);
    if (!first.ok) return;
    const second = enqueueReward(first.state, makeMicroEnvelope());
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.enqueued).toBe(false);
    if (!second.enqueued) expect(second.reason).toBe("duplicate_in_queue");
  });

  it("orders by priority then age", () => {
    let state = EMPTY_REWARD_QUEUE;
    const low = enqueueReward(
      state,
      makeMicroEnvelope({
        grantId: "grant_micro_low______",
        priority: 1,
        createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
      }),
    );
    expect(low.ok && low.enqueued).toBe(true);
    if (!low.ok) return;
    state = low.state;
    const high = enqueueReward(
      state,
      makeAchievementEnvelope({
        grantId: "grant_ach_high_______",
        priority: 90,
        createdAt: new Date("2026-01-02T00:00:00.000Z").toISOString(),
      }),
    );
    expect(high.ok && high.enqueued).toBe(true);
    if (!high.ok) return;
    expect(peekReward(high.state)?.grantId).toBe("grant_ach_high_______");
  });

  it("bounds the queue", () => {
    let state = EMPTY_REWARD_QUEUE;
    for (let i = 0; i < REWARD_PRESENTATION_CAPS.maxQueue + 3; i += 1) {
      const result = enqueueReward(
        state,
        makeMicroEnvelope({
          grantId: `grant_micro_fill_${String(i).padStart(4, "0")}`,
          eventId: `evt_${i}`,
          priority: i,
        }),
      );
      if (result.ok) state = result.state;
    }
    expect(state.items.length).toBeLessThanOrEqual(REWARD_PRESENTATION_CAPS.maxQueue);
  });

  it("does not replay settled grants", () => {
    const enq = enqueueReward(EMPTY_REWARD_QUEUE, makeMicroEnvelope());
    expect(enq.ok && enq.enqueued).toBe(true);
    if (!enq.ok) return;
    const settled = dequeueReward(enq.state, makeMicroEnvelope().grantId);
    const again = enqueueReward(settled, makeMicroEnvelope());
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.enqueued).toBe(false);
    if (!again.enqueued) expect(again.reason).toBe("already_settled");
  });

  it("discards expired envelopes", () => {
    const result = enqueueReward(
      EMPTY_REWARD_QUEUE,
      makeMicroEnvelope({
        expiresAt: new Date(Date.now() - 5000).toISOString(),
      }),
    );
    expect(result.ok && result.enqueued).toBe(false);
  });

  it("clears session on auth loss helper", () => {
    const enq = enqueueReward(EMPTY_REWARD_QUEUE, makeMicroEnvelope());
    if (!enq.ok) return;
    const cleared = clearAllRewardSession();
    expect(cleared.items).toHaveLength(0);
    expect(cleared.settledGrantIds).toHaveLength(0);
  });
});
