/** Recover failed application assets once per page and release in a browser session.
 * A new document clears failed module promises; retrying React alone does not.
 * Only recognized application asset errors trigger a reload.
 */
import { DOCUMENT_RECOVERY_PREFIX } from "@/lib/shell/document-startup-recovery";

export function isChunkLoadError(message: string): boolean {
  return (
    message.includes("Loading chunk") ||
    message.includes("ChunkLoadError") ||
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Loading CSS chunk") ||
    message.includes("Importing a module script failed") ||
    (message.includes("Failed to load resource") && message.includes("_next/static"))
  );
}

/** Loaded-page recovery. Pending navigation belongs to Next, preserving its target. */
export function recoverChunkLoadError(error: unknown): boolean {
  if (typeof window === "undefined") return false;
  const message = typeof error === "string" ? error : (error as { message?: unknown } | null)?.message;
  if (typeof message !== "string" || !isChunkLoadError(message)) return false;
  const path = window.location.pathname ?? "/";
  const key = `${DOCUMENT_RECOVERY_PREFIX}${process.env.TOOOLVIBES_RELEASE_SHA ?? "development"}:${path}:attempted`;
  try {
    if (sessionStorage.getItem(key) === "1") return false;
    sessionStorage.setItem(key, "1");
  } catch {
    // Without a persistent guard, automatic recovery could loop.
    return false;
  }
  window.location.reload();
  return true;
}
