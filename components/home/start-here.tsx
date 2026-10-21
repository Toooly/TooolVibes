"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "@/components/ui/app-link";
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink, Layers3, ScanSearch, Sparkles } from "lucide-react";
import { InstrumentJourney } from "@/components/ui/instrument-journey";
import { InstrumentOrbit } from "@/components/ui/instrument-orbit";
import { workspaceViewHref } from "@/components/account/workspace/workspace-model";
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
function editorialReasonsFor(tool: ToolPublicView, translate: (source: string) => string): string[] {
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
  const firstUseCase = (tool.useCases ?? []).map((u) => translate(u.trim())).find((u) => u.length > 0);
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
        <h2 id="def-start-title" className="def-start__title"><LocalizedText>{"Da dove partire? "}</LocalizedText></h2>
        <LocalizedAttributes><div
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
                <LocalizedText>{item.label}</LocalizedText>
              </button>
            );
          })}
        </div></LocalizedAttributes>
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
  const { t } = useLocale();
  if (!focusTool) return null;
  const editorialScore = computeEditorialScore(focusTool);
  const isAffiliateLink =
    Boolean(focusTool.affiliateUrl) || hasAffiliateSignal(focusTool.url);
  const scoreLabel =
    editorialScore.status === "assessed" && editorialScore.value !== null
      ? editorialScore.value.toFixed(1)
      : "—";
  const positioning = truncate(t(focusTool.tldr || focusTool.shortDescription || ""), 140);

  return (
    <LocalizedAttributes><div className="def-editorial tv-tool-mode" aria-label="In evidenza">
      <div className="def-editorial__inner">
        <div
          className="def-editorial__spotlight tv-featured-tool"
          data-spotlight={focusTool.slug}
          key={focusTool.slug}
        >
          <span className="tv-featured-tool__meteor" aria-hidden="true" data-meteor="" />
          <span className="tv-featured-tool__sparks" aria-hidden="true" data-sparks="" />
          <LocalizedAttributes><Link
            href={`/toools/${focusTool.slug}`}
            className="tv-featured-tool__stretch"
            aria-label={`Apri ${focusTool.name}`}
          /></LocalizedAttributes>
          <div className="def-editorial__spot-body">
            <p className="def-editorial__spot-eyebrow"><LocalizedText>{"Scelta della redazione"}</LocalizedText></p>
            <div className="def-editorial__spot-head">
              <span className="def-editorial__spot-avatar" aria-hidden="true">
                {iconUrlFor(focusTool) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <LocalizedAttributes><img src={iconUrlFor(focusTool)!} alt="" loading="eager" decoding="async" /></LocalizedAttributes>
                ) : (
                  <span>{initialFor(focusTool.name)}</span>
                )}
              </span>
              <div className="def-editorial__spot-identity">
                <h3 className="def-editorial__spot-name">{focusTool.name}</h3>
                <p className="def-editorial__spot-cat"><LocalizedText>{focusTool.categoryLabel}</LocalizedText></p>
              </div>
            </div>
            {positioning ? (
              <p className="def-editorial__spot-lede"><LocalizedText>{positioning}</LocalizedText></p>
            ) : null}
            {editorialReasonsFor(focusTool, t).length > 0 ? (
              <LocalizedAttributes><ul className="tv-featured-tool__reasons" aria-label="Perche la redazione lo consiglia">
                {editorialReasonsFor(focusTool, t).map((reason) => (
                  <li key={reason}><LocalizedText>{reason}</LocalizedText></li>
                ))}
              </ul></LocalizedAttributes>
            ) : null}
            <p className="tv-featured-tool__meta">
              <span>
                <span className="tv-featured-tool__meta-label"><LocalizedText>{"Score"}</LocalizedText></span>
                <strong className="tv-featured-tool__mono"><LocalizedText>{scoreLabel}</LocalizedText></strong>
              </span>
              <span>
                <span className="tv-featured-tool__meta-label"><LocalizedText>{"Livello"}</LocalizedText></span>
                <strong><LocalizedText>{focusTool.levelLabel ?? "\u2014"}</LocalizedText></strong>
              </span>
              <span>
                <span className="tv-featured-tool__meta-label"><LocalizedText>{"Lettura"}</LocalizedText></span>
                <strong className="tv-featured-tool__mono">
                  <LocalizedText>{formatHomeAnalysisTime(focusTool.readingTime)}</LocalizedText>
                </strong>
              </span>
            </p>
            <div className="tv-featured-tool__footer">
              <LocalizedAttributes><Link
                href={`/toools/${focusTool.slug}`}
                className="tv-featured-tool__cta"
                aria-label={`Apri ${focusTool.name}`}
              ><LocalizedText>{"Apri scheda "}</LocalizedText><ArrowRight size={13} aria-hidden="true" />
              </Link></LocalizedAttributes>
              {(() => {
                const visitUrl = focusTool.affiliateUrl ?? focusTool.externalUrl;
                return visitUrl ? (
                  <LocalizedAttributes><a
                    href={visitUrl}
                    target="_blank"
                    rel={isAffiliateLink ? "sponsored noopener noreferrer" : "noopener noreferrer"}
                    className="tv-featured-tool__external"
                    aria-label={isAffiliateLink ? `Visita sito di ${focusTool.name} (link affiliato)` : `Visita sito di ${focusTool.name}`}
                  ><LocalizedText>{"Visita sito "}</LocalizedText><ExternalLink size={12} aria-hidden="true" />
                  </a></LocalizedAttributes>
                ) : null;
              })()}
            </div>
            {isAffiliateLink ? (
              <p className="def-editorial__spot-disclosure"><LocalizedText>{"Link affiliato: commissione possibile, senza costi extra. "}</LocalizedText></p>
            ) : null}
          </div>
        </div>

        <LatestFromCatalog tools={tools} />
      </div>
    </div></LocalizedAttributes>
  );
}

type PodiumPosition = "second" | "first" | "third";

function PodiumCard({ tool, rank, position, selected, detailId, onSelect }: {
  tool: ToolPublicView;
  rank: string;
  position?: PodiumPosition;
  selected?: boolean;
  detailId?: string;
  onSelect?: () => void;
}) {
  const score = computeEditorialScore(tool);
  const iconUrl = iconUrlFor(tool);
  const compact = !position;
  const tone = position === "first" ? "gold" : position === "second" ? "silver" : "bronze";
  const className = `def-podium__card ${position === "first" ? "is-first" : compact ? "is-rest is-compact" : "is-top"}${selected ? " is-selected" : ""}`;
  const content = <>
    {compact ? <span className="def-podium__rank def-podium__rank--inline" aria-hidden="true">{rank}</span> : null}
    <span className="def-podium__avatar" aria-hidden="true">
      {iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={iconUrl} alt="" loading="lazy" decoding="async" />
      ) : <span>{initialFor(tool.name)}</span>}
    </span>
    <span className="def-podium__name">{tool.name}</span>
    {tool.categoryLabel ? <span className="def-podium__cat"><LocalizedText>{tool.categoryLabel}</LocalizedText></span> : null}
    <span className="def-podium__score">
      <span className="tv-featured-tool__mono">{score.status === "assessed" && score.value !== null ? score.value.toFixed(1) : "—"}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
    </span>
    {!compact ? <span className="def-podium__selection-mark" aria-hidden="true"><span /></span> : null}
  </>;
  return <>
    {!compact ? <div className={`def-podium__badge${position === "first" ? " def-podium__badge--gold" : ""}`} aria-hidden="true">
      <RankLaurels tone={tone} compact={position !== "first"} />
      <span className={position === "first" ? "def-podium__crown" : `def-podium__medal def-podium__medal--${tone}`}>
        <svg viewBox="0 0 48 28" fill="none"><path d="M4 24 L8 10 L16 18 L24 6 L32 18 L40 10 L44 24 Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" /><circle cx="8" cy="8" r="2" fill="currentColor" /><circle cx="24" cy="4" r="2" fill="currentColor" /><circle cx="40" cy="8" r="2" fill="currentColor" /></svg>
      </span>
      <span className="def-podium__rank">{rank}</span>
    </div> : null}
    <LocalizedAttributes>{compact ? (
      <Link href={`/toools/${tool.slug}`} className={className} aria-label={`Posizione ${rank}: apri ${tool.name}`}>{content}</Link>
    ) : (
      <button type="button" className={className} aria-label={`Mostra dettagli di ${tool.name}`} aria-pressed={selected} aria-controls={detailId} onClick={onSelect}>{content}</button>
    )}</LocalizedAttributes>
  </>;
}

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


function LatestFromCatalog({ tools }: { tools: ToolPublicView[] }) {
  const podiumRef = useRef<HTMLElement | null>(null);
  const detailId = "def-podium-reading";
  const [selectedPos, setSelectedPos] = useState<PodiumPosition>("first");
  const ranked = tools.slice(0, 9);
  const top3 = [ranked[1], ranked[0], ranked[2]];
  const positions: PodiumPosition[] = ["second", "first", "third"];
  const inspectedTool = ranked[selectedPos === "second" ? 1 : selectedPos === "third" ? 2 : 0];

  // Keyboard selection never moves or replaces the focused card.
  function onStageKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const offset = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!offset && event.key !== "Home" && event.key !== "End") return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    event.preventDefault();
    const index = event.key === "Home" ? 0 : event.key === "End" ? 2 : (current + offset + 3) % 3;
    setSelectedPos(positions[index]);
    buttons[index]?.focus({ preventScroll: true });
  }

  useEffect(() => {
    const podium = podiumRef.current;
    if (!podium || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      podium.classList.add("is-celebrated");
      observer.disconnect();
    }, { threshold: 0.25 });
    observer.observe(podium);
    return () => observer.disconnect();
  }, []);

  if (ranked.length < 3 || !inspectedTool) return null;
  return (
    <section ref={podiumRef} className="def-latest" aria-labelledby="def-latest-title" data-instrument-stage>
      <div className="def-latest__head def-podium__header">
        <h3 id="def-latest-title" className="def-latest__title def-podium__title"><LocalizedText>Ultime dal catalogo</LocalizedText></h3>
        <p className="def-podium__subtitle"><LocalizedText>Seleziona un tool e scopri cosa può fare per te.</LocalizedText></p>
      </div>
      <div className="def-podium__backdrop" aria-hidden="true" />
      <div className="def-podium__ribbons" aria-hidden="true"><InstrumentOrbit /></div>
      <LocalizedAttributes><div className="def-podium__stage" role="list" aria-label="Podio dei tool" onKeyDown={onStageKeyDown}>
        {top3.map((tool, index) => tool ? <div key={tool.slug} role="listitem" className={`def-podium__cell pos-${positions[index]}`}>
          <PodiumCard tool={tool} rank={index === 0 ? "02" : index === 1 ? "01" : "03"} position={positions[index]} selected={selectedPos === positions[index]} detailId={detailId} onSelect={() => setSelectedPos(positions[index])} />
        </div> : null)}
      </div></LocalizedAttributes>
      <div id={detailId} className="def-podium__reading" aria-live="polite" aria-atomic="true">
        <div key={inspectedTool.slug} className="def-podium__reading-content">
          <div className="def-podium__reading-heading"><Sparkles size={16} aria-hidden="true" /><h4>{inspectedTool.name}</h4><span><LocalizedText>In lettura</LocalizedText></span></div>
          {inspectedTool.shortDescription ? <p><LocalizedText>{inspectedTool.shortDescription}</LocalizedText></p> : null}
          <div className="def-podium__reading-meta">
            {inspectedTool.levelLabel ? <span className="def-podium__pill"><LocalizedText>{inspectedTool.levelLabel}</LocalizedText></span> : null}
            {inspectedTool.readingTime ? <span className="def-podium__pill"><LocalizedText>{formatHomeAnalysisTime(inspectedTool.readingTime)}</LocalizedText></span> : null}
            {inspectedTool.tags?.slice(0, 2).map(tag => <span key={tag} className="def-podium__pill def-podium__pill--tag"><LocalizedText>{tag}</LocalizedText></span>)}
          </div>
        </div>
      </div>
      <InstrumentJourney label="Esplora i tool del podio" className="def-podium__journey" steps={[
        { id: "inspect", label: "Approfondisci", detail: inspectedTool.name, href: `/toools/${inspectedTool.slug}`, icon: <Sparkles size={16} />, tone: "violet" },
        { id: "catalog", label: "Vedi tutto il catalogo", href: "/archivio", icon: <ScanSearch size={16} />, tone: "cyan" },
        { id: "stack", label: "Crea il tuo stack", href: workspaceViewHref("stack"), icon: <Layers3 size={16} />, tone: "gold" },
      ]} />
      {ranked.length > 3 ? <LocalizedAttributes><div className="def-podium__rail" role="list" aria-label={`Posizioni 04–${String(ranked.length).padStart(2, "0")}`}>
        {ranked.slice(3).map((tool, i) => <div key={tool.slug} role="listitem" className="def-podium__rail-item"><PodiumCard tool={tool} rank={String(i + 4).padStart(2, "0")} /></div>)}
      </div></LocalizedAttributes> : null}
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
        <LocalizedAttributes><div
          className="def-stacks__carousel"
          role="region"
          aria-roledescription="carousel"
          aria-label="Stack in evidenza"
        >
          <LocalizedAttributes><button
            type="button"
            className="def-stacks__arrow def-stacks__arrow--prev"
            aria-label="Stack precedente"
            onClick={() => scrollToIndex(Math.max(0, active - 1))}
            disabled={active === 0}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button></LocalizedAttributes>
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
                      <span className="def-stacks__pill"><LocalizedText>{stack.kicker}</LocalizedText></span>
                      <span className="def-stacks__counter">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                        {index + 1}/{total}
                      </span>
                    </div>
                    <h3 className="def-stacks__title"><LocalizedText>{stack.title}</LocalizedText></h3>
                    {stack.outcome ? (
                      <p className="def-stacks__desc"><LocalizedText>{stack.outcome}</LocalizedText></p>
                    ) : null}
                    {shownTools.length > 0 ? (
                      <LocalizedAttributes><ol className="def-stacks__tools" aria-label="Tool inclusi">
                        {shownTools.map((stage, si) => (
                          <li key={`${stack.slug}-${stage.name}`} className="def-stacks__tool">
                            <span className="def-stacks__tool-icon">
                              {stage.iconUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <LocalizedAttributes><img src={stage.iconUrl} alt="" loading="lazy" decoding="async" /></LocalizedAttributes>
                              ) : (
                                <span className="def-stacks__tool-fallback">{stage.name.slice(0, 1).toUpperCase()}</span>
                              )}
                            </span>
                            <span className="def-stacks__tool-text">
                              <strong>{stage.name}</strong>
                              {stage.label ? <span><LocalizedText>{stage.label}</LocalizedText></span> : null}
                            </span>
                            {si < shownTools.length - 1 ? (
                              <span className="def-stacks__tool-node" aria-hidden="true" />
                            ) : null}
                          </li>
                        ))}
                        {extraCount > 0 ? (
                          <li className="def-stacks__tool def-stacks__tool--more">+{extraCount}<LocalizedText>{" altri"}</LocalizedText></li>
                        ) : null}
                      </ol></LocalizedAttributes>
                    ) : null}
                    <div className="def-stacks__meta">
                      {stack.setupTime ? (
                        <span className="def-stacks__meta-item">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                          <LocalizedText>{stack.setupTime}</LocalizedText>
                        </span>
                      ) : null}
                      {stack.variantLabel ? (
                        <span className="def-stacks__meta-item">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg><LocalizedText>{"Variante "}</LocalizedText><LocalizedText>{stack.variantLabel}</LocalizedText>
                        </span>
                      ) : null}
                      {stack.cost ? (
                        <span className="def-stacks__meta-item">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                          <LocalizedText>{stack.cost}</LocalizedText>
                        </span>
                      ) : null}
                      {stack.toolCount ? (
                        <span className="def-stacks__meta-item">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                          {stack.toolCount}<LocalizedText>{" tool "}</LocalizedText></span>
                      ) : null}
                    </div>
                    {!authenticated ? (
                      <span className="def-stacks__cta tv-gold-cta tv-gold-cta--secondary">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <span className="tv-gold-cta__label"><LocalizedText>{"Accedi per lo stack completo"}</LocalizedText></span>
                      </span>
                    ) : (
                      <span className="def-stacks__cta tv-gold-cta tv-gold-cta--secondary">
                        <span className="tv-gold-cta__label"><LocalizedText>{"Apri raccolta"}</LocalizedText></span>
                        <ArrowRight size={14} aria-hidden="true" />
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <LocalizedAttributes><button
            type="button"
            className="def-stacks__arrow def-stacks__arrow--next"
            aria-label="Stack successivo"
            onClick={() => scrollToIndex(Math.min(stacks.length - 1, active + 1))}
            disabled={active === stacks.length - 1}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button></LocalizedAttributes>
        </div></LocalizedAttributes>
      ) : null}
      {showDots ? (
        <LocalizedAttributes><div className="def-stacks__pagination" role="group" aria-label="Paginazione stack">
          <div className="def-stacks__segments">
            {stacks.map((stack, index) => (
              <LocalizedAttributes key={stack.slug}><button
                key={stack.slug}
                type="button"
                aria-current={index === active ? "true" : undefined}
                aria-label={`Vai allo stack ${index + 1}`}
                className={`def-stacks__segment${index === active ? " is-active" : ""}${index < active ? " is-past" : ""}`}
                onClick={() => scrollToIndex(index)}
              >
                <span className="def-stacks__segment-bar" />
              </button></LocalizedAttributes>
            ))}
          </div>
          <span className="def-stacks__progress-label" aria-live="polite">
            {active + 1} / {total}
          </span>
        </div></LocalizedAttributes>
      ) : null}
      <div className="def-stacks__discovery">
        <p className="def-stacks__discovery-hint">
          {total}<LocalizedText>{" in evidenza · molte altre da esplorare "}</LocalizedText></p>
        <Link href="/collections" className="def-stacks__more tv-gold-cta">
          <span className="tv-gold-cta__glow" aria-hidden="true" />
          <span className="tv-gold-cta__label"><LocalizedText>{"Tutte le raccolte"}</LocalizedText></span>
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
