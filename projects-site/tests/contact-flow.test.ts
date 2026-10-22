import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";

const publicRoot = resolve(process.cwd(), "projects-site/public");
const documents: JSDOM[] = [];
afterEach(() => { documents.splice(0).forEach((dom) => dom.window.close()); vi.restoreAllMocks(); });

async function setup(responses: Array<{ status: number; code?: string }> = [{ status: 200 }], pending = false) {
  const dom = new JSDOM(readFileSync(resolve(publicRoot, "index.html"), "utf8"), { url: "https://progetti.tooolvibes.eu", runScripts: "outside-only" });
  documents.push(dom);
  const w = dom.window;
  w.matchMedia = () => ({ matches: true, addEventListener() {} }) as unknown as MediaQueryList;
  w.AbortSignal = globalThis.AbortSignal as typeof w.AbortSignal;
  let callback: (token: string) => void = () => undefined;
  let expired: () => void = () => undefined;
  let error: () => void = () => undefined;
  let timeout: () => void = () => undefined;
  let execution = 0;
  const execute = vi.fn(() => { execution++; if (!pending) callback(`fresh-${execution}`); });
  const reset = vi.fn();
  w.turnstile = {
    render: (_element: unknown, options: { callback: typeof callback; "expired-callback": typeof expired; "error-callback": typeof error; "timeout-callback": typeof timeout }) => {
      callback = options.callback; expired = options["expired-callback"]; error = options["error-callback"]; timeout = options["timeout-callback"]; return "widget";
    },
    execute, reset, isExpired: () => false,
  };
  const payloads: Record<string, unknown>[] = [];
  w.fetch = vi.fn(async (url: string, options?: RequestInit) => {
    if (url === "/api/config") return new Response(JSON.stringify({ formAvailable: true, siteKey: "production-public-key" }));
    if (url === "/api/contact") {
      payloads.push(JSON.parse(String(options?.body)));
      const result = responses[Math.min(payloads.length - 1, responses.length - 1)];
      return new Response(JSON.stringify({ ok: result.status === 200, code: result.code, message: "Messaggio del server" }), { status: result.status });
    }
    return new Response(null, { status: 204 });
  });
  w.eval(readFileSync(resolve(publicRoot, "app.js"), "utf8"));
  const form = w.document.querySelector("form") as HTMLFormElement;
  for (const [name, value] of Object.entries({ name: "QA Test", email: "qa@example.com", message: "Test della verifica: nessuna email viene inviata.", need: "ecommerce" })) {
    const field = form.elements.namedItem(name) as HTMLInputElement | RadioNodeList;
    field.value = value;
  }
  (form.elements.namedItem("privacyAccepted") as HTMLInputElement).checked = true;
  const submit = () => form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  return { w, form, submit, payloads, execute, reset, resolveToken: (token: string) => callback(token), expire: () => expired(), error: () => error(), timeout: () => timeout() };
}

describe("Projects verification lifecycle", () => {
  it("switches all three explorer scenes and links without motion", async () => {
    const ui = await setup();
    for (const [service, target] of [["app", "#app"], ["software", "#software"], ["ecommerce", "#servizi"]]) {
      ui.w.document.querySelector<HTMLButtonElement>(`[data-journey-select="${service}"]`)!.click();
      expect(ui.w.document.querySelector<HTMLElement>("[data-journey]")!.dataset.active).toBe(service);
      expect(ui.w.document.querySelector("[data-journey-link]")!.getAttribute("href")).toBe(target);
      expect(ui.w.document.querySelector("[data-journey-link]")!.hasAttribute("aria-label")).toBe(false);
      expect([...ui.w.document.querySelectorAll<HTMLElement>("[data-journey-scene]")].filter(scene => !scene.hidden).map(scene => scene.dataset.journeyScene)).toEqual([service]);
    }
  });

  it("names the next action at each step and keeps the service selection intact", async () => {
    const ui = await setup();
    const next = ui.form.querySelector<HTMLButtonElement>("[data-step-next]")!;
    expect(next.textContent).toContain("Raccontaci l’idea");
    next.click();
    expect(ui.w.document.querySelector<HTMLElement>("[data-contact-panel]")!.dataset.step).toBe("1");
    expect(next.textContent).toContain("Vai ai contatti");
    next.click();
    expect(ui.w.document.querySelector<HTMLElement>("[data-contact-panel]")!.dataset.step).toBe("2");
    expect(next.hidden).toBe(true);
    expect(ui.form.querySelector('button[type="submit"]')!.textContent).toContain("Invia il messaggio");
    expect((ui.form.elements.namedItem("need") as RadioNodeList).value).toBe("ecommerce");
  });

  it("acquires a fresh token on submit and sends exactly once", async () => {
    const ui = await setup();
    expect(ui.execute).not.toHaveBeenCalled();
    ui.submit();
    await vi.waitFor(() => expect(ui.payloads).toHaveLength(1));
    expect(ui.payloads[0].turnstileToken).toBe("fresh-1");
    await vi.waitFor(() => expect(ui.form.classList.contains("is-success")).toBe(true));
  });

  it("waits for the challenge and ignores repeated submit clicks", async () => {
    const ui = await setup(undefined, true);
    ui.submit(); ui.submit();
    await vi.waitFor(() => expect(ui.execute).toHaveBeenCalledTimes(1));
    expect(ui.payloads).toHaveLength(0);
    expect((ui.form.querySelector('[type="submit"]') as HTMLButtonElement).disabled).toBe(true);
    ui.resolveToken("fresh-human-token");
    await vi.waitFor(() => expect(ui.payloads).toHaveLength(1));
  });

  it("recovers once from a spent token with a different token", async () => {
    const ui = await setup([{ status: 400, code: "verification_required" }, { status: 200 }]);
    ui.submit();
    await vi.waitFor(() => expect(ui.form.classList.contains("is-success")).toBe(true));
    expect(ui.payloads.map((p) => p.turnstileToken)).toEqual(["fresh-1", "fresh-2"]);
    expect(ui.payloads[0].message).toBe(ui.payloads[1].message);
  });

  it.each(["error", "timeout", "expire"] as const)("keeps the draft and recovers after challenge %s", async (failure) => {
    const ui = await setup(undefined, true);
    ui.submit();
    await vi.waitFor(() => expect(ui.execute).toHaveBeenCalledTimes(1));
    ui[failure]();
    await vi.waitFor(() => expect(ui.w.document.querySelector(".form-status.is-error")).not.toBeNull());
    expect(ui.payloads).toHaveLength(0);
    expect((ui.form.elements.namedItem("email") as HTMLInputElement).value).toBe("qa@example.com");
    ui.submit();
    await vi.waitFor(() => expect(ui.execute).toHaveBeenCalledTimes(2));
    ui.resolveToken("new-human-token");
    await vi.waitFor(() => expect(ui.form.classList.contains("is-success")).toBe(true));
    expect(ui.payloads).toHaveLength(1);
  });

  it("replaces a token older than four minutes before posting", async () => {
    const ui = await setup();
    ui.form.dispatchEvent(new ui.w.FocusEvent("focusin", { bubbles: true }));
    await vi.waitFor(() => expect(ui.w.fetch).toHaveBeenCalled());
    await Promise.resolve();
    ui.resolveToken("stale-token");
    const now = ui.w.Date.now();
    vi.spyOn(ui.w.Date, "now").mockReturnValue(now + 241_000);
    ui.submit();
    await vi.waitFor(() => expect(ui.payloads).toHaveLength(1));
    expect(ui.payloads[0].turnstileToken).toBe("fresh-1");
  });

  it.each([
    [{ status: 400, code: "verification_required" }, { status: 400, code: "verification_required" }],
    [{ status: 503, code: "verification_unavailable" }],
    [{ status: 502 }],
  ])("stops bounded retries and preserves all entered data (%j)", async (...responses) => {
    const ui = await setup(responses);
    ui.submit();
    await vi.waitFor(() => expect(ui.w.document.querySelector(".form-status.is-error")).not.toBeNull());
    expect(ui.payloads).toHaveLength(responses.length);
    expect((ui.form.elements.namedItem("email") as HTMLInputElement).value).toBe("qa@example.com");
    expect((ui.form.querySelector('[type="submit"]') as HTMLButtonElement).disabled).toBe(false);
  });
});
