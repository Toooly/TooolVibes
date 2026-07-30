/** Deterministic comparison-set identity from canonical sorted tool slugs. */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

export function normalizeCompareSlugs(slugs: readonly string[]): string[] {
  const cleaned = slugs
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && SLUG_RE.test(s));
  return Array.from(new Set(cleaned)).sort((a, b) => a.localeCompare(b));
}

/** Stable non-crypto hash suitable for setHash context (8–64 hex). */
export function hashCompareSet(slugs: readonly string[]): string {
  const canonical = normalizeCompareSlugs(slugs).join("|");
  // FNV-1a 32-bit then expand for length
  let h = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i++) {
    h ^= canonical.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const a = (h >>> 0).toString(16).padStart(8, "0");
  let h2 = 0x811c9dc5;
  const mirrored = canonical.split("").reverse().join("");
  for (let i = 0; i < mirrored.length; i++) {
    h2 ^= mirrored.charCodeAt(i);
    h2 = Math.imul(h2, 0x01000193);
  }
  const b = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${a}${b}`;
}
