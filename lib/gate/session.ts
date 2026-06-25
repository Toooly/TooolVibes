import { gateCookieName, gateMaxAge } from "./constants";

function getSecret(): string {
  const secret = process.env.TOOOLVIBES_SESSION_SECRET?.trim().replace(/^["']|["']$/g, "");
  if (!secret) {
    throw new Error("TOOOLVIBES_SESSION_SECRET non configurato");
  }
  return secret;
}

function toBase64Url(value: string | Uint8Array): string {
  const binary =
    typeof value === "string"
      ? value
      : String.fromCharCode(...value);

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "=",
  );
  return atob(padded);
}

async function importSigningKey(secret: string, usage: KeyUsage) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  );
}

export async function createGateToken(): Promise<string> {
  const secret = getSecret();
  const issuedAt = Date.now();
  const payload = toBase64Url(
    JSON.stringify({
      v: 1,
      iat: issuedAt,
      exp: issuedAt + gateMaxAge * 1000,
    }),
  );
  const encoder = new TextEncoder();
  const key = await importSigningKey(secret, "sign");
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const sigB64 = toBase64Url(new Uint8Array(sig));
  return `${payload}.${sigB64}`;
}

export async function verifyGateToken(token: string): Promise<boolean> {
  try {
    const secret = getSecret();
    const [payloadB64, sigB64] = token.split(".");
    if (!payloadB64 || !sigB64) return false;

    const encoder = new TextEncoder();
    const key = await importSigningKey(secret, "verify");

    const sigBytes = Uint8Array.from(
      fromBase64Url(sigB64)
        .split("")
        .map((c) => c.charCodeAt(0))
    );
    const payloadBytes = encoder.encode(payloadB64);
    const isValidSignature = await crypto.subtle.verify("HMAC", key, sigBytes, payloadBytes);

    if (!isValidSignature) return false;

    const payload = JSON.parse(fromBase64Url(payloadB64)) as {
      v?: number;
      exp?: number;
    };

    if (payload.v !== 1 || typeof payload.exp !== "number") return false;
    return Date.now() <= payload.exp;
  } catch {
    return false;
  }
}

export { gateCookieName };
