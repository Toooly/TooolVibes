import { logoutAdmin } from "@/app/(admin)/admin/actions";
import { BrandLogo } from "@/components/layout/brand-logo";
import { PremiumLink } from "@/components/ui/premium";
import type { AdminCollectionsRuntime } from "@/lib/admin/collection-queries";
import {
  getAdminToolWarningLabel,
  type AdminToolsRuntime,
} from "@/lib/admin/tool-queries";

type FounderControlCenterProps = {
  toolsRuntime: AdminToolsRuntime;
  collectionsRuntime: AdminCollectionsRuntime;
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
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em]"
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
    <article className="discovery-strip-dark rounded-[24px] px-4 py-4">
      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/52">
        {label}
      </p>
      <p className="mt-3 text-[2rem] leading-none text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-white/70">{detail}</p>
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
    <form action={logoutAdmin}>
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

export function FounderControlCenter({
  toolsRuntime,
  collectionsRuntime,
}: FounderControlCenterProps) {
  const publishedTools = toolsRuntime.tools.filter((tool) => tool.is_published).length;
  const publishedCollections = collectionsRuntime.collections.filter(
    (collection) =>
      collection.editorial_state === "published" ||
      collection.editorial_state === "featured",
  ).length;
  const openCollectionDecisions =
    collectionsRuntime.transitionReport.summary.conflicts +
    collectionsRuntime.transitionReport.summary.pending_import;
  const runtimeWarningCount =
    toolsRuntime.warnings.length + collectionsRuntime.publicSnapshot.meta.warnings.length;
  const quickLinks = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/new", label: "Nuovo tool", primary: true },
    { href: "/admin/collections", label: "Collections" },
    { href: "/admin/collections/review", label: "Conflict review" },
    { href: "/", label: "Vai al sito" },
  ] as const;
  const founderSignals = [
    {
      label: "Write posture",
      value: toolsRuntime.canWrite ? "Tools live" : "Tools locked",
      detail: toolsRuntime.writeMessage,
      tone: toolsRuntime.canWrite ? "rgba(236,253,245,0.14)" : "rgba(255,251,235,0.12)",
      borderColor: toolsRuntime.canWrite
        ? "rgba(15,118,110,0.18)"
        : "rgba(255,200,61,0.18)",
    },
    {
      label: "Review memory",
      value: collectionsRuntime.canReview ? "Persistente" : "Preview locale",
      detail: collectionsRuntime.reviewMessage,
      tone: collectionsRuntime.canReview
        ? "rgba(68,220,255,0.12)"
        : "rgba(255,251,235,0.12)",
      borderColor: collectionsRuntime.canReview
        ? "rgba(68,220,255,0.18)"
        : "rgba(255,200,61,0.18)",
    },
    {
      label: "Warnings",
      value: runtimeWarningCount > 0 ? `${runtimeWarningCount} aperti` : "Pulito",
      detail:
        runtimeWarningCount > 0
          ? "Restano fallback o source non del tutto live da chiudere."
          : "Nessun warning operativo aperto nel runtime corrente.",
      tone: runtimeWarningCount > 0
        ? "rgba(255,251,235,0.12)"
        : "rgba(236,253,245,0.14)",
      borderColor:
        runtimeWarningCount > 0 ? "rgba(255,200,61,0.18)" : "rgba(15,118,110,0.18)",
    },
  ];
  const metrics = [
    {
      label: "Tools workspace",
      value: String(toolsRuntime.tools.length),
      detail: `${publishedTools} pubblicati, ${toolsRuntime.tools.length - publishedTools} in lavorazione.`,
    },
    {
      label: "Collections workspace",
      value: String(collectionsRuntime.collections.length),
      detail: `${publishedCollections} pubbliche, ${collectionsRuntime.transitionReport.summary.pending_import} da importare.`,
    },
    {
      label: "Open decisions",
      value: String(openCollectionDecisions),
      detail: `${collectionsRuntime.transitionReport.summary.conflicts} conflitti e ${collectionsRuntime.transitionReport.summary.pending_import} pending import.`,
    },
    {
      label: "Runtime warnings",
      value: String(runtimeWarningCount),
      detail:
        runtimeWarningCount > 0
          ? "Sono presenti fallback o source non completamente live da verificare."
          : "Nessun warning aperto nel runtime attuale.",
    },
  ];

  return (
    <header className="page-shell pt-5 sm:pt-6">
      <div className="dark-panel brand-aura rounded-[34px] px-4.5 py-4.5 sm:px-6 sm:py-6">
        <div
          className="flex flex-col gap-5 border-b pb-5 xl:flex-row xl:items-start xl:justify-between"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <div className="max-w-[48rem]">
            <div className="flex items-start gap-3.5 sm:gap-4.5">
              <BrandLogo size={56} priority />
              <div className="min-w-0">
                <span
                  className="inline-flex rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/82"
                  style={{
                    borderColor: "rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.08)",
                  }}
                >
                  Founders runtime
                </span>
                <h1 className="mt-3 text-[1.7rem] text-white sm:text-[2rem]">
                  Control room editoriale e operativo
                </h1>
                <p className="mt-3 max-w-[44rem] text-sm leading-7 text-white/72 sm:text-[0.98rem]">
                  Una vista unica su tools, collections, source attive e write path. Il pannello
                  resta leggibile anche in fallback, ma segnala subito quando il runtime non è
                  pienamente live.
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <RuntimeBadge
                    label="Tools read"
                    value={toolsRuntime.adminReadSource}
                    tone={toolsRuntime.canWrite ? "live" : "warn"}
                  />
                  <RuntimeBadge
                    label="Tools public"
                    value={toolsRuntime.publicSnapshot.source}
                    tone={
                      toolsRuntime.publicSnapshot.source === "supabase" ? "live" : "warn"
                    }
                  />
                  <RuntimeBadge
                    label="Collections public"
                    value={collectionsRuntime.publicSnapshot.meta.active_source}
                    tone={
                      collectionsRuntime.publicSnapshot.meta.active_source === "supabase"
                        ? "live"
                        : "neutral"
                    }
                  />
                  <RuntimeBadge
                    label="Safe align"
                    value={collectionsRuntime.canSafeAlign ? "ready" : "off"}
                    tone={collectionsRuntime.canSafeAlign ? "live" : "neutral"}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="hidden flex-wrap items-center gap-3 sm:flex xl:max-w-[26rem] xl:justify-end">
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

        <div className="tool-rail -mx-1.5 mt-5 flex snap-x gap-3 overflow-x-auto px-1.5 pb-1 sm:hidden">
          {metrics.map((metric) => (
            <div key={metric.label} className="w-[15rem] shrink-0 snap-start">
              <MetricCard label={metric.label} value={metric.value} detail={metric.detail} />
            </div>
          ))}
        </div>

        <div className="mt-5 hidden gap-4 sm:grid lg:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              detail={metric.detail}
            />
          ))}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {founderSignals.map((signal) => (
            <article
              key={signal.label}
              className="rounded-[24px] border px-4 py-4"
              style={{ borderColor: signal.borderColor, background: signal.tone }}
            >
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/52">
                {signal.label}
              </p>
              <p className="mt-3 text-[1.22rem] leading-6 text-white">{signal.value}</p>
              <p className="mt-2 text-sm leading-6 text-white/72">{signal.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <article className="brand-panel rounded-[28px] p-5">
            <p className="editorial-label">Tools runtime</p>
            <h2 className="text-display-card mt-2 text-[1.42rem] sm:text-[1.56rem]">
              Workspace tools e public feed sotto controllo
            </h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "var(--muted)" }}>
              {toolsRuntime.readMessage}
            </p>
            <p className="mt-2 text-sm leading-7" style={{ color: "var(--muted-strong)" }}>
              {toolsRuntime.writeMessage}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="selection-chip rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em]">
                Public requested: {toolsRuntime.publicSnapshot.requestedSource}
              </span>
              <span className="selection-chip rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em]">
                Write target: {toolsRuntime.writeTarget ?? "locked"}
              </span>
              <span className="selection-chip rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em]">
                Live nel feed: {toolsRuntime.publicSnapshot.tools.length}
              </span>
            </div>
            <div className="mt-4 grid gap-2">
              {toolsRuntime.warnings.length > 0 ? (
                toolsRuntime.warnings.map((warning) => (
                  <div
                    key={warning}
                    className="rounded-[20px] border px-4 py-3 text-sm"
                    style={{
                      borderColor: "rgba(161,105,47,0.18)",
                      background: "rgba(255,251,235,0.96)",
                    }}
                  >
                    {getAdminToolWarningLabel(warning)}
                  </div>
                ))
              ) : (
                <div
                  className="rounded-[20px] border px-4 py-3 text-sm"
                  style={{
                    borderColor: "rgba(15,118,110,0.18)",
                    background: "rgba(236,253,245,0.95)",
                  }}
                >
                  Nessun warning aperto sul layer tools.
                </div>
              )}
            </div>
          </article>

          <article className="brand-panel rounded-[28px] p-5">
            <p className="editorial-label">Collections runtime</p>
            <h2 className="text-display-card mt-2 text-[1.42rem] sm:text-[1.56rem]">
              Transizione editoriale leggibile prima di scrivere
            </h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "var(--muted)" }}>
              {collectionsRuntime.writeMessage}
            </p>
            <p className="mt-2 text-sm leading-7" style={{ color: "var(--muted-strong)" }}>
              {collectionsRuntime.reviewMessage} {collectionsRuntime.safeAlignMessage}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="selection-chip rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em]">
                Public active: {collectionsRuntime.publicSnapshot.meta.active_source}
              </span>
              <span className="selection-chip rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em]">
                Review: {collectionsRuntime.canReview ? "on" : "off"}
              </span>
              <span className="selection-chip rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em]">
                Alignable:{" "}
                {
                  Object.values(collectionsRuntime.syncPreviewBySlug).filter(
                    (preview) => preview?.state === "safe-align-ready",
                  ).length
                }
              </span>
            </div>
            <div className="mt-4 grid gap-2">
              {collectionsRuntime.publicSnapshot.meta.warnings.length > 0 ? (
                collectionsRuntime.publicSnapshot.meta.warnings.map((warning) => (
                  <div
                    key={warning}
                    className="rounded-[20px] border px-4 py-3 text-sm"
                    style={{
                      borderColor: "rgba(161,105,47,0.18)",
                      background: "rgba(255,251,235,0.96)",
                    }}
                  >
                    {warning}
                  </div>
                ))
              ) : (
                <div
                  className="rounded-[20px] border px-4 py-3 text-sm"
                  style={{
                    borderColor: "rgba(15,118,110,0.18)",
                    background: "rgba(236,253,245,0.95)",
                  }}
                >
                  Nessun warning aperto sulla source pubblica collections.
                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    </header>
  );
}
