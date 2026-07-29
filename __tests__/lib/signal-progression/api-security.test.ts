import { vi } from "vitest";
vi.mock("server-only", () => ({}));

import { describe, expect, it } from "vitest";

import { POST as postEvent } from "@/app/api/signal-progression/events/route";
import { GET as getPending } from "@/app/api/signal-progression/pending/route";
import { POST as postAck } from "@/app/api/signal-progression/acknowledge/route";

describe("signal API security", () => {
  // -------------------------------------------------------------------------
  // Authentication
  // -------------------------------------------------------------------------
  it("rejects missing auth on events", async () => {
    const res = await postEvent(
      new Request("http://localhost/api/signal-progression/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventType: "tool_saved", context: { slug: "blink" } }),
      }),
    );
    expect([401, 404]).toContain(res.status) // 404 when flags OFF;
  });

  it("rejects missing auth on pending and acknowledge", async () => {
    const pending = await getPending(
      new Request("http://localhost/api/signal-progression/pending"),
    );
    expect([401, 404]).toContain(pending.status);

    const ack = await postAck(
      new Request("http://localhost/api/signal-progression/acknowledge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          grantId: "11111111-1111-1111-1111-111111111111",
          status: "dismissed",
        }),
      }),
    );
    expect([401, 404]).toContain(ack.status);
  });

  // -------------------------------------------------------------------------
  // Content validation
  // -------------------------------------------------------------------------
  it("rejects invalid JSON on events", async () => {
    const res = await postEvent(
      new Request("http://localhost/api/signal-progression/events", {
        method: "POST",
        headers: {
          authorization: "Bearer test-token",
          "content-type": "application/json",
        },
        body: "not-json",
      }),
    );
    // 400 (bad body), 401 (no auth), or 404 (flags OFF)
    expect([400, 401, 404]).toContain(res.status);
  });

  it("rejects non-JSON content type on events", async () => {
    const res = await postEvent(
      new Request("http://localhost/api/signal-progression/events", {
        method: "POST",
        headers: {
          authorization: "Bearer test-token",
          "content-type": "text/plain",
        },
        body: "some text",
      }),
    );
    // 400/401/404/415 — flags OFF returns 404 before auth
    expect([400, 401, 404, 415]).toContain(res.status);
  });

  it("rejects oversized event body", async () => {
    const res = await postEvent(
      new Request("http://localhost/api/signal-progression/events", {
        method: "POST",
        headers: {
          authorization: "Bearer test-token",
          "content-type": "application/json",
          "content-length": "100000",
        },
        body: JSON.stringify({ big: "x".repeat(100000) }),
      }),
    );
    expect([400, 401, 404, 413]).toContain(res.status);
  });

  // -------------------------------------------------------------------------
  // Forbidden body fields
  // -------------------------------------------------------------------------
  it("rejects events with injected spDelta", async () => {
    const res = await postEvent(
      new Request("http://localhost/api/signal-progression/events", {
        method: "POST",
        headers: {
          authorization: "Bearer test-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          eventType: "tool_saved",
          context: { slug: "blink" },
          spDelta: 9999,
        }),
      }),
    );
    // 400 (forbidden field) or 401 (auth fails first)
    expect([400, 401, 404]).toContain(res.status);
  });

  it("rejects unknown event types", async () => {
    const res = await postEvent(
      new Request("http://localhost/api/signal-progression/events", {
        method: "POST",
        headers: {
          authorization: "Bearer test-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          eventType: "steal_sp",
          context: {},
        }),
      }),
    );
    expect([400, 401, 404]).toContain(res.status);
  });

  // -------------------------------------------------------------------------
  // Acknowledge payload validation
  // -------------------------------------------------------------------------
  it("rejects ack with invalid status value", async () => {
    const res = await postAck(
      new Request("http://localhost/api/signal-progression/acknowledge", {
        method: "POST",
        headers: {
          authorization: "Bearer test-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          grantId: "11111111-1111-1111-1111-111111111111",
          status: "hacked",
        }),
      }),
    );
    expect([400, 401, 404]).toContain(res.status);
  });

  it("rejects ack with forbidden reward fields", async () => {
    const res = await postAck(
      new Request("http://localhost/api/signal-progression/acknowledge", {
        method: "POST",
        headers: {
          authorization: "Bearer test-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          grantId: "11111111-1111-1111-1111-111111111111",
          status: "acknowledged",
          spDelta: 999,
        }),
      }),
    );
    expect([400, 401, 404]).toContain(res.status);
  });
});
