import {
  type RewardEnvelope,
  isEnvelopeExpired,
  isHostPresentableTier,
  parseRewardEnvelope,
} from "@/lib/rewards/contracts";
import { REWARD_PRESENTATION_CAPS } from "@/lib/rewards/caps";

export type RewardQueueState = {
  items: RewardEnvelope[];
  /** grantIds presented or dismissed this session — never replay */
  settledGrantIds: string[];
};

export const EMPTY_REWARD_QUEUE: RewardQueueState = {
  items: [],
  settledGrantIds: [],
};

function sortQueue(items: RewardEnvelope[]): RewardEnvelope[] {
  return [...items].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    // stable: older first when same priority
    return Date.parse(a.createdAt) - Date.parse(b.createdAt);
  });
}

export type EnqueueResult =
  | { ok: true; state: RewardQueueState; enqueued: true }
  | { ok: true; state: RewardQueueState; enqueued: false; reason: string }
  | { ok: false; state: RewardQueueState; error: string };

export function enqueueReward(
  state: RewardQueueState,
  input: unknown,
  nowMs: number = Date.now(),
): EnqueueResult {
  const parsed = parseRewardEnvelope(input);
  if (!parsed.ok) {
    return { ok: false, state, error: parsed.error };
  }
  const envelope = parsed.envelope;

  if (!isHostPresentableTier(envelope.tier)) {
    return {
      ok: true,
      state,
      enqueued: false,
      reason: `tier_${envelope.tier}_not_hosted`,
    };
  }

  if (isEnvelopeExpired(envelope, nowMs)) {
    return { ok: true, state, enqueued: false, reason: "expired" };
  }

  if (state.settledGrantIds.includes(envelope.grantId)) {
    return { ok: true, state, enqueued: false, reason: "already_settled" };
  }

  if (state.items.some((item) => item.grantId === envelope.grantId)) {
    return { ok: true, state, enqueued: false, reason: "duplicate_in_queue" };
  }

  let items = [...state.items, envelope];
  items = sortQueue(items);

  if (items.length > REWARD_PRESENTATION_CAPS.maxQueue) {
    // drop lowest priority / newest tail after sort — keep head
    items = items.slice(0, REWARD_PRESENTATION_CAPS.maxQueue);
  }

  // if our envelope was dropped by bound, report
  if (!items.some((item) => item.grantId === envelope.grantId)) {
    return { ok: true, state, enqueued: false, reason: "queue_full" };
  }

  return {
    ok: true,
    state: { items, settledGrantIds: state.settledGrantIds },
    enqueued: true,
  };
}

export function peekReward(
  state: RewardQueueState,
): RewardEnvelope | null {
  return state.items[0] ?? null;
}

export function dequeueReward(
  state: RewardQueueState,
  grantId: string,
): RewardQueueState {
  return {
    items: state.items.filter((item) => item.grantId !== grantId),
    settledGrantIds: state.settledGrantIds.includes(grantId)
      ? state.settledGrantIds
      : [...state.settledGrantIds, grantId],
  };
}

export function markSettledWithoutPresenting(
  state: RewardQueueState,
  grantId: string,
): RewardQueueState {
  return dequeueReward(state, grantId);
}

export function clearRewardQueue(state: RewardQueueState): RewardQueueState {
  return {
    items: [],
    settledGrantIds: [...state.settledGrantIds],
  };
}

export function clearAllRewardSession(): RewardQueueState {
  return {
    items: [],
    settledGrantIds: [],
  };
}

export function purgeExpiredFromQueue(
  state: RewardQueueState,
  nowMs: number = Date.now(),
): RewardQueueState {
  return {
    ...state,
    items: state.items.filter((item) => !isEnvelopeExpired(item, nowMs)),
  };
}
