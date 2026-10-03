/**
 * Chunk-load error recovery.
 *
 * When a JS chunk fails to load (deploy version skew, network flake, CDN
 * hiccup), Next.js shows a fatal "Application error" screen. This module
 * performs at most ONE automatic recovery reload per RELEASE / FAILURE KEY
 * (scoped guard, not a session-global flag).
 *
 * Guard architecture:
 *   key = {releaseSha}:{failureSignature}
 *   value = "1" (recovery attempted)
 *
 * - Same failure + same release → NO second reload (loop prevention)
 * - Different release → recovery may fire once again (legitimate new deploy)
 * - Unrelated TypeError / application bug → NEVER reloads
 * - sessionStorage is the storage — cleared when the browser session ends
 * - No secrets, no user data, no PII stored
 *
 * After one failed recovery for a given key, the error boundary is shown.
 * The reload loop is bounded by design: one attempt per failure/release.
 */

const STORAGE_PREFIX = "__tvChunkRecovery:";

function getReleaseSha(): string {
  // The release SHA is embedded at build time via env.
  // Falls back to "dev" in local/test environments.
  return process.env.TOOOLVIBES_RELEASE_SHA ?? "dev";
}

function isChunkLoadError(message: string): boolean {
  return (
    message.includes("Loading chunk") ||
    message.includes("ChunkLoadError") ||
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Loading CSS chunk") ||
    message.includes("Importing a module script failed") ||
    (message.includes("Failed to load resource") && message.includes("_next/static"))
  );
}

function failureKey(message: string): string {
  // Normalize the failure signature: strip dynamic parts (URLs, line numbers).
  const sig = message
    .replace(/https?:\/\/[^\s"']+/g, "<url>")
    .replace(/:\d+:\d+/g, "")
    .slice(0, 120);
  return `${getReleaseSha()}:${sig}`;
}

function hasRecovered(key: string): boolean {
  try {
    return sessionStorage.getItem(STORAGE_PREFIX + key) === "1";
  } catch {
    return true; // Storage unavailable → refuse recovery to avoid loops.
  }
}

function markRecovered(key: string): void {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, "1");
  } catch {
    // Storage unavailable — recovery already refused in hasRecovered.
  }
}

function attemptRecovery(message: string): void {
  const key = failureKey(message);
  if (hasRecovered(key)) return;
  markRecovered(key);
  window.location.reload();
}

/** Install chunk-load error recovery. Call once at app bootstrap. Idempotent. */
let installed = false;
export function initChunkRecovery(): void {
  if (typeof window === "undefined" || installed) return;
  installed = true;

  // Catch uncaught errors from <script>/<link> load failures.
  window.addEventListener("error", (event) => {
    const msg = event.message ?? "";
    const target = event.target as HTMLElement | null;
    const isScriptError =
      target?.tagName === "SCRIPT" ||
      target?.tagName === "LINK" ||
      msg.includes("ChunkLoadError") ||
      msg.includes("Loading chunk");
    if (isScriptError && isChunkLoadError(msg)) {
      attemptRecovery(msg);
    }
  }, true);

  // Catch unhandled rejections from dynamic import() failures.
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const msg = reason?.message ?? String(reason ?? "");
    if (isChunkLoadError(msg)) {
      event.preventDefault();
      attemptRecovery(msg);
    }
  });
}
