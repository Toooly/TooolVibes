"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useAccount } from "@/components/account/account-provider";

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
  iconUrl?: string | null;
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

/* Micro editorial reasons: up to 3 compact badges explaining WHY this tool
   is the editors' pick. Fully data-driven — derived from canonical fields
   (score, level, tags, useCases). No identity hardcoding. Order: speed →
   ease → quality, max one per family. */
function editorialReasonsFor(tool: ToolPublicView): string[] {
  const hay = [
    tool.categoryLabel ?? "",
    tool.category ?? "",
    ...(tool.tags ?? []),
    ...(tool.useCases ?? []),
    ...(tool.highlights ?? []),
    tool.shortDescription ?? "",
    tool.levelLabel ?? "",
  ]
    .join(" \n ")
    .toLowerCase();
  const has = (...needles: string[]) => needles.some((n) => hay.includes(n));
  const reasons: string[] = [];
  if (has("minut", "ore invece", "veloc", "rapid", "acceler", "subito", "ore", "fast", "rapid")) {
    reasons.push("Risultato in poche ore");
  }
  if (has("base", "beginner", "facile", "semplice", "dolce", "senza ripartire", "no-code", "no code", "easy")) {
    reasons.push("Facile anche da zero");
  }
  if (
    has("produzione", "serio", "completa", "completo", "backend", "pubblica", "qualit", "solido", "production")
  ) {
    reasons.push("Output di qualità");
  }
  if (reasons.length === 0 && tool.levelLabel) {
    reasons.push(`Livello ${tool.levelLabel}`);
  }
  return reasons.slice(0, 3);
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
  const account = useAccount();
  const authenticated = account.status === "authenticated";
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
          <HomeStacks stacks={stacks} authenticated={authenticated} />
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
        <article
          className="def-editorial__spotlight tv-featured-tool"
          data-spotlight={focusTool.slug}
          key={focusTool.slug}
        >
          <span className="tv-featured-tool__meteor" aria-hidden="true" data-meteor="" />
          <span className="tv-featured-tool__sparks" aria-hidden="true" data-sparks="" />
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
            {editorialReasonsFor(focusTool).length > 0 ? (
              <ul className="tv-featured-tool__reasons" aria-label="Perché la redazione lo consiglia">
                {editorialReasonsFor(focusTool).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
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

          </div>
        </article>
        <div className="tv-featured-tool__cta-row">
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

        <LatestFromCatalog tools={tools} />
      </div>
    </div>
  );
}

function LatestFromCatalog({ tools }: { tools: ToolPublicView[] }) {
  const podiumRef = useRef<HTMLElement | null>(null);
  const celebrated = useRef(false);

  useEffect(() => {
    const podium = podiumRef.current;
    if (!podium || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || celebrated.current) continue;
          celebrated.current = true;
          podium.classList.add("is-celebrated");
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(podium);
    return () => observer.disconnect();
  }, []);
  /* Canonical top-5: same ranked dataset (tool order), no algorithm change,
     no invented entries. Top-3 compose the safe stage; 04/05 continue in
     the secondary rail. Renders only with >=3 canonical tools. */
  /* Canonical ranking: top-3 stage + 04/05/06 compact continuation grid.
     No carousel, no scroll. Renders 04/05(/06) only when canonical tools
     exist — never invented. */
  const ranked = tools.slice(0, 6);
  if (ranked.length < 3) return null;
  const top3 = [ranked[1], ranked[0], ranked[2]].filter(Boolean) as ToolPublicView[];
  const rest = ranked.slice(3, 6);

  function StageCard({ tool, rank, rankClass, medal, compact }: { tool: ToolPublicView; rank: string; rankClass: string; medal?: "silver" | "bronze"; compact?: boolean }) {
    const score = computeEditorialScore(tool);
    const iconUrl = iconUrlFor(tool);
    const initial = initialFor(tool.name);
    const scoreLabel =
      score.status === "assessed" && score.value !== null ? score.value.toFixed(1) : "—";
    return (
      <Link
        href={`/toools/${tool.slug}`}
        className={`def-podium__card ${rankClass}${compact ? " is-compact" : ""}`}
        aria-label={`Posizione ${rank}: apri ${tool.name}`}
      >
        <span className="def-podium__rank" aria-hidden="true">{rank}</span>
        {medal ? (
          <span className={`def-podium__medal def-podium__medal--${medal}`} aria-hidden="true">
            <svg viewBox="0 0 40 26" fill="none">
              <path d="M5 22 L9 9 L15 16 L20 7 L25 16 L31 9 L35 22 Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
              <circle cx="20" cy="5" r="1.8" fill="currentColor" />
            </svg>
          </span>
        ) : null}
        <span className="def-podium__avatar" aria-hidden="true">
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconUrl} alt="" loading="lazy" decoding="async" />
          ) : (
            <span>{initial}</span>
          )}
        </span>
        <span className="def-podium__name">{tool.name}</span>
        {tool.categoryLabel ? (
          <span className="def-podium__cat">{tool.categoryLabel}</span>
        ) : null}
        <span className="def-podium__score">
          <span className="tv-featured-tool__mono">{scoreLabel}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </span>
      </Link>
    );
  }

  function WinnerCard({ tool }: { tool: ToolPublicView }) {
    const score = computeEditorialScore(tool);
    const iconUrl = iconUrlFor(tool);
    const initial = initialFor(tool.name);
    const scoreLabel =
      score.status === "assessed" && score.value !== null ? score.value.toFixed(1) : "—";
    return (
      <Link
        href={`/toools/${tool.slug}`}
        className="def-podium__card is-first"
        aria-label={`Posizione 01: apri ${tool.name}`}
      >
        <span className="def-podium__crown" aria-hidden="true">
          <svg viewBox="0 0 48 28" fill="none">
            <path d="M4 24 L8 10 L16 18 L24 6 L32 18 L40 10 L44 24 Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
            <circle cx="8" cy="8" r="2.2" fill="currentColor" />
            <circle cx="24" cy="4" r="2.2" fill="currentColor" />
            <circle cx="40" cy="8" r="2.2" fill="currentColor" />
          </svg>
        </span>
        <span className="def-podium__laurels" aria-hidden="true">
          <svg viewBox="0 0 120 96" fill="none">
            <path d="M28 88 C16 72 10 52 12 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M92 88 C104 72 110 52 108 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="17" cy="70" rx="6" ry="3" transform="rotate(-38 17 70)" fill="currentColor" opacity="0.9" />
            <ellipse cx="14" cy="55" rx="6" ry="3" transform="rotate(-22 14 55)" fill="currentColor" opacity="0.9" />
            <ellipse cx="15" cy="40" rx="5.5" ry="2.8" transform="rotate(-6 15 40)" fill="currentColor" opacity="0.9" />
            <ellipse cx="103" cy="70" rx="6" ry="3" transform="rotate(38 103 70)" fill="currentColor" opacity="0.9" />
            <ellipse cx="106" cy="55" rx="6" ry="3" transform="rotate(22 106 55)" fill="currentColor" opacity="0.9" />
            <ellipse cx="105" cy="40" rx="5.5" ry="2.8" transform="rotate(6 105 40)" fill="currentColor" opacity="0.9" />
          </svg>
        </span>
        <span className="def-podium__rank" aria-hidden="true">01</span>
        <span className="def-podium__avatar" aria-hidden="true">
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconUrl} alt="" loading="lazy" decoding="async" />
          ) : (
            <span>{initial}</span>
          )}
        </span>
        <span className="def-podium__name">{tool.name}</span>
        {tool.categoryLabel ? (
          <span className="def-podium__cat">{tool.categoryLabel}</span>
        ) : null}
        <span className="def-podium__score">
          <span className="tv-featured-tool__mono">{scoreLabel}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </span>
      </Link>
    );
  }

  return (
    <section ref={podiumRef} className="def-latest" aria-labelledby="def-latest-title">
      <div className="def-latest__head def-podium__header">
        <h3 id="def-latest-title" className="def-latest__title def-podium__title">
          Ultime dal catalogo
        </h3>
        <p className="def-podium__subtitle">I tool più discussi questa settimana.</p>
      </div>
      <div className="def-podium__backdrop" aria-hidden="true" />
      <div className="def-podium__stage" role="list" aria-label="Podio dei tool">
        {top3[0] ? (
          <div role="listitem" className="def-podium__cell pos-second">
            <StageCard tool={top3[0]} rank="02" rankClass="is-top" medal="silver" />
          </div>
        ) : null}
        {top3[1] ? (
          <div role="listitem" className="def-podium__cell pos-first">
            <WinnerCard tool={top3[1]} />
          </div>
        ) : null}
        {top3[2] ? (
          <div role="listitem" className="def-podium__cell pos-third">
            <StageCard tool={top3[2]} rank="03" rankClass="is-top" medal="bronze" />
          </div>
        ) : null}
      </div>
      {rest.length > 0 ? (
        <div className="def-podium__more" role="list" aria-label={`Posizioni 04${rest.length > 2 ? ", 05 e 06" : " e 05"}`}>
          {rest.map((tool, i) => {
            const rank = String(i + 4).padStart(2, "0");
            return (
              <div key={tool.slug} role="listitem" className="def-podium__cell is-rest">
                <StageCard tool={tool} rank={rank} rankClass="is-rest" compact />
              </div>
            );
          })}
        </div>
      ) : null}
      <Link href="/archivio" className="def-podium__cta">
        Vedi tutto il catalogo
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </section>
  );
}

function HomeStacks({ stacks, authenticated = false }: { stacks: HomeStackPreview[]; authenticated?: boolean }) {
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
                  <p className="tv-workflow-card__eyebrow">{stack.kicker}</p>
                  <h3 className="tv-workflow-card__outcome">{stack.outcome || stack.title}</h3>
                  {stack.stages && stack.stages.length > 0 ? (
                    <div className="tv-workflow-card__flow" aria-label="Flusso">
                      {stack.stages.slice(0, 3).map((stage, si) => (
                        <div key={`${stack.slug}-${stage.name}`} className="tv-workflow-card__step">
                          <div className="tv-workflow-card__step-icon">
                            {stage.iconUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={stage.iconUrl} alt="" className="tv-workflow-card__stage-icon" loading="lazy" decoding="async" />
                            ) : null}
                          </div>
                          <span className="tv-workflow-card__step-label">{stage.label}</span>
                          {si < Math.min(stack.stages?.length ?? 0, 3) - 1 ? (
                            <span className="tv-workflow-card__step-arrow" aria-hidden="true">→</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {(stack.setupTime || stack.cost) ? (
                    <p className="tv-workflow-card__meta">
                      {stack.setupTime ? <span className="tv-featured-tool__mono">{stack.setupTime}</span> : null}
                      {stack.setupTime && stack.cost ? " · " : null}
                      {stack.cost ? <span className="tv-featured-tool__mono">{stack.cost}</span> : null}
                      {stack.stages && stack.stages.length > 0 ? ` · ${stack.stages.length} tool` : null}
                    </p>
                  ) : null}
                  {!authenticated ? (
                    <p className="tv-workflow-card__gate">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      Accedi per lo stack completo
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
