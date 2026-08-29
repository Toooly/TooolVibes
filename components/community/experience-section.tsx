import { ExperienceCard } from "@/components/community/experience-card";
import { ExperienceLoadMore } from "@/components/community/experience-load-more";
import { ExperienceOwnerPanel } from "@/components/community/experience-owner-panel";
import { loadPublishedExperiencesForTool } from "@/lib/community/public-read";
import { isCommunityWriteUiEnabled } from "@/lib/community/write-flag";

export async function ExperienceSection({
  toolSlug,
  catalogNames,
}: {
  toolSlug: string;
  catalogNames: Record<string, string>;
}) {
  const result = await loadPublishedExperiencesForTool(toolSlug);
  if (result.skipped || !result.ok) return null;
  const writeEnabled = isCommunityWriteUiEnabled();

  return (
    <section
      id="td-final-experiences"
      className="td-final-experiences"
      aria-labelledby="td-final-experiences-title"
    >
      <p className="td-final-section-eyebrow">Esperienze</p>
      <h2 id="td-final-experiences-title" className="td-final-section-title">
        Come viene usato davvero.
      </h2>
      <p className="td-final-experiences__lede">
        Come viene usato davvero da chi lo conosce.
      </p>
      <p className="td-final-experiences__note">
        Le Esperienze raccontano l&apos;uso personale dei membri di TooolVibes.
      </p>
      {writeEnabled ? (
        <ExperienceOwnerPanel toolSlug={toolSlug} catalogNames={catalogNames} />
      ) : null}
      {result.experiences.length === 0 ? (
        <p className="td-final-experiences__empty">
          Nessuna esperienza pubblicata ancora.
        </p>
      ) : (
        <div className="td-final-experiences__list">
          {result.experiences.map((experience) => (
            <ExperienceCard
              key={experience.id}
              experience={experience}
              catalogNames={catalogNames}
            />
          ))}
          {result.nextCursor ? (
            <ExperienceLoadMore
              toolSlug={toolSlug}
              initialCursor={result.nextCursor}
              catalogNames={catalogNames}
              initialIds={result.experiences.map((item) => item.id)}
            />
          ) : null}
        </div>
      )}
    </section>
  );
}
