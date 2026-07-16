import { isValueRevoked, revokeValue } from "@/lib/security/distributed-state";

export const adminSessionMaxAgeSeconds = 60 * 60 * 8;
const adminRevocationNamespace = "admin-session-revoked";

function cleanAdminEnvValue(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  return normalized.replace(/^["']|["']$/g, "");
}

export function getRequiredSessionSecret(): string {
  const secret = cleanAdminEnvValue(process.env.TOOOLVIBES_SESSION_SECRET);
  if (!secret) throw new Error("Missing TOOOLVIBES_SESSION_SECRET");
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

async function getVerifiedExpiry(token: string): Promise<number | null> {
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const payload = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  const signedPayload = await signSessionPayload(payload);
  const expected = signedPayload.slice(signedPayload.lastIndexOf(".") + 1);
  if (!constantTimeEqual(signature, expected)) return null;

  const issuedAtStr = payload.split(":")[0];
  if (!issuedAtStr) return null;
  const issuedAt = parseInt(issuedAtStr, 36);
  if (Number.isNaN(issuedAt)) return null;

  const now = Date.now();
  const expiresAt = issuedAt + adminSessionMaxAgeSeconds * 1000;
  if (issuedAt > now + 60_000 || now > expiresAt) return null;
  return expiresAt;
}

export async function revokeSessionToken(token: string): Promise<void> {
  const expiresAt = await getVerifiedExpiry(token);
  if (!expiresAt) return;
  const ttlMs = expiresAt - Date.now();
  if (ttlMs < 1_000) return;
  await revokeValue({ namespace: adminRevocationNamespace, value: token, ttlMs });
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    if (!(await getVerifiedExpiry(token))) return false;
    return !(await isValueRevoked({ namespace: adminRevocationNamespace, value: token }));
  } catch {
    return false;
  }
}
