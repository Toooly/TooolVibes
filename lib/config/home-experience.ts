/* BATCH 40 (MOB-704) — Home time-to-value experience flags (pattern B04).

   Modulo dedicato (non release-features.ts) per restare disgiunto dai batch
   paralleli. Due dimensioni indipendenti e reversibili via env:

   - introMode: comportamento dell'intro brand 3D montata in app/layout.tsx.
       "cinematic" → esperienza legacy (4s + exit 0.8s, solo skip/pointer).
       "compact"   → default: brand flash breve (1.4s + exit 0.4s) che si
                     chiude anche con wheel/touchmove/keydown: nessuna attesa
                     obbligatoria prima della CTA primaria.
       "off"       → intro non montata.
   - layout: composizione della home marketing.
       "legacy"        → hero mobile 100svh + discovery stage 100svh.
       "time-to-value" → default: hero compatto con CTA + chip tool nel primo
                         viewport, discovery stage a flusso (non piu' 100svh
                         forzato), margini mobile corretti.

   Valori ignoti → errore fail-fast (come release-features B04). */

export const HOME_INTRO_MODES = ["cinematic", "compact", "off"] as const;
export type HomeIntroMode = (typeof HOME_INTRO_MODES)[number];

export const HOME_LAYOUTS = ["legacy", "time-to-value"] as const;
export type HomeLayout = (typeof HOME_LAYOUTS)[number];

export type HomeExperienceEnvironment = Readonly<{
  TOOOLVIBES_HOME_INTRO_MODE?: string;
  TOOOLVIBES_HOME_LAYOUT?: string;
}>;

export type HomeExperienceConfig = Readonly<{
  introMode: HomeIntroMode;
  layout: HomeLayout;
}>;

export class HomeExperienceConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HomeExperienceConfigError";
  }
}

function parseMode<Mode extends string>(
  value: string | undefined,
  envKey: string,
  allowedModes: readonly Mode[],
  fallback: Mode,
): Mode {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if ((allowedModes as readonly string[]).includes(normalized)) {
    return normalized as Mode;
  }

  throw new HomeExperienceConfigError(
    `${envKey} has unknown mode "${value}". Allowed modes: ${allowedModes.join(", ")}.`,
  );
}

export function createHomeExperienceConfig(
  environment: HomeExperienceEnvironment = {},
): HomeExperienceConfig {
  return Object.freeze({
    introMode: parseMode(
      environment.TOOOLVIBES_HOME_INTRO_MODE,
      "TOOOLVIBES_HOME_INTRO_MODE",
      HOME_INTRO_MODES,
      "compact",
    ),
    layout: parseMode(
      environment.TOOOLVIBES_HOME_LAYOUT,
      "TOOOLVIBES_HOME_LAYOUT",
      HOME_LAYOUTS,
      "time-to-value",
    ),
  });
}

export function readHomeExperienceEnvironment(): HomeExperienceEnvironment {
  // Allowlist esplicita: mai esporre secret nel config serializzabile.
  return {
    TOOOLVIBES_HOME_INTRO_MODE: process.env.TOOOLVIBES_HOME_INTRO_MODE,
    TOOOLVIBES_HOME_LAYOUT: process.env.TOOOLVIBES_HOME_LAYOUT,
  };
}

export const homeExperience = createHomeExperienceConfig(
  readHomeExperienceEnvironment(),
);
