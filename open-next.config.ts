import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";
import { releaseStaticCache } from "./lib/cloudflare/release-static-cache";

// Cloudflare Workers Builds and local release path both use Node 22.23.1 + npm.
// Keep prerendered pages in Workers static assets to reduce CPU and latency.
// Workers Paid provides headroom for dynamic requests, not a reason to rerender
// immutable public pages on every hit.
const baseConfig = defineCloudflareConfig({
  incrementalCache: releaseStaticCache(staticAssetsIncrementalCache),
  enableCacheInterception: true,
});

const config = {
  ...baseConfig,
  buildCommand: "npm run build",
};

export default config;
