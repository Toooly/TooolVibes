import { LocalizedText } from "@/components/i18n/localized-text";
import { ExperienceCard } from "@/components/community/experience-card";
import { ExperienceLoadMore } from "@/components/community/experience-load-more";
import { ExperienceOwnerPanel } from "@/components/community/experience-owner-panel";
import { loadPublishedExperiencesForTool } from "@/lib/community/public-read";
import { isCommunityReportUiEnabled } from "@/lib/community/report-flag";
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
  const reportEnabled = isCommunityReportUiEnabled();

  return (
    <section
      id="td-final-experiences"
      className="td-final-experiences"
      aria-labelledby="td-final-experiences-title"
    >
      <p className="td-final-section-eyebrow"><LocalizedText>{"Esperienze"}</LocalizedText></p>
      <h2 id="td-final-experiences-title" className="td-final-section-title"><LocalizedText>{"Come viene usato davvero. "}</LocalizedText></h2>
      <p className="td-final-experiences__lede"><LocalizedText>{"Come viene usato davvero da chi lo conosce. "}</LocalizedText></p>
      <p className="td-final-experiences__note"><LocalizedText>{"Le Esperienze raccontano l'uso personale dei membri di TooolVibes. "}</LocalizedText></p>
      {writeEnabled ? (
        <ExperienceOwnerPanel toolSlug={toolSlug} catalogNames={catalogNames} />
      ) : null}
      {result.experiences.length === 0 ? (
        <p className="td-final-experiences__empty"><LocalizedText>{"Nessuna esperienza pubblicata ancora. "}</LocalizedText></p>
      ) : (
        <div className="td-final-experiences__list">
          {result.experiences.map((experience) => (
            <ExperienceCard
              key={experience.id}
              experience={experience}
              catalogNames={catalogNames}
              reportEnabled={reportEnabled}
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
