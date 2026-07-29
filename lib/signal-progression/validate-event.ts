import "server-only";

import {
  type SignalEventIngestInput,
  assertNoClientRewardFields,
  signalEventIngestSchema,
} from "@/lib/signal-progression/contracts";
import {
  type SignalRewardRule,
  getSignalRule,
  isSignalEventType,
} from "@/lib/signal-progression/rules";

export type ValidatedSignalEvent = {
  input: SignalEventIngestInput;
  rule: SignalRewardRule;
  context: Record<string, string>;
  dedupeKey: string;
};

export type ValidateSignalEventResult =
  | { ok: true; value: ValidatedSignalEvent }
  | { ok: false; error: string; status: number };

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HASH_RE = /^[a-f0-9]{8,64}$/i;

export function validateSignalEventPayload(
  body: unknown,
  userId: string,
): ValidateSignalEventResult {
  const forbidden = assertNoClientRewardFields(body);
  if (forbidden) {
    return { ok: false, error: forbidden, status: 400 };
  }

  const parsed = signalEventIngestSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, error: "invalid_payload", status: 400 };
  }

  const input = parsed.data;
  if (!isSignalEventType(input.eventType)) {
    return { ok: false, error: "unknown_event", status: 400 };
  }

  const rule = getSignalRule(input.eventType);
  const context = input.context ?? {};
  const keys = Object.keys(context);

  for (const key of keys) {
    if (!rule.allowedContextKeys.includes(key)) {
      return { ok: false, error: `unexpected_context:${key}`, status: 400 };
    }
  }
  for (const required of rule.requiredContextKeys) {
    if (!context[required]) {
      return { ok: false, error: `missing_context:${required}`, status: 400 };
    }
  }

  if (context.slug && !SLUG_RE.test(context.slug)) {
    return { ok: false, error: "invalid_slug", status: 400 };
  }
  if (context.date && !DATE_RE.test(context.date)) {
    return { ok: false, error: "invalid_date", status: 400 };
  }
  if (context.setHash && !HASH_RE.test(context.setHash)) {
    return { ok: false, error: "invalid_set_hash", status: 400 };
  }
  if (context.step && !/^\d{1,3}$/.test(context.step)) {
    return { ok: false, error: "invalid_step", status: 400 };
  }

  if (input.occurredAt) {
    const occurred = Date.parse(input.occurredAt);
    const now = Date.now();
    if (Number.isNaN(occurred) || occurred > now + 60_000 || occurred < now - 86_400_000 * 7) {
      return { ok: false, error: "invalid_occurred_at", status: 400 };
    }
  }

  const dedupeKey = rule.buildDedupeKey(userId, context);
  if (dedupeKey.length < 3 || dedupeKey.length > 256) {
    return { ok: false, error: "invalid_dedupe", status: 500 };
  }

  return {
    ok: true,
    value: { input, rule, context, dedupeKey },
  };
}
