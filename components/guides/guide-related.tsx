import Link from "next/link";

import { formatItalianDate } from "@/lib/utils";
import type { EditorialPostRecord } from "@/lib/types/article";
import type { ToolPublic } from "@/lib/types/tool-public";

import { estimateReadingMinutes } from "@/components/guides/guide-card";

type GuideRelatedRailProps = {
  post: EditorialPostRecord;
  tool: ToolPublic | null;
  toolHref: string | null;
  relatedPosts: EditorialPostRecord[];
  topicLabel: string;
};

export function GuideRelatedRail({
  post,
  tool,
  toolHref,
  relatedPosts,
  topicLabel,
}: GuideRelatedRailProps) {
  const safeRelated = relatedPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  const readingMinutes = estimateReadingMinutes(post.content_markdown);

  return (
    <aside className="guides-rail" aria-label="Risorse collegate">
      {tool && toolHref ? (
        <div className="guides-rail__card">
          <span className="guides-rail__label">Tool in primo piano</span>
          <h3 className="guides-rail__title">{tool.name}</h3>
          {tool.content.bestFor ? (
            <p className="guides-rail__hint">{tool.content.bestFor}</p>
          ) : null}
          <div className="guides-rail__cta-row">
            <Link href={toolHref} className="guides-rail__cta" data-variant="primary">
              Apri scheda
              <span aria-hidden>→</span>
            </Link>
            {tool.urls.website ? (
              <Link
                href={tool.urls.website}
                target="_blank"
                rel="noopener noreferrer"
                className="guides-rail__cta"
              >
                Sito ufficiale
                <span aria-hidden>↗</span>
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {safeRelated.length > 0 ? (
        <div className="guides-rail__card">
          <span className="guides-rail__label">Guide collegate</span>
          <h3 className="guides-rail__title">
            Cosa leggere dopo questa guida.
          </h3>
          <ul className="guides-rail__list">
            {safeRelated.map((p) => (
              <li key={p.slug}>
                <Link href={`/posts/${p.slug}`}>
                  <span className="kicker">{topicLabel}</span>
                  <span className="title">{p.title}</span>
                  {p.dek ? <span className="dek">{p.dek}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="guides-rail__card">
        <span className="guides-rail__label">Su questa guida</span>
        <div className="guides-rail__meta">
          <span>
            <strong>Pubblicata</strong> {formatItalianDate(post.published_at)}
          </span>
          {post.updated_at && post.updated_at !== post.published_at ? (
            <span>
              <strong>Aggiornata</strong> {formatItalianDate(post.updated_at)}
            </span>
          ) : null}
          <span>
            <strong>Lettura</strong> {readingMinutes} min
          </span>
          <span>
            <strong>Autore</strong> {post.author_name ?? "Team editoriale TooolVibes"}
          </span>
        </div>
      </div>

      <div className="guides-rail__card">
        <span className="guides-rail__label">Prossimo passo</span>
        <h3 className="guides-rail__title">Esplora le raccolte</h3>
        <p className="guides-rail__hint">
          Le raccolte raggruppano i tool per obiettivo reale — perfette per
          confrontare alternative in un colpo d&apos;occhio.
        </p>
        <div className="guides-rail__cta-row">
          <Link href="/collections" className="guides-rail__cta">
            Raccolte
            <span aria-hidden>→</span>
          </Link>
          <Link href="/radar" className="guides-rail__cta">
            Radar
            <span aria-hidden>↗</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
