import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe.each([
  ["services-site", "tooolvibes-servizi", "servizi.tooolvibes.eu"],
  ["projects-site", "tooolvibes-progetti", "progetti.tooolvibes.eu"],
])("%s public HTML delivery policy", (site, worker, hostname) => {
  const headers = readFileSync(resolve(process.cwd(), site, "public/_headers"), "utf8");
  const rules = new Map(headers.trim().split(/\n\s*\n/).map(block => {
    const [path, ...values] = block.split("\n");
    return [path, values.join("\n")];
  }));
  const config = JSON.parse(readFileSync(resolve(process.cwd(), site, "wrangler.jsonc"), "utf8"));

  it("delivers only the two public homepage paths without content transformation", () => {
    expect([...rules].filter(([, value]) => value.includes("no-transform")).map(([path]) => path)).toEqual(["/", "/index.html"]);
    expect(rules.get("/")).toContain("public, max-age=0, must-revalidate, no-transform");
    expect(rules.get("/index.html")).toContain("public, max-age=300, must-revalidate, no-transform");
    expect(rules.get("/assets/*")).toContain("max-age=86400, stale-while-revalidate=604800");
    expect(rules.get("/privacy/*")).not.toContain("no-transform");
  });

  it("retains global CSP, HTTPS and isolation headers including Turnstile support", () => {
    const security = rules.get("/*")!;
    expect(security).toContain("frame-ancestors 'none'");
    expect(security).toContain("X-Content-Type-Options: nosniff");
    expect(security).toContain("Strict-Transport-Security: max-age=31536000; includeSubDomains");
    expect(security).toContain("https://challenges.cloudflare.com");
    expect(security).not.toMatch(/(?:script|connect|frame)-src \*/);
    expect(security).not.toContain("no-transform");
  });

  it("does not extend delivery changes to the main platform or bypass the API Worker", () => {
    expect(config.name).toBe(worker);
    expect(config.routes).toEqual([{ pattern: hostname, custom_domain: true }]);
    expect(config.assets.run_worker_first).toEqual(["/api/*"]);
    expect(config.ratelimits.map((rate: { name: string }) => rate.name)).toContain("CONTACT_RATE_LIMITER");
    expect(config.secrets.required).toContain(site === "services-site" ? "TOOOLVIBES_TURNSTILE_SECRET_KEY" : "PROJECTS_TURNSTILE_SECRET_KEY");
  });
});
