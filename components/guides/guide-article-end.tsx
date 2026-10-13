import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
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
      <LocalizedAttributes><nav className="guides-article__end" aria-label="Altre guide">
        <Link href="/posts" className="guides-end__cta"><LocalizedText>{"Tutte le guide "}</LocalizedText><span aria-hidden>→</span>
        </Link>
      </nav></LocalizedAttributes>
    );
  }

  return (
    <section className="guides-article__end" aria-labelledby="guide-article-end-title">
      <div>
        <p className="guides-eyebrow is-on-dark"><LocalizedText>{"Continua a leggere "}</LocalizedText></p>
        <h2 id="guide-article-end-title" className="guides-article__end-title"><LocalizedText>{"Tre "}</LocalizedText><em><LocalizedText>{"guide"}</LocalizedText></em><LocalizedText>{" per andare avanti. "}</LocalizedText></h2>
        <p className="guides-article__end-dek"><LocalizedText>{"Hai letto questa guida. Ecco le tre che leggiamo in continuazione come complemento naturale — non per riempire la pagina, ma per darti un prossimo passo utile. "}</LocalizedText></p>
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
        <Link href="/posts" className="guides-end__cta"><LocalizedText>{"Tutte le guide "}</LocalizedText><span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
