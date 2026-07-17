/**
 * BATCH 29 — Release flag univoche per le destinazioni di navigazione.
 *
 * Le semantics di parsing replicano il registry B04
 * (`lib/config/release-features.ts`): flag booleane via env, default
 * esplicito, errore su valori non booleani. Tutti i default sono `true`
 * perché la configurazione deve riprodurre esattamente l'IA esistente
 * (reversibilità B29); spegnere una flag rimuove la destinazione dalle
 * surface senza cancellare contenuti o route.
 */

export type NavReleaseEnvironment = Readonly<
  Record<string, string | undefined>
>;

type NavReleaseFlagDefinition = Readonly<{
  envKey: string;
  defaultEnabled: boolean;
}>;

function navFlag(envKey: string): NavReleaseFlagDefinition {
  return { envKey, defaultEnabled: true };
}

export const navReleaseFlagRegistry = {
  home: navFlag("TOOOLVIBES_NAV_HOME_ENABLED"),
  catalog: navFlag("TOOOLVIBES_NAV_CATALOG_ENABLED"),
  radar: navFlag("TOOOLVIBES_NAV_RADAR_ENABLED"),
  compare: navFlag("TOOOLVIBES_NAV_COMPARE_ENABLED"),
  shortlist: navFlag("TOOOLVIBES_NAV_SHORTLIST_ENABLED"),
  shop: navFlag("TOOOLVIBES_NAV_SHOP_ENABLED"),
  community: navFlag("TOOOLVIBES_NAV_COMMUNITY_ENABLED"),
  suggest: navFlag("TOOOLVIBES_NAV_SUGGEST_ENABLED"),
  affiliates: navFlag("TOOOLVIBES_NAV_AFFILIATES_ENABLED"),
  tags: navFlag("TOOOLVIBES_NAV_TAGS_ENABLED"),
  adminLogin: navFlag("TOOOLVIBES_NAV_ADMIN_LOGIN_ENABLED"),
  facetVibeCoding: navFlag("TOOOLVIBES_NAV_FACET_VIBE_CODING_ENABLED"),
  facetAiAppBuilder: navFlag("TOOOLVIBES_NAV_FACET_AI_APP_BUILDER_ENABLED"),
  facetNoCode: navFlag("TOOOLVIBES_NAV_FACET_NO_CODE_ENABLED"),
  facetAutomation: navFlag("TOOOLVIBES_NAV_FACET_AUTOMATION_ENABLED"),
  facetAiAgents: navFlag("TOOOLVIBES_NAV_FACET_AI_AGENTS_ENABLED"),
  facetAiVideo: navFlag("TOOOLVIBES_NAV_FACET_AI_VIDEO_ENABLED"),
  shopExternal: navFlag("TOOOLVIBES_NAV_SHOP_EXTERNAL_ENABLED"),
  chiSiamo: navFlag("TOOOLVIBES_NAV_CHI_SAMO_ENABLED"),
  posts: navFlag("TOOOLVIBES_NAV_POSTS_ENABLED"),
  privacy: navFlag("TOOOLVIBES_NAV_PRIVACY_ENABLED"),
  termini: navFlag("TOOOLVIBES_NAV_TERMINI_ENABLED"),
  cookie: navFlag("TOOOLVIBES_NAV_COOKIE_ENABLED"),
  contactEmail: navFlag("TOOOLVIBES_NAV_CONTACT_EMAIL_ENABLED"),
} as const satisfies Record<string, NavReleaseFlagDefinition>;

export type NavReleaseFlagKey = keyof typeof navReleaseFlagRegistry;

export type NavigationRelease = Readonly<Record<NavReleaseFlagKey, boolean>>;

export class NavigationReleaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NavigationReleaseConfigError";
  }
}

function parseBooleanFlag(
  value: string | undefined,
  definition: NavReleaseFlagDefinition,
) {
  if (value === undefined || value.trim() === "") {
    return definition.defaultEnabled;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "on", "yes"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "off", "no"].includes(normalized)) {
    return false;
  }

  throw new NavigationReleaseConfigError(
    `${definition.envKey} must be a boolean flag (true/false or 1/0).`,
  );
}

export function resolveNavigationRelease(
  environment: NavReleaseEnvironment = {},
): NavigationRelease {
  const resolved = {} as Record<NavReleaseFlagKey, boolean>;
  for (const flagKey of Object.keys(
    navReleaseFlagRegistry,
  ) as NavReleaseFlagKey[]) {
    const definition = navReleaseFlagRegistry[flagKey];
    resolved[flagKey] = parseBooleanFlag(
      environment[definition.envKey],
      definition,
    );
  }
  return Object.freeze(resolved);
}

export function readNavigationReleaseEnvironment(): NavReleaseEnvironment {
  // Allowlist costruita dal registry: nessun altro valore env viene letto.
  const environment: Record<string, string | undefined> = {};
  for (const definition of Object.values(navReleaseFlagRegistry)) {
    environment[definition.envKey] = process.env[definition.envKey];
  }
  return environment;
}

/**
 * Release di default: su server riflette le env `TOOOLVIBES_NAV_*`; nel
 * bundle client le variabili non pubbliche non sono inline, quindi valgono i
 * default (tutte ON), che riproducono l'IA corrente. I consumer client
 * possono ricevere una release diversa via `NavigationReleaseProvider`.
 */
export const defaultNavigationRelease = resolveNavigationRelease(
  readNavigationReleaseEnvironment(),
);
