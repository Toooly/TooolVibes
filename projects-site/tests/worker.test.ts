import type { ProjectsEnv, ProjectsContext } from "../src/env";
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

describe("TooolVibes Progetti contact contract", () => {
  it("rejects prototype names as contact categories", () => {
    for (const need of ["constructor", "toString", "__proto__"]) expect(parseContactPayload({ ...validPayload, need })).toBeNull();
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  function verificationRequest(token = "token") {
    return new Request("https://progetti.tooolvibes.eu/api/contact", {
      method: "POST", headers: { "Content-Type": "application/json", Origin: "https://progetti.tooolvibes.eu" },
      body: JSON.stringify({ ...validPayload, startedAt: Date.now() - 3_000, turnstileToken: token }),
    });
  }
  function verificationEnv() {
    return {
      RESEND_API_KEY: "re_test", PROJECTS_EMAIL_FROM: "Tooolvibes <info@tooolvibes.eu>", PROJECTS_NOTIFY_EMAIL: "studio@example.it",
      PROJECTS_TURNSTILE_SECRET_KEY: "test-secret", SITE_HOST: "progetti.tooolvibes.eu",
      CONTACT_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) },
      THANK_YOU_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) },
    } as unknown as ProjectsEnv;
  }
  function execution() {
    const pending: Promise<unknown>[] = [];
    return { ctx: { waitUntil: (promise: Promise<unknown>) => pending.push(promise) } as unknown as ProjectsContext, flush: () => Promise.all(pending) };
  }

  it.each([
    ["timeout-or-duplicate", 400, "verification_required"],
    ["invalid-input-response", 400, "verification_required"],
    ["invalid-input-secret", 503, "verification_unavailable"],
  ])("fails closed for %s and never sends email", async (reason, status, code) => {
    const log = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const mockedFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false, "error-codes": [reason] })));
    vi.stubGlobal("fetch", mockedFetch);
    const response = await worker.fetch(verificationRequest(), verificationEnv(), {} as ProjectsContext);
    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({ ok: false, code });
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(JSON.stringify({ event: "projects_verification_failed", reason }));
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/test-secret|GIULIA|EXAMPLE|Studio/);
  });

  it.each([
    { success: true, action: "wrong", hostname: "progetti.tooolvibes.eu" },
    { success: true, action: "projects_contact", hostname: "attacker.example" },
  ])("rejects action/hostname mismatches without email", async (result) => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const mockedFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(result)));
    vi.stubGlobal("fetch", mockedFetch);
    expect((await worker.fetch(verificationRequest(), verificationEnv(), {} as ProjectsContext)).status).toBe(503);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it("retries a temporary verification failure with the same idempotency key", async () => {
    const mockedFetch = vi.fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, action: "projects_contact", hostname: "progetti.tooolvibes.eu" })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "email" })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "confirmation" })));
    vi.stubGlobal("fetch", mockedFetch);
    const job = execution();
    expect((await worker.fetch(verificationRequest(), verificationEnv(), job.ctx)).status).toBe(200);
    await job.flush();
    expect(mockedFetch).toHaveBeenCalledTimes(4);
    const first = mockedFetch.mock.calls[0][1].body as URLSearchParams;
    const second = mockedFetch.mock.calls[1][1].body as URLSearchParams;
    expect(first.get("idempotency_key")).toBe(second.get("idempotency_key"));
  });

  it("rejects missing tokens before contacting providers", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const mockedFetch = vi.fn(); vi.stubGlobal("fetch", mockedFetch);
    expect((await worker.fetch(verificationRequest(""), verificationEnv(), {} as ProjectsContext)).status).toBe(400);
    expect(mockedFetch).not.toHaveBeenCalled();
  });

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

  it("validates Turnstile, notifies all configured recipients and confirms to the lead", async () => {
    const mockedFetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: true, action: "projects_contact", hostname: "progetti.tooolvibes.eu" }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "notification" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "confirmation" }), { status: 200 }));
    vi.stubGlobal("fetch", mockedFetch);

    const pending: Promise<unknown>[] = [];
    const ctx = {
      waitUntil(promise: Promise<unknown>) {
        pending.push(promise);
      },
      passThroughOnException() {},
      props: {},
    } as unknown as ProjectsContext;
    const env = {
      RESEND_API_KEY: "re_test",
      PROJECTS_NOTIFY_EMAIL: "studio@example.it, mattia@example.it, TEODORO@example.it",
      PROJECTS_TURNSTILE_SECRET_KEY: "turnstile-secret",
      PROJECTS_EMAIL_FROM: "Tooolvibes <info@tooolvibes.eu>",
      SITE_HOST: "progetti.tooolvibes.eu",
      CONTACT_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) },
      THANK_YOU_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) },
    } as unknown as ProjectsEnv;
    const request = new Request("https://progetti.tooolvibes.eu/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://progetti.tooolvibes.eu",
      },
      body: JSON.stringify({ ...validPayload, startedAt: Date.now() - 3_000, to: "attacker@example.com", from: "attacker@example.com", bcc: "attacker@example.com" }),
    });

    const response = await worker.fetch(request, env, ctx);
    await Promise.all(pending);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(mockedFetch).toHaveBeenCalledTimes(3);
    expect(mockedFetch.mock.calls[0]?.[0]).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
    expect(mockedFetch.mock.calls[1]?.[0]).toBe("https://api.resend.com/emails");
    const emailRequest = mockedFetch.mock.calls[1]?.[1] as RequestInit;
    const emailBody = JSON.parse(String(emailRequest.body));
    expect(emailBody).toMatchObject({
      from: "Tooolvibes <info@tooolvibes.eu>",
      to: ["studio@example.it", "mattia@example.it", "teodoro@example.it"],
      reply_to: "giulia@example.it",
    });
    expect(emailBody.text).toContain("Origine: progetti.tooolvibes.eu");
    expect(emailBody.bcc).toBeUndefined();
    const confirmationRequest = mockedFetch.mock.calls[2]?.[1] as RequestInit;
    const confirmation = JSON.parse(String(confirmationRequest.body));
    expect(confirmation).toMatchObject({ from: "Tooolvibes <info@tooolvibes.eu>", to: ["giulia@example.it"], reply_to: "info@tooolvibes.eu" });
    expect(confirmation.text).toContain("La tua idea è arrivata.");
    expect(confirmation.text).not.toContain(validPayload.message);
    expect(confirmation.html).toContain('lang="it"');
    expect(confirmation.html).toContain("#050916");
    expect(String(confirmationRequest.body)).not.toContain("attacker@example.com");
    expect((confirmationRequest.headers as Record<string, string>)["Idempotency-Key"]).not.toBe((emailRequest.headers as Record<string, string>)["Idempotency-Key"]);
    expect(env.THANK_YOU_RATE_LIMITER.limit).toHaveBeenCalledWith({ key: expect.stringMatching(/^[a-f0-9]{64}$/u) });
  });

  it.each(["a@b.it\r\nBcc: victim@example.com", "Name <a@example.com>", "a@example.it,other.example", "a..b@example.it", ".a@example.it", "a@-example.it"])("rejects unsafe email %s", (email) => {
    expect(parseContactPayload({ ...validPayload, email })).toBeNull();
  });

  it("never turns confirmation failure into a failed lead or duplicate notification", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const mockedFetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, action: "projects_contact", hostname: "progetti.tooolvibes.eu" })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "internal" })))
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }));
    vi.stubGlobal("fetch", mockedFetch);
    const job = execution();
    expect((await worker.fetch(verificationRequest(), verificationEnv(), job.ctx)).status).toBe(200);
    await job.flush();
    expect(mockedFetch).toHaveBeenCalledTimes(4);
    const first = mockedFetch.mock.calls[2][1] as RequestInit;
    const retry = mockedFetch.mock.calls[3][1] as RequestInit;
    expect(first.body).toBe(retry.body);
    expect(first.headers).toEqual(retry.headers);
  });

  it("rate-limits confirmations per address without dropping the internal lead", async () => {
    const mockedFetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, action: "projects_contact", hostname: "progetti.tooolvibes.eu" })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "internal" })));
    vi.stubGlobal("fetch", mockedFetch);
    const env = verificationEnv();
    env.THANK_YOU_RATE_LIMITER = { limit: vi.fn().mockResolvedValue({ success: false }) } as unknown as RateLimit;
    const job = execution();
    expect((await worker.fetch(verificationRequest(), env, job.ctx)).status).toBe(200);
    await job.flush();
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it("does not send a confirmation when internal delivery fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const mockedFetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, action: "projects_contact", hostname: "progetti.tooolvibes.eu" })))
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }));
    vi.stubGlobal("fetch", mockedFetch);
    const job = execution();
    expect((await worker.fetch(verificationRequest(), verificationEnv(), job.ctx)).status).toBe(502);
    await job.flush();
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });
});
