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
        <p className="td-final-section-eyebrow">Esperienze</p>
        <h2 id="td-final-experiences-title" className="td-final-section-title">
          Come viene usato davvero.
        </h2>
        <p className="td-final-experiences__lede">
          Come viene usato davvero da chi lo conosce.
        </p>
        {experiences.length === 0 ? (
          <p className="td-final-experiences__empty">Nessuna esperienza pubblicata ancora.</p>
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
