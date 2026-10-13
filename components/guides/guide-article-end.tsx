import Link from "@/components/ui/app-link";

import type { EditorialPostRecord } from "@/lib/types/article";

import { GuideCard } from "@/components/guides/guide-card";

type GuideArticleEndProps = {
  currentSlug: string;
  relatedPosts: EditorialPostRecord[];
};

export function GuideArticleEnd({
  currentSlug,
  relatedPosts,
}: GuideArticleEndProps) {
  const safeRelated = relatedPosts.filter((p) => p.slug !== currentSlug).slice(0, 3);

  if (safeRelated.length === 0) {
    return (
      <nav className="guides-article__end" aria-label="Altre guide">
        <Link href="/posts" className="guides-end__cta">
          Tutte le guide
          <span aria-hidden>→</span>
        </Link>
      </nav>
    );
  }

  return (
    <section className="guides-article__end" aria-labelledby="guide-article-end-title">
      <div>
        <p className="guides-eyebrow is-on-dark">
          Continua a leggere
        </p>
        <h2 id="guide-article-end-title" className="guides-article__end-title">
          Tre <em>guide</em> per andare avanti.
        </h2>
        <p className="guides-article__end-dek">
          Hai letto questa guida. Ecco le tre che leggiamo in continuazione
          come complemento naturale — non per riempire la pagina, ma per darti
          un prossimo passo utile.
        </p>
      </div>

      <div className="guides-article__end-grid">
        {safeRelated.map((post) => (
          <GuideCard key={post.slug} post={post} variant="default" />
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.6rem",
          paddingTop: "0.4rem",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          marginTop: "0.4rem",
          padding: "1rem 0 0 0",
        }}
      >
        <Link href="/posts" className="guides-end__cta">
          Tutte le guide
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
