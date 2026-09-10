import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { Callout as ProseCallout, Card as ProseCard } from "@prose-ui/react";

import { loadCatalogEditorialPosts } from "@/lib/data/public-articles";
import {
  GuideMarkdown,
  guideSanitizeSchema,
} from "@/components/guides/guide-markdown";

import "@prose-ui/style/prose-ui.css";
import "./tv-prose-theme.css";
import "./spike.css";

export const metadata: Metadata = {
  title: "Prose UI evaluation (dev)",
  robots: { index: false, follow: false },
};

const GUIDES = ["betterpic", "jenny-ai", "omi-app-ai"] as const;

/** TV ::: kinds → Prose UI callout variants. */
const CALLOUT_VARIANT = {
  tip: "tip",
  warning: "warning",
  pro: "info",
  decision: "note",
} as const;

function renderHybridCallout(
  kind: "tip" | "warning" | "pro" | "decision",
  title: string | undefined,
  bodyMarkdown: string,
  key: string,
) {
  return (
    <ProseCallout
      key={key}
      variant={CALLOUT_VARIANT[kind]}
      title={title}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, guideSanitizeSchema]]}
      >
        {bodyMarkdown}
      </ReactMarkdown>
    </ProseCallout>
  );
}

function contentStats(md: string) {
  const lines = md.split("\n");
  return {
    words: md.split(/\s+/).filter(Boolean).length,
    h3: lines.filter((l) => l.startsWith("### ")).length,
    tables: lines.filter((l) => /^\|.*\|\s*$/.test(l)).length,
    callouts: (md.match(/^:::\s*(tip|warning|pro|decision)/gm) ?? []).length,
    quotes: lines.filter((l) => l.startsWith(">")).length,
    lists: lines.filter((l) => /^\s*([-*]|\d+\.)\s/.test(l)).length,
  };
}

export default async function ProseUiEvaluationPage({
  searchParams,
}: {
  searchParams: Promise<{ guide?: string; view?: string }>;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  const params = await searchParams;
  const posts = await loadCatalogEditorialPosts();
  const bySlug = new Map(posts.map((p) => [p.slug, p]));
  const guideSlug = GUIDES.includes(params.guide as (typeof GUIDES)[number])
    ? (params.guide as (typeof GUIDES)[number])
    : "betterpic";
  const view = params.view === "A" || params.view === "B" ? params.view : "split";
  const post = bySlug.get(guideSlug);
  if (!post?.content_markdown) {
    notFound();
  }
  const md: string = post.content_markdown;
  const stats = contentStats(md);
  const firstH3 = (md.match(/^### (.+)$/m) ?? [])[1] ?? post.title;
  // Related-card experiment: link the next trio guide (real route, real title).
  const nextSlug = GUIDES[(GUIDES.indexOf(guideSlug) + 1) % GUIDES.length];
  const nextPost = bySlug.get(nextSlug);

  const showA = view !== "B";
  const showB = view !== "A";

  return (
    <div className="spike-page">
      <header className="spike-head">
        <p className="spike-head__eyebrow">Dev spike · Prose UI editorial evaluation</p>
        <h1>Current vs Prose UI hybrid</h1>
        <p>
          Stesso contenuto runtime, stesso parser (react-markdown + sanitize + :::),
          due presentation layer. Produzione intatta: questa pagina è dev-only.
        </p>
      </header>

      <nav className="spike-nav" aria-label="Spike guides">
        {GUIDES.map((g) => (
          <Link
            key={g}
            href={`/dev/prose-ui-evaluation?guide=${g}&view=${view}`}
            aria-current={g === guideSlug}
          >
            {bySlug.get(g)?.title ?? g}
          </Link>
        ))}
        {(["split", "A", "B"] as const).map((v) => (
          <Link
            key={v}
            href={`/dev/prose-ui-evaluation?guide=${guideSlug}&view=${v}`}
            aria-current={v === view}
          >
            Vista {v}
          </Link>
        ))}
      </nav>

      <dl className="spike-meta" aria-label="Contenuto reale">
        <div><dt>Guida</dt><dd>{post.title}</dd></div>
        <div><dt>Parole</dt><dd>{stats.words}</dd></div>
        <div><dt>H3</dt><dd>{stats.h3}</dd></div>
        <div><dt>Righe tabella</dt><dd>{stats.tables}</dd></div>
        <div><dt>Callout :::</dt><dd>{stats.callouts}</dd></div>
        <div><dt>Citazioni</dt><dd>{stats.quotes}</dd></div>
        <div><dt>Voci lista</dt><dd>{stats.lists}</dd></div>
        <div><dt>Link autore</dt><dd>0 (assenti nel contenuto reale)</dd></div>
      </dl>

      <div className="spike-split">
        {showA && (
          <section aria-label="Variante A current">
            <span className="spike-variant-tag">A · GuideMarkdown + guides.css</span>
            <div className="guides-article">
              <div className="guides-article__body">
                <GuideMarkdown content={md} />
              </div>
            </div>
          </section>
        )}
        {showB && (
          <section aria-label="Variante B hybrid">
            <span className="spike-variant-tag">B · Prose UI hybrid + TV adapter</span>
            <div className="prose-ui tv-prose-ui-theme">
              <div className="tv-hybrid-canvas">
                <GuideMarkdown
                  content={md}
                  bodyClassName="tv-hybrid-md"
                  blockquoteClassName="blockquote"
                  calloutRenderer={renderHybridCallout}
                />
              </div>
              {nextPost && (
                <div className="spike-card-exp not-prose">
                  <span className="spike-variant-tag">Esperimento Card editoriale</span>
                  <ProseCard
                    title={nextPost.title}
                    href={`/posts/${nextSlug}`}
                    cta="Leggi la guida"
                    arrow="true"
                  >
                    {nextPost.dek ?? nextPost.summary ?? ""}
                  </ProseCard>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <section className="spike-lab" aria-label="Element probe lab">
        <h2>Lab elementi (copy reale, fuori articolo)</h2>
        <p className="spike-lab__note">
          Il contenuto reale non contiene link autore né h2: questo strip isolato usa
          copy reale della guida (titolo, dek, primo h3) e destinazioni reali del sito
          per confrontare link / h2 / hr nei due temi. Metodologia, non contenuto demo.
        </p>
        <div className="spike-lab__grid">
          <div>
            <span className="spike-variant-tag">A · current</span>
            <div className="guides-article">
              <div className="guides-article__body">
              <div className="editorial-markdown inside-ivory inside-light-surface">
                <h2>{post.title}</h2>
                <p>{post.dek}</p>
                <h3>{firstH3}</h3>
                <p>
                  <a href="/archivio">Catalogo</a>
                  {" · "}
                  <a href="https://tooolvibes.eu">Sito live</a>
                  {" · "}
                  <a href="#spike-lab-a">Ancora interna</a>
                </p>
                <hr />
              </div>
              </div>
            </div>
          </div>
          <div>
            <span className="spike-variant-tag">B · hybrid</span>
            <div className="prose-ui tv-prose-ui-theme">
              <div className="tv-hybrid-canvas">
                <div className="tv-hybrid-md">
                  <h2>{post.title}</h2>
                  <p>{post.dek}</p>
                  <h3>{firstH3}</h3>
                  <p>
                    <a href="/archivio">Catalogo</a>
                    {" · "}
                    <a href="https://tooolvibes.eu">Sito live</a>
                    {" · "}
                    <a href="#spike-lab-b">Ancora interna</a>
                  </p>
                  <hr />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
