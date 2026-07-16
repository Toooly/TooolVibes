import { beforeEach, describe, expect, it, vi } from "vitest";

const waitlistRepository = vi.hoisted(() => ({
  isEnabled: vi.fn(),
  register: vi.fn(),
}));

vi.mock("@/lib/supabase/waitlist-repository", () => ({
  isWaitlistRegistrationEnabled: waitlistRepository.isEnabled,
  registerWaitlistEntry: waitlistRepository.register,
}));

import { POST } from "@/app/api/waitlist/route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/waitlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    waitlistRepository.isEnabled.mockReturnValue(true);
    waitlistRepository.register.mockResolvedValue({ created: true });
  });

  it("rejects malformed JSON without touching persistence", async () => {
    const response = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Richiesta non valida.",
    });
    expect(waitlistRepository.register).not.toHaveBeenCalled();
  });

  it.each([
    [{ email: "not-an-email" }],
    [{ email: "valid@example.com", source: "spoofed-client-source" }],
    [{ email: "a".repeat(245) + "@example.com" }],
    [{}],
  ])("rejects an invalid or non-canonical payload: %j", async (body) => {
    const response = await POST(jsonRequest(body));

    expect(response.status).toBe(400);
    expect(waitlistRepository.register).not.toHaveBeenCalled();
  });

  it("returns 503 when the server-side kill switch or persistence is unavailable", async () => {
    waitlistRepository.isEnabled.mockReturnValue(false);

    const response = await POST(jsonRequest({ email: "person@example.com" }));

    expect(response.status).toBe(503);
    expect(waitlistRepository.register).not.toHaveBeenCalled();
  });

  it("normalizes email and records only server-controlled source and consent", async () => {
    const response = await POST(
      jsonRequest({ email: "  PERSON@Example.COM  " }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      status: "created",
    });
    expect(waitlistRepository.register).toHaveBeenCalledExactlyOnceWith({
      email: "person@example.com",
      source: "coming-soon",
      consentVersion: "waitlist-v1",
    });
  });

  it("treats a duplicate registration as an idempotent success", async () => {
    waitlistRepository.register.mockResolvedValue({ created: false });

    const response = await POST(jsonRequest({ email: "person@example.com" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "already_registered",
    });
  });

  it("returns a generic 500 response without logging the submitted email", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    waitlistRepository.register.mockRejectedValue(
      new Error("database error for person@example.com"),
    );

    const response = await POST(jsonRequest({ email: "person@example.com" }));

    expect(response.status).toBe(500);
    expect(consoleError).toHaveBeenCalledWith("Waitlist registration failed.");
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "person@example.com",
    );
    consoleError.mockRestore();
  });
});
