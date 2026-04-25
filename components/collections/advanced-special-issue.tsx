import Link from "next/link";

import type {
  AdvancedSpecialIssueBlock,
  AdvancedSpecialIssueToolMoment,
  CuratedCollection,
  ResolvedCollectionToolSlot,
} from "@/lib/types/collection";
import {
  countHiddenAdvancedIssueBlocks,
  getVisibleAdvancedIssueBlocks,
} from "@/lib/collections/format";

import { SectionHeading } from "@/components/sections/section-heading";
import { ShortlistLink } from "@/components/tools/shortlist-link";
import { ButtonLink } from "@/components/ui/button";

type AdvancedSpecialIssueProps = {
  collection: CuratedCollection;
  hasFullAccess: boolean;
  premiumUpgradeHref: string;
  premiumUpgradeLabel: string;
};

function resolveToolSlot(
  toolSlug: string,
  lookup: Map<string, ResolvedCollectionToolSlot>,
) {
  return lookup.get(toolSlug) ?? null;
}

function ToolMomentCard({
  moment,
  lookup,
}: {
  moment: AdvancedSpecialIssueToolMoment;
  lookup: Map<string, ResolvedCollectionToolSlot>;
}) {
  const slot = resolveToolSlot(moment.tool_slug, lookup);

  return (
    <article
      className="rounded-[24px] border px-4 py-4"
      style={{
        borderColor:
          moment.emphasis === "anchor"
            ? "rgba(112, 82, 255, 0.22)"
            : moment.emphasis === "watch"
              ? "rgba(242, 179, 71, 0.24)"
              : "var(--line)",
        background:
          moment.emphasis === "anchor"
            ? "linear-gradient(180deg, rgba(248,244,255,0.96), rgba(241,234,255,0.88))"
            : "rgba(255,255,255,0.76)",
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="selection-status">
          {moment.emphasis === "anchor"
            ? "Momento chiave"
            : moment.emphasis === "watch"
              ? "Da tenere d'occhio"
              : "Ruolo di supporto"}
        </span>
        <span className="editorial-label">{moment.label}</span>
      </div>
      <h4 className="text-display-card mt-3 text-[1.18rem]">
        {slot?.tool.name ?? moment.tool_slug}
      </h4>
      <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
        {moment.note}
      </p>
      {slot ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="selection-chip rounded-full border px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.78)", color: "var(--muted-strong)" }}>
            {slot.role}
          </span>
          <Link
            href={`/toools/${slot.tool.slug}`}
            className="section-quiet-link text-sm font-semibold"
            style={{ color: "var(--accent-strong)" }}
          >
            Apri profilo
          </Link>
        </div>
      ) : null}
    </article>
  );
}

function renderIssueBlock(
  block: AdvancedSpecialIssueBlock,
  lookup: Map<string, ResolvedCollectionToolSlot>,
  {
    hasFullAccess,
    premiumUpgradeHref,
    premiumUpgradeLabel,
  }: {
    hasFullAccess: boolean;
    premiumUpgradeHref: string;
    premiumUpgradeLabel: string;
  },
) {
  if (block.type === "opening-note") {
    return (
      <article key={block.id} className="brand-panel panel-lift rounded-[32px] p-4.5 sm:p-5 lg:col-span-12">
        <p className="editorial-label">{block.eyebrow}</p>
        <h3 className="text-display-card mt-3 max-w-none text-[1.66rem] sm:max-w-[20ch] sm:text-[1.84rem] sm:text-balance">
          {block.title}
        </h3>
        <p className="text-body-soft mt-4 max-w-[44rem] text-[0.98rem]" style={{ color: "var(--muted-strong)" }}>
          {block.body}
        </p>
      </article>
    );
  }

  if (block.type === "thesis") {
    return (
      <article key={block.id} className="dark-panel panel-lift rounded-[32px] p-4.5 text-white sm:p-5 lg:col-span-7">
        <p className="editorial-label !text-white/60">{block.eyebrow}</p>
        <h3 className="text-display-card mt-3 max-w-none text-[1.58rem] text-white sm:max-w-[19ch] sm:text-balance">
          {block.title}
        </h3>
        <p className="mt-4 text-[0.98rem] leading-7 text-white/82">{block.statement}</p>
        <div className="mt-5 grid gap-3">
          {block.points.map((point) => (
            <div key={point} className="discovery-strip-dark rounded-[22px] px-4 py-4 text-sm leading-6 text-white/82">
              {point}
            </div>
          ))}
        </div>
      </article>
    );
  }

  if (block.type === "curated-picks") {
    return (
      <article key={block.id} className="brand-panel panel-lift rounded-[32px] p-4.5 sm:p-5 lg:col-span-12">
        <p className="editorial-label">{block.eyebrow}</p>
        <h3 className="text-display-card mt-3 max-w-none text-[1.56rem] sm:max-w-[19ch] sm:text-balance">
          {block.title}
        </h3>
        <p className="text-body-soft mt-3 max-w-[48rem] text-[0.96rem]" style={{ color: "var(--muted-strong)" }}>
          {block.body}
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {block.tool_moments.map((moment) => (
            <ToolMomentCard key={`${block.id}-${moment.tool_slug}`} moment={moment} lookup={lookup} />
          ))}
        </div>
      </article>
    );
  }

  if (block.type === "compare-insight") {
    const comparedSlots = block.compare.compared_tool_slugs
      .map((slug) => resolveToolSlot(slug, lookup))
      .filter((slot): slot is ResolvedCollectionToolSlot => Boolean(slot));

    return (
      <article key={block.id} className="dark-panel panel-lift rounded-[32px] p-4.5 text-white sm:p-5 lg:col-span-5">
        <p className="editorial-label !text-white/60">{block.eyebrow}</p>
        <h3 className="text-display-card mt-3 text-[1.62rem] text-white sm:text-balance">
          {block.title}
        </h3>
        <p className="mt-3 text-sm leading-7 text-white/80">{block.body}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {comparedSlots.map((slot) => (
            <span
              key={slot.tool.slug}
              className="selection-chip rounded-full border border-white/14 px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-white/84"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              {slot.tool.name}
            </span>
          ))}
        </div>
        <div className="mt-5 rounded-[24px] border border-white/12 bg-white/6 px-4 py-4">
          <p className="text-sm leading-6 text-white/84">{block.compare.insight}</p>
          <div className="mt-4 grid gap-2">
            {block.compare.differentiators.map((item) => (
              <p key={item} className="text-sm leading-6 text-white/74">
                {item}
              </p>
            ))}
          </div>
          <p className="mt-4 text-[0.84rem] leading-6 text-white/66">
            {block.compare.recommendation}
          </p>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <ButtonLink href="/compare">Apri compare</ButtonLink>
          <Link
            href="/shortlist"
            className="section-quiet-link text-sm font-semibold"
            style={{ color: "white" }}
          >
            Porta i candidati in shortlist
          </Link>
        </div>
      </article>
    );
  }

  if (block.type === "workflow") {
    return (
      <article key={block.id} className="brand-panel panel-lift rounded-[32px] p-4.5 sm:p-5 lg:col-span-7">
        <p className="editorial-label">{block.eyebrow}</p>
        <h3 className="text-display-card mt-3 max-w-none text-[1.56rem] sm:max-w-[19ch] sm:text-balance">
          {block.title}
        </h3>
        <p className="text-body-soft mt-3 text-[0.96rem]" style={{ color: "var(--muted-strong)" }}>
          {block.body}
        </p>
        <div className="mt-5 grid gap-3">
          {block.steps.map((step, index) => {
            const slot = step.tool_slug ? resolveToolSlot(step.tool_slug, lookup) : null;

            return (
              <div
                key={`${block.id}-${step.title}`}
                className="metadata-block rounded-[24px] px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="editorial-label">Passaggio {String(index + 1).padStart(2, "0")}</p>
                    <h4 className="text-display-card mt-2 text-[1.15rem]">{step.title}</h4>
                  </div>
                  {slot ? <span className="selection-status">{slot.tool.name}</span> : null}
                </div>
                <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                  {step.body}
                </p>
                {step.outcome ? (
                  <p className="mt-3 text-[0.84rem] leading-6" style={{ color: "var(--muted)" }}>
                    Esito: {step.outcome}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </article>
    );
  }

  if (block.type === "why-this-matters") {
    return (
      <article key={block.id} className="dark-panel panel-lift rounded-[32px] p-4.5 text-white sm:p-5 lg:col-span-5">
        <p className="editorial-label !text-white/60">{block.eyebrow}</p>
        <h3 className="text-display-card mt-3 max-w-none text-[1.48rem] text-white sm:max-w-[18ch] sm:text-balance">
          {block.title}
        </h3>
        <p className="mt-3 text-sm leading-7 text-white/80">{block.body}</p>
        <div className="mt-5 grid gap-3">
          {block.points.map((point) => (
            <div key={point} className="discovery-strip-dark rounded-[22px] px-4 py-4 text-sm leading-6 text-white/82">
              {point}
            </div>
          ))}
        </div>
      </article>
    );
  }

  if (block.type === "editorial-takeaway") {
    return (
      <article key={block.id} className="brand-panel brand-aura panel-lift rounded-[32px] p-4.5 sm:p-5 lg:col-span-12">
        <p className="editorial-label">{block.eyebrow}</p>
        <h3 className="text-display-card mt-3 max-w-none text-[1.64rem] sm:max-w-[19ch] sm:text-balance">
          {block.title}
        </h3>
        <p className="text-body-soft mt-3 max-w-[42rem] text-[0.98rem]" style={{ color: "var(--muted-strong)" }}>
          {block.body}
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {block.takeaways.map((item) => (
            <div
              key={item}
              className="rounded-[24px] border px-4 py-4 text-sm leading-6"
              style={{
                borderColor: "rgba(112, 82, 255, 0.16)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(245,240,252,0.82))",
              }}
            >
              {item}
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <ShortlistLink variant="button" />
          <Link
            href="/compare"
            className="section-quiet-link text-sm font-semibold"
            style={{ color: "var(--accent-strong)" }}
          >
            Apri compare
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article key={block.id} className="dark-panel panel-lift rounded-[32px] p-4.5 text-white sm:p-5 lg:col-span-12">
      <p className="editorial-label !text-white/60">{block.eyebrow}</p>
      <h3 className="text-display-card mt-3 max-w-none text-[1.48rem] text-white sm:max-w-[18ch] sm:text-balance">
        {block.title}
      </h3>
      <p className="mt-3 max-w-[44rem] text-sm leading-7 text-white/80">{block.body}</p>
      <div className="mt-5 rounded-[24px] border border-white/12 bg-white/6 px-4 py-4 text-sm leading-6 text-white/74">
        {block.member_note}
      </div>
      {!hasFullAccess ? (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <ButtonLink href={premiumUpgradeHref}>{premiumUpgradeLabel}</ButtonLink>
          <Link
            href="/account"
            className="section-quiet-link text-sm font-semibold"
            style={{ color: "white" }}
          >
            Apri account
          </Link>
        </div>
      ) : null}
    </article>
  );
}

export function AdvancedSpecialIssue({
  collection,
  hasFullAccess,
  premiumUpgradeHref,
  premiumUpgradeLabel,
}: AdvancedSpecialIssueProps) {
  const issue = collection.advanced_issue;

  if (!issue || issue.format !== "advanced-special-issue") {
    return null;
  }

  const visibleBlocks = getVisibleAdvancedIssueBlocks(issue.blocks, hasFullAccess);
  const hiddenBlockCount = countHiddenAdvancedIssueBlocks(issue.blocks, visibleBlocks);
  const toolLookup = new Map(
    collection.included_tools.map((slot) => [slot.tool.slug, slot] as const),
  );

  return (
    <section className="tone-issue brand-panel brand-aura panel-lift rounded-[36px] p-5 sm:p-6 lg:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5 soft-divider">
        <SectionHeading
          eyebrow="Special issue avanzata"
          title="Il formato lungo in cui la selezione diventa tesi."
          description={issue.intro}
        />
        <div className="space-y-2">
          <span className="selection-status">Formato issue</span>
          <p className="text-[0.74rem] uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
            {issue.reading_flow}
          </p>
        </div>
      </div>

      <div className="metadata-block mt-5 rounded-[28px] px-4.5 py-4.5">
        <p className="brand-kicker">Tesi dell&apos;issue</p>
        <p className="mt-3 max-w-[46rem] text-[1.02rem] leading-7" style={{ color: "var(--muted-strong)" }}>
          {issue.thesis}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {issue.takeaways.slice(0, 3).map((item) => (
            <div
              key={item}
              className="rounded-[22px] border px-4 py-4 text-sm leading-6"
              style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.74)" }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="editorial-grid mt-5 gap-y-4">
        {visibleBlocks.map((block) =>
          renderIssueBlock(block, toolLookup, {
            hasFullAccess,
            premiumUpgradeHref,
            premiumUpgradeLabel,
          }),
        )}
      </div>

      {!hasFullAccess && hiddenBlockCount > 0 ? (
        <div
          className="mt-5 rounded-[28px] border px-4.5 py-4.5"
          style={{
            borderColor: "rgba(242, 179, 71, 0.26)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(249,239,212,0.84))",
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="pill pill-premium">Confine preview</p>
            <span className="selection-status">{hiddenBlockCount} moduli nel layer completo</span>
          </div>
          <p className="mt-3 max-w-[46rem] text-[0.96rem] leading-7" style={{ color: "var(--muted-strong)" }}>
            La preview lascia leggibile la tesi dell&apos;issue. Il layer completo conserva i moduli piu` densi: note comparative piu` lunghe, varianti di stack e chiusure editoriali piu` specifiche.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <ButtonLink href={premiumUpgradeHref}>{premiumUpgradeLabel}</ButtonLink>
            <Link
              href="/account#member-access"
              className="section-quiet-link text-sm font-semibold"
              style={{ color: "var(--accent-strong)" }}
            >
              Capisci il member layer
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
