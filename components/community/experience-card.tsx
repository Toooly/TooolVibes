import { LocalizedText } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";

import { ExperienceReportAction } from "@/components/community/experience-report-action";
import { durationBucketLabel } from "@/lib/community/duration";
import type { CommunityExperiencePublic } from "@/lib/community/schema";
import { formatItalianDate } from "@/lib/utils";

export function ExperienceCard({
  experience,
  catalogNames,
  reportEnabled = false,
}: {
  experience: CommunityExperiencePublic;
  catalogNames: Record<string, string>;
  reportEnabled?: boolean;
}) {
  const switchedName = experience.switchedFromSlug
    ? catalogNames[experience.switchedFromSlug]
    : null;
  const switchedLabel = switchedName ?? experience.switchedFromLabel;

  return (
    <article className="td-final-experience">
      <p className="td-final-experience__byline">
        <span>{experience.displayName}</span>
        <span aria-hidden="true"> · </span>
        <span>{durationBucketLabel(experience.durationBucket)}</span>
      </p>
      <p className="td-final-experience__use">{experience.useCase}</p>
      <p className="td-final-experience__body">{experience.body}</p>
      <p className="td-final-experience__kicker"><LocalizedText>{"Cosa funziona bene"}</LocalizedText></p>
      <ul className="td-final-experience__list">
        {experience.pros.map((item) => (
          <li key={item}><LocalizedText>{item}</LocalizedText></li>
        ))}
      </ul>
      <p className="td-final-experience__kicker"><LocalizedText>{"Limiti"}</LocalizedText></p>
      <ul className="td-final-experience__list td-final-experience__list--limits">
        {experience.limits.map((item) => (
          <li key={item}><LocalizedText>{item}</LocalizedText></li>
        ))}
      </ul>
      {switchedLabel ? (
        <p className="td-final-experience__switched"><LocalizedText>{"Prima usava:"}</LocalizedText><LocalizedText>{" "}</LocalizedText>
          {experience.switchedFromSlug && switchedName ? (
            <Link href={`/toools/${experience.switchedFromSlug}`} className="td-final-internal-link">
              <LocalizedText>{switchedName}</LocalizedText>
            </Link>
          ) : (
            switchedLabel
          )}
        </p>
      ) : null}
      {experience.publishedAt ? (
        <p className="td-final-experience__date"><LocalizedText>{"Pubblicata il "}</LocalizedText>{formatItalianDate(experience.publishedAt)}
        </p>
      ) : null}
      {reportEnabled ? (
        <ExperienceReportAction
          experienceId={experience.id}
          toolSlug={experience.toolSlug}
        />
      ) : null}
    </article>
  );
}
