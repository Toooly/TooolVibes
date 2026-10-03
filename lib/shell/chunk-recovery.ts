/**
 * Chunk-load error recovery.
 *
 * When a JS chunk fails to load (deploy version skew, network flake, CDN
 * hiccup), Next.js shows a fatal "Application error" screen. This module
 * performs at most ONE automatic recovery reload per browser session
 * (guarded by sessionStorage) for recognized chunk-loading failures only.
 *
 * Never reloads for arbitrary application errors. After one failed recovery,
 * the error boundary is shown — the reload loop is bounded by design.
 */

const RECOVERY_KEY = "__tvChunkRecovery";

function isChunkLoadError(message: string): boolean {
  return (
    message.includes("Loading chunk") ||
    message.includes("ChunkLoadError") ||
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Loading CSS chunk") ||
    message.includes("Failed to load resource") && message.includes("_next/static") ||
    message.includes("Importing a module script failed")
  );
}

function hasRecovered(): boolean {
  try {
    return sessionStorage.getItem(RECOVERY_KEY) === "1";
  } catch {
    return false;
  }
}

function markRecovered(): void {
  try {
    sessionStorage.setItem(RECOVERY_KEY, "1");
  } catch {
    // Storage unavailable — skip recovery to avoid loops.
  }
}

function attemptRecovery(): void {
  if (hasRecovered()) return;
  markRecovered();
  // Use location.reload() — preserves the URL and history entry.
  window.location.reload();
}

/** Install chunk-load error recovery. Call once at app bootstrap. */
export function initChunkRecovery(): void {
  if (typeof window === "undefined") return;

  // Catch uncaught errors from <script> load failures.
  window.addEventListener("error", (event) => {
    const msg = event.message ?? "";
    const target = event.target as HTMLElement | null;
    const isScriptError =
      target?.tagName === "SCRIPT" ||
      target?.tagName === "LINK" ||
      msg.includes("ChunkLoadError") ||
      msg.includes("Loading chunk");
    if (isScriptError && isChunkLoadError(msg)) {
      attemptRecovery();
    }
  }, true);

  // Catch unhandled rejections from dynamic import() failures.
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const msg = reason?.message ?? String(reason ?? "");
    if (isChunkLoadError(msg)) {
      event.preventDefault();
      attemptRecovery();
    }
  });
}
