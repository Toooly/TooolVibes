import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
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
  pro: "Approfondimento",
  decision: "Decisione rapida",
};

export function GuideCallout({
  kind = "tip",
  title,
  children,
  className,
}: GuideCalloutProps) {
  return (
    <LocalizedAttributes><aside
      className={cn("guides-callout", `guides-callout--${kind}`, className)}
      role={kind === "warning" ? "note" : undefined}
      aria-label={title ?? KIND_TITLE[kind]}
    >
      <span className="guides-callout__glyph" aria-hidden>
        <LocalizedText>{KIND_GLYPH[kind]}</LocalizedText>
      </span>
      <div className="guides-callout__body">
        <p className="guides-callout__title"><LocalizedText>{title ?? KIND_TITLE[kind]}</LocalizedText></p>
        <div className="guides-callout__content">{children}</div>
      </div>
    </aside></LocalizedAttributes>
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
    <LocalizedAttributes><aside
      className={cn("guides-takeaways", className)}
      aria-label={title}
    >
      <p className="guides-takeaways__title"><LocalizedText>{title}</LocalizedText></p>
      <ul className="guides-takeaways__list">
        {items.map((item) => (
          <li key={item}><LocalizedText>{item}</LocalizedText></li>
        ))}
      </ul>
    </aside></LocalizedAttributes>
  );
}

export function GuideTakeawaysDisclosure({
  title = "Cosa otterrai da questa guida",
  items,
}: GuideKeyTakeawaysProps) {
  if (!items || items.length === 0) return null;
  return (
    <details className="guides-takeaways-disclosure">
      <summary><LocalizedText>{"Cosa trovi nella guida"}</LocalizedText></summary>
      <LocalizedAttributes><GuideKeyTakeaways title={title} items={items} /></LocalizedAttributes>
    </details>
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
        <LocalizedText>{"A cura di "}</LocalizedText><strong><LocalizedText>{author ?? "Team editoriale TooolVibes"}</LocalizedText></strong></span>
      {pub ? (
        <>
          <span className="guides-byline__dot" aria-hidden />
          <span><LocalizedText>{"Pubblicata il "}</LocalizedText><strong><LocalizedText>{pub}</LocalizedText></strong>
          </span>
        </>
      ) : null}
      {upd && upd !== pub ? (
        <>
          <span className="guides-byline__dot" aria-hidden />
          <span><LocalizedText>{"Aggiornata il "}</LocalizedText><strong><LocalizedText>{upd}</LocalizedText></strong>
          </span>
        </>
      ) : null}
      {readingMinutes && readingMinutes > 0 ? (
        <>
          <span className="guides-byline__dot" aria-hidden />
          <span>
            <strong>{readingMinutes}</strong><LocalizedText>{" minuti di lettura "}</LocalizedText></span>
        </>
      ) : null}
    </div>
  );
}
