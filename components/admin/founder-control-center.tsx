import { BrandLogo } from "@/components/layout/brand-logo";
import { PremiumLink } from "@/components/ui/premium";
import type { AdminArticlesRuntime } from "@/lib/admin/article-queries";

type FounderControlCenterProps = {
  articlesRuntime: AdminArticlesRuntime;
};

function RuntimeBadge({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "live" | "warn";
}) {
  const styles =
    tone === "live"
      ? {
          borderColor: "rgba(68,220,255,0.22)",
          background: "rgba(68,220,255,0.12)",
          color: "rgba(245,248,255,0.94)",
        }
      : tone === "warn"
        ? {
            borderColor: "rgba(255,200,61,0.22)",
            background: "rgba(255,200,61,0.12)",
            color: "rgba(255,244,214,0.92)",
          }
        : {
            borderColor: "rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.08)",
            color: "rgba(245,248,255,0.88)",
          };

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]"
      style={styles}
    >
      <span className="text-white/54">{label}</span>
      <span>{value}</span>
    </span>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-[20px] border border-white/12 bg-white/8 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/52">
        {label}
      </p>
      <div className="mt-2 flex items-end gap-2">
        <p className="text-[1.75rem] leading-none text-white">{value}</p>
        <p className="pb-0.5 text-xs leading-5 text-white/66">{detail}</p>
      </div>
    </article>
  );
}

function QuickLink({
  href,
  label,
  primary = false,
  compact = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
  compact?: boolean;
}) {
  return (
    <PremiumLink
      href={href}
      tone={primary ? "primary" : "ghost"}
      size={compact ? "sm" : "md"}
      className={
        primary
          ? "text-white"
          : "border-white/14 bg-white/8 text-white/88 hover:bg-white/12"
      }
    >
      {label}
    </PremiumLink>
  );
}

function LogoutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action="/api/admin/logout" method="post">
      <button
        type="submit"
        className={`premium-button premium-button-ghost border-white/14 bg-white/8 font-semibold text-white/86 hover:bg-white/12 ${compact ? "px-3.5 py-2 text-[0.78rem]" : "px-4 py-2.5 text-sm"}`}
        style={{
          borderColor: "rgba(255,255,255,0.14)",
        }}
      >
        Esci
      </button>
    </form>
  );
}

function getReadSourceLabel(source: AdminArticlesRuntime["adminReadSource"]) {
  switch (source) {
    case "supabase":
      return "Archivio principale";
    case "storage":
      return "Archivio alternativo";
    case "mixed":
      return "Archivio misto";
    case "legacy":
      return "Articoli importati";
    case "empty":
      return "Nessun articolo";
    default:
      return source;
  }
}

function getWriteTargetLabel(target: AdminArticlesRuntime["writeTarget"]) {
  switch (target) {
    case "supabase":
      return "Archivio principale";
    case "storage":
      return "Archivio alternativo";
    default:
      return "Sola lettura";
  }
}

export function FounderControlCenter({ articlesRuntime }: FounderControlCenterProps) {
  const publishedArticles = articlesRuntime.articles.filter(
    (article) => article.status === "published",
  ).length;
  const draftArticles = articlesRuntime.articles.length - publishedArticles;
  const runtimeWarningCount = articlesRuntime.warnings.length;
  const quickLinks = [
    { href: "/admin", label: "Blog" },
    { href: "/admin/new", label: "Nuovo articolo", primary: true },
    { href: "/posts", label: "Post pubblici" },
    { href: "/", label: "Sito" },
  ] as const;
  const metrics = [
    {
      label: "Articoli",
      value: String(articlesRuntime.articles.length),
      detail: `${publishedArticles} pubblicati`,
    },
    {
      label: "Bozze",
      value: String(draftArticles),
      detail: "da lavorare",
    },
    {
      label: "Avvisi",
      value: String(runtimeWarningCount),
      detail: runtimeWarningCount > 0 ? "da verificare" : "tutto in ordine",
    },
  ];

  return (
    <header className="page-shell pt-4 sm:pt-5">
      <div className="dark-panel rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
        <div
          className="flex flex-col gap-4 border-b pb-4 xl:flex-row xl:items-center xl:justify-between"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <div className="max-w-[43rem]">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <BrandLogo size={48} priority />
              <div className="min-w-0">
                <span
                  className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/82"
                  style={{
                    borderColor: "rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.08)",
                  }}
                >
                  Backoffice
                </span>
                <h1 className="mt-2 text-[1.38rem] leading-tight text-white sm:text-[1.7rem]">
                  Gestione blog TooolVibes
                </h1>
                <p className="mt-2 max-w-[40rem] text-sm leading-6 text-white/70">
                  Creazione, modifica e pubblicazione degli articoli in una navigazione compatta.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <RuntimeBadge
                    label="Lettura"
                    value={getReadSourceLabel(articlesRuntime.adminReadSource)}
                    tone={articlesRuntime.canWrite ? "live" : "warn"}
                  />
                  <RuntimeBadge
                    label="Salvataggio"
                    value={getWriteTargetLabel(articlesRuntime.writeTarget)}
                    tone={articlesRuntime.canWrite ? "live" : "warn"}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="hidden flex-wrap items-center gap-2 sm:flex xl:max-w-[31rem] xl:justify-end">
            {quickLinks.map((item) => (
              <QuickLink
                key={item.href}
                href={item.href}
                label={item.label}
                primary={Boolean("primary" in item && item.primary)}
              />
            ))}
            <LogoutButton />
          </div>
        </div>

        <div className="tool-rail -mx-1 mt-4 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:hidden">
          {quickLinks.map((item) => (
            <QuickLink
              key={`mobile-${item.href}`}
              href={item.href}
              label={item.label}
              primary={Boolean("primary" in item && item.primary)}
              compact
            />
          ))}
          <LogoutButton compact />
        </div>

        <div className="tool-rail -mx-1.5 mt-4 flex snap-x gap-3 overflow-x-auto px-1.5 pb-1 sm:hidden">
          {metrics.map((metric) => (
            <div key={metric.label} className="w-[14rem] shrink-0 snap-start">
              <MetricCard label={metric.label} value={metric.value} detail={metric.detail} />
            </div>
          ))}
        </div>

        <div className="mt-4 hidden gap-3 sm:grid lg:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              detail={metric.detail}
            />
          ))}
        </div>
      </div>
    </header>
  );
}
