import { cn } from "@/lib/utils";

type GuideCalloutKind = "tip" | "warning" | "pro" | "decision";

type GuideCalloutProps = {
  kind?: GuideCalloutKind;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

const KIND_GLYPH: Record<GuideCalloutKind, string> = {
  tip: "💡",
  warning: "!",
  pro: "★",
  decision: "→",
};

const KIND_TITLE: Record<GuideCalloutKind, string> = {
  tip: "Consiglio pratico",
  warning: "Attenzione",
  pro: "Pro tip",
  decision: "Decisione rapida",
};

export function GuideCallout({
  kind = "tip",
  title,
  children,
  className,
}: GuideCalloutProps) {
  return (
    <aside
      className={cn("guides-callout", `guides-callout--${kind}`, className)}
      role={kind === "warning" ? "note" : undefined}
      aria-label={title ?? KIND_TITLE[kind]}
    >
      <span className="guides-callout__glyph" aria-hidden>
        {KIND_GLYPH[kind]}
      </span>
      <div className="guides-callout__body">
        <p className="guides-callout__title">{title ?? KIND_TITLE[kind]}</p>
        <div className="guides-callout__content">{children}</div>
      </div>
    </aside>
  );
}

type GuideKeyTakeawaysProps = {
  title?: string;
  items: string[];
  className?: string;
};

export function GuideKeyTakeaways({
  title = "Punti chiave",
  items,
  className,
}: GuideKeyTakeawaysProps) {
  if (!items || items.length === 0) return null;
  return (
    <aside
      className={cn("guides-takeaways", className)}
      aria-label={title}
    >
      <p className="guides-takeaways__title">{title}</p>
      <ul className="guides-takeaways__list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}

type GuideBylineProps = {
  author?: string;
  publishedAt?: string;
  updatedAt?: string | null;
  readingMinutes?: number;
  className?: string;
};

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function GuideByline({
  author,
  publishedAt,
  updatedAt,
  readingMinutes,
  className,
}: GuideBylineProps) {
  const pub = formatShortDate(publishedAt);
  const upd = formatShortDate(updatedAt);
  return (
    <div className={cn("guides-byline", className)}>
      <span>
        <strong>{author ?? "Team editoriale TooolVibes"}</strong> ha scritto
        questa guida.
      </span>
      {pub ? (
        <>
          <span className="guides-byline__dot" aria-hidden />
          <span>
            Pubblicata il <strong>{pub}</strong>
          </span>
        </>
      ) : null}
      {upd && upd !== pub ? (
        <>
          <span className="guides-byline__dot" aria-hidden />
          <span>
            Aggiornata il <strong>{upd}</strong>
          </span>
        </>
      ) : null}
      {readingMinutes && readingMinutes > 0 ? (
        <>
          <span className="guides-byline__dot" aria-hidden />
          <span>
            <strong>{readingMinutes}</strong> minuti di lettura
          </span>
        </>
      ) : null}
    </div>
  );
}
