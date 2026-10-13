"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

type MarkdownContentProps = {
  content: string;
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

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const { markdown } = useLocale();
  return (
    <div className={cn("editorial-markdown", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
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
        {markdown(content)}
      </ReactMarkdown>
    </div>
  );
}

/** Compact formatted highlights use the same locale as the full article. */
export function MarkdownHighlight({ content }: { content: string }) {
  const { markdown } = useLocale();
  return <ReactMarkdown allowedElements={["p", "strong", "em", "code"]} unwrapDisallowed components={{ p: ({ children }) => <span>{children}</span> }}>{markdown(content)}</ReactMarkdown>;
}
