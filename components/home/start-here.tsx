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
  variantLabel?: string | null;
  toolCount?: number | null;
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
        <div
          className="def-editorial__spotlight tv-featured-tool"
          data-spotlight={focusTool.slug}
          key={focusTool.slug}
        >
          <span className="tv-featured-tool__meteor" aria-hidden="true" data-meteor="" />
          <span className="tv-featured-tool__sparks" aria-hidden="true" data-sparks="" />
          <Link
            href={`/toools/${focusTool.slug}`}
            className="tv-featured-tool__stretch"
            aria-label={`Apri ${focusTool.name}`}
          />
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
              <Link
                href={`/toools/${focusTool.slug}`}
                className="tv-featured-tool__cta"
                aria-label={`Apri ${focusTool.name}`}
              >
                Apri scheda
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
              {(() => {
                const visitUrl = focusTool.affiliateUrl ?? focusTool.externalUrl;
                return visitUrl ? (
                  <a
                    href={visitUrl}
                    target="_blank"
                    rel={isAffiliateLink ? "sponsored noopener noreferrer" : "noopener noreferrer"}
                    className="tv-featured-tool__external"
                    aria-label={isAffiliateLink ? `Visita sito di ${focusTool.name} (link affiliato)` : `Visita sito di ${focusTool.name}`}
                  >
                    Visita sito
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                ) : null;
              })()}
            </div>
            {isAffiliateLink ? (
              <p className="def-editorial__spot-disclosure">
                Link affiliato: commissione possibile, senza costi extra.
              </p>
            ) : null}
          </div>
        </div>

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
  const [selectedPos, setSelectedPos] = useState<"second" | "first" | "third" | null>(null);

  const handleCellClick = (pos: "second" | "first" | "third") => (e: React.MouseEvent) => {
    if (selectedPos !== pos) {
      e.preventDefault();
      setSelectedPos(pos);
    }
  };

  /* Reset selection when tapping/clicking outside the podium stage. */
  useEffect(() => {
    if (!selectedPos) return;
    const onOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest(".def-podium__stage")) {
        setSelectedPos(null);
      }
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, [selectedPos]);

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
  const ranked = tools.slice(0, 9);
  if (ranked.length < 3) return null;
  const top3 = [ranked[1], ranked[0], ranked[2]].filter(Boolean) as ToolPublicView[];
  const rest = ranked.slice(3, 9);

  function StageCard({ tool, rank, rankClass, medal, compact, laurel, isSelected, onSelect }: { tool: ToolPublicView; rank: string; rankClass: string; medal?: "silver" | "bronze"; compact?: boolean; laurel?: "silver" | "bronze"; isSelected?: boolean; onSelect?: (e: React.MouseEvent) => void }) {
    const score = computeEditorialScore(tool);
    const iconUrl = iconUrlFor(tool);
    const initial = initialFor(tool.name);
    const scoreLabel =
      score.status === "assessed" && score.value !== null ? score.value.toFixed(1) : "—";
    return (
      <>
        {!compact ? (
          <div className="def-podium__badge" aria-hidden="true">
            {laurel ? <RankLaurels tone={laurel} compact /> : null}
            {medal === "silver" ? (
              <span className="def-podium__medal def-podium__medal--silver">
                <svg viewBox="0 0 44 28" fill="none">
                  <path d="M4 24 L7 8 L14 16 L22 5 L30 16 L37 8 L40 24 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <circle cx="22" cy="3" r="1.6" fill="currentColor" />
                  <line x1="14" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                </svg>
              </span>
            ) : medal === "bronze" ? (
              <span className="def-podium__medal def-podium__medal--bronze">
                <svg viewBox="0 0 40 28" fill="none">
                  <path d="M6 24 L10 10 L20 6 L30 10 L34 24 Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
                  <circle cx="20" cy="4" r="1.4" fill="currentColor" />
                  <path d="M12 20 Q20 16 28 20" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                </svg>
              </span>
            ) : null}
            <span className="def-podium__rank">{rank}</span>
          </div>
        ) : null}
        <Link
          href={`/toools/${tool.slug}`}
          className={`def-podium__card ${rankClass}${compact ? " is-compact" : ""}${isSelected ? " is-selected" : ""}`}
          aria-label={`Posizione ${rank}: apri ${tool.name}`}
          data-selected={isSelected || undefined}
          onClick={onSelect}
        >
        {compact ? <span className="def-podium__rank def-podium__rank--inline" aria-hidden="true">{rank}</span> : null}
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
        {isSelected && !compact ? (
          <div className="def-podium__extra">
            {tool.shortDescription ? <p className="def-podium__extra-desc">{truncate(tool.shortDescription, 120)}</p> : null}
            <div className="def-podium__extra-meta">
              {tool.levelLabel ? (
                <span className="def-podium__pill">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  {tool.levelLabel}
                </span>
              ) : null}
              {tool.readingTime ? (
                <span className="def-podium__pill">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  {formatHomeAnalysisTime(tool.readingTime)}
                </span>
              ) : null}
              {tool.tags?.[0] ? (
                <span className="def-podium__pill def-podium__pill--tag">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  {tool.tags[0]}
                </span>
              ) : null}
              {tool.tags?.[1] ? (
                <span className="def-podium__pill def-podium__pill--tag">{tool.tags[1]}</span>
              ) : null}
            </div>
          </div>
        ) : null}
        </Link>
      </>
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
      <>
        <div className="def-podium__badge def-podium__badge--gold" aria-hidden="true">
          <RankLaurels tone="gold" />
          <span className="def-podium__crown">
            <svg viewBox="0 0 48 28" fill="none">
              <path d="M4 24 L8 10 L16 18 L24 6 L32 18 L40 10 L44 24 Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
              <circle cx="8" cy="8" r="2.2" fill="currentColor" />
              <circle cx="24" cy="4" r="2.2" fill="currentColor" />
              <circle cx="40" cy="8" r="2.2" fill="currentColor" />
            </svg>
          </span>
          <span className="def-podium__rank">01</span>
        </div>
        <Link
          href={`/toools/${tool.slug}`}
          className={`def-podium__card is-first${isSelected ? " is-selected" : ""}`}
          aria-label={`Posizione 01: apri ${tool.name}`}
          data-selected={isSelected || undefined}
          onClick={onSelect}
        >
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
        {isSelected ? (
          <div className="def-podium__extra">
            {tool.shortDescription ? <p className="def-podium__extra-desc">{truncate(tool.shortDescription, 120)}</p> : null}
            <div className="def-podium__extra-meta">
              {tool.levelLabel ? (
                <span className="def-podium__pill">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  {tool.levelLabel}
                </span>
              ) : null}
              {tool.readingTime ? (
                <span className="def-podium__pill">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  {formatHomeAnalysisTime(tool.readingTime)}
                </span>
              ) : null}
              {tool.tags?.[0] ? (
                <span className="def-podium__pill def-podium__pill--tag">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  {tool.tags[0]}
                </span>
              ) : null}
              {tool.tags?.[1] ? (
                <span className="def-podium__pill def-podium__pill--tag">{tool.tags[1]}</span>
              ) : null}
            </div>
          </div>
        ) : null}
        </Link>
      </>
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
        className={"def-podium__stage" + (selectedPos ? " has-focus-" + selectedPos : "")}
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
        <div className="def-podium__rail" role="list" aria-label={`Posizioni 04–${String(Math.min(rest.length + 3, 9)).padStart(2, "0")}`}>
          {rest.map((tool, i) => {
            const rank = String(i + 4).padStart(2, "0");
            return (
              <div key={tool.slug} role="listitem" className="def-podium__rail-item">
                <StageCard tool={tool} rank={rank} rankClass="is-rest" compact isSelected={false} />
              </div>
            );
          })}
        </div>
      ) : null}
      <Link href="/archivio" className="def-podium__cta tv-gold-cta">
        <span className="tv-gold-cta__glow" aria-hidden="true" />
        <span className="tv-gold-cta__label">Vedi tutto il catalogo</span>
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
    if (!root || !root.isConnected) return;
    const cards = root.querySelectorAll<HTMLElement>("[data-stack-card]");
    const card = cards[index];
    if (!card || !card.isConnected) return;
    card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setActive(index);
  }

  const total = stacks.length;
  const showDots = total > 1 && total <= 12;

  return (
    <div className="def-stacks tv-stack-mode">
      {stacks.length > 0 ? (
        <div
          className="def-stacks__carousel"
          role="region"
          aria-roledescription="carousel"
          aria-label="Stack in evidenza"
        >
          <button
            type="button"
            className="def-stacks__arrow def-stacks__arrow--prev"
            aria-label="Stack precedente"
            onClick={() => scrollToIndex(Math.max(0, active - 1))}
            disabled={active === 0}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <ul ref={scrollerRef} className="def-stacks__rail">
            {stacks.map((stack, index) => {
              const isActive = index === active;
              const shownTools = (stack.stages ?? []).slice(0, 3);
              const extraCount = Math.max(0, (stack.toolCount ?? stack.stages?.length ?? 0) - 3);
              return (
                <li
                  key={stack.slug}
                  data-stack-card=""
                  className={`def-stacks__slide${isActive ? " is-active" : ""}`}
                >
                  <Link href={`/collections/${stack.slug}`} className="def-stacks__card">
                    <div className="def-stacks__card-head">
                      <span className="def-stacks__pill">{stack.kicker}</span>
                      <span className="def-stacks__counter">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                        {index + 1}/{total}
                      </span>
                    </div>
                    <h3 className="def-stacks__title">{stack.title}</h3>
                    {stack.outcome ? (
                      <p className="def-stacks__desc">{stack.outcome}</p>
                    ) : null}
                    {shownTools.length > 0 ? (
                      <ol className="def-stacks__tools" aria-label="Tool inclusi">
                        {shownTools.map((stage, si) => (
                          <li key={`${stack.slug}-${stage.name}`} className="def-stacks__tool">
                            <span className="def-stacks__tool-icon">
                              {stage.iconUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={stage.iconUrl} alt="" loading="lazy" decoding="async" />
                              ) : (
                                <span className="def-stacks__tool-fallback">{stage.name.slice(0, 1).toUpperCase()}</span>
                              )}
                            </span>
                            <span className="def-stacks__tool-text">
                              <strong>{stage.name}</strong>
                              {stage.label ? <span>{stage.label}</span> : null}
                            </span>
                            {si < shownTools.length - 1 ? (
                              <span className="def-stacks__tool-node" aria-hidden="true" />
                            ) : null}
                          </li>
                        ))}
                        {extraCount > 0 ? (
                          <li className="def-stacks__tool def-stacks__tool--more">+{extraCount} altri</li>
                        ) : null}
                      </ol>
                    ) : null}
                    <div className="def-stacks__meta">
                      {stack.setupTime ? (
                        <span className="def-stacks__meta-item">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                          {stack.setupTime}
                        </span>
                      ) : null}
                      {stack.variantLabel ? (
                        <span className="def-stacks__meta-item">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                          Variante {stack.variantLabel}
                        </span>
                      ) : null}
                      {stack.cost ? (
                        <span className="def-stacks__meta-item">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                          {stack.cost}
                        </span>
                      ) : null}
                      {stack.toolCount ? (
                        <span className="def-stacks__meta-item">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                          {stack.toolCount} tool
                        </span>
                      ) : null}
                    </div>
                    {!authenticated ? (
                      <span className="def-stacks__cta tv-gold-cta tv-gold-cta--secondary">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <span className="tv-gold-cta__label">Accedi per lo stack completo</span>
                      </span>
                    ) : (
                      <span className="def-stacks__cta tv-gold-cta tv-gold-cta--secondary">
                        <span className="tv-gold-cta__label">Apri raccolta</span>
                        <ArrowRight size={14} aria-hidden="true" />
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            className="def-stacks__arrow def-stacks__arrow--next"
            aria-label="Stack successivo"
            onClick={() => scrollToIndex(Math.min(stacks.length - 1, active + 1))}
            disabled={active === stacks.length - 1}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      ) : null}
      {showDots ? (
        <div className="def-stacks__pagination" role="group" aria-label="Paginazione stack">
          <div className="def-stacks__segments">
            {stacks.map((stack, index) => (
              <button
                key={stack.slug}
                type="button"
                aria-current={index === active ? "true" : undefined}
                aria-label={`Vai allo stack ${index + 1}`}
                className={`def-stacks__segment${index === active ? " is-active" : ""}${index < active ? " is-past" : ""}`}
                onClick={() => scrollToIndex(index)}
              >
                <span className="def-stacks__segment-bar" />
              </button>
            ))}
          </div>
          <span className="def-stacks__progress-label" aria-live="polite">
            {active + 1} / {total}
          </span>
        </div>
      ) : null}
      <div className="def-stacks__discovery">
        <p className="def-stacks__discovery-hint">
          {total} in evidenza · molte altre da esplorare
        </p>
        <Link href="/collections" className="def-stacks__more tv-gold-cta">
          <span className="tv-gold-cta__glow" aria-hidden="true" />
          <span className="tv-gold-cta__label">Tutte le raccolte</span>
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
