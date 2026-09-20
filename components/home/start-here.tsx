"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

import { HomeRadarPreview } from "@/components/radar/radar-experience";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { computeEditorialScore } from "@/lib/data/editorial-score";

export function formatHomeAnalysisTime(raw: string | null | undefined) {
  const value = raw?.trim() ?? "";
  if (!value) return "—";
  if (/min/i.test(value)) return value;
  return `${value} min`;
}

export type HomeStackStage = {
  label: string;
  name: string;
};

export type HomeStackPreview = {
  slug: string;
  title: string;
  kicker: string;
  description: string;
  outcome?: string | null;
  setupTime?: string | null;
  cost?: string | null;
  stages?: HomeStackStage[];
};

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

const START_TABS = [
  { id: "tool", label: "TOOL" },
  { id: "stack", label: "STACK" },
  { id: "radar", label: "RADAR" },
] as const;

type StartTabId = (typeof START_TABS)[number]["id"];

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
  const [hasSwitched, setHasSwitched] = useState(false);
  const tabRefs = useRef<Partial<Record<StartTabId, HTMLButtonElement | null>>>({});

  function selectTab(next: StartTabId, focus = false) {
    if (next !== tab) setHasSwitched(true);
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
    <section
      className="def-start tv-discovery-stage"
      aria-labelledby="def-start-title"
      data-mode={tab}
      data-switched={hasSwitched ? "" : undefined}
    >
      <header className="def-start__head tv-discovery-stage__head">
        <h2 id="def-start-title" className="def-start__title">
          Da dove partire?
        </h2>
        <div
          className="def-start__tabs tv-discovery-stage__switch"
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

      <div className="tv-discovery-stage__frame">
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
  const scoreLabel =
    editorialScore.status === "assessed" && editorialScore.value !== null
      ? editorialScore.value.toFixed(1)
      : "—";
  const positioning = truncate(focusTool.tldr || focusTool.shortDescription || "", 140);

  return (
    <div className="def-editorial tv-tool-mode" aria-label="In evidenza">
      <div className="def-editorial__inner">
        <article className="def-editorial__spotlight tv-featured-tool">
          <div className="def-editorial__spot-body">
            <p className="def-editorial__spot-eyebrow">Scelta della redazione</p>
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
                <p className="def-editorial__spot-cat">{focusTool.categoryLabel}</p>
              </div>
            </div>
            {positioning ? (
              <p className="def-editorial__spot-lede">{positioning}</p>
            ) : null}

            <p className="tv-featured-tool__meta">
              <span>
                <span className="tv-featured-tool__meta-label">Score</span>
                <strong className="tv-featured-tool__mono">{scoreLabel}</strong>
              </span>
              <span>
                <span className="tv-featured-tool__meta-label">Livello</span>
                <strong>{focusTool.levelLabel ?? "—"}</strong>
              </span>
              <span>
                <span className="tv-featured-tool__meta-label">Lettura</span>
                <strong className="tv-featured-tool__mono">
                  {formatHomeAnalysisTime(focusTool.readingTime)}
                </strong>
              </span>
            </p>

            <div className="def-editorial__spot-actions">
              <Link
                href={`/toools/${focusTool.slug}`}
                className="def-editorial__spot-cta def-editorial__spot-cta--primary"
                aria-label={`Apri ${focusTool.name}`}
              >
                Apri {focusTool.name}
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
                      ? `Sito ufficiale di ${focusTool.name} (link affiliato)`
                      : `Sito ufficiale di ${focusTool.name}`
                  }
                >
                  Sito
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              ) : null}
            </div>
            {isAffiliateLink ? (
              <p className="def-editorial__spot-disclosure">
                Link affiliato: commissione possibile, senza costi extra.
              </p>
            ) : null}
          </div>
        </article>

        <EditorialDeck tools={tools} />
      </div>
    </div>
  );
}

function EditorialDeck({ tools }: { tools: ToolPublicView[] }) {
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
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-deck-card]"));
    if (cards.length === 0) return;
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = cards.indexOf(visible.target as HTMLElement);
        if (index >= 0) setActive(index);
      },
      { root, threshold: 0.6 },
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [top3.length]);

  function scrollToIndex(index: number) {
    const root = scrollerRef.current;
    const card = root?.querySelectorAll<HTMLElement>("[data-deck-card]")[index];
    card?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  if (top3.length === 0) return null;

  return (
    <div
      className="tv-editorial-deck def-editorial__podium"
      role="region"
      aria-roledescription="carousel"
      aria-label={isPodium ? "Valutazioni editoriali" : "Tre tool da esplorare"}
    >
      <div className="def-editorial__pod-head-row">
        <p className="def-editorial__pod-eyebrow">{isPodium ? "Valutazioni editoriali" : "Dal catalogo"}</p>
        <p className="def-editorial__pod-subtitle">
          {isPodium
            ? "Copertina editoriale, non una classifica di mercato."
            : "Tre tool da esplorare."}
        </p>
      </div>
      <div className="tv-editorial-deck__controls">
        <button
          type="button"
          className="tv-editorial-deck__nav"
          aria-label="Scheda precedente"
          onClick={() => scrollToIndex(Math.max(0, active - 1))}
          disabled={active === 0}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="tv-editorial-deck__nav"
          aria-label="Scheda successiva"
          onClick={() => scrollToIndex(Math.min(top3.length - 1, active + 1))}
          disabled={active === top3.length - 1}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
      <ul ref={scrollerRef} className="tv-editorial-deck__track def-editorial__pod-stage">
        {top3.map((tool, index) => (
          <li
            key={tool.slug}
            className={`tv-editorial-deck__cell def-editorial__pod-cell${index === 0 ? " def-editorial__pod-cell--first" : index === 1 ? " def-editorial__pod-cell--second" : " def-editorial__pod-cell--third"}${index === active ? " is-active" : ""}`}
            data-deck-card=""
          >
            {isPodium ? (
              <DeckCard tool={tool} rank={index + 1} active={index === active} />
            ) : (
              <ExploratoryCard tool={tool} active={index === active} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExploratoryCard({
  tool,
  active,
}: {
  tool: ToolPublicView;
  active: boolean;
}) {
  const iconUrl = iconUrlFor(tool);
  const initial = initialFor(tool.name);
  return (
    <Link
      href={`/toools/${tool.slug}`}
      className={`def-editorial__exploratory-card tv-editorial-deck__card${active ? " is-active" : ""}`}
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

function DeckCard({
  tool,
  rank,
  active,
}: {
  tool: ToolPublicView;
  rank: number;
  active: boolean;
}) {
  const score = computeEditorialScore(tool);
  const rationale = truncate(tool.tldr || tool.shortDescription || "", rank === 1 ? 110 : 72);
  const iconUrl = iconUrlFor(tool);
  const initial = initialFor(tool.name);

  return (
    <Link
      href={`/toools/${tool.slug}`}
      className={`def-editorial__pod-card def-editorial__pod-card--rank-${rank} tv-editorial-deck__card${active ? " is-active is-revealed" : " is-revealed"}`}
      data-rank={rank}
      aria-label={`Apri la scheda di ${tool.name}`}
    >
      <span className="def-editorial__pod-rank tv-featured-tool__mono" aria-label={`Posizione editoriale ${rank}`}>
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
      {rationale ? <span className="def-editorial__pod-rationale">{rationale}</span> : null}
      <span className="def-editorial__pod-score">
        <span className="def-editorial__pod-score-num tv-featured-tool__mono">
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
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-stack-card]"));
    if (cards.length === 0) return;
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = cards.indexOf(visible.target as HTMLElement);
        if (index >= 0) setActive(index);
      },
      { root, threshold: 0.55 },
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [stacks.length]);

  function scrollToIndex(index: number) {
    const root = scrollerRef.current;
    const card = root?.querySelectorAll<HTMLElement>("[data-stack-card]")[index];
    card?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  return (
    <div className="def-stacks tv-stack-mode">
      <p className="def-stacks__lede">
        Workflow operativi: sequenza, esito, tempo e costo.
      </p>
      {stacks.length > 0 ? (
        <div
          className="tv-workflow-deck"
          role="region"
          aria-roledescription="carousel"
          aria-label="Stack in evidenza"
        >
          <div className="tv-editorial-deck__controls">
            <button
              type="button"
              className="tv-editorial-deck__nav"
              aria-label="Stack precedente"
              onClick={() => scrollToIndex(Math.max(0, active - 1))}
              disabled={active === 0}
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="tv-editorial-deck__nav"
              aria-label="Stack successivo"
              onClick={() => scrollToIndex(Math.min(stacks.length - 1, active + 1))}
              disabled={active === stacks.length - 1}
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
          <ul ref={scrollerRef} className="def-stacks__grid tv-workflow-deck__track">
            {stacks.map((stack, index) => (
              <li key={stack.slug} data-stack-card="" className={index === active ? "is-active" : undefined}>
                <Link href={`/collections/${stack.slug}`} className="def-stacks__card tv-workflow-card">
                  <span>{stack.kicker}</span>
                  <strong>{stack.title}</strong>
                  {stack.outcome ? <em>{stack.outcome}</em> : stack.description ? <em>{stack.description}</em> : null}
                  {stack.stages && stack.stages.length > 0 ? (
                    <ol className="tv-workflow-card__flow" aria-label="Flusso">
                      {stack.stages.slice(0, 3).map((stage) => (
                        <li key={`${stack.slug}-${stage.name}`}>
                          <b>{stage.label}</b>
                          <span>{stage.name}</span>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                  {(stack.setupTime || stack.cost) ? (
                    <p className="tv-workflow-card__meta">
                      {stack.setupTime ? <span className="tv-featured-tool__mono">{stack.setupTime}</span> : null}
                      {stack.setupTime && stack.cost ? " · " : null}
                      {stack.cost ? <span className="tv-featured-tool__mono">{stack.cost}</span> : null}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Link href="/collections" className="def-stacks__more">
        Tutte le raccolte
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  );
}
