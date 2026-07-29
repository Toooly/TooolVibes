import { assign, setup } from "xstate";

import type { RewardEnvelope } from "@/lib/rewards/contracts";
import {
  type RewardQueueState,
  EMPTY_REWARD_QUEUE,
  clearAllRewardSession,
  dequeueReward,
  enqueueReward,
  peekReward,
  purgeExpiredFromQueue,
} from "@/lib/rewards/queue";
import {
  type PresentationLogEntry,
  canPresentTier,
  recordPresentation,
} from "@/lib/rewards/caps";
import {
  type RewardPreferences,
  DEFAULT_REWARD_PREFERENCES,
} from "@/lib/rewards/preferences";
import { isHostPresentableTier } from "@/lib/rewards/contracts";

export type RewardMachineContext = {
  queue: RewardQueueState;
  active: RewardEnvelope | null;
  presentationLog: PresentationLogEntry[];
  preferences: RewardPreferences;
  preferReducedMotion: boolean;
  runtimeEnabled: boolean;
  lastError: string | null;
};

export type RewardMachineEvent =
  | { type: "RUNTIME_ENABLED"; enabled: boolean }
  | { type: "ENQUEUE"; envelope: unknown }
  | { type: "PRESENTATION_COMPLETE" }
  | { type: "DISMISS" }
  | { type: "SKIP" }
  | { type: "PREFERENCES_CHANGED"; preferences: RewardPreferences }
  | { type: "REDUCED_MOTION_CHANGED"; preferReducedMotion: boolean }
  | { type: "ROUTE_CHANGED" }
  | { type: "AUTH_LOST" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "TICK"; nowMs?: number };

function tryActivate(
  context: RewardMachineContext,
  nowMs: number,
): Partial<RewardMachineContext> {
  if (!context.runtimeEnabled) {
    return { active: null };
  }

  let queue = purgeExpiredFromQueue(context.queue, nowMs);
  let log = context.presentationLog;
  let guard = 0;

  while (guard < REWARD_GUARD && queue.items.length > 0) {
    guard += 1;
    const next = peekReward(queue);
    if (!next || !isHostPresentableTier(next.tier)) {
      if (next) queue = dequeueReward(queue, next.grantId);
      else break;
      continue;
    }

    if (
      next.tier === "achievement" &&
      context.preferences.suppressAutomaticAchievements
    ) {
      // Quiet: settle without auto presentation
      queue = dequeueReward(queue, next.grantId);
      continue;
    }

    if (!canPresentTier(next.tier, log, nowMs)) {
      // Cap hit — leave in queue for later; stop activating
      break;
    }

    log = recordPresentation(log, {
      grantId: next.grantId,
      tier: next.tier,
      presentedAtMs: nowMs,
    });

    return {
      queue: dequeueReward(queue, next.grantId),
      active: next,
      presentationLog: log,
      lastError: null,
    };
  }

  return { queue, active: null, presentationLog: log };
}

const REWARD_GUARD = 20;

const initialContext: RewardMachineContext = {
  queue: EMPTY_REWARD_QUEUE,
  active: null,
  presentationLog: [],
  preferences: DEFAULT_REWARD_PREFERENCES,
  preferReducedMotion: false,
  runtimeEnabled: false,
  lastError: null,
};

export const rewardPresentationMachine = setup({
  types: {
    context: {} as RewardMachineContext,
    events: {} as RewardMachineEvent,
  },
}).createMachine({
  id: "rewardPresentation",
  initial: "idle",
  context: initialContext,
  on: {
    RUNTIME_ENABLED: {
      actions: assign(({ event }) => ({ runtimeEnabled: event.enabled })),
    },
    PREFERENCES_CHANGED: {
      actions: assign(({ event }) => ({ preferences: event.preferences })),
    },
    REDUCED_MOTION_CHANGED: {
      actions: assign(({ event }) => ({
        preferReducedMotion: event.preferReducedMotion,
      })),
    },
    AUTH_LOST: {
      target: ".idle",
      actions: assign(() => ({
        queue: clearAllRewardSession(),
        active: null,
        presentationLog: [],
        lastError: null,
      })),
    },
  },
  states: {
    idle: {
      on: {
        ENQUEUE: {
          target: "queueing",
          actions: assign(({ context, event }) => {
            const result = enqueueReward(context.queue, event.envelope);
            if (!result.ok) {
              return { queue: result.state, lastError: result.error };
            }
            return { queue: result.state, lastError: null };
          }),
        },
        RESUME: {
          target: "queueing",
        },
        ROUTE_CHANGED: {
          // preserve queue; do not replay active
          actions: assign(({ context }) => ({
            active: null,
            queue: context.queue,
          })),
        },
        PAUSE: "paused",
      },
    },
    queueing: {
      always: [
        {
          guard: ({ context }) =>
            Boolean(context.runtimeEnabled && peekReward(context.queue)),
          target: "presenting",
          actions: assign(({ context }) =>
            tryActivate(context, Date.now()),
          ),
        },
        { target: "idle" },
      ],
    },
    presenting: {
      always: [
        {
          // if activate failed to set active, go idle
          guard: ({ context }) => context.active == null,
          target: "idle",
        },
      ],
      on: {
        PRESENTATION_COMPLETE: {
          target: "settling",
        },
        DISMISS: {
          target: "dismissed",
        },
        SKIP: {
          target: "dismissed",
        },
        ENQUEUE: {
          actions: assign(({ context, event }) => {
            const result = enqueueReward(context.queue, event.envelope);
            if (!result.ok) {
              return { queue: result.state, lastError: result.error };
            }
            return { queue: result.state, lastError: null };
          }),
        },
        ROUTE_CHANGED: {
          // defer: clear active presentation, keep queue
          target: "idle",
          actions: assign(({ context }) => ({
            active: null,
            queue: context.queue,
          })),
        },
        PAUSE: {
          target: "paused",
          actions: assign(({ context }) => {
            // put active back to front of queue if still presentable
            if (!context.active) return {};
            const requeue = enqueueReward(
              {
                items: context.queue.items,
                settledGrantIds: context.queue.settledGrantIds.filter(
                  (id) => id !== context.active!.grantId,
                ),
              },
              context.active,
            );
            return {
              active: null,
              queue: requeue.ok ? requeue.state : context.queue,
            };
          }),
        },
      },
    },
    settling: {
      always: {
        target: "queueing",
        actions: assign(({ context }) => ({
          active: null,
          queue: context.active
            ? dequeueReward(
                {
                  ...context.queue,
                  // already dequeued on activate — ensure settled
                  settledGrantIds: context.queue.settledGrantIds.includes(
                    context.active.grantId,
                  )
                    ? context.queue.settledGrantIds
                    : [
                        ...context.queue.settledGrantIds,
                        context.active.grantId,
                      ],
                },
                context.active.grantId,
              )
            : context.queue,
        })),
      },
    },
    dismissed: {
      always: {
        target: "queueing",
        actions: assign(({ context }) => ({
          active: null,
          queue: context.active
            ? {
                items: context.queue.items,
                settledGrantIds: context.queue.settledGrantIds.includes(
                  context.active.grantId,
                )
                  ? context.queue.settledGrantIds
                  : [
                      ...context.queue.settledGrantIds,
                      context.active.grantId,
                    ],
              }
            : context.queue,
        })),
      },
    },
    paused: {
      on: {
        RESUME: "queueing",
        ENQUEUE: {
          actions: assign(({ context, event }) => {
            const result = enqueueReward(context.queue, event.envelope);
            if (!result.ok) {
              return { queue: result.state, lastError: result.error };
            }
            return { queue: result.state, lastError: null };
          }),
        },
        ROUTE_CHANGED: {
          actions: assign(() => ({ active: null })),
        },
      },
    },
    error: {
      on: {
        DISMISS: {
          target: "idle",
          actions: assign(() => ({ lastError: null, active: null })),
        },
      },
    },
  },
});

export type RewardPresentationMachine = typeof rewardPresentationMachine;
