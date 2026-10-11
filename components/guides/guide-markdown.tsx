import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

import {
  GuideCallout,
  GuideKeyTakeaways,
} from "@/components/guides/guide-callout";

type GuideMarkdownProps = {
  content: string;
  onHeadings?: (headings: Array<{ id: string; text: string; level: 2 | 3 }>) => void;
  className?: string;
};

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "article",
    "aside",
    "div",
    "figure",
    "figcaption",
    "mark",
    "section",
    "span",
  ],
  attributes: {
    ...defaultSchema.attributes,
    "*": [
      ...(defaultSchema.attributes?.["*"] ?? []),
      "title",
      "aria-label",
      "id",
    ],
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      "href",
      "target",
      "rel",
    ],
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      "src",
      "alt",
      "title",
      "width",
      "height",
      "loading",
    ],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: ["http", "https"],
    href: ["http", "https", "mailto", "tel"],
  },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

/**
 * Strip the marker lines that introduce guides-callout / guides-takeaways
 * blocks so they do not render as plain markdown.
 */
function preprocessContent(content: string): {
  processed: string;
  callouts: Array<{ kind: "tip" | "warning" | "pro" | "decision"; title?: string; body: string }>;
  takeaways: Array<{ title?: string; items: string[] }>;
} {
  const callouts: Array<{ kind: "tip" | "warning" | "pro" | "decision"; title?: string; body: string }> = [];
  const takeaways: Array<{ title?: string; items: string[] }> = [];

  // Block pattern: ::: tip[ Title]\n body \n:::
  const blockPattern = /^:::\s*(tip|warning|pro|decision)(?:\s+(.+?))?\s*\n([\s\S]*?)\n:::\s*$/gm;
  let processed = content.replace(blockPattern, (_, kind, title, body) => {
    const trimmed = body.trim();
    callouts.push({ kind, title: title?.trim() || undefined, body: trimmed });
    return `\n\n[CALLOUT_${callouts.length - 1}]\n\n`;
  });

  // Block pattern: :::takeaways[ Title]\n- item\n- item\n:::
  const takePattern = /^:::\s*takeaways(?:\s+(.+?))?\s*\n([\s\S]*?)\n:::\s*$/gm;
  processed = processed.replace(takePattern, (_, title, body) => {
    const items = body
      .split(/\n+/)
      .map((line: string) => line.replace(/^\s*[-*]\s+/, "").trim())
      .filter((line: string) => line.length > 0);
    takeaways.push({ title: title?.trim() || undefined, items });
    return `\n\n[TAKEAWAY_${takeaways.length - 1}]\n\n`;
  });

  return { processed, callouts, takeaways };
}

function splitOnTokens(
  text: string,
  tokenRegex: RegExp,
): Array<{ type: "md" | "token"; value: string }> {
  const parts: Array<{ type: "md" | "token"; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(tokenRegex.source, "gm");
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "md", value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "token", value: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "md", value: text.slice(lastIndex) });
  }
  return parts;
}

export function GuideMarkdown({
  content,
  onHeadings,
  className,
}: GuideMarkdownProps) {
  const { processed, callouts, takeaways } = preprocessContent(content);
  const usedIds = new Set<string>();

  const parts = splitOnTokens(
    processed,
    /\[(?:CALLOUT|TAKEAWAY)_\d+\]/,
  );

  // Walk through MD parts to find headings for TOC, regardless of interleaving
  // (we only need ids for actual headings inside the markdown itself).
  const collectedIds = new Set<string>();
  const collectedHeadings: Array<{ id: string; text: string; level: 2 | 3 }> = [];
  for (const part of parts) {
    if (part.type !== "md") continue;
    const headingPattern = /^(#{2,3})\s+(.+)$/gm;
    let m: RegExpExecArray | null;
    while ((m = headingPattern.exec(part.value)) !== null) {
      const level = (m[1].length === 2 ? 2 : 3) as 2 | 3;
      const text = m[2].trim();
      const id = (() => {
        const base = slugify(text) || "sezione";
        let id = base;
        let i = 2;
        while (collectedIds.has(id)) {
          id = `${base}-${i++}`;
        }
        collectedIds.add(id);
        return id;
      })();
      // Reset usedIds per part? No — ids must be unique across the whole article.
      // We re-collect into a separate set for the onHeadings callback below.
      collectedHeadings.push({ id, text, level });
    }
  }

  // Build a stable id map for headings actually rendered. We render via the
  // components.h2/h3 callbacks below, so we capture the same id in the same
  // pass. The above pass is only to compute the TOC; the onHeadings callback
  // below receives the canonical set.
  if (onHeadings) {
    onHeadings(collectedHeadings);
  }

  return (
    <div className={cn("guides-markdown-flow", className)}>
      {parts.map((part, idx) => {
        if (part.type === "md") {
          return (
            <div
              key={`md-${idx}`}
              className="editorial-markdown inside-ivory inside-light-surface"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
                components={{
                  h1: ({ children }) => {
                    // Surface as h2 in the article body, with stable id.
                    const text = flattenText(children);
                    const id = ensureUnique(text, usedIds);
                    return <h2 id={id}>{children}</h2>;
                  },
                  h2: ({ children }) => {
                    const text = flattenText(children);
                    const id = ensureUnique(text, usedIds);
                    return <h2 id={id}>{children}</h2>;
                  },
                  h3: ({ children }) => {
                    const text = flattenText(children);
                    const id = ensureUnique(text, usedIds);
                    return <h3 id={id}>{children}</h3>;
                  },
                  a: ({ href, children, ...props }) => (
                    <a
                      href={href}
                      target={href?.startsWith("http") ? "_blank" : undefined}
                      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                      {...props}
                    >
                      {children}
                    </a>
                  ),
                  img: ({ alt, ...props }) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={alt ?? ""} loading="lazy" {...props} />
                  ),
                }}
              >
                {part.value}
              </ReactMarkdown>
            </div>
          );
        }

        // Token: parse which callout / takeaway
        const calloutMatch = part.value.match(/\[CALLOUT_(\d+)\]/);
        if (calloutMatch) {
          const idxNum = Number(calloutMatch[1]);
          const c = callouts[idxNum];
          if (!c) return null;
          return (
            <GuideCallout key={part.value} kind={c.kind} title={c.title}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
              >
                {c.body}
              </ReactMarkdown>
            </GuideCallout>
          );
        }

        const takeawayMatch = part.value.match(/\[TAKEAWAY_(\d+)\]/);
        if (takeawayMatch) {
          const idxNum = Number(takeawayMatch[1]);
          const t = takeaways[idxNum];
          if (!t) return null;
          return (
            <GuideKeyTakeaways
              key={part.value}
              title={t.title ?? "Punti chiave"}
              items={t.items}
            />
          );
        }
        return null;
      })}
    </div>
  );
}

function flattenText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return flattenText((node as { props: { children: React.ReactNode } }).props.children);
  }
  return "";
}

function ensureUnique(text: string, usedIds: Set<string>): string {
  const base = slugify(text) || "sezione";
  let id = base;
  let i = 2;
  while (usedIds.has(id)) {
    id = `${base}-${i++}`;
  }
  usedIds.add(id);
  return id;
}
