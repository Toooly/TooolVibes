import { LocalizedText } from "@/components/i18n/localized-text";
import { ExperienceCard } from "@/components/community/experience-card";
import { COMMUNITY_QA_FIXTURES } from "@/lib/community/public-fixtures";

export function ExperienceQa({
  fixture = "one",
}: {
  fixture?: keyof typeof COMMUNITY_QA_FIXTURES;
}) {
  const experiences = COMMUNITY_QA_FIXTURES[fixture] ?? COMMUNITY_QA_FIXTURES.one;
  return (
    <div data-community-qa="" className="td-final-page">
      <section className="td-final-experiences" aria-labelledby="td-final-experiences-title">
        <p className="td-final-section-eyebrow"><LocalizedText>{"Esperienze"}</LocalizedText></p>
        <h2 id="td-final-experiences-title" className="td-final-section-title"><LocalizedText>{"Come viene usato davvero. "}</LocalizedText></h2>
        <p className="td-final-experiences__lede"><LocalizedText>{"Come viene usato davvero da chi lo conosce. "}</LocalizedText></p>
        {experiences.length === 0 ? (
          <p className="td-final-experiences__empty"><LocalizedText>{"Nessuna esperienza pubblicata ancora."}</LocalizedText></p>
        ) : (
          <div className="td-final-experiences__list">
            {experiences.map((experience) => (
              <ExperienceCard
                key={experience.id}
                experience={experience}
                catalogNames={{ blink: "Blink", weweb: "WeWeb" }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
