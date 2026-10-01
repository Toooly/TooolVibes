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

/* Micro editorial reasons: up to 3 compact pills explaining the pick.
   GROUNDED LOGIC — every label is a literal canonical datum, never an
   inferred benefit claim:
   1. canonical tags (e.g. "Vibe coding", "No-code") — editorial taxonomy;
   2. canonical categoryLabel when it adds a distinct facet;
   3. canonical useCases — first use case, truncated, only when it states a
      concrete job (no time/ease/quality inference added);
   4. canonical levelLabel ("Livello Base") as the closing facet.
   No time-to-result, ease, quality or performance claims are synthesized. */
function editorialReasonsFor(tool: ToolPublicView): string[] {
  const seen = new Set<string>();
  const reasons: string[] = [];
  const push = (label: string) => {
    const clean = label.trim().replace(/\s+/g, " ");
    if (clean.length < 2 || clean.length > 42) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    reasons.push(clean);
  };
  const category = (tool.categoryLabel ?? "").trim();
  for (const tag of tool.tags ?? []) {
    if (reasons.length >= 2) break;
    const clean = tag.trim();
    if (category && clean.toLowerCase() !== category.toLowerCase()) {
      push(clean);
    }
  }
  if (reasons.length < 2 && category) {
    push(category);
  }
  const firstUseCase = (tool.useCases ?? []).map((u) => u.trim()).find((u) => u.length > 0);
  if (firstUseCase && reasons.length < 3) {
    /* Word-boundary truncation: never cut a word, never alter meaning. */
    const words = firstUseCase.split(/\s+/);
    let short = "";
    for (const word of words) {
      const next = short ? `${short} ${word}` : word;
      if (next.length > 40) break;
      short = next;
    }
    push(short.length >= 12 ? (short.length < firstUseCase.length ? `${short}…` : short) : firstUseCase.slice(0, 40).trimEnd());
  }
  if (reasons.length < 3 && tool.levelLabel) {
    push(`Livello ${tool.levelLabel}`);
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
        <Link
          href={`/toools/${focusTool.slug}`}
          className="def-editorial__spotlight tv-featured-tool"
          data-spotlight={focusTool.slug}
          key={focusTool.slug}
          aria-label={`Apri ${focusTool.name}`}
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
              <ul className="tv-featured-tool__reasons" aria-label="Perche la redazione lo consiglia">
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
                <strong>{focusTool.levelLabel ?? "\u2014"}</strong>
              </span>
              <span>
                <span className="tv-featured-tool__meta-label">Lettura</span>
                <strong className="tv-featured-tool__mono">
                  {formatHomeAnalysisTime(focusTool.readingTime)}
                </strong>
              </span>
            </p>
            <div className="tv-featured-tool__footer">
              <span className="tv-featured-tool__cta">
                Apri scheda
                <ArrowRight size={13} aria-hidden="true" />
              </span>
              {focusTool.url ? (
                <a
                  href={focusTool.url}
                  target="_blank"
                  rel={isAffiliateLink ? "sponsored noopener noreferrer" : "noopener noreferrer"}
                  className="tv-featured-tool__external"
                  aria-label={isAffiliateLink ? `Visita sito di ${focusTool.name} (link affiliato)` : `Visita sito di ${focusTool.name}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  Visita sito
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              ) : null}
            </div>
            {isAffiliateLink ? (
              <p className="def-editorial__spot-disclosure">
                Link affiliato: commissione possibile, senza costi extra.
              </p>
            ) : null}
          </div>
        </Link>

        <LatestFromCatalog tools={tools} />
      </div>
    </div>
  );
}

function LatestFromCatalog({ tools }: { tools: ToolPublicView[] }) {
  const podiumRef = useRef<HTMLElement | null>(null);
  const celebrated = useRef(false);
  /* Selection state: which top-3 cell is currently brought to front.
     First tap selects (brings forward), second tap on same card navigates.
     No persistent ranking state — pure UI feedback. */
  const [selectedPos, setSelectedPos] = useState<"second" | "first" | "third" | null>("first");

  const handleCellClick = (pos: "second" | "first" | "third") => (e: React.MouseEvent) => {
    if (selectedPos !== pos) {
      e.preventDefault();
      setSelectedPos(pos);
    }
  };

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

  function StageCard({ tool, rank, rankClass, medal, compact, laurel, isSelected, onSelect }: { tool: ToolPublicView; rank: string; rankClass: string; medal?: "silver" | "bronze"; compact?: boolean; laurel?: "silver" | "bronze"; isSelected?: boolean; onSelect?: (e: React.MouseEvent) => void }) {
    const score = computeEditorialScore(tool);
    const iconUrl = iconUrlFor(tool);
    const initial = initialFor(tool.name);
    const scoreLabel =
      score.status === "assessed" && score.value !== null ? score.value.toFixed(1) : "—";
    return (
      <Link
        href={`/toools/${tool.slug}`}
        className={`def-podium__card ${rankClass}${compact ? " is-compact" : ""}${isSelected ? " is-selected" : ""}`}
        aria-label={`Posizione ${rank}: apri ${tool.name}`}
        aria-pressed={isSelected}
        onClick={onSelect}
      >
        {laurel ? <RankLaurels tone={laurel} compact /> : null}
        <span className="def-podium__rank" aria-hidden="true">{rank}</span>
        {medal === "silver" ? (
          <span className="def-podium__medal def-podium__medal--silver" aria-hidden="true">
            <svg viewBox="0 0 44 28" fill="none">
              <path d="M4 24 L7 8 L14 16 L22 5 L30 16 L37 8 L40 24 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="22" cy="3" r="1.6" fill="currentColor" />
              <line x1="14" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            </svg>
          </span>
        ) : medal === "bronze" ? (
          <span className="def-podium__medal def-podium__medal--bronze" aria-hidden="true">
            <svg viewBox="0 0 40 28" fill="none">
              <path d="M6 24 L10 10 L20 6 L30 10 L34 24 Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
              <circle cx="20" cy="4" r="1.4" fill="currentColor" />
              <path d="M12 20 Q20 16 28 20" stroke="currentColor" strokeWidth="1" opacity="0.5" />
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

  /* Rank laurels: restrained stylized branches framing a prestige card.
     Full span for 01 gold; compact (~65%) for 02 silver / 03 bronze. */
  function RankLaurels({ tone, compact }: { tone: "gold" | "silver" | "bronze"; compact?: boolean }) {
    return (
      <span className={`def-podium__laurels def-podium__laurels--${tone}${compact ? " is-compact" : ""}`} aria-hidden="true">
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
    );
  }

  function WinnerCard({ tool, isSelected, onSelect }: { tool: ToolPublicView; isSelected?: boolean; onSelect?: (e: React.MouseEvent) => void }) {
    const score = computeEditorialScore(tool);
    const iconUrl = iconUrlFor(tool);
    const initial = initialFor(tool.name);
    const scoreLabel =
      score.status === "assessed" && score.value !== null ? score.value.toFixed(1) : "—";
    return (
      <Link
        href={`/toools/${tool.slug}`}
        className={`def-podium__card is-first${isSelected ? " is-selected" : ""}`}
        aria-label={`Posizione 01: apri ${tool.name}`}
        aria-pressed={isSelected}
        onClick={onSelect}
      >
        <span className="def-podium__crown" aria-hidden="true">
          <svg viewBox="0 0 48 28" fill="none">
            <path d="M4 24 L8 10 L16 18 L24 6 L32 18 L40 10 L44 24 Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
            <circle cx="8" cy="8" r="2.2" fill="currentColor" />
            <circle cx="24" cy="4" r="2.2" fill="currentColor" />
            <circle cx="40" cy="8" r="2.2" fill="currentColor" />
          </svg>
        </span>
        <RankLaurels tone="gold" />
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
      <div
        className={"def-podium__stage has-focus-" + (selectedPos ?? "first")}
        role="list"
        aria-label="Podio dei tool"
      >
        {top3[0] ? (
          <div
            role="listitem"
            className={"def-podium__cell pos-second"}
          >
            <StageCard tool={top3[0]} rank="02" rankClass="is-top" medal="silver" laurel="silver" isSelected={selectedPos === "second"} onSelect={handleCellClick("second")} />
          </div>
        ) : null}
        {top3[1] ? (
          <div
            role="listitem"
            className={"def-podium__cell pos-first"}
          >
            <WinnerCard tool={top3[1]} isSelected={selectedPos === "first"} onSelect={handleCellClick("first")} />
          </div>
        ) : null}
        {top3[2] ? (
          <div
            role="listitem"
            className={"def-podium__cell pos-third"}
          >
            <StageCard tool={top3[2]} rank="03" rankClass="is-top" medal="bronze" laurel="bronze" isSelected={selectedPos === "third"} onSelect={handleCellClick("third")} />
          </div>
        ) : null}
      </div>
      {rest.length > 0 ? (
        <div className="def-podium__more" role="list" aria-label={`Posizioni 04${rest.length > 2 ? ", 05 e 06" : " e 05"}`}>
          {rest.map((tool, i) => {
            const rank = String(i + 4).padStart(2, "0");
            return (
              <div key={tool.slug} role="listitem" className="def-podium__cell is-rest">
                <StageCard tool={tool} rank={rank} rankClass="is-rest" compact isSelected={false} />
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
