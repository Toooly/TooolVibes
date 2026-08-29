/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  PENDING_AUTH_INTENT_STORAGE_KEY,
  PENDING_AUTH_INTENT_TTL_MS,
  clearPendingAuthIntent,
  consumePendingAuthIntent,
  isSafeReturnTo,
  parsePendingAuthIntent,
  readPendingAuthIntent,
  resetPendingAuthIntentConsumptionsForTests,
  writePendingAuthIntent,
} from "@/lib/auth/pending-auth-intent";

describe("pending auth intent", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetPendingAuthIntentConsumptionsForTests();
  });

  afterEach(() => {
    window.localStorage.clear();
    resetPendingAuthIntentConsumptionsForTests();
  });

  it("INTENT-01 valid write/read", () => {
    const written = writePendingAuthIntent({
      toolSlug: "blink",
      desiredStackName: "AI Coding",
      returnTo: "/toools/blink",
      origin: "save-overflow",
    });
    expect(written.status).toBe("ready");
    const read = readPendingAuthIntent();
    expect(read.status).toBe("ready");
    if (read.status !== "ready") return;
    expect(read.intent.payload.toolSlug).toBe("blink");
    expect(read.intent.payload.desiredStackName).toBe("AI Coding");
  });

  it("INTENT-02 localStorage survives a second browsing context simulation", () => {
    writePendingAuthIntent({
      toolSlug: "blink",
      returnTo: "/toools/blink",
    });
    const raw = window.localStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = parsePendingAuthIntent(JSON.parse(raw as string));
    expect(parsed.status).toBe("ready");
  });

  it("INTENT-03 TTL is 30 minutes", () => {
    const now = Date.now();
    const written = writePendingAuthIntent({
      toolSlug: "blink",
      returnTo: "/toools/blink",
      nowMs: now,
    });
    expect(written.status).toBe("ready");
    if (written.status !== "ready") return;
    expect(
      Date.parse(written.intent.expiresAt) - Date.parse(written.intent.createdAt),
    ).toBe(PENDING_AUTH_INTENT_TTL_MS);
  });

  it("INTENT-04 expired is cleared", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    window.localStorage.setItem(
      PENDING_AUTH_INTENT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        id: "intent-expired-01",
        capability: "stack.create",
        payload: { toolSlug: "blink" },
        returnTo: "/toools/blink",
        createdAt: past,
        expiresAt: past,
      }),
    );
    const read = readPendingAuthIntent();
    expect(read.status).toBe("expired");
    expect(window.localStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY)).toBeNull();
  });

  it("INTENT-05 malformed is cleared", () => {
    window.localStorage.setItem(PENDING_AUTH_INTENT_STORAGE_KEY, "{not-json");
    expect(readPendingAuthIntent().status).toBe("invalid");
    expect(window.localStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY)).toBeNull();
  });

  it("INTENT-06 unknown version is rejected", () => {
    const parsed = parsePendingAuthIntent({
      version: 99,
      id: "intent-version-01",
      capability: "stack.create",
      payload: { toolSlug: "blink" },
      returnTo: "/toools/blink",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    expect(parsed.status).toBe("invalid");
    if (parsed.status === "invalid") expect(parsed.reason).toBe("unknown-version");
  });

  it("INTENT-07 unknown capability is rejected", () => {
    const parsed = parsePendingAuthIntent({
      version: 1,
      id: "intent-capability-01",
      capability: "note.private",
      payload: { toolSlug: "blink" },
      returnTo: "/toools/blink",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    expect(parsed.status).toBe("invalid");
  });

  it("INTENT-08 external returnTo is rejected", () => {
    expect(isSafeReturnTo("https://evil.example/phish")).toBe(false);
    const parsed = parsePendingAuthIntent({
      version: 1,
      id: "intent-return-01",
      capability: "stack.create",
      payload: { toolSlug: "blink" },
      returnTo: "https://evil.example/phish",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    expect(parsed.status).toBe("invalid");
  });

  it("INTENT-09 javascript return is rejected", () => {
    expect(isSafeReturnTo("javascript:alert(1)")).toBe(false);
  });

  it("INTENT-10 protocol-relative return is rejected", () => {
    expect(isSafeReturnTo("//evil.example")).toBe(false);
  });

  it("INTENT-11 oversized payload is rejected", () => {
    const huge = "a".repeat(3000);
    window.localStorage.setItem(PENDING_AUTH_INTENT_STORAGE_KEY, huge);
    const read = readPendingAuthIntent();
    expect(read.status).toBe("invalid");
  });

  it("INTENT-12 one-shot consume", () => {
    writePendingAuthIntent({
      toolSlug: "blink",
      returnTo: "/toools/blink",
    });
    const first = consumePendingAuthIntent();
    expect(first.status).toBe("ready");
    const second = consumePendingAuthIntent();
    expect(second.status).toBe("empty");
  });

  it("INTENT-13 second consume is a no-op even if storage is rewritten with same id", () => {
    writePendingAuthIntent({
      toolSlug: "blink",
      returnTo: "/toools/blink",
    });
    const first = consumePendingAuthIntent();
    expect(first.status).toBe("ready");
    if (first.status !== "ready") return;
    window.localStorage.setItem(
      PENDING_AUTH_INTENT_STORAGE_KEY,
      JSON.stringify(first.intent),
    );
    const second = consumePendingAuthIntent();
    expect(second.status).toBe("empty");
  });

  it("INTENT-14 storage failure is safe", () => {
    const parsed = parsePendingAuthIntent(undefined);
    expect(parsed.status).toBe("empty");
    clearPendingAuthIntent();
  });
});
