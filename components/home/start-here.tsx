"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import { HomeRadarPreview } from "@/components/radar/radar-experience";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { computeEditorialScore } from "@/lib/data/editorial-score";
import { useOnceInView } from "@/lib/motion/use-once-in-view";

export function formatHomeAnalysisTime(raw: string | null | undefined) {
  const value = raw?.trim() ?? "";
  if (!value) return "—";
  if (/min/i.test(value)) return value;
  return `${value} min`;
}

export type HomeStackPreview = {
  slug: string;
  title: string;
  kicker: string;
  description: string;
};

const START_TABS = [
  { id: "tool", label: "TOOL" },
  { id: "stack", label: "STACK" },
  { id: "radar", label: "RADAR" },
] as const;

type StartTabId = (typeof START_TABS)[number]["id"];

function hasAffiliateSignal(href: string | null | undefined) {
  if (!href) return false;

  try {
    const url = new URL(href);
    return ["aff", "affiliate", "ref", "referral", "via"].some((key) =>
      url.searchParams.has(key),
    );
  } catch {
    return false;
  }
}

function truncate(str: string, max: number) {
  if (str.length <= max) return str;
  return str.slice(0, max).trimEnd() + "…";
}

function iconUrlFor(tool: ToolPublicView) {
  return tool.domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(tool.domain)}&sz=128`
    : null;
}

function initialFor(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export function StartHere({
  focusTool,
  tools,
  stacks,
}: {
  focusTool: ToolPublicView | null;
  tools: ToolPublicView[];
  stacks: HomeStackPreview[];
}) {
  const [tab, setTab] = useState<StartTabId>("tool");
  const tabRefs = useRef<Partial<Record<StartTabId, HTMLButtonElement | null>>>({});

  function selectTab(next: StartTabId, focus = false) {
    setTab(next);
    if (focus) tabRefs.current[next]?.focus();
  }

  function onTabsKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = START_TABS.findIndex((item) => item.id === tab);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % START_TABS.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + START_TABS.length) % START_TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = START_TABS.length - 1;
    else return;
    event.preventDefault();
    selectTab(START_TABS[next].id, true);
  }

  return (
    <section className="def-start" aria-labelledby="def-start-title">
      <header className="def-start__head">
        <h2 id="def-start-title" className="def-start__title">
          Da dove partire?
        </h2>
        <div
          className="def-start__tabs"
          role="tablist"
          aria-label="Da dove partire"
          onKeyDown={onTabsKeyDown}
        >
          {START_TABS.map((item) => {
            const selected = item.id === tab;
            return (
              <button
                key={item.id}
                type="button"
                className={`def-start__tab${selected ? " is-active" : ""}`}
                role="tab"
                id={`def-start-tab-${item.id}`}
                aria-selected={selected}
                aria-controls={`def-start-panel-${item.id}`}
                tabIndex={selected ? 0 : -1}
                ref={(node) => {
                  tabRefs.current[item.id] = node;
                }}
                onClick={() => selectTab(item.id)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      <div
        className="def-start__panel"
        role="tabpanel"
        id="def-start-panel-tool"
        aria-labelledby="def-start-tab-tool"
        hidden={tab !== "tool"}
      >
        <IvoryEditorial focusTool={focusTool} tools={tools} />
      </div>

      <div
        className="def-start__panel"
        role="tabpanel"
        id="def-start-panel-stack"
        aria-labelledby="def-start-tab-stack"
        hidden={tab !== "stack"}
      >
        <HomeStacks stacks={stacks} />
      </div>

      <div
        className="def-start__panel"
        role="tabpanel"
        id="def-start-panel-radar"
        aria-labelledby="def-start-tab-radar"
        hidden={tab !== "radar"}
      >
        <div className="def-start__radar">
          <HomeRadarPreview />
        </div>
      </div>
    </section>
  );
}

function IvoryEditorial({
  focusTool,
  tools,
}: {
  focusTool: ToolPublicView | null;
  tools: ToolPublicView[];
}) {
  if (!focusTool) return null;
  const editorialScore = computeEditorialScore(focusTool);
  const isAffiliateLink =
    Boolean(focusTool.affiliateUrl) || hasAffiliateSignal(focusTool.url);
  return (
    <div className="def-editorial" aria-label="In evidenza">
      <div aria-hidden="true" className="def-editorial__traces" />
      <div className="def-editorial__inner">
        <article className="def-editorial__spotlight">
          <div className="def-editorial__spot-body">
            <p className="def-editorial__spot-eyebrow">
              In primo piano
            </p>
            <div className="def-editorial__spot-head">
              <span className="def-editorial__spot-avatar" aria-hidden="true">
                {iconUrlFor(focusTool) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={iconUrlFor(focusTool)!} alt="" loading="eager" decoding="async" />
                ) : (
                  <span>{initialFor(focusTool.name)}</span>
                )}
              </span>
              <div className="def-editorial__spot-identity">
                <h3 className="def-editorial__spot-name">{focusTool.name}</h3>
                <p className="def-editorial__spot-cat">
                  {focusTool.categoryLabel}
                  {focusTool.levelLabel ? ` · ${focusTool.levelLabel}` : ""}
                </p>
              </div>
            </div>
            <p className="def-editorial__spot-lede">
              {focusTool.tldr || focusTool.shortDescription}
            </p>
            <p className="def-editorial__distinction">
              {focusTool.editorialNote ||
                "Scelta per il taglio, non per il punteggio."}
            </p>

            <ul className="def-editorial__spot-rail" aria-label="Dettagli editoriali">
              <li>
                <span>Valutazione editoriale</span>
                <strong>
                  {editorialScore.status === "assessed" && editorialScore.value !== null
                    ? `${editorialScore.value.toFixed(1)} / 10`
                    : "In preparazione"}
                </strong>
              </li>
              <li>
                <span>Casi d&apos;uso</span>
                <strong>{focusTool.useCases.length}</strong>
              </li>
              <li>
                <span>Tempo di analisi</span>
                <strong>{formatHomeAnalysisTime(focusTool.readingTime)}</strong>
              </li>
            </ul>

            <div className="def-editorial__spot-actions">
              <Link
                href={`/toools/${focusTool.slug}`}
                className="def-editorial__spot-cta def-editorial__spot-cta--primary"
                aria-label="Apri la scheda dello strumento selezionato"
              >
                Apri la scheda
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
              {focusTool.url ? (
                <a
                  href={focusTool.url}
                  target="_blank"
                  rel={
                    isAffiliateLink
                      ? "sponsored noopener noreferrer"
                      : "noopener noreferrer"
                  }
                  className="def-editorial__spot-cta def-editorial__spot-cta--ghost"
                  aria-label={
                    isAffiliateLink
                      ? `Prova ${focusTool.name} (link affiliato)`
                      : `Visita ${focusTool.name}`
                  }
                >
                  {focusTool.ctaLabel ??
                    (isAffiliateLink ? `Prova ${focusTool.name}` : `Visita ${focusTool.name}`)}
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              ) : null}
            </div>
            {isAffiliateLink ? (
              <p className="def-editorial__spot-disclosure">
                Link affiliato: potremmo ricevere una commissione, senza costi
                aggiuntivi per te.
              </p>
            ) : null}
          </div>
        </article>

        <ClassificaOrAlternativa tools={tools} />
      </div>
    </div>
  );
}

function ClassificaOrAlternativa({
  tools,
}: {
  tools: ToolPublicView[];
}) {
  const evaluated = tools
    .map((tool) => ({
      tool,
      score: computeEditorialScore({ publicTool: tool.publicTool, cautions: tool.cautions }),
    }))
    .filter((item) => item.score.status === "assessed" && item.score.value !== null)
    .sort((left, right) => (right.score.value ?? 0) - (left.score.value ?? 0))
    .map((item) => item.tool);
  const isPodium = evaluated.length >= 3;
  const top3 = isPodium ? evaluated.slice(0, 3) : tools.slice(0, 3);

  if (isPodium) {
    return (
      <div className="def-editorial__podium" role="region" aria-label="Valutazioni editoriali">
        <div className="def-editorial__pod-head-row">
          <p className="def-editorial__pod-eyebrow">Valutazioni editoriali</p>
          <p className="def-editorial__pod-subtitle">
            Ordinate per valutazione della redazione, non per un ranking di mercato.
          </p>
        </div>
        <PodiumStage top3={top3} />
      </div>
    );
  }

  return (
    <div className="def-editorial__podium" role="region" aria-label="Tre tool da esplorare">
      <div className="def-editorial__pod-head-row">
        <p className="def-editorial__pod-eyebrow">Dal catalogo</p>
        <p className="def-editorial__pod-subtitle">
          Tre tool da esplorare.
        </p>
      </div>
      <ExploratoryPodium top3={top3} />
    </div>
  );
}

function ExploratoryPodium({
  top3,
}: {
  top3: ToolPublicView[];
}) {
  return (
    <ol className="def-editorial__pod-stage def-editorial__exploratory-stage">
      {top3[0] ? (
        <li className="def-editorial__pod-cell def-editorial__pod-cell--first">
          <ExploratoryCard tool={top3[0]} />
        </li>
      ) : null}
      {top3[1] ? (
        <li className="def-editorial__pod-cell def-editorial__pod-cell--second">
          <ExploratoryCard tool={top3[1]} />
        </li>
      ) : null}
      {top3[2] ? (
        <li className="def-editorial__pod-cell def-editorial__pod-cell--third">
          <ExploratoryCard tool={top3[2]} />
        </li>
      ) : null}
    </ol>
  );
}

function ExploratoryCard({
  tool,
}: {
  tool: ToolPublicView;
}) {
  const iconUrl = iconUrlFor(tool);
  const initial = initialFor(tool.name);
  return (
    <Link
      href={`/toools/${tool.slug}`}
      className="def-editorial__exploratory-card"
      aria-label={`Apri la scheda di ${tool.name}`}
    >
      <span className="def-editorial__exploratory-avatar" aria-hidden="true">
        {iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={iconUrl} alt="" loading="lazy" decoding="async" />
        ) : (
          <span>{initial}</span>
        )}
      </span>
      <span className="def-editorial__exploratory-name">{tool.name}</span>
      <span className="def-editorial__exploratory-cat">{tool.categoryLabel}</span>
      <span className="def-editorial__exploratory-pill">
        {computeEditorialScore({ publicTool: tool.publicTool }).status === "assessed"
          ? "Valutato"
          : "In valutazione"}
      </span>
    </Link>
  );
}

function PodiumStage({
  top3,
}: {
  top3: ToolPublicView[];
}) {
  const { ref, hasBeenVisible, preferReducedMotion } = useOnceInView<HTMLOListElement>({
    threshold: 0.28,
    rootMargin: "0px 0px -8% 0px",
  });
  const pending = !preferReducedMotion && !hasBeenVisible;

  return (
    <ol
      ref={ref}
      className="def-editorial__pod-stage"
      data-motion-pending={pending ? "true" : "false"}
    >
      {top3[0] ? (
        <li className="def-editorial__pod-cell def-editorial__pod-cell--first">
          <PodiumCard
            tool={top3[0]}
            rank={1}
            revealed={hasBeenVisible || preferReducedMotion}
          />
        </li>
      ) : null}
      {top3[1] ? (
        <li className="def-editorial__pod-cell def-editorial__pod-cell--second">
          <PodiumCard
            tool={top3[1]}
            rank={2}
            revealed={hasBeenVisible || preferReducedMotion}
          />
        </li>
      ) : null}
      {top3[2] ? (
        <li className="def-editorial__pod-cell def-editorial__pod-cell--third">
          <PodiumCard
            tool={top3[2]}
            rank={3}
            revealed={hasBeenVisible || preferReducedMotion}
          />
        </li>
      ) : null}
    </ol>
  );
}

function PodiumCard({
  tool,
  rank,
  revealed = true,
}: {
  tool: ToolPublicView;
  rank: 1 | 2 | 3;
  revealed?: boolean;
}) {
  const score = computeEditorialScore(tool);
  const rationale = truncate(tool.tldr || tool.shortDescription || "", rank === 1 ? 110 : 90);
  const pills: { label: string; tone: "gold" | "cyan" | "violet" }[] = [
    {
      label: score.status === "assessed" ? "Valutato" : "Da valutare",
      tone: rank === 1 ? "gold" : rank === 2 ? "cyan" : "violet",
    },
  ];
  if (tool.levelLabel) {
    pills.push({ label: tool.levelLabel, tone: rank === 1 ? "gold" : rank === 2 ? "cyan" : "violet" });
  }
  const visiblePills = pills.slice(0, 2);
  const iconUrl = iconUrlFor(tool);
  const initial = initialFor(tool.name);

  return (
    <Link
      href={`/toools/${tool.slug}`}
      className={`def-editorial__pod-card def-editorial__pod-card--rank-${rank}${revealed ? " is-revealed" : ""}`}
      data-rank={rank}
      aria-label={`Apri la scheda di ${tool.name}`}
    >
      <span className="def-editorial__pod-rank" aria-label={`Valutazione editoriale ${rank}`}>
        {String(rank).padStart(2, "0")}
      </span>
      <span className="def-editorial__pod-avatar" aria-hidden="true">
        {iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={iconUrl} alt="" loading="eager" decoding="async" />
        ) : (
          <span>{initial}</span>
        )}
      </span>
      <span className="def-editorial__pod-name">{tool.name}</span>
      <span className="def-editorial__pod-cat">{tool.categoryLabel}</span>

      {rationale ? (
        <span className="def-editorial__pod-rationale">{rationale}</span>
      ) : null}

      {visiblePills.length > 0 ? (
        <span className="def-editorial__pod-pills" aria-hidden="true">
          {visiblePills.map((pill, i) => (
            <span
              key={i}
              className={`def-editorial__pod-pill def-editorial__pod-pill--${pill.tone}`}
            >
              {pill.label}
            </span>
          ))}
        </span>
      ) : null}

      <span className="def-editorial__pod-score">
        <span className="def-editorial__pod-score-num">
          {score.value !== null ? score.value.toFixed(1) : "—"}
        </span>
        <span className="def-editorial__pod-score-max">
          {score.value !== null ? "/ 10" : "da valutare"}
        </span>
      </span>
    </Link>
  );
}

function HomeStacks({ stacks }: { stacks: HomeStackPreview[] }) {
  return (
    <div className="def-stacks">
      <p className="def-stacks__lede">
        Raccolte operative: ruolo di ogni tool, limiti e quando non usarle.
      </p>
      {stacks.length > 0 ? (
        <ul className="def-stacks__grid">
          {stacks.map((stack) => (
            <li key={stack.slug}>
              <Link href={`/collections/${stack.slug}`} className="def-stacks__card">
                <span>{stack.kicker}</span>
                <strong>{stack.title}</strong>
                <em>{stack.description}</em>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <Link href="/collections" className="def-stacks__more">
        Tutte le raccolte
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  );
}
