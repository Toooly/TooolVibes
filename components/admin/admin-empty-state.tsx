import { PremiumBadge, PremiumLink, PremiumPanel } from "@/components/ui/premium";

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
    <PremiumPanel tone="light" className="px-6 py-8 text-center sm:px-8 sm:py-10">
      <PremiumBadge tone="accent" className="mx-auto">
        Founders workspace
      </PremiumBadge>
      <h2 className="mt-4 text-2xl text-[var(--foreground)]">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7" style={{ color: "var(--muted)" }}>
        {description}
      </p>
      {ctaHref && ctaLabel ? (
        <PremiumLink href={ctaHref} tone="primary" className="mt-6">
          {ctaLabel}
        </PremiumLink>
      ) : null}
    </PremiumPanel>
  );
}
