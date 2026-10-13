import type { IncrementalCache } from "@opennextjs/aws/types/overrides.js";

/** Reuse only this build's immutable page artifacts; never cache HTML in the browser/CDN. */
export function releaseStaticCache(base: IncrementalCache): IncrementalCache {
  return {
    // OpenNext selects its cache-population step by the provider's name.
    name: base.name,
    async get(key, type) {
      const entry = await base.get(key, type);
      const value = entry?.value;
      if (value && "type" in value && (value.type === "app" || value.type === "page")) {
        value.revalidate = false;
        value.meta = {
          ...value.meta,
          headers: { ...value.meta?.headers, "cache-control": "no-store" },
        };
        entry.shouldBypassTagCache = true;
      }
      return entry;
    },
    set: base.set.bind(base),
    delete: base.delete.bind(base),
  };
}
