import { LocalizedText } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";

type TagPillProps = {
  tag: string;
};

export function TagPill({ tag }: TagPillProps) {
  return (
    <Link
      href={`/archivio?tag=${encodeURIComponent(tag)}`}
      className="text-ui-strong badge-shell group/tag inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] transition-all duration-200"
      style={{
        color: "var(--muted-strong)",
      }}
    >
      <span className="badge-dot h-1.25 w-1.25 rounded-full" style={{ background: "var(--gold)" }} />
      #<LocalizedText>{tag}</LocalizedText>
    </Link>
  );
}
