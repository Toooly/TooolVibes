import { describe, expect, it } from "vitest";

import {
  createHomeExperienceConfig,
  HOME_INTRO_MODES,
  HomeExperienceConfigError,
  readHomeExperienceEnvironment,
} from "@/lib/config/home-experience";

/* BATCH 40 (MOB-704) — flag home time-to-value (pattern B04, modulo
   dedicato lib/config/home-experience.ts per restare disgiunto dai batch
   paralleli su release-features.ts). */

describe("B40 home experience flags (MOB-704)", () => {
  it("espone i modi consentiti per l'intro", () => {
    expect(HOME_INTRO_MODES).toEqual(["cinematic", "compact", "off"]);
  });

  it("default: intro disattivata", () => {
    const config = createHomeExperienceConfig();

    expect(config.introMode).toBe("off");
  });

  it("env vuota o blank ricade sui default", () => {
    const config = createHomeExperienceConfig({
      TOOOLVIBES_HOME_INTRO_MODE: "   ",
    });

    expect(config.introMode).toBe("off");
  });

  it("reversibilita': override env ripristina cinematic", () => {
    const config = createHomeExperienceConfig({
      TOOOLVIBES_HOME_INTRO_MODE: "cinematic",
    });

    expect(config.introMode).toBe("cinematic");
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
    });

    expect(config.introMode).toBe("cinematic");
  });

  it("valori ignoti: errore fail-fast che nomina la env key", () => {
    expect(() =>
      createHomeExperienceConfig({ TOOOLVIBES_HOME_INTRO_MODE: "slow" }),
    ).toThrow(HomeExperienceConfigError);
    expect(() =>
      createHomeExperienceConfig({ TOOOLVIBES_HOME_INTRO_MODE: "slow" }),
    ).toThrow(/TOOOLVIBES_HOME_INTRO_MODE/);
  });

  it("il config risolto e' frozen", () => {
    const config = createHomeExperienceConfig();
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("readHomeExperienceEnvironment legge solo la allowlist esplicita", () => {
    const environment = readHomeExperienceEnvironment();
    expect(Object.keys(environment)).toEqual(["TOOOLVIBES_HOME_INTRO_MODE"]);
  });
});
