import type { CommunityExperiencePublic } from "@/lib/community/schema";

const BODY =
  "Used this tool daily for client landing pages and kept coming back when the stack already had a builder.";

export function communityPublicFixture(
  overrides: Partial<CommunityExperiencePublic> = {},
): CommunityExperiencePublic {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    toolSlug: "blink",
    displayName: "Gianmaria",
    useCase: "AI coding",
    body: BODY,
    pros: ["Fast preview cycle"],
    limits: ["Weak collaboration"],
    durationBucket: "months_6_12",
    switchedFromSlug: null,
    switchedFromLabel: null,
    publishedAt: "2026-08-30T12:00:00.000Z",
    updatedAt: "2026-08-30T12:00:00.000Z",
    ...overrides,
  };
}

export const COMMUNITY_QA_FIXTURES: Record<string, CommunityExperiencePublic[]> = {
  empty: [],
  one: [communityPublicFixture()],
  eight: Array.from({ length: 8 }, (_, index) =>
    communityPublicFixture({
      id: `11111111-1111-4111-8111-11111111111${index}`,
      displayName: `Membro ${index + 1}`,
    }),
  ),
  long: [
    communityPublicFixture({
      body: `${BODY}\n\n${"Lungo paragrafo di esperienza. ".repeat(40)}`,
      pros: ["Fast preview cycle", "Seconda cosa che funziona molto bene nel lavoro quotidiano"],
      limits: ["Weak collaboration", "Altro limite descritto con più parole del necessario"],
    }),
  ],
  switched: [
    communityPublicFixture({
      switchedFromSlug: "weweb",
    }),
  ],
  offcatalog: [
    communityPublicFixture({
      switchedFromSlug: null,
      switchedFromLabel: "Framer",
    }),
  ],
};
