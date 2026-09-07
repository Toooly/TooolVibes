import Link from "next/link";

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

  return (
    <section className="guides-article__end" aria-labelledby="guide-article-end-title">
      <div>
        <p className="guides-eyebrow" style={{ color: "rgba(190, 178, 255, 0.82)" }}>
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

      {safeRelated.length > 0 ? (
        <div className="guides-article__end-grid">
          {safeRelated.map((p) => (
            <GuideCard key={p.slug} post={p} variant="default" />
          ))}
        </div>
      ) : (
        <p className="guides-article__end-dek">
          Stiamo preparando i prossimi pezzi. Nel frattempo, apri la libreria
          completa per scegliere un altro punto di ingresso.
        </p>
      )}

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
