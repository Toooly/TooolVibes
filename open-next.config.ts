import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";
import { releaseStaticCache } from "./lib/cloudflare/release-static-cache";

// Cloudflare Workers Builds and local release path both use Node 22.23.1 + npm.
// Prerendered pages are served from Workers static assets so Free-plan CPU
// is not spent re-running Next on every public hit (Error 1102).
const baseConfig = defineCloudflareConfig({
  incrementalCache: releaseStaticCache(staticAssetsIncrementalCache),
  enableCacheInterception: true,
});

const config = {
  ...baseConfig,
  buildCommand: "npm run build",
};

export default config;
