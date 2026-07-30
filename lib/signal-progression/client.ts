"use client";

/**
 * Authenticated Signal Progression product-event client.
 * Never calculates SP. Never imports server reward-rule registry.
 * Inert when guest / flags OFF / missing token.
 */

import {
  parseRewardEnvelope,
  type RewardEnvelope,
} from "@/lib/rewards/contracts";
import type { SignalEventEmitResult } from "@/lib/signal-progression/client-types";
import { hashCompareSet } from "@/lib/signal-progression/compare-hash";
import type { RewardPreferences } from "@/lib/rewards/preferences";
import type { SignalProgressHub } from "@/lib/signal-progression/hub-contracts";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

type EnvelopeHandler = (envelope: RewardEnvelope) => void;

let envelopeHandler: EnvelopeHandler | null = null;
let writesEnabled = false;

const inFlight = new Set<string>();
const settled = new Set<string>();

export function configureSignalClient(options: {
  writesEnabled: boolean;
  onEnvelope?: EnvelopeHandler | null;
}) {
  writesEnabled = options.writesEnabled;
  envelopeHandler = options.onEnvelope ?? null;
}

export function setSignalEnvelopeHandler(handler: EnvelopeHandler | null) {
  envelopeHandler = handler;
}

async function getAccessToken(): Promise<string | null> {
  try {
    const session = (await getBrowserSupabaseClient().auth.getSession()).data
      .session;
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

function rememberKey(key: string): "new" | "busy" {
  if (settled.has(key) || inFlight.has(key)) return "busy";
  inFlight.add(key);
  return "new";
}

function finishKey(key: string, ok: boolean) {
  inFlight.delete(key);
  if (ok) {
    settled.add(key);
    if (settled.size > 500) {
      const first = settled.values().next().value;
      if (first) settled.delete(first);
    }
  }
}

function deliverEnvelopes(items: unknown[]) {
  if (!envelopeHandler) return;
  for (const item of items) {
    const parsed = parseRewardEnvelope(item);
    if (parsed.ok) envelopeHandler(parsed.envelope);
  }
}

async function emitEvent(input: {
  eventType: string;
  context?: Record<string, string>;
  clientIdempotencyKey: string;
}): Promise<SignalEventEmitResult> {
  if (!writesEnabled) {
    return { ok: true, status: "skipped" };
  }
  if (rememberKey(input.clientIdempotencyKey) === "busy") {
    return { ok: true, status: "duplicate" };
  }

  try {
    const token = await getAccessToken();
    if (!token) {
      finishKey(input.clientIdempotencyKey, false);
      return { ok: true, status: "skipped" };
    }

    const response = await fetch("/api/signal-progression/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        eventType: input.eventType,
        context: input.context ?? {},
        clientIdempotencyKey: input.clientIdempotencyKey,
      }),
    });

    if (response.status === 404) {
      finishKey(input.clientIdempotencyKey, true);
      return { ok: true, status: "skipped" };
    }

    if (!response.ok) {
      finishKey(input.clientIdempotencyKey, response.status < 500);
      return {
        ok: false,
        error: `http_${response.status}`,
        status: response.status,
      };
    }

    const payload = (await response.json()) as {
      status?: string;
      granted?: boolean;
      spAwarded?: number;
      envelope?: unknown;
      missionEnvelopes?: unknown[];
    };

    const envelopes: unknown[] = [];
    if (payload.envelope) envelopes.push(payload.envelope);
    if (Array.isArray(payload.missionEnvelopes)) {
      envelopes.push(...payload.missionEnvelopes);
    }
    deliverEnvelopes(envelopes);

    finishKey(input.clientIdempotencyKey, true);
    return {
      ok: true,
      status: payload.status === "duplicate" ? "duplicate" : "accepted",
      granted: payload.granted,
      spAwarded: payload.spAwarded,
      envelope: payload.envelope,
    };
  } catch {
    finishKey(input.clientIdempotencyKey, false);
    return { ok: false, error: "network" };
  }
}

export function emitToolSaved(slug: string, isFirstSave: boolean): void {
  if (isFirstSave) {
    void emitEvent({
      eventType: "tool_saved_first_time",
      context: { slug },
      clientIdempotencyKey: `save_first:${slug}`,
    }).then((first) => {
      if (first.ok && first.status === "accepted") return;
      void emitEvent({
        eventType: "tool_saved",
        context: { slug },
        clientIdempotencyKey: `save:${slug}`,
      });
    });
    return;
  }
  void emitEvent({
    eventType: "tool_saved",
    context: { slug },
    clientIdempotencyKey: `save:${slug}`,
  });
}

export function emitToolUnsaved(slug: string): void {
  const day = new Date().toISOString().slice(0, 10);
  void emitEvent({
    eventType: "tool_unsaved",
    context: { slug },
    clientIdempotencyKey: `unsave:${slug}:${day}`,
  });
}

export function emitComparisonCompleted(slugs: readonly string[]): void {
  const setHash = hashCompareSet(slugs);
  if (!setHash || normalizeLen(slugs) < 2) return;
  void emitEvent({
    eventType: "comparison_completed",
    context: { setHash },
    clientIdempotencyKey: `cmp_done:${setHash}`,
  });
}

function normalizeLen(slugs: readonly string[]) {
  return new Set(slugs.map((s) => s.trim()).filter(Boolean)).size;
}

export function emitCollectionOpened(slug: string): void {
  void emitEvent({
    eventType: "collection_opened",
    context: { slug },
    clientIdempotencyKey: `col_open:${slug}`,
  });
}

export function emitCollectionProgressed(slug: string, step: number): void {
  const stepStr = String(Math.max(0, Math.min(999, Math.floor(step))));
  void emitEvent({
    eventType: "collection_progressed",
    context: { slug, step: stepStr },
    clientIdempotencyKey: `col_prog:${slug}:${stepStr}`,
  });
}

export function emitRadarReturned(dateIsoDay?: string): void {
  const date = dateIsoDay ?? new Date().toISOString().slice(0, 10);
  void emitEvent({
    eventType: "radar_returned",
    context: { date },
    clientIdempotencyKey: `radar:${date}`,
  });
}

export async function saveSignalProfileContext(input: {
  focusArea: string;
  primaryGoal: string;
}): Promise<SignalEventEmitResult> {
  try {
    const token = await getAccessToken();
    if (!token) return { ok: true, status: "skipped" };
    const response = await fetch("/api/signal-progression/profile-context", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify(input),
    });
    if (response.status === 404) return { ok: true, status: "skipped" };
    if (!response.ok) {
      return {
        ok: false,
        error: `http_${response.status}`,
        status: response.status,
      };
    }
    const payload = (await response.json()) as { envelopes?: unknown[] };
    deliverEnvelopes(payload.envelopes ?? []);
    return { ok: true, status: "accepted" };
  } catch {
    return { ok: false, error: "network" };
  }
}

export async function fetchSignalHub(): Promise<SignalProgressHub | null> {
  try {
    const token = await getAccessToken();
    if (!token) return null;
    const response = await fetch("/api/signal-progression/hub", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "same-origin",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { hub?: SignalProgressHub };
    return payload.hub ?? null;
  } catch {
    return null;
  }
}

export async function saveSignalPreferences(
  prefs: RewardPreferences,
): Promise<boolean> {
  try {
    const token = await getAccessToken();
    if (!token) return false;
    const response = await fetch("/api/signal-progression/preferences", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        reduceRewardAnimations: prefs.reduceRewardAnimations,
        muteRewardSounds: prefs.muteRewardSounds,
        quietMode: prefs.quietMode,
        suppressAutomaticAchievements: prefs.suppressAutomaticAchievements,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function __resetSignalClientIdempotencyForTests() {
  inFlight.clear();
  settled.clear();
}

export { hashCompareSet, normalizeCompareSlugs } from "@/lib/signal-progression/compare-hash";
