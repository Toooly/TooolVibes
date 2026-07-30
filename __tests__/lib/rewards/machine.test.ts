import { createActor } from "xstate";
import { describe, expect, it } from "vitest";

import { rewardPresentationMachine } from "@/lib/rewards/machine";
import { makeAchievementEnvelope, makeMicroEnvelope } from "@/lib/rewards/test-fixtures";

function boot(enabled = true) {
  const actor = createActor(rewardPresentationMachine);
  actor.start();
  actor.send({ type: "RUNTIME_ENABLED", enabled });
  return actor;
}

describe("reward presentation machine", () => {
  it("stays inert when runtime disabled", () => {
    const actor = boot(false);
    actor.send({ type: "ENQUEUE", envelope: makeMicroEnvelope() });
    // enqueue still allowed into queue but presenting requires enabled - actually ENQUEUE works
    // RUNTIME disabled: tryActivate returns active null
    expect(actor.getSnapshot().context.active).toBeNull();
    actor.stop();
  });

  it("presents a micro envelope when enabled", () => {
    const actor = boot(true);
    actor.send({ type: "ENQUEUE", envelope: makeMicroEnvelope() });
    const snap = actor.getSnapshot();
    expect(snap.context.active?.tier).toBe("micro");
    expect(snap.value).toBe("presenting");
    actor.send({ type: "PRESENTATION_COMPLETE" });
    expect(actor.getSnapshot().context.active).toBeNull();
    actor.stop();
  });

  it("dismisses with DISMISS and does not replay", () => {
    const actor = boot(true);
    const env = makeAchievementEnvelope();
    actor.send({ type: "ENQUEUE", envelope: env });
    expect(actor.getSnapshot().context.active?.grantId).toBe(env.grantId);
    actor.send({ type: "DISMISS" });
    expect(actor.getSnapshot().context.active).toBeNull();
    actor.send({ type: "ENQUEUE", envelope: env });
    expect(actor.getSnapshot().context.active).toBeNull();
    actor.stop();
  });

  it("clears private state on AUTH_LOST", () => {
    const actor = boot(true);
    actor.send({ type: "ENQUEUE", envelope: makeMicroEnvelope() });
    actor.send({ type: "AUTH_LOST" });
    const snap = actor.getSnapshot();
    expect(snap.context.queue.items).toHaveLength(0);
    expect(snap.context.active).toBeNull();
    actor.stop();
  });

  it("clears active on ROUTE_CHANGED without dropping queue peers", () => {
    const actor = boot(true);
    actor.send({
      type: "ENQUEUE",
      envelope: makeMicroEnvelope({ grantId: "grant_micro_a________", priority: 1 }),
    });
    actor.send({
      type: "ENQUEUE",
      envelope: makeMicroEnvelope({
        grantId: "grant_micro_b________",
        eventId: "evt_b",
        priority: 1,
      }),
    });
    // first is active, second queued
    expect(actor.getSnapshot().context.active).not.toBeNull();
    const queuedBefore = actor.getSnapshot().context.queue.items.length;
    actor.send({ type: "ROUTE_CHANGED" });
    expect(actor.getSnapshot().context.active).toBeNull();
    expect(actor.getSnapshot().context.queue.items.length).toBeGreaterThanOrEqual(
      queuedBefore,
    );
    actor.stop();
  });

  it("suppresses automatic achievements when preferred", () => {
    const actor = boot(true);
    actor.send({
      type: "PREFERENCES_CHANGED",
      preferences: {
        version: 1,
        reduceRewardAnimations: false,
        muteRewardSounds: false,
        suppressAutomaticAchievements: true,
        quietMode: false,
        suppressMajorCelebrations: false,
      },
    });
    actor.send({ type: "ENQUEUE", envelope: makeAchievementEnvelope() });
    expect(actor.getSnapshot().context.active).toBeNull();
    actor.stop();
  });
});
