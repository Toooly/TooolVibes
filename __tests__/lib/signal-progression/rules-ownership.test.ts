import { vi } from "vitest";
vi.mock("server-only", () => ({}));

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("signal rules ownership", () => {
  it("keeps rule engine behind server-only", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "lib/signal-progression/rules.ts"),
      "utf8",
    );
    expect(source.startsWith('import "server-only"')).toBe(true);
    expect(source).toContain("SIGNAL_REWARD_RULES");
    expect(source).toContain("spDelta");
  });

  it("migration hardens ledger against client writes", () => {
    const sql = fs.readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/20260730000001_signal_progression_backbone.sql",
      ),
      "utf8",
    );
    expect(sql).toContain("signal_engagement_events");
    expect(sql).toContain("signal_reward_grants");
    expect(sql).toContain("accept_signal_engagement");
    expect(sql).toContain("revoke all on table public.signal_reward_grants");
    expect(sql).toContain("grant execute on function public.accept_signal_engagement");
    expect(sql).toMatch(/grant execute on function public\.accept_signal_engagement\([\s\S]*?\) to service_role;/);
    expect(sql).toContain("revoke all on function public.accept_signal_engagement");
    expect(sql).toContain("from public, anon, authenticated");
  });

  it("does not wire product actions in API routes", () => {
    const events = fs.readFileSync(
      path.join(process.cwd(), "app/api/signal-progression/events/route.ts"),
      "utf8",
    );
    expect(events).toContain("canWriteSignalEvents");
    expect(events).not.toContain("toggleSaved");
    expect(events).not.toContain("tool-workspace-store");
  });
});
