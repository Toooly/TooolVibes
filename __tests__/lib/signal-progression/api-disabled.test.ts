import { vi } from "vitest";
vi.mock("server-only", () => ({}));

import { describe, expect, it } from "vitest";

import { POST as postEvent } from "@/app/api/signal-progression/events/route";
import { GET as getPending } from "@/app/api/signal-progression/pending/route";
import { POST as postAck } from "@/app/api/signal-progression/acknowledge/route";

describe("signal progression APIs with default flags OFF", () => {
  it("returns 404 for event writes", async () => {
    const response = await postEvent(
      new Request("http://localhost/api/signal-progression/events", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer test-token",
        },
        body: JSON.stringify({
          eventType: "tool_saved",
          context: { slug: "blink" },
        }),
      }),
    );
    expect(response.status).toBe(404);
  });

  it("returns 404 for pending and acknowledge", async () => {
    const pending = await getPending(
      new Request("http://localhost/api/signal-progression/pending", {
        headers: { authorization: "Bearer test-token" },
      }),
    );
    expect(pending.status).toBe(404);

    const ack = await postAck(
      new Request("http://localhost/api/signal-progression/acknowledge", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer test-token",
        },
        body: JSON.stringify({
          grantId: "11111111-1111-1111-1111-111111111111",
          status: "dismissed",
        }),
      }),
    );
    expect(ack.status).toBe(404);
  });
});
