import "server-only";

export type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

type StoreRateInput = { opaqueKey: string; limit: number; windowMs: number };

export interface DistributedSecurityStateStore {
  consumeRateLimit(input: StoreRateInput): Promise<RateLimitDecision>;
  peekRateLimit(input: StoreRateInput): Promise<RateLimitDecision>;
  clearRateLimit(opaqueKey: string): Promise<void>;
  revoke(opaqueKey: string, ttlMs: number): Promise<void>;
  isRevoked(opaqueKey: string): Promise<boolean>;
}

export type RateLimitInput = {
  namespace: string;
  identifiers: string[];
  limit: number;
  windowMs: number;
};

export class SecurityStateUnavailableError extends Error {
  constructor(message = "Distributed security state is unavailable", options?: ErrorOptions) {
    super(message, options);
    this.name = "SecurityStateUnavailableError";
  }
}

type SecurityStateServiceBinding = {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
};
type MemoryRecord =
  | { kind: "rate"; count: number; resetAt: number }
  | { kind: "revoked"; expiresAt: number };

function decision(
  allowed: boolean,
  count: number,
  limit: number,
  resetAt: number,
  now: number,
): RateLimitDecision {
  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt,
    retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((resetAt - now) / 1000)),
  };
}

export class DevelopmentMemorySecurityStateStore
  implements DistributedSecurityStateStore
{
  private readonly records = new Map<string, MemoryRecord>();

  async consumeRateLimit(input: StoreRateInput) {
    const now = Date.now();
    const stored = this.records.get(input.opaqueKey);
    const rate =
      stored?.kind === "rate" && stored.resetAt > now
        ? stored
        : { kind: "rate" as const, count: 0, resetAt: now + input.windowMs };
    if (rate.count >= input.limit) {
      return decision(false, rate.count, input.limit, rate.resetAt, now);
    }
    rate.count += 1;
    this.records.set(input.opaqueKey, rate);
    return decision(true, rate.count, input.limit, rate.resetAt, now);
  }

  async peekRateLimit(input: StoreRateInput) {
    const now = Date.now();
    const stored = this.records.get(input.opaqueKey);
    if (stored?.kind !== "rate" || stored.resetAt <= now) {
      this.records.delete(input.opaqueKey);
      return decision(true, 0, input.limit, now + input.windowMs, now);
    }
    return decision(
      stored.count < input.limit,
      stored.count,
      input.limit,
      stored.resetAt,
      now,
    );
  }

  async clearRateLimit(opaqueKey: string) {
    this.records.delete(opaqueKey);
  }

  async revoke(opaqueKey: string, ttlMs: number) {
    this.records.set(opaqueKey, { kind: "revoked", expiresAt: Date.now() + ttlMs });
  }

  async isRevoked(opaqueKey: string) {
    const stored = this.records.get(opaqueKey);
    if (stored?.kind !== "revoked") return false;
    if (stored.expiresAt > Date.now()) return true;
    this.records.delete(opaqueKey);
    return false;
  }
}

function isRateDecision(value: unknown): value is RateLimitDecision {
  const item = value as Partial<RateLimitDecision>;
  return (
    typeof item?.allowed === "boolean" &&
    Number.isSafeInteger(item.limit) &&
    Number(item.limit) >= 1 &&
    Number.isSafeInteger(item.remaining) &&
    Number(item.remaining) >= 0 &&
    Number.isSafeInteger(item.resetAt) &&
    Number(item.resetAt) > 0 &&
    Number.isSafeInteger(item.retryAfterSeconds) &&
    Number(item.retryAfterSeconds) >= 0
  );
}

export class CloudflareServiceSecurityStateStore
  implements DistributedSecurityStateStore
{
  constructor(private readonly service: SecurityStateServiceBinding) {}

  consumeRateLimit(input: StoreRateInput) {
    return this.request("/v1/consume", input, isRateDecision);
  }

  peekRateLimit(input: StoreRateInput) {
    return this.request("/v1/peek", input, isRateDecision);
  }

  async clearRateLimit(opaqueKey: string) {
    await this.request("/v1/clear", { opaqueKey }, isOk);
  }

  async revoke(opaqueKey: string, ttlMs: number) {
    await this.request("/v1/revoke", { opaqueKey, ttlMs }, isOk);
  }

  async isRevoked(opaqueKey: string) {
    return (await this.request("/v1/revoked", { opaqueKey }, isRevoked)).revoked;
  }

  private async request<T>(
    pathname: string,
    body: object,
    validate: (value: unknown) => value is T,
  ): Promise<T> {
    let response: Response;
    try {
      response = await this.service.fetch(`https://security-state.internal${pathname}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new SecurityStateUnavailableError(undefined, { cause: error });
    }
    if (!response.ok) {
      throw new SecurityStateUnavailableError(`Security state returned ${response.status}`);
    }
    let result: unknown;
    try {
      result = await response.json();
    } catch (error) {
      throw new SecurityStateUnavailableError(undefined, { cause: error });
    }
    if (!validate(result)) {
      throw new SecurityStateUnavailableError("Invalid security state response");
    }
    return result;
  }
}

function isOk(value: unknown): value is { ok: true } {
  return (value as { ok?: unknown })?.ok === true;
}
function isRevoked(value: unknown): value is { revoked: boolean } {
  return typeof (value as { revoked?: unknown })?.revoked === "boolean";
}
function clean(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized.replace(/^["']|["']$/g, "") : undefined;
}
function assertKey(namespace: string, identifiers: string[]) {
  if (!/^[a-z0-9-]{1,48}$/.test(namespace)) {
    throw new TypeError("Invalid security-state namespace");
  }
  if (
    identifiers.length < 1 ||
    identifiers.length > 4 ||
    identifiers.some((value) => !value || value.length > 512)
  ) {
    throw new TypeError("Invalid security-state identifiers");
  }
}
function assertRate(input: RateLimitInput) {
  assertKey(input.namespace, input.identifiers);
  if (
    !Number.isSafeInteger(input.limit) || input.limit < 1 || input.limit > 10_000 ||
    !Number.isSafeInteger(input.windowMs) || input.windowMs < 1_000 ||
    input.windowMs > 31 * 24 * 60 * 60 * 1000
  ) {
    throw new TypeError("Invalid rate-limit policy");
  }
}

async function opaqueKey(namespace: string, identifiers: string[], secret: string) {
  assertKey(namespace, identifiers);
  if (secret.length < 32) {
    throw new SecurityStateUnavailableError("Security-state key secret is too short");
  }
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const canonical = [namespace, ...identifiers.map((item) => item.normalize("NFKC").trim())]
    .join("\u0000");
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(canonical));
  const hex = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `v1:${namespace}:${hex}`;
}

export class DistributedSecurityStateClient {
  constructor(
    private readonly store: DistributedSecurityStateStore,
    private readonly secret: string,
  ) {}

  async consumeRateLimit(input: RateLimitInput) {
    assertRate(input);
    return this.store.consumeRateLimit({
      opaqueKey: await opaqueKey(input.namespace, input.identifiers, this.secret),
      limit: input.limit,
      windowMs: input.windowMs,
    });
  }
  async peekRateLimit(input: RateLimitInput) {
    assertRate(input);
    return this.store.peekRateLimit({
      opaqueKey: await opaqueKey(input.namespace, input.identifiers, this.secret),
      limit: input.limit,
      windowMs: input.windowMs,
    });
  }
  async clearRateLimit(input: Pick<RateLimitInput, "namespace" | "identifiers">) {
    await this.store.clearRateLimit(await opaqueKey(input.namespace, input.identifiers, this.secret));
  }
  async revokeValue(input: { namespace: string; value: string; ttlMs: number }) {
    if (!Number.isSafeInteger(input.ttlMs) || input.ttlMs < 1_000 ||
        input.ttlMs > 31 * 24 * 60 * 60 * 1000) {
      throw new TypeError("Invalid revocation TTL");
    }
    await this.store.revoke(await opaqueKey(input.namespace, [input.value], this.secret), input.ttlMs);
  }
  async isValueRevoked(input: { namespace: string; value: string }) {
    return this.store.isRevoked(await opaqueKey(input.namespace, [input.value], this.secret));
  }
}

let memoryStore: DistributedSecurityStateStore | undefined;
async function runtimeStore() {
  const configured = clean(process.env.TOOOLVIBES_SECURITY_STATE_MODE)?.toLowerCase();
  const mode = configured === "service" || configured === "memory" || configured === "deny"
    ? configured
    : process.env.NODE_ENV === "production" ? "service" : "memory";
  if (mode === "deny") throw new SecurityStateUnavailableError("Security state disabled");
  if (mode === "memory") {
    if (process.env.NODE_ENV === "production" && process.env.TOOOLVIBES_E2E_FIXTURES !== "1") {
      throw new SecurityStateUnavailableError("Memory security state forbidden in production");
    }
    memoryStore ??= new DevelopmentMemorySecurityStateStore();
    return memoryStore;
  }
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const context = await getCloudflareContext({ async: true });
    const service = (context.env as { SECURITY_STATE?: SecurityStateServiceBinding }).SECURITY_STATE;
    if (!service) throw new Error("Missing SECURITY_STATE binding");
    return new CloudflareServiceSecurityStateStore(service);
  } catch (error) {
    throw new SecurityStateUnavailableError(undefined, { cause: error });
  }
}
async function runtimeClient() {
  const secret = clean(process.env.TOOOLVIBES_SECURITY_STATE_KEY_SECRET);
  if (!secret) throw new SecurityStateUnavailableError("Missing security-state key secret");
  return new DistributedSecurityStateClient(await runtimeStore(), secret);
}

export async function consumeRateLimit(input: RateLimitInput) {
  return (await runtimeClient()).consumeRateLimit(input);
}
export async function peekRateLimit(input: RateLimitInput) {
  return (await runtimeClient()).peekRateLimit(input);
}
export async function clearRateLimit(input: Pick<RateLimitInput, "namespace" | "identifiers">) {
  await (await runtimeClient()).clearRateLimit(input);
}
export async function revokeValue(input: { namespace: string; value: string; ttlMs: number }) {
  await (await runtimeClient()).revokeValue(input);
}
export async function isValueRevoked(input: { namespace: string; value: string }) {
  return (await runtimeClient()).isValueRevoked(input);
}
export function getRequestAddress(request: Request) {
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflareIp) return cloudflareIp;
  if (process.env.NODE_ENV === "production") return "unknown";
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() || "unknown";
}
export function rateLimitResponseHeaders(item: RateLimitDecision) {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "RateLimit-Limit": String(item.limit),
    "RateLimit-Remaining": String(item.remaining),
    "RateLimit-Reset": String(Math.max(0, Math.ceil((item.resetAt - Date.now()) / 1000))),
  });
  if (!item.allowed) headers.set("Retry-After", String(item.retryAfterSeconds));
  return headers;
}
