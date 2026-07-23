import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// `buildCommand` forces the OpenNext `npm run build` invocation to use `bun`.
// Required because the local environment has only bun installed (no node/npm)
// and OpenNext's build helper would otherwise try to invoke `npm run build`
// which fails with ENOENT. The `defineCloudflareConfig()` wrapper currently
// drops unknown top-level fields, so we spread its result and re-attach
// `buildCommand` at the top level here.
//
// This file is the single source of truth for the build invocation command
// on the deploy path. Removing it falls back to the @opennextjs/aws default
// (which inspects the lockfile to pick the packager).
const baseConfig = defineCloudflareConfig();

export default {
  ...baseConfig,
  buildCommand: "bun run build",
};
