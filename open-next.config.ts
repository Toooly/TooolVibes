import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Cloudflare Workers Builds and local release path both use Node 22.23.1 + npm.
// Do not force bun here: CF builders do not guarantee bun, and an empty bun.lock
// previously made Git-connected builds fail while manual wrangler deploys worked.
const baseConfig = defineCloudflareConfig();

const config = {
  ...baseConfig,
  buildCommand: "npm run build",
};

export default config;
