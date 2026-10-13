"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useState } from "react";

export function GuideThumbnail({ domain, label }: { domain: string | null; label: string }) {
  const [loadedSource, setLoadedSource] = useState<string | null>(null);
  const source = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
    : null;

  return (
    <span className="guides-card__thumb" aria-hidden="true">
      <span><LocalizedText>{label.slice(0, 2).toUpperCase()}</LocalizedText></span>
      {source ? (
        // eslint-disable-next-line @next/next/no-img-element
        <LocalizedAttributes><img
          src={source}
          alt=""
          loading="lazy"
          decoding="async"
          style={{ opacity: loadedSource === source ? 1 : 0 }}
          onLoad={() => setLoadedSource(source)}
          onError={() => setLoadedSource(null)}
        /></LocalizedAttributes>
      ) : null}
    </span>
  );
}
