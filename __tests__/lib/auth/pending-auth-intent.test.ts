/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  PENDING_AUTH_INTENT_CONSUMED_STORAGE_KEY,
  PENDING_AUTH_INTENT_STORAGE_KEY,
  PENDING_AUTH_INTENT_TTL_MS,
  clearPendingAuthIntent,
  consumePendingAuthIntent,
  isSafeReturnTo,
  parsePendingAuthIntent,
  readPendingAuthIntent,
  resetPendingAuthIntentConsumptionsForTests,
  restorePendingAuthIntent,
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
    expect("toolSlug" in read.intent.payload && read.intent.payload.toolSlug).toBe("blink");
    expect((read.intent.payload as { desiredStackName?: string }).desiredStackName).toBe("AI Coding");
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
      capability: "insight.personal",
      payload: { toolSlug: "blink" },
      returnTo: "/toools/blink",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    expect(parsed.status).toBe("invalid");
  });

  it("INTENT-D-01 search.personal stores query only", () => {
    const written = writePendingAuthIntent({
      capability: "search.personal",
      query: "usage:using",
      returnTo: "/archivio",
      origin: "command-palette",
    });
    expect(written.status).toBe("ready");
    if (written.status !== "ready") return;
    expect(written.intent.capability).toBe("search.personal");
    expect(written.intent.payload).toEqual({ query: "usage:using" });
    expect(JSON.stringify(written.intent)).not.toContain("toolSlug");
  });

  it("DEEP-CONT-01 compare.deep stores empty payload", () => {
    const written = writePendingAuthIntent({
      capability: "compare.deep",
      returnTo: "/compare",
      origin: "compare.deep",
    });
    expect(written.status).toBe("ready");
    if (written.status !== "ready") return;
    expect(written.intent.capability).toBe("compare.deep");
    expect(written.intent.payload).toEqual({});
    expect(written.intent.returnTo).toBe("/compare");
    expect(JSON.stringify(written.intent)).not.toContain("note");
    expect(JSON.stringify(written.intent)).not.toContain("toolSlug");
  });

  it("DEEP-CONT-07 compare.deep rejects extra payload keys", () => {
    const parsed = parsePendingAuthIntent({
      version: 1,
      id: "intent-compare-extra-01",
      capability: "compare.deep",
      payload: { toolSlug: "blink" },
      returnTo: "/compare",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    expect(parsed.status).toBe("invalid");
  });

  it("INTENT-D-02 search.personal rejects extra payload keys", () => {
    const parsed = parsePendingAuthIntent({
      version: 1,
      id: "intent-search-extra-01",
      capability: "search.personal",
      payload: { query: "usage:using", toolSlug: "blink" },
      returnTo: "/archivio",
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

  it("INTENT-15 never writes email, jwt, notes, or workspace", () => {
    const written = writePendingAuthIntent({
      toolSlug: "blink",
      desiredStackName: "Podcast",
      returnTo: "/toools/blink",
      origin: "save-overflow",
    });
    expect(written.status).toBe("ready");
    const raw = window.localStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY) ?? "";
    expect(raw).not.toMatch(/email|jwt|access_token|note|decision|workspace/i);
    expect(window.sessionStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY)).toBeNull();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    expect(Object.keys(parsed).sort()).toEqual([
      "capability",
      "createdAt",
      "expiresAt",
      "id",
      "origin",
      "payload",
      "returnTo",
      "version",
    ]);
  });

  it("INTENT-16 extra payload keys fail closed", () => {
    const parsed = parsePendingAuthIntent({
      version: 1,
      id: "intent-extra-01",
      capability: "stack.create",
      payload: { toolSlug: "blink", note: "secret" },
      returnTo: "/toools/blink",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    expect(parsed.status).toBe("invalid");
  });

  it("INTENT-17 encoded and exotic returnTo values fail closed", () => {
    expect(isSafeReturnTo("data:text/html,hi")).toBe(false);
    expect(isSafeReturnTo("/\\evil.example")).toBe(false);
    expect(isSafeReturnTo("/%2f%2fevil.example")).toBe(false);
    expect(isSafeReturnTo("/%2F%2Fevil.example")).toBe(false);
  });

  it("INTENT-18 a new JS realm still honors consume via durable ledger", () => {
    const written = writePendingAuthIntent({
      toolSlug: "blink",
      returnTo: "/toools/blink",
    });
    expect(written.status).toBe("ready");
    if (written.status !== "ready") return;
    expect(consumePendingAuthIntent().status).toBe("ready");
    consumedIdsResetOnlyInMemory();
    window.localStorage.setItem(
      PENDING_AUTH_INTENT_STORAGE_KEY,
      JSON.stringify(written.intent),
    );
    expect(consumePendingAuthIntent().status).toBe("empty");
  });

  it("INTENT-19 restore after skipped replay puts the same intent back", () => {
    const written = writePendingAuthIntent({
      toolSlug: "blink",
      desiredStackName: "Podcast",
      returnTo: "/toools/blink",
    });
    expect(written.status).toBe("ready");
    if (written.status !== "ready") return;
    const consumed = consumePendingAuthIntent();
    expect(consumed.status).toBe("ready");
    if (consumed.status !== "ready") return;
    expect(window.localStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY)).toBeNull();
    const restored = restorePendingAuthIntent(consumed.intent);
    expect(restored.status).toBe("ready");
    const read = readPendingAuthIntent();
    expect(read.status).toBe("ready");
    if (read.status !== "ready") return;
    expect(read.intent.id).toBe(consumed.intent.id);
    expect((read.intent.payload as { desiredStackName?: string }).desiredStackName).toBe("Podcast");
  });
  it("NOTE-CONT-01 note.private intent is accepted", () => {
    const written = writePendingAuthIntent({
      capability: "note.private",
      toolSlug: "blink",
      returnTo: "/toools/blink",
      origin: "note.tool",
    });
    expect(written.status).toBe("ready");
    if (written.status !== "ready") return;
    expect(written.intent.capability).toBe("note.private");
    expect(written.intent.payload).toEqual({ toolSlug: "blink" });
  });

  it("NOTE-CONT-02 note.private payload cannot include note text", () => {
    const parsed = parsePendingAuthIntent({
      version: 1,
      id: "intent-note-text-01",
      capability: "note.private",
      payload: { toolSlug: "blink", note: "secret" },
      returnTo: "/toools/blink",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    expect(parsed.status).toBe("invalid");
  });

  it("NOTE-CONT-06 unsafe note.private payload is rejected", () => {
    const parsed = parsePendingAuthIntent({
      version: 1,
      id: "intent-note-stack-01",
      capability: "note.private",
      payload: { toolSlug: "blink", desiredStackName: "AI Coding" },
      returnTo: "/toools/blink",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    expect(parsed.status).toBe("invalid");
  });
});

function consumedIdsResetOnlyInMemory() {
  // Durable ledger stays; only the in-memory Set is cleared to mimic a new tab.
  const ledger = window.localStorage.getItem(PENDING_AUTH_INTENT_CONSUMED_STORAGE_KEY);
  resetPendingAuthIntentConsumptionsForTests();
  if (ledger) {
    window.localStorage.setItem(PENDING_AUTH_INTENT_CONSUMED_STORAGE_KEY, ledger);
  }
}
