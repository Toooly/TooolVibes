import Link from "next/link";

import { formatItalianDate } from "@/lib/utils";
import type { EditorialPostRecord } from "@/lib/types/article";
import type { ToolPublic } from "@/lib/types/tool-public";

type GuideArticleHeroProps = {
  post: EditorialPostRecord;
  tool: ToolPublic | null;
  toolHref: string | null;
  readingMinutes: number;
  topicLabel: string;
  relatedPosts?: EditorialPostRecord[];
};

function safeFormat(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return formatItalianDate(iso);
  } catch {
    return "";
  }
}

export function GuideArticleHero({
  post,
  tool,
  toolHref,
  readingMinutes,
  topicLabel,
}: GuideArticleHeroProps) {
  const published = safeFormat(post.published_at);
  const updated = safeFormat(post.updated_at);
  const showUpdated = updated && updated !== published;

  const palette = (() => {
    const t = topicLabel.toLowerCase();
    if (t.includes("scrittura") || t.includes("writing") || t.includes("seo")) {
      return { from: "#0e3a44", to: "#0a6b80", glow: "rgba(43, 208, 255, 0.22)" };
    }
    if (t.includes("agenti") || t.includes("agent")) {
      return { from: "#1a1230", to: "#4d2dd6", glow: "rgba(106, 60, 255, 0.22)" };
    }
    if (t.includes("affiliate") || t.includes("saas") || t.includes("business")) {
      return { from: "#0a2618", to: "#15643a", glow: "rgba(72, 200, 130, 0.22)" };
    }
    if (t.includes("media") || t.includes("immagini") || t.includes("foto")) {
      return { from: "#3a1f08", to: "#7c4a13", glow: "rgba(255, 192, 122, 0.22)" };
    }
    return { from: "#0a0814", to: "#1f1850", glow: "rgba(126, 130, 255, 0.22)" };
  })();

  return (
    <section
      className="guides-article__hero"
      aria-labelledby="guide-article-title"
      style={
        {
          ["--guides-article-hero-glow" as string]: palette.glow,
        } as React.CSSProperties
      }
    >
      <div className="guides-article__hero-main">
        <div className="guides-article__hero-meta">
          <span className="pill pill--accent">Guida</span>
          <span className="pill">{topicLabel}</span>
          <span className="pill">Pubblicata {published}</span>
          {showUpdated ? <span className="pill">Aggiornata {updated}</span> : null}
          <span className="pill">{readingMinutes} min di lettura</span>
        </div>

        <h1 id="guide-article-title" className="guides-article__hero-h1">
          {post.title}
        </h1>

        {post.dek ? <p className="guides-article__hero-dek">{post.dek}</p> : null}

        {post.highlights.length > 0 ? (
          <ul className="guides-article__hero-points" aria-label="Cosa troverai">
            {post.highlights.slice(0, 5).map((point) => (
              <li key={point}>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginTop: "0.5rem" }}>
          {tool && toolHref ? (
            <Link
              href={toolHref}
              className="guides-feature__cta"
              style={{ display: "inline-flex" }}
            >
              <span data-variant="primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                Apri la scheda {tool.name}
                <span aria-hidden>↗</span>
              </span>
            </Link>
          ) : null}
          <Link
            href="/posts"
            className="guides-feature__cta"
            style={{ display: "inline-flex" }}
          >
            <span
              data-variant="ghost"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                color: "var(--guides-text-on-dark)",
                borderColor: "rgba(255, 255, 255, 0.18)",
                background: "rgba(255, 255, 255, 0.04)",
              }}
            >
              Tutte le guide
              <span aria-hidden>→</span>
            </span>
          </Link>
        </div>
      </div>

      <aside className="guides-article__hero-side" aria-label="Informazioni rapide">
        <div className="guides-article__hero-stat" aria-hidden>
          <p className="label">Lunghezza</p>
          <p className="value">{readingMinutes} min</p>
          <p className="hint">
            Lettura completa, saltabile grazie all&apos;indice qui a sinistra
            (o in alto su mobile).
          </p>
        </div>

        {tool ? (
          <div className="guides-article__hero-stat">
            <p className="label">Tool collegato</p>
            <p className="value">{tool.name}</p>
            <p className="hint">
              {tool.content.bestFor ?? tool.content.summary}
            </p>
            {toolHref ? (
              <Link
                href={toolHref}
                style={{
                  color: "var(--guides-accent-cyan)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  marginTop: "0.4rem",
                  textDecoration: "none",
                  borderBottom: "1px solid rgba(43, 208, 255, 0.4)",
                  alignSelf: "start",
                }}
              >
                Apri profilo completo →
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="guides-article__hero-stat">
          <p className="label">Categoria</p>
          <p className="value">{topicLabel}</p>
          <p className="hint">
            Appartiene alla collezione editoriale di guide {topicLabel.toLowerCase()} di TooolVibes.
          </p>
        </div>
      </aside>
    </section>
  );
}
