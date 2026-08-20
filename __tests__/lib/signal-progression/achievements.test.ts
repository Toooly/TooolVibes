import { vi } from "vitest";
vi.mock("server-only", () => ({}));

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  levelAdvancementTier,
  SIGNAL_ACHIEVEMENT_CODES,
  SIGNAL_ACHIEVEMENT_DEFINITIONS,
} from "@/lib/signal-progression/achievements";
import { SIGNAL_ONBOARDING_MISSIONS } from "@/lib/signal-progression/missions";

const MIGRATION = "20260730000003_signal_achievements_v1.sql";
const sql = fs
  .readFileSync(path.join(process.cwd(), "supabase/migrations", MIGRATION), "utf8")
  .replace(/\s+/g, " ")
  .toLowerCase();

describe("signal achievements registry", () => {
  it("defines exactly the nine canonical V1 achievements", () => {
    expect(SIGNAL_ACHIEVEMENT_CODES).toHaveLength(9);
    expect(SIGNAL_ACHIEVEMENT_CODES).toEqual([
      "first_signal",
      "profile_set",
      "first_verdict",
      "pathfinder",
      "stack_builder",
      "radar_return",
      "curator_mark",
      "strategist",
      "cartographer",
    ]);
    expect(SIGNAL_ACHIEVEMENT_DEFINITIONS).toHaveLength(9);
  });

  it("merged achievements reference real onboarding missions", () => {
    const missionIds = new Set(SIGNAL_ONBOARDING_MISSIONS.map((m) => m.id));
    for (const def of SIGNAL_ACHIEVEMENT_DEFINITIONS) {
      if (def.mergedIntoMission != null) {
        expect(missionIds.has(def.mergedIntoMission as never)).toBe(true);
      }
    }
    const merged = SIGNAL_ACHIEVEMENT_DEFINITIONS.filter(
      (d) => d.mergedIntoMission != null,
    ).map((d) => d.code);
    expect(merged).toEqual([
      "first_signal",
      "first_verdict",
    ]);
  });

  it("cartographer is the only badge-level milestone presentation", () => {
    const milestones = SIGNAL_ACHIEVEMENT_DEFINITIONS.filter(
      (d) => d.presentationTier === "milestone",
    ).map((d) => d.code);
    expect(milestones).toEqual(["cartographer"]);
  });

  it("level advancement tiers: milestone only from Stratega up", () => {
    expect(levelAdvancementTier(2)).toBe("achievement");
    expect(levelAdvancementTier(3)).toBe("achievement");
    expect(levelAdvancementTier(4)).toBe("milestone");
    expect(levelAdvancementTier(5)).toBe("milestone");
  });

  it("missions carrying merged badge context use real achievement codes", () => {
    const withBadge = SIGNAL_ONBOARDING_MISSIONS.filter((m) => m.badgeId);
    expect(withBadge.map((m) => m.badgeId)).toEqual([
      "first_signal",
      "first_verdict",
    ]);
  });
});

describe("phase 6 migration contract", () => {
  it("extends badges with restrained rarity and family columns", () => {
    expect(sql).toContain("family text not null default 'legacy'");
    expect(sql).toContain("rarity text not null default 'common'");
    expect(sql).toMatch(/badges_family_check check \(family in \('legacy', 'signal_v1'\)\)/);
    expect(sql).toMatch(/badges_rarity_check check \(rarity in \('common', 'uncommon', 'rare'\)\)/);
    expect(sql).not.toContain("legendary");
    expect(sql).not.toContain("mythic");
  });

  it("seeds exactly the nine V1 badge definitions", () => {
    for (const code of SIGNAL_ACHIEVEMENT_CODES) {
      expect(sql).toContain(`'${code}'`);
    }
    expect(sql).toContain("on conflict (code) do nothing");
  });

  it("keeps award and evaluation functions service_role only", () => {
    expect(sql).toMatch(
      /revoke all on function public\.award_signal_badge\(uuid, text, text, integer, integer, text, boolean\) from public, anon, authenticated/,
    );
    expect(sql).toMatch(
      /grant execute on function public\.award_signal_badge\(uuid, text, text, integer, integer, text, boolean\) to service_role/,
    );
    expect(sql).toMatch(
      /revoke all on function public\.evaluate_signal_achievements\(uuid, integer, text\) from public, anon, authenticated/,
    );
    expect(sql).toMatch(
      /grant execute on function public\.evaluate_signal_achievements\(uuid, integer, text\) to service_role/,
    );
  });

  it("does not weaken user_badges insert protection", () => {
    expect(sql).not.toMatch(/create policy .*user_badges.*insert/i);
    expect(sql).not.toContain("with check (true)");
  });

  it("adds the suppress_major_celebrations preference with safe default", () => {
    expect(sql).toContain(
      "suppress_major_celebrations boolean not null default false",
    );
  });

  it("verifies stack builder from authoritative workspace state", () => {
    expect(sql).toContain("viewer_workspaces");
    expect(sql).toContain("auth_user_id");
    expect(sql).toContain("saved_count >= 5");
  });

  it("verifies curator mark from real collection slot counts", () => {
    expect(sql).toContain("collection_tool_slots");
    expect(sql).toMatch(/t\.steps >= \(/);
    // never a hardcoded universal step count
    expect(sql).not.toContain("steps >= 3");
  });

  it("radar return requires three distinct days without streak logic", () => {
    expect(sql).toContain("count(distinct e.context->>'date')");
    expect(sql).toContain("radar_days >= 3");
    // no consecutive-day or punitive-reset logic
    expect(sql).not.toContain("consecutive");
    expect(sql).not.toContain("streak_days");
  });

  it("level advancement is once-only per reached level with zero sp", () => {
    expect(sql).toContain("'level_adv:l' || lvl::text");
    expect(sql).toMatch(/values \(\s*p_user_id,\s*synthetic_event\.id,\s*'level_advanced',\s*0,/);
  });
});
