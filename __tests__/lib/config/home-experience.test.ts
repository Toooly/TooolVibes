import { describe, expect, it } from "vitest";

import {
  createHomeExperienceConfig,
  HOME_INTRO_MODES,
  HOME_LAYOUTS,
  HomeExperienceConfigError,
  readHomeExperienceEnvironment,
} from "@/lib/config/home-experience";

/* BATCH 40 (MOB-704) — flag home time-to-value (pattern B04, modulo
   dedicato lib/config/home-experience.ts per restare disgiunto dai batch
   paralleli su release-features.ts). */

describe("B40 home experience flags (MOB-704)", () => {
  it("espone i modi consentiti per intro e layout", () => {
    expect(HOME_INTRO_MODES).toEqual(["cinematic", "compact", "off"]);
    expect(HOME_LAYOUTS).toEqual(["legacy", "time-to-value"]);
  });

  it("default: intro compact e layout time-to-value (nuova esperienza attiva)", () => {
    const config = createHomeExperienceConfig();

    expect(config.introMode).toBe("compact");
    expect(config.layout).toBe("time-to-value");
  });

  it("env vuota o blank ricade sui default", () => {
    const config = createHomeExperienceConfig({
      TOOOLVIBES_HOME_INTRO_MODE: "   ",
      TOOOLVIBES_HOME_LAYOUT: "",
    });

    expect(config.introMode).toBe("compact");
    expect(config.layout).toBe("time-to-value");
  });

  it("reversibilita': override env ripristina cinematic e legacy", () => {
    const config = createHomeExperienceConfig({
      TOOOLVIBES_HOME_INTRO_MODE: "cinematic",
      TOOOLVIBES_HOME_LAYOUT: "legacy",
    });

    expect(config.introMode).toBe("cinematic");
    expect(config.layout).toBe("legacy");
  });

  it("intro off: la modalita' e' risolta e il gate resta al call site", () => {
    const config = createHomeExperienceConfig({
      TOOOLVIBES_HOME_INTRO_MODE: "off",
    });

    expect(config.introMode).toBe("off");
  });

  it("parsing case-insensitive con trim", () => {
    const config = createHomeExperienceConfig({
      TOOOLVIBES_HOME_INTRO_MODE: "  Cinematic ",
      TOOOLVIBES_HOME_LAYOUT: " Legacy",
    });

    expect(config.introMode).toBe("cinematic");
    expect(config.layout).toBe("legacy");
  });

  it("valori ignoti: errore fail-fast che nomina la env key", () => {
    expect(() =>
      createHomeExperienceConfig({ TOOOLVIBES_HOME_INTRO_MODE: "slow" }),
    ).toThrow(HomeExperienceConfigError);
    expect(() =>
      createHomeExperienceConfig({ TOOOLVIBES_HOME_INTRO_MODE: "slow" }),
    ).toThrow(/TOOOLVIBES_HOME_INTRO_MODE/);
    expect(() =>
      createHomeExperienceConfig({ TOOOLVIBES_HOME_LAYOUT: "grid" }),
    ).toThrow(/TOOOLVIBES_HOME_LAYOUT/);
  });

  it("il config risolto e' frozen", () => {
    const config = createHomeExperienceConfig();
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("readHomeExperienceEnvironment legge solo la allowlist esplicita", () => {
    const environment = readHomeExperienceEnvironment();
    expect(Object.keys(environment).sort()).toEqual([
      "TOOOLVIBES_HOME_INTRO_MODE",
      "TOOOLVIBES_HOME_LAYOUT",
    ]);
  });
});
