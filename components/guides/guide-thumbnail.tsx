"use client";

import { useState } from "react";

export function GuideThumbnail({ domain, label }: { domain: string | null; label: string }) {
  const [loadedSource, setLoadedSource] = useState<string | null>(null);
  const source = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
    : null;

  return (
    <span className="guides-card__thumb" aria-hidden="true">
      <span>{label.slice(0, 2).toUpperCase()}</span>
      {source ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={source}
          alt=""
          loading="lazy"
          decoding="async"
          style={{ opacity: loadedSource === source ? 1 : 0 }}
          onLoad={() => setLoadedSource(source)}
          onError={() => setLoadedSource(null)}
        />
      ) : null}
    </span>
  );
}
