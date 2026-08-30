import type { CommunityExperiencePublic } from "@/lib/community/schema";

export const COMMUNITY_QA_FIXTURE_ENV_KEY = "TOOOLVIBES_COMMUNITY_QA_FIXTURE";

export function isCommunityQaFixtureEnabled() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env[COMMUNITY_QA_FIXTURE_ENV_KEY] === "1"
  );
}

const FIXTURE_IDS = {
  first: "9a111111-1111-4111-8111-111111111111",
  second: "9a222222-2222-4222-8222-222222222222",
  third: "9a333333-3333-4333-8333-333333333333",
} as const;

export function communityQaFixtureExperiences(
  toolSlug: string,
): CommunityExperiencePublic[] {
  const at = "2026-08-30T12:00:00.000Z";
  return [
    {
      id: FIXTURE_IDS.first,
      toolSlug,
      displayName: "QA Anna",
      useCase: "Landing page per clienti",
      body: "La uso ogni settimana per costruire landing rapide: la struttura delle sezioni mi fa risparmiare un bel po' di tempo e il risultato resta coerente con il resto del progetto. (fixture QA)",
      pros: ["Anteprima molto rapida", "Componenti riusabili tra pagine"],
      limits: ["Poca collaborazione in tempo reale"],
      durationBucket: "months_6_12",
      switchedFromSlug: "weweb",
      switchedFromLabel: null,
      publishedAt: at,
      updatedAt: at,
    },
    {
      id: FIXTURE_IDS.second,
      toolSlug,
      displayName: "QA Marco",
      useCase: "Prototipi interni",
      body: "Prototipo flussi interni prima di passarli allo sviluppo. (fixture QA)",
      pros: ["Curva di apprendimento breve"],
      limits: ["Export limitato", "Template rigidi"],
      durationBucket: "months_1_3",
      switchedFromSlug: null,
      switchedFromLabel: "Vecchio builder",
      publishedAt: at,
      updatedAt: at,
    },
    {
      id: FIXTURE_IDS.third,
      toolSlug,
      displayName: "QA Sofia",
      useCase: "Micro-siti per eventi",
      body: "Micro-siti one-page per eventi e campagne puntuali: in mezza giornata sono online con form e analytics. Il pannello media resta essenziale ma sufficiente per raccolte piccole. (fixture QA)",
      pros: ["Pubblicazione immediata", "Dominio gestito"],
      limits: ["Analytics base incluso", "Non adatta a blog"],
      durationBucket: "year_plus",
      switchedFromSlug: null,
      switchedFromLabel: null,
      publishedAt: at,
      updatedAt: at,
    },
  ];
}
