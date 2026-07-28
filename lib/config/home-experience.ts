/* Home intro experience flag.

   - introMode: comportamento dell'intro brand 3D montata in app/layout.tsx.
       "cinematic" → esperienza legacy (4s + exit 0.8s, solo skip/pointer).
       "compact"   → brand flash breve (1.4s + exit 0.4s) che si chiude anche
                     con wheel/touchmove/keydown.
       "off"       → intro non montata.

   Valori ignoti → errore fail-fast (come release-features B04). */

export const HOME_INTRO_MODES = ["cinematic", "compact", "off"] as const;
export type HomeIntroMode = (typeof HOME_INTRO_MODES)[number];

export type HomeExperienceEnvironment = Readonly<{
  TOOOLVIBES_HOME_INTRO_MODE?: string;
}>;

export type HomeExperienceConfig = Readonly<{
  introMode: HomeIntroMode;
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
      "off",
    ),
  });
}

export function readHomeExperienceEnvironment(): HomeExperienceEnvironment {
  // Allowlist esplicita: mai esporre secret nel config serializzabile.
  return {
    TOOOLVIBES_HOME_INTRO_MODE: process.env.TOOOLVIBES_HOME_INTRO_MODE,
  };
}

export const homeExperience = createHomeExperienceConfig(
  readHomeExperienceEnvironment(),
);
