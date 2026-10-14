import { afterEach, describe, expect, it, vi } from "vitest";

import worker, { isPlausibleSubmissionTime, parseContactPayload } from "../src/worker";

const validPayload = {
  name: "Giulia Rossi",
  email: "GIULIA@EXAMPLE.IT",
  company: "Studio Giulia",
  need: "multiple",
  message: "Vorrei collegare il nuovo sito a un flusso di contatto più ordinato.",
  privacyAccepted: true,
  companyWebsite: "",
  startedAt: 1_000,
  turnstileToken: "token",
};

describe("TooolVibes Servizi contact contract", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("normalizes a valid Italian lead payload", () => {
    expect(parseContactPayload(validPayload)).toMatchObject({
      name: "Giulia Rossi",
      email: "giulia@example.it",
      company: "Studio Giulia",
      need: "multiple",
    });
  });

  it("rejects missing consent, invalid needs and short messages", () => {
    expect(parseContactPayload({ ...validPayload, privacyAccepted: false })).toBeNull();
    expect(parseContactPayload({ ...validPayload, need: "unknown" })).toBeNull();
    expect(parseContactPayload({ ...validPayload, message: "Troppo breve" })).toBeNull();
  });

  it("rejects implausibly fast and expired submissions", () => {
    const now = 20_000_000;
    expect(isPlausibleSubmissionTime(now - 2_499, now)).toBe(false);
    expect(isPlausibleSubmissionTime(now - 2_500, now)).toBe(true);
    expect(isPlausibleSubmissionTime(now - 3 * 60 * 60 * 1_000 - 1, now)).toBe(false);
  });

  it("validates Turnstile and dispatches one internal notification", async () => {
    const mockedFetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: true, action: "services_contact", hostname: "servizi.tooolvibes.eu" }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "notification" }), { status: 200 }));
    vi.stubGlobal("fetch", mockedFetch);

    const pending: Promise<unknown>[] = [];
    const ctx = {
      waitUntil(promise: Promise<unknown>) {
        pending.push(promise);
      },
      passThroughOnException() {},
      props: {},
    } as unknown as ExecutionContext;
    const env = {
      RESEND_API_KEY: "re_test",
      SERVICES_NOTIFY_EMAIL: "studio@example.it",
      TOOOLVIBES_TURNSTILE_SECRET_KEY: "turnstile-secret",
      SERVICES_EMAIL_FROM: "Tooolvibes <info@tooolvibes.eu>",
      SITE_HOST: "servizi.tooolvibes.eu",
      CONTACT_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) },
    } as unknown as Env;
    const request = new Request("https://servizi.tooolvibes.eu/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://servizi.tooolvibes.eu",
      },
      body: JSON.stringify({ ...validPayload, startedAt: Date.now() - 3_000 }),
    });

    const response = await worker.fetch(request, env, ctx);
    await Promise.all(pending);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(mockedFetch.mock.calls[0]?.[0]).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
    expect(mockedFetch.mock.calls[1]?.[0]).toBe("https://api.resend.com/emails");
    const emailRequest = mockedFetch.mock.calls[1]?.[1] as RequestInit;
    const emailBody = JSON.parse(String(emailRequest.body));
    expect(emailBody).toMatchObject({
      from: "Tooolvibes <info@tooolvibes.eu>",
      to: ["studio@example.it"],
      reply_to: "giulia@example.it",
    });
    expect(emailBody.text).toContain("Origine: servizi.tooolvibes.eu");
  });
});
