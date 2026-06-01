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
    "audio",
    "div",
    "figure",
    "figcaption",
    "iframe",
    "mark",
    "section",
    "source",
    "span",
    "video",
  ],
  attributes: {
    ...defaultSchema.attributes,
    "*": [
      ...(defaultSchema.attributes?.["*"] ?? []),
      "className",
      "id",
      "style",
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
    iframe: ["src", "title", "width", "height", "allow", "allowFullScreen", "loading"],
    source: ["src", "type"],
    video: ["src", "controls", "poster", "width", "height", "title", "playsInline"],
    audio: ["src", "controls", "title"],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: ["http", "https", "data"],
    href: ["http", "https", "mailto", "tel"],
  },
};

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn("editorial-markdown", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={{
          a: ({ href, children, ...props }) => (
            <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer" {...props}>
              {children}
            </a>
          ),
          img: ({ alt, ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={alt ?? ""} loading="lazy" {...props} />
          ),
          video: ({ children, ...props }) => (
            <video controls playsInline {...props}>
              {children}
            </video>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
