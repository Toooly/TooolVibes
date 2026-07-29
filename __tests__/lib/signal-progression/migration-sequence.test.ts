import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("migration execution sequence", () => {
  it("places signal progression after all gamification prerequisites", () => {
    const migrationDir = path.join(process.cwd(), "supabase/migrations");
    const files = fs.readdirSync(migrationDir).sort();

    const gamificationCoreIdx = files.findIndex(
      (f) => f === "20260608000001_gamification_core.sql",
    );
    const gamificationRpcIdx = files.findIndex(
      (f) => f === "20260608000006_gamification_rpc.sql",
    );
    const signalIdx = files.findIndex(
      (f) => f === "20260730000001_signal_progression_backbone.sql",
    );

    expect(gamificationCoreIdx).toBeGreaterThan(-1);
    expect(gamificationRpcIdx).toBeGreaterThan(-1);
    expect(signalIdx).toBeGreaterThan(-1);
    expect(gamificationCoreIdx).toBeLessThan(signalIdx);
    expect(gamificationRpcIdx).toBeLessThan(signalIdx);
  });

  it("uses create table if not exists for additive safety", () => {
    const sql = fs.readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/20260730000001_signal_progression_backbone.sql",
      ),
      "utf8",
    );
    const creates = sql.match(/create table if not exists/g) ?? [];
    expect(creates.length).toBe(4);
  });

  it("uses create or replace for idempotent function deployment", () => {
    const sql = fs.readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/20260730000001_signal_progression_backbone.sql",
      ),
      "utf8",
    );
    const fnCreates = sql.match(/create or replace function/g) ?? [];
    expect(fnCreates.length).toBe(3);
  });

  it("drops policies before recreating (idempotent replay)", () => {
    const sql = fs.readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/20260730000001_signal_progression_backbone.sql",
      ),
      "utf8",
    );
    const drops = sql.match(/drop policy if exists/g) ?? [];
    expect(drops.length).toBeGreaterThanOrEqual(4);
  });
});
