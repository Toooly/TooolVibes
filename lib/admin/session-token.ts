export const adminSessionMaxAgeSeconds = 60 * 60 * 8;

const revokedSessionTokens = new Map<string, number>();

function cleanAdminEnvValue(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  return normalized.replace(/^["']|["']$/g, "");
}

export function getRequiredSessionSecret(): string {
  const secret = cleanAdminEnvValue(process.env.TOOOLVIBES_SESSION_SECRET);

  if (!secret) {
    throw new Error("Missing TOOOLVIBES_SESSION_SECRET");
  }

  return secret;
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;

  let diff = 0;
  for (let index = 0; index < left.length; index++) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return diff === 0;
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function signSessionPayload(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getRequiredSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const hexSignature = Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  return `${payload}.${hexSignature}`;
}

export async function revokeSessionToken(token: string): Promise<void> {
  const expiresAt = Date.now() + adminSessionMaxAgeSeconds * 1000;
  revokedSessionTokens.set(await sha256Hex(token), expiresAt);
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const tokenDigest = await sha256Hex(token);
    const revokedUntil = revokedSessionTokens.get(tokenDigest);
    if (revokedUntil) {
      if (Date.now() <= revokedUntil) return false;
      revokedSessionTokens.delete(tokenDigest);
    }

    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return false;

    const payload = token.slice(0, dotIndex);
    const signature = token.slice(dotIndex + 1);
    const signedPayload = await signSessionPayload(payload);
    const expected = signedPayload.slice(signedPayload.lastIndexOf(".") + 1);

    if (!constantTimeEqual(signature, expected)) return false;

    const issuedAtStr = payload.split(":")[0];
    if (!issuedAtStr) return false;
    const issuedAt = parseInt(issuedAtStr, 36);
    if (Number.isNaN(issuedAt)) return false;

    const maxAgeMs = adminSessionMaxAgeSeconds * 1000;
    if (Date.now() - issuedAt > maxAgeMs) return false;

    return true;
  } catch {
    return false;
  }
}
