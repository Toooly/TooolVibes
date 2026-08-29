import { MAX_REQUEST_BYTES } from "@/lib/community/schema";

export async function readCommunityJson(request: Request) {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > MAX_REQUEST_BYTES) {
    return { ok: false as const, tooLarge: true as const };
  }
  const raw = await request.text();
  if (raw.length > MAX_REQUEST_BYTES) {
    return { ok: false as const, tooLarge: true as const };
  }
  try {
    return { ok: true as const, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false as const, tooLarge: false as const };
  }
}

export function encodeExperienceCursor(publishedAt: string | null, id: string) {
  return Buffer.from(JSON.stringify({ t: publishedAt, i: id }), "utf8").toString(
    "base64url",
  );
}

export function decodeExperienceCursor(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as { t?: unknown; i?: unknown };
    if (typeof parsed.i !== "string" || parsed.i.length < 8) return null;
    return {
      publishedAt: typeof parsed.t === "string" ? parsed.t : null,
      id: parsed.i,
    };
  } catch {
    return null;
  }
}
