import { createActor } from "xstate";
import { describe, expect, it } from "vitest";

import { rewardPresentationMachine } from "@/lib/rewards/machine";
import { DEFAULT_REWARD_PREFERENCES } from "@/lib/rewards/preferences";
import {
  makeMilestoneEnvelope,
  makeMicroEnvelope,
} from "@/lib/rewards/test-fixtures";

function boot(enabled = true, milestones = true) {
  const actor = createActor(rewardPresentationMachine);
  actor.start();
  actor.send({ type: "RUNTIME_ENABLED", enabled });
  actor.send({ type: "MILESTONES_ENABLED", enabled: milestones });
  return actor;
}

function prefsWith(patch: Partial<typeof DEFAULT_REWARD_PREFERENCES>) {
  return { ...DEFAULT_REWARD_PREFERENCES, ...patch };
}

describe("milestone (Tier 3) presentation modes", () => {
  it("presents full when flag on and nothing suppresses", () => {
    const actor = boot(true, true);
    actor.send({ type: "ENQUEUE", envelope: makeMilestoneEnvelope() });
    const snap = actor.getSnapshot();
    expect(snap.context.active?.tier).toBe("milestone");
    expect(snap.context.activePresentation).toBe("full");
    actor.stop();
  });

  it("falls back to static when milestones flag is OFF", () => {
    const actor = boot(true, false);
    actor.send({ type: "ENQUEUE", envelope: makeMilestoneEnvelope() });
    const snap = actor.getSnapshot();
    expect(snap.context.active?.tier).toBe("milestone");
    expect(snap.context.activePresentation).toBe("static");
    actor.stop();
  });

  it("falls back to static under reduced motion", () => {
    const actor = boot(true, true);
    actor.send({ type: "REDUCED_MOTION_CHANGED", preferReducedMotion: true });
    actor.send({ type: "ENQUEUE", envelope: makeMilestoneEnvelope() });
    expect(actor.getSnapshot().context.activePresentation).toBe("static");
    actor.stop();
  });

  it("falls back to static under quiet mode", () => {
    const actor = boot(true, true);
    actor.send({
      type: "PREFERENCES_CHANGED",
      preferences: prefsWith({ quietMode: true }),
    });
    actor.send({ type: "ENQUEUE", envelope: makeMilestoneEnvelope() });
    expect(actor.getSnapshot().context.activePresentation).toBe("static");
    actor.stop();
  });

  it("falls back to static when major celebrations are suppressed", () => {
    const actor = boot(true, true);
    actor.send({
      type: "PREFERENCES_CHANGED",
      preferences: prefsWith({ suppressMajorCelebrations: true }),
    });
    actor.send({ type: "ENQUEUE", envelope: makeMilestoneEnvelope() });
    expect(actor.getSnapshot().context.activePresentation).toBe("static");
    actor.stop();
  });

  it("allows at most one automatic full milestone per day", () => {
    const actor = boot(true, true);
    actor.send({
      type: "ENQUEUE",
      envelope: makeMilestoneEnvelope({ grantId: "grant_mst_a_00000001" }),
    });
    expect(actor.getSnapshot().context.activePresentation).toBe("full");
    actor.send({ type: "PRESENTATION_COMPLETE" });

    actor.send({
      type: "ENQUEUE",
      envelope: makeMilestoneEnvelope({ grantId: "grant_mst_b_00000002" }),
    });
    const snap = actor.getSnapshot();
    // Second valid milestone the same day: acknowledged via static card,
    // never a second automatic celebration.
    expect(snap.context.active?.tier).toBe("milestone");
    expect(snap.context.activePresentation).toBe("static");
    actor.stop();
  });

  it("does not replay a settled milestone envelope", () => {
    const actor = boot(true, true);
    const env = makeMilestoneEnvelope();
    actor.send({ type: "ENQUEUE", envelope: env });
    expect(actor.getSnapshot().context.active?.grantId).toBe(env.grantId);
    actor.send({ type: "DISMISS" });
    actor.send({ type: "ENQUEUE", envelope: env });
    expect(actor.getSnapshot().context.active).toBeNull();
    actor.stop();
  });

  it("milestone static presentation does not consume achievement daily cap", () => {
    const actor = boot(true, false);
    actor.send({ type: "ENQUEUE", envelope: makeMilestoneEnvelope() });
    expect(actor.getSnapshot().context.activePresentation).toBe("static");
    const logged = actor
      .getSnapshot()
      .context.presentationLog.filter((e) => e.tier === "milestone");
    expect(logged).toHaveLength(0);
    actor.stop();
  });

  it("clears milestone state on AUTH_LOST", () => {
    const actor = boot(true, true);
    actor.send({ type: "ENQUEUE", envelope: makeMilestoneEnvelope() });
    actor.send({ type: "AUTH_LOST" });
    const snap = actor.getSnapshot();
    expect(snap.context.active).toBeNull();
    expect(snap.context.queue.items).toHaveLength(0);
    expect(snap.context.presentationLog).toHaveLength(0);
    actor.stop();
  });

  it("micro envelopes keep their normal full presentation", () => {
    const actor = boot(true, true);
    actor.send({ type: "ENQUEUE", envelope: makeMicroEnvelope() });
    const snap = actor.getSnapshot();
    expect(snap.context.active?.tier).toBe("micro");
    expect(snap.context.activePresentation).toBe("full");
    actor.stop();
  });
});
