import Link from "next/link";

import { durationBucketLabel } from "@/lib/community/duration";
import type { CommunityExperiencePublic } from "@/lib/community/schema";
import { formatItalianDate } from "@/lib/utils";

export function ExperienceCard({
  experience,
  catalogNames,
}: {
  experience: CommunityExperiencePublic;
  catalogNames: Record<string, string>;
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
      <p className="td-final-experience__kicker">Cosa funziona bene</p>
      <ul className="td-final-experience__list">
        {experience.pros.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="td-final-experience__kicker">Limiti</p>
      <ul className="td-final-experience__list td-final-experience__list--limits">
        {experience.limits.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {switchedLabel ? (
        <p className="td-final-experience__switched">
          Prima usava:{" "}
          {experience.switchedFromSlug && switchedName ? (
            <Link href={`/toools/${experience.switchedFromSlug}`} className="td-final-internal-link">
              {switchedName}
            </Link>
          ) : (
            switchedLabel
          )}
        </p>
      ) : null}
      {experience.publishedAt ? (
        <p className="td-final-experience__date">
          Pubblicata il {formatItalianDate(experience.publishedAt)}
        </p>
      ) : null}
    </article>
  );
}
