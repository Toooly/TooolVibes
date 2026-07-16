type StoredRecord =
  | { kind: "rate"; count: number; resetAt: number }
  | { kind: "revoked"; expiresAt: number };

export type SecurityStateStorageTransaction = {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
};
export type SecurityStateDurableStorage = SecurityStateStorageTransaction & {
  transaction<T>(closure: (transaction: SecurityStateStorageTransaction) => Promise<T>): Promise<T>;
  setAlarm(timestamp: number): Promise<void>;
  deleteAlarm(): Promise<void>;
};
export type SecurityStateDurableState = { storage: SecurityStateDurableStorage };
type Stub = { fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> };
type Namespace = { idFromName(name: string): unknown; get(id: unknown): Stub };
type Env = { SECURITY_STATE_DO: Namespace };
type RateRequest = { limit: number; windowMs: number };

const recordKey = "record";
const opaqueKeyPattern = /^v1:[a-z0-9-]{1,48}:[a-f0-9]{64}$/;

function json(body: object, status = 200) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store", "content-type": "application/json; charset=utf-8" },
  });
}
function rateDecision(
  allowed: boolean,
  count: number,
  limit: number,
  resetAt: number,
  now: number,
) {
  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt,
    retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((resetAt - now) / 1000)),
  };
}
function isRateRequest(value: unknown): value is RateRequest {
  const item = value as Partial<RateRequest>;
  return Number.isSafeInteger(item?.limit) && Number(item.limit) >= 1 &&
    Number(item.limit) <= 10_000 && Number.isSafeInteger(item?.windowMs) &&
    Number(item.windowMs) >= 1_000 && Number(item.windowMs) <= 31 * 24 * 60 * 60 * 1000;
}
async function readSmallJson(request: Request) {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > 2_048) throw new TypeError("Payload too large");
  const text = await request.text();
  if (text.length > 2_048) throw new TypeError("Payload too large");
  return JSON.parse(text) as unknown;
}

export class SecurityStateDurableObject {
  constructor(private readonly state: SecurityStateDurableState) {}

  async fetch(request: Request) {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    try {
      const pathname = new URL(request.url).pathname;
      const body = await readSmallJson(request);
      const now = Date.now();

      if (pathname === "/v1/consume" || pathname === "/v1/peek") {
        if (!isRateRequest(body)) return json({ error: "Invalid request" }, 400);
        const result = await this.state.storage.transaction(async (transaction) => {
          const stored = await transaction.get<StoredRecord>(recordKey);
          const rate = stored?.kind === "rate" && stored.resetAt > now
            ? stored
            : { kind: "rate" as const, count: 0, resetAt: now + body.windowMs };
          if (pathname === "/v1/consume") {
            if (rate.count >= body.limit) {
              return rateDecision(false, rate.count, body.limit, rate.resetAt, now);
            }
            rate.count += 1;
            await transaction.put(recordKey, rate);
            return rateDecision(true, rate.count, body.limit, rate.resetAt, now);
          }
          if (stored?.kind === "rate" && stored.resetAt <= now) {
            await transaction.delete(recordKey);
          }
          return rateDecision(rate.count < body.limit, rate.count, body.limit, rate.resetAt, now);
        });
        if (pathname === "/v1/consume" && result.allowed) {
          await this.state.storage.setAlarm(result.resetAt);
        }
        return json(result);
      }

      if (pathname === "/v1/clear") {
        await this.state.storage.delete(recordKey);
        await this.state.storage.deleteAlarm();
        return json({ ok: true });
      }
      if (pathname === "/v1/revoke") {
        const item = body as { ttlMs?: number };
        if (!Number.isSafeInteger(item.ttlMs) || Number(item.ttlMs) < 1_000 ||
            Number(item.ttlMs) > 31 * 24 * 60 * 60 * 1000) {
          return json({ error: "Invalid request" }, 400);
        }
        const expiresAt = now + Number(item.ttlMs);
        await this.state.storage.put<StoredRecord>(recordKey, { kind: "revoked", expiresAt });
        await this.state.storage.setAlarm(expiresAt);
        return json({ ok: true });
      }
      if (pathname === "/v1/revoked") {
        const stored = await this.state.storage.get<StoredRecord>(recordKey);
        const revoked = stored?.kind === "revoked" && stored.expiresAt > now;
        if (stored?.kind === "revoked" && !revoked) {
          await this.state.storage.delete(recordKey);
          await this.state.storage.deleteAlarm();
        }
        return json({ revoked });
      }
      return json({ error: "Not found" }, 404);
    } catch {
      return json({ error: "Security state unavailable" }, 503);
    }
  }

  async alarm() {
    await this.state.storage.delete(recordKey);
  }
}

const securityStateWorker = {
  async fetch(request: Request, env: Env) {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    try {
      const body = await readSmallJson(request);
      const item = body as { opaqueKey?: string };
      if (!opaqueKeyPattern.test(item.opaqueKey ?? "")) {
        return json({ error: "Invalid request" }, 400);
      }
      const id = env.SECURITY_STATE_DO.idFromName(item.opaqueKey!);
      const forwarded = { ...item };
      delete forwarded.opaqueKey;
      return env.SECURITY_STATE_DO.get(id).fetch(request.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(forwarded),
      });
    } catch {
      return json({ error: "Security state unavailable" }, 503);
    }
  },

};
export default securityStateWorker;
