import { releaseFeatures } from "@/lib/config/release-features";

/**
 * Cookie-free product unlock. Layouts and public pages MUST use this.
 * Importing `cookies()` from next/headers in a layout makes every route
 * dynamic Worker SSR and trips Cloudflare Error 1102.
 *
 * The coming-soon cookie gate stays in middleware + isPublicGateOpen().
 */
export function isPublicProductOpen() {
  return !releaseFeatures.publicGate.enabled;
}
