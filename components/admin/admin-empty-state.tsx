import Link from "@/components/ui/app-link";

export function AdminEmptyState({
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="tv-cc-card" style={{ textAlign: "center", justifyItems: "center" }}>
      <div>
        <h2 className="tv-cc-card__title">{title}</h2>
        <p className="tv-cc-card__meta" style={{ justifyContent: "center" }}>
          {description}
        </p>
      </div>
      {ctaHref && ctaLabel ? (
        <Link href={ctaHref} className="tv-cc-btn tv-cc-btn--primary">
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
