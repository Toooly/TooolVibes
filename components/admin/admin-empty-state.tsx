import Link from "next/link";

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
    <div
      className="brand-panel rounded-[28px] px-6 py-8 text-center sm:px-8 sm:py-10"
    >
      <p className="pill mx-auto">Founders workspace</p>
      <h2 className="text-2xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7" style={{ color: "var(--muted)" }}>
        {description}
      </p>
      {ctaHref && ctaLabel ? (
        <Link
          href={ctaHref}
          className="button-shell button-primary mt-6 inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-strong), var(--accent) 72%, var(--cyan))",
          }}
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
