"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
import { useRef, useState, useTransition } from "react";

import { ExperienceCard } from "@/components/community/experience-card";
import { parsePublicExperiencePage } from "@/lib/community/public-page";
import { MAX_PUBLIC_PAGE } from "@/lib/community/schema";
import type { CommunityExperiencePublic } from "@/lib/community/schema";

export function ExperienceLoadMore({
  toolSlug,
  initialCursor,
  catalogNames,
  initialIds,
}: {
  toolSlug: string;
  initialCursor: string;
  catalogNames: Record<string, string>;
  initialIds: string[];
}) {
  const [items, setItems] = useState<CommunityExperiencePublic[]>([]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const seen = useRef(new Set(initialIds));

  function loadMore() {
    if (!cursor || pending) return;
    const current = cursor;
    startTransition(async () => {
      try {
        const url = new URL("/api/community/experiences", window.location.origin);
        url.searchParams.set("tool", toolSlug);
        url.searchParams.set("limit", String(MAX_PUBLIC_PAGE));
        url.searchParams.set("cursor", current);
        const response = await fetch(url.toString(), { credentials: "same-origin" });
        if (!response.ok) {
          setError("Non siamo riusciti a caricare altre esperienze.");
          return;
        }
        const parsed = parsePublicExperiencePage(await response.json());
        if (!parsed) {
          setError("Non siamo riusciti a caricare altre esperienze.");
          return;
        }
        const extra: CommunityExperiencePublic[] = [];
        for (const experience of parsed.experiences) {
          if (seen.current.has(experience.id)) continue;
          seen.current.add(experience.id);
          extra.push(experience);
        }
        setItems((currentItems) => [...currentItems, ...extra]);
        setCursor(parsed.nextCursor);
        setError(null);
      } catch {
        setError("Non siamo riusciti a caricare altre esperienze.");
      }
    });
  }

  return (
    <>
      {items.map((experience) => (
        <ExperienceCard
          key={experience.id}
          experience={experience}
          catalogNames={catalogNames}
        />
      ))}
      {error ? (
        <p className="td-final-experience__status" role="alert">
          <LocalizedText>{error}</LocalizedText>
        </p>
      ) : null}
      {cursor ? (
        <button
          type="button"
          className="td-final-experience__more"
          onClick={loadMore}
          disabled={pending}
        >
          <LocalizedText>{pending ? "Caricamento…" : "Mostra altre esperienze"}</LocalizedText>
        </button>
      ) : null}
    </>
  );
}
