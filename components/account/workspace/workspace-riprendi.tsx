"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { StackPickOrCreate } from "@/components/tools/stack-pick-or-create";
import {
  markWorkspaceRevisited,
  markWorkspaceToolUsing,
  reopenWorkspaceDecision,
  setWorkspaceRevisit,
  toggleWorkspaceCompare,
} from "@/lib/account/workspace-actions";
import {
  USAGE_ACTION_LABELS,
  formatRevisitLine,
  revisitAtFromPreset,
} from "@/lib/account/workspace-lifecycle";
import { queueStackCompare } from "@/lib/account/workspace-stack-compare";
import {
  composeHomeWorkspace,
  listHomeUsingSlugs,
  pipelineColumnForTool,
  stackNameForSlug,
  type HomeUnfinishedKind,
  type ResumeKind,
} from "@/lib/account/workspace-pipeline";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";
import { MIN_COMPARE_TOOLS } from "@/lib/discovery/workspace-constants";
import { getActiveWorkspaceOwner } from "@/lib/discovery/workspace-owner-storage";
import type { WorkspaceStateV1, WorkspaceToolState } from "@/lib/discovery/types";

import { HomeRadarPulse } from "./home-radar-pulse";
import { DecisionSheet } from "./decision-sheet";
import { RevisitWhenChips } from "./revisit-when-chips";
import { PIPELINE_LABELS, formatWorkspaceDate, workspaceViewHref } from "./workspace-model";
import { WorkspaceCatalogMark, WorkspaceMarkStrip } from "./workspace-tool-mark";
import { WorkspaceChip, pipelineTone } from "./workspace-visual";

const RESUME_COPY: Record<
  Exclude<ResumeKind, "empty">,
  { title: string; body: string; action: string }
> = {
  continue_compare: {
    title: "Continua il confronto",
    body: "Hai un confronto aperto. Chiudilo quando hai abbastanza evidenza.",
    action: "Riprendi il confronto",
  },
  review_decision: {
    title: "Rivedi questa decisione",
    body: "L’avevi rimandata. È il momento di riprenderla.",
    action: "Ancora vero",
  },
  close_decision: {
    title: "Chiudi la decisione",
    body: "È candidato, ancora senza verdetto.",
    action: "Apri i salvati",
  },
  evaluate_saved: {
    title: "Continua la valutazione",
    body: "Salvato, ancora aperto.",
    action: "Apri i salvati",
  },
  confirm_usage: {
    title: "Conferma se lo usi",
    body: "L’hai scelto. Manca solo se lo stai usando.",
    action: USAGE_ACTION_LABELS.using,
  },
};

const UNFINISHED_COPY: Record<
  HomeUnfinishedKind,
  { kicker: string; action: string }
> = {
  top_without_verdict: { kicker: "Candidato", action: "Apri" },
  selected_follow_up: { kicker: "Scelto", action: USAGE_ACTION_LABELS.using },
  review_without_verdict: { kicker: "Da valutare", action: "Apri" },
  stale_saved: { kicker: "Salvato", action: "Organizza" },
  saved_open: { kicker: "Salvato", action: "Organizza" },
};

function catalogNameMap(catalog: readonly PublicToolCatalogItem[]) {
  const map = new Map<string, string>();
  for (const item of catalog) map.set(item.slug, item.name);
  return map;
}

function nameOf(names: Map<string, string>, slug: string) {
  return names.get(slug) ?? slug;
}

function resumeHref(kind: Exclude<ResumeKind, "empty">, slug: string | null) {
  const focus = slug ? { focus: slug } : undefined;
  if (kind === "continue_compare") return "/compare";
  return workspaceViewHref("salvati", focus);
}

function salvatiFocusHref(slug: string) {
  return workspaceViewHref("salvati", { focus: slug });
}

function reviewWhy(tool: WorkspaceToolState | undefined) {
  const useCase = tool?.useCase?.trim();
  if (useCase) return useCase;
  const note = tool?.note?.trim();
  if (!note) return null;
  if (note.length <= 140) return note;
  return `${note.slice(0, 137).trimEnd()}…`;
}

function relationshipBreadcrumb(state: WorkspaceStateV1, kind: ResumeKind, slug: string | null) {
  if (kind === "continue_compare" || !slug) return [];
  const tool = state.toolStates[slug];
  const stages: string[] = [];
  if (state.saved.slugs.includes(slug)) stages.push("Salvato");
  if (state.compare.slugs.includes(slug)) stages.push("Confrontato");
  if (tool?.decision?.outcome === "selected") stages.push("Scelto");
  if (tool?.usage === "using") stages.push("In uso");
  return stages.length >= 2 ? stages : [];
}

function WorkspaceReviewActions({
  primary = false,
  snoozeOpen,
  onStillTrue,
  onNoLonger,
  onRimanda,
  onSnooze,
}: {
  primary?: boolean;
  snoozeOpen: boolean;
  onStillTrue: () => void;
  onNoLonger: () => void;
  onRimanda: () => void;
  onSnooze: (revisitAt: string) => void;
}) {
  return (
    <div className="tv-review-actions">
      <button
        type="button"
        className={primary ? "tv-home-cta tv-home-cta--primary" : "tv-home-textbtn"}
        onClick={onStillTrue}
      >
        Ancora vero
      </button>
      <button type="button" className="tv-home-textbtn" onClick={onNoLonger}>
        Non più
      </button>
      <button
        type="button"
        className="tv-home-textbtn"
        aria-expanded={snoozeOpen}
        onClick={onRimanda}
      >
        Rimanda
      </button>
      {snoozeOpen ? <RevisitWhenChips onSelect={onSnooze} /> : null}
    </div>
  );
}

export function WorkspaceRiprendi({
  state,
  focusSlug = null,
  autoOpenDecide = false,
}: {
  state: WorkspaceStateV1;
  focusSlug?: string | null;
  autoOpenDecide?: boolean;
}) {
  const catalog = usePublicToolCatalog();
  const names = useMemo(() => catalogNameMap(catalog), [catalog]);
  const nowIso = useMemo(() => new Date().toISOString(), []);
  const composition = composeHomeWorkspace(state, nowIso);
  const { blank, resume, unfinished, stacks, review, unfiled } = composition;
  const usingSlugs = listHomeUsingSlugs(state);

  const [decideSlug, setDecideSlug] = useState<string | null>(
    autoOpenDecide ? focusSlug : null,
  );
  const [snoozeSlug, setSnoozeSlug] = useState<string | null>(null);
  const [filingSlug, setFilingSlug] = useState<string | null>(null);

  const resumeTool = resume.slug ? state.toolStates[resume.slug] : undefined;
  const resumeRevisit =
    resume.kind === "review_decision" && resume.slug
      ? formatRevisitLine(resumeTool?.revisitAt ?? null)
      : null;
  const resumeWhy = resume.kind === "review_decision" ? reviewWhy(resumeTool) : null;
  const resumeDecidedAt =
    resume.kind === "review_decision"
      ? formatWorkspaceDate(resumeTool?.decision?.updatedAt ?? null)
      : null;
  const copy = resume.kind !== "empty" ? RESUME_COPY[resume.kind] : null;
  const href = resume.kind !== "empty" ? resumeHref(resume.kind, resume.slug) : null;
  const crumbs = relationshipBreadcrumb(state, resume.kind, resume.slug);
  const quiet =
    !blank &&
    resume.kind === "empty" &&
    unfinished.length === 0 &&
    review.length === 0;

  useEffect(() => {
    if (autoOpenDecide) setDecideSlug(focusSlug);
  }, [autoOpenDecide, focusSlug]);

  const decideName = decideSlug ? nameOf(names, decideSlug) : "";
  const resumeColumn = resume.slug
    ? pipelineColumnForTool({
        stage: resumeTool?.stage ?? "saved",
        outcome: resumeTool?.decision?.outcome ?? null,
      })
    : null;
  const stackName = stackNameForSlug(state, resume.slug);
  const canCreateStack = getActiveWorkspaceOwner().kind === "account";

  function stillTrue(slug: string) {
    setSnoozeSlug(null);
    markWorkspaceRevisited(slug, revisitAtFromPreset("3m"));
  }

  function noLonger(slug: string) {
    setSnoozeSlug(null);
    reopenWorkspaceDecision(slug);
    setDecideSlug(slug);
  }

  return (
    <div className="tv-home">
      {blank ? (
        <section className="tv-mod tv-mod--resume tv-home__resume" aria-labelledby="tv-home-empty-title">
          <h2 id="tv-home-empty-title" className="tv-home-title">
            Ancora niente da riprendere
          </h2>
          <p className="tv-home-copy">
            Qui restano stack, decisioni e note. Il catalogo resta pubblico: questo è il tuo laboratorio.
          </p>
          <div className="tv-home-actions">
            <Link className="tv-home-cta tv-home-cta--primary" href={workspaceViewHref("stack")}>
              Crea il primo stack
            </Link>
            <Link className="tv-home-textbtn" href={workspaceViewHref("salvati")}>
              Apri i Salvati
            </Link>
            <Link className="tv-home-textbtn" href="/archivio">
              Apri il catalogo
            </Link>
          </div>
        </section>
      ) : null}

      {!blank && copy && href && resume.kind !== "empty" ? (
        <section
          className="tv-mod tv-mod--resume tv-home__resume"
          id="tv-home-resume"
          aria-labelledby="tv-home-resume-title"
        >
          <p className="tv-home-kicker">Continua da qui</p>
          <div className="tv-resume__hero tv-home-hero">
            <span
              className="tv-home-hero__light"
              data-tv-decor
              aria-hidden="true"
            />
            {resume.kind === "continue_compare" ? (
              <WorkspaceMarkStrip catalog={catalog} slugs={state.compare.slugs} size="lg" />
            ) : resume.slug ? (
              <WorkspaceCatalogMark catalog={catalog} slug={resume.slug} size="xl" />
            ) : null}
            <div className="tv-resume__body">
              <h2 id="tv-home-resume-title" className="tv-resume__title">
                {copy.title}
              </h2>
              {resume.kind === "continue_compare" ? (
                <p className="tv-resume__tool">
                  {state.compare.slugs.map((slug) => nameOf(names, slug)).join(" vs ")}
                </p>
              ) : resume.slug ? (
                <p className="tv-resume__tool">{nameOf(names, resume.slug)}</p>
              ) : null}
              <p className="tv-home-copy">
                {copy.body}
                {resumeRevisit ? ` ${resumeRevisit}.` : null}
              </p>
              {resumeDecidedAt ? (
                <p className="tv-home-whisper">{resumeDecidedAt}</p>
              ) : null}
              {resumeWhy ? <p className="tv-home-whisper">{resumeWhy}</p> : null}
              {crumbs.length > 0 ? (
                <p className="tv-home-crumb">
                  {crumbs.map((stage, index) => (
                    <span key={stage}>
                      {index > 0 ? " → " : null}
                      {stage}
                    </span>
                  ))}
                </p>
              ) : null}
              {resumeColumn ? (
                <div className="tv-resume__meta">
                  <WorkspaceChip tone={pipelineTone(resumeColumn)}>
                    {PIPELINE_LABELS[resumeColumn]}
                  </WorkspaceChip>
                </div>
              ) : null}
              {stackName ? <p className="tv-home-whisper">{stackName}</p> : null}
            </div>
          </div>
          {resume.kind === "review_decision" && resume.slug ? (
            <WorkspaceReviewActions
              primary
              snoozeOpen={snoozeSlug === resume.slug}
              onStillTrue={() => stillTrue(resume.slug as string)}
              onNoLonger={() => noLonger(resume.slug as string)}
              onRimanda={() =>
                setSnoozeSlug((current) => (current === resume.slug ? null : resume.slug))
              }
              onSnooze={(revisitAt) => {
                setWorkspaceRevisit(resume.slug as string, revisitAt);
                setSnoozeSlug(null);
              }}
            />
          ) : (
            <div className="tv-home-actions">
              {resume.kind === "confirm_usage" && resume.slug ? (
                <>
                  <button
                    type="button"
                    className="tv-home-cta tv-home-cta--primary"
                    onClick={() => markWorkspaceToolUsing(resume.slug as string)}
                  >
                    {USAGE_ACTION_LABELS.using}
                  </button>
                  <Link className="tv-home-textbtn" href={href}>
                    Apri
                  </Link>
                </>
              ) : (
                <Link className="tv-home-cta tv-home-cta--primary" href={href}>
                  {copy.action}
                </Link>
              )}
            </div>
          )}
        </section>
      ) : null}

      {quiet ? (
        <div className="tv-home__quiet">
          <p className="tv-home-whisper">Niente da riprendere.</p>
          {state.saved.slugs.length > 0 ? (
            <Link className="tv-home-textbtn" href={workspaceViewHref("salvati")}>
              Apri i Salvati
            </Link>
          ) : null}
        </div>
      ) : null}

      {!blank && unfinished.length > 0 ? (
        <section className="tv-home__unfinished" aria-labelledby="tv-home-unfinished-title">
          <h2 id="tv-home-unfinished-title" className="tv-home-title">
            Da riprendere
          </h2>
          <ul className="tv-home-list">
            {unfinished.map((item) => {
              const copyItem = UNFINISHED_COPY[item.kind];
              return (
                <li key={item.slug} className="tv-home-queue-item tv-home-mini">
                  <span className="tv-home-mini__mark">
                    <WorkspaceCatalogMark catalog={catalog} slug={item.slug} size="sm" />
                  </span>
                  <div className="tv-home-mini__body">
                    <p className="tv-home-kicker tv-home-mini__kicker">{copyItem.kicker}</p>
                    <div className="tv-home-row">
                      <span className="tv-home-row__text">{nameOf(names, item.slug)}</span>
                      {item.kind === "selected_follow_up" ? (
                        <button
                          type="button"
                          className="tv-home-textbtn"
                          onClick={() => markWorkspaceToolUsing(item.slug)}
                        >
                          {copyItem.action}
                        </button>
                      ) : (
                        <Link className="tv-home-textbtn" href={salvatiFocusHref(item.slug)}>
                          {copyItem.action}
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {!blank && review.length > 0 ? (
        <section className="tv-home__review tv-home-review" aria-labelledby="tv-home-review-title">
          <h2 id="tv-home-review-title" className="tv-home-title">
            Da rivedere
          </h2>
          <ul className="tv-home-list">
            {review.map((item) => {
              const tool = state.toolStates[item.slug];
              const revisit = formatRevisitLine(tool?.revisitAt ?? null);
              const why = reviewWhy(tool);
              const decidedAt = formatWorkspaceDate(tool?.decision?.updatedAt ?? null);
              return (
                <li key={item.slug} className="tv-home-review-item">
                  <span className="tv-home-review__mark">
                    <WorkspaceCatalogMark catalog={catalog} slug={item.slug} size="sm" />
                  </span>
                  <div className="tv-home-review__body">
                  <div className="tv-home-row">
                    <span className="tv-home-row__text">{nameOf(names, item.slug)}</span>
                    <span className="tv-home-row__meta">
                      <span className="tv-home-review__dot" aria-hidden="true" />
                      {revisit ?? decidedAt ?? "Rimandata, da riprendere"}
                    </span>
                  </div>
                  {decidedAt ? (
                    <p className="tv-home-whisper">
                      {decidedAt}. Lo stai ancora preferendo?
                    </p>
                  ) : (
                    <p className="tv-home-whisper">Lo stai ancora preferendo?</p>
                  )}
                  {why ? <p className="tv-home-whisper">{why}</p> : null}
                  <WorkspaceReviewActions
                    snoozeOpen={snoozeSlug === item.slug}
                    onStillTrue={() => stillTrue(item.slug)}
                    onNoLonger={() => noLonger(item.slug)}
                    onRimanda={() =>
                      setSnoozeSlug((current) => (current === item.slug ? null : item.slug))
                    }
                    onSnooze={(revisitAt) => {
                      setWorkspaceRevisit(item.slug, revisitAt);
                      setSnoozeSlug(null);
                    }}
                  />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {!blank && stacks.length > 0 ? (
        <section className="tv-home__stacks" aria-labelledby="tv-home-stacks-title">
          <h2 id="tv-home-stacks-title" className="tv-home-title">
            Stack attivi
          </h2>
          <div className="tv-home-stacks">
            {stacks.map((stack) => {
              const shown = stack.slugs.slice(0, 4);
              const count = stack.slugs.length;
              return (
                <article key={stack.id} className="tv-home-stack">
                  <h3 className="tv-home-stack__name">{stack.name}</h3>
                  {shown.length > 0 ? (
                    <div className="tv-home-stack__jewels" aria-hidden="true">
                      {shown.map((slug) => (
                        <WorkspaceCatalogMark key={slug} catalog={catalog} slug={slug} size="sm" />
                      ))}
                    </div>
                  ) : null}
                  {count > 0 ? (
                    <p className="tv-home-whisper tv-home-stack__count">
                      {count === 1 ? "1 tool" : `${count} tool`}
                    </p>
                  ) : null}
                  {shown.length > 0 ? (
                    <p className="tv-home-whisper tv-home-stack__tools">
                      {shown.map((slug) => nameOf(names, slug)).join(" · ")}
                    </p>
                  ) : null}
                  <div className="tv-home-actions">
                    <Link
                      className="tv-home-textbtn"
                      href={workspaceViewHref("stack", { stack: stack.id })}
                    >
                      Apri
                    </Link>
                    {stack.slugs.length >= MIN_COMPARE_TOOLS ? (
                      <Link
                        className="tv-home-textbtn"
                        href="/compare"
                        onClick={() => queueStackCompare(stack.slugs, state.compare.slugs)}
                      >
                        Confronta
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {!blank && unfiled.length > 0 ? (
        <section className="tv-home__unfiled" aria-labelledby="tv-home-unfiled-title">
          <h2 id="tv-home-unfiled-title" className="tv-home-title">
            Salvati da organizzare
          </h2>
          <ul className="tv-home-list">
            {unfiled.map((item) => (
              <li key={item.slug} className="tv-home-queue-item tv-home-mini">
                <span className="tv-home-mini__mark">
                  <WorkspaceCatalogMark catalog={catalog} slug={item.slug} size="sm" />
                </span>
                <div className="tv-home-mini__body">
                <p className="tv-home-kicker tv-home-mini__kicker">Solo salvato</p>
                <div className="tv-home-row">
                  <span className="tv-home-row__text">{nameOf(names, item.slug)}</span>
                </div>
                <div className="tv-home-actions">
                  <button
                    type="button"
                    className="tv-home-textbtn"
                    aria-expanded={filingSlug === item.slug}
                    onClick={() =>
                      setFilingSlug((current) => (current === item.slug ? null : item.slug))
                    }
                  >
                    Aggiungi a Stack
                  </button>
                  <Link
                    className="tv-home-textbtn"
                    href="/compare"
                    onClick={() => {
                      if (!state.compare.slugs.includes(item.slug)) {
                        toggleWorkspaceCompare(item.slug);
                      }
                    }}
                  >
                    Confronta
                  </Link>
                  <Link className="tv-home-textbtn" href={salvatiFocusHref(item.slug)}>
                    Apri
                  </Link>
                </div>
                  {filingSlug === item.slug ? (
                    <StackPickOrCreate
                      slug={item.slug}
                      compact
                      allowCreate={canCreateStack}
                      onDone={() => setFilingSlug(null)}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!blank && usingSlugs.length > 0 ? (
        <p className="tv-home-using-line tv-home__using">
          In uso: {usingSlugs.map((slug) => nameOf(names, slug)).join(" · ")}
        </p>
      ) : null}


      <section className="tv-home__members" aria-labelledby="tv-home-members-title">
        <h2 id="tv-home-members-title" className="tv-home-title">
          Solo nel tuo spazio
        </h2>
        <p className="tv-home-copy">
          Raccolte complete e guide profonde si aprono qui, insieme a stack e Salvati.
        </p>
        <div className="tv-home-member-links">
          <Link className="tv-home-cta tv-home-cta--primary" href={workspaceViewHref("stack")}>
            I tuoi stack
          </Link>
          <Link className="tv-home-textbtn" href={workspaceViewHref("salvati")}>
            Salvati
          </Link>
          <Link className="tv-home-textbtn" href="/collections">
            Raccolte
          </Link>
          <Link className="tv-home-textbtn" href="/posts">
            Guide
          </Link>
        </div>
      </section>
      <HomeRadarPulse />
      {decideSlug ? (
        <DecisionSheet
          open
          onOpenChange={(open) => {
            if (!open) setDecideSlug(null);
          }}
          slug={decideSlug}
          toolName={decideName}
          alternatives={[]}
          source="home"
          defaultOutcome="selected"
        />
      ) : null}
    </div>
  );
}
