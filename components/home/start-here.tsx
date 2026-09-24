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

        <LatestFromCatalog tools={tools} />
      </div>
    </div>
  );
}

function LatestFromCatalog({ tools }: { tools: ToolPublicView[] }) {
  const latest = tools.slice(0, 3);
  if (latest.length === 0) return null;
  return (
    <section className="def-latest" aria-labelledby="def-latest-title">
      <div className="def-latest__head">
        <h3 id="def-latest-title" className="def-latest__title">
          Ultime dal catalogo
        </h3>
        <Link href="/archivio" className="def-latest__more">
          Vedi tutte
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
      <ol className="def-latest__list def-podium">
        {latest.map((tool, index) => {
          const score = computeEditorialScore(tool);
          const iconUrl = iconUrlFor(tool);
          const initial = initialFor(tool.name);
          const desc = truncate(tool.tldr || tool.shortDescription || "", 72);
          const isLead = index === 0;
          return (
            <li
              key={tool.slug}
              className={`def-latest__item def-podium__item${isLead ? " def-podium__item--lead" : ""}`}
            >
              <Link
                href={`/toools/${tool.slug}`}
                className="def-latest__link def-podium__link"
                aria-label={`Apri ${tool.name}`}
              >
                <span className="def-podium__rank tv-featured-tool__mono" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="def-podium__avatar" aria-hidden="true">
                  {iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={iconUrl} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <span>{initial}</span>
                  )}
                </span>
                <span className="def-podium__body">
                  <span className="def-latest__name">{tool.name}</span>
                  {tool.categoryLabel ? (
                    <span className="def-podium__cat">{tool.categoryLabel}</span>
                  ) : null}
                  {desc ? <span className="def-latest__desc">{desc}</span> : null}
                </span>
                <span className="def-podium__score tv-featured-tool__mono">
                  {score.status === "assessed" && score.value !== null
                    ? `${score.value.toFixed(1)}★`
                    : ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
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
