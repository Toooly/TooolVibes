"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { markWorkspaceToolUsing, setWorkspaceRevisit } from "@/lib/account/workspace-actions";
import { USAGE_ACTION_LABELS, formatRevisitLine } from "@/lib/account/workspace-lifecycle";
import {
  HOME_REVIEW_CAP,
  chooseResumeAction,
  isBlankWorkspace,
  listHomeReviewQueue,
  listHomeUsingSlugs,
  pipelineColumnForTool,
  stackNameForSlug,
  type ResumeKind,
} from "@/lib/account/workspace-pipeline";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";

import { DecisionSheet } from "./decision-sheet";
import { RevisitWhenChips } from "./revisit-when-chips";
import { PIPELINE_LABELS, workspaceViewHref } from "./workspace-model";
import { WorkspaceCatalogMark, WorkspaceMarkStrip } from "./workspace-tool-mark";
import { toolName } from "./workspace-tool-name";
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
    action: "Decidi",
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

function resumeHref(kind: Exclude<ResumeKind, "empty">, slug: string | null) {
  const focus = slug ? { focus: slug } : undefined;
  if (kind === "continue_compare") return "/compare";
  return workspaceViewHref("salvati", focus);
}

export function WorkspaceRiprendi({
  state,
  focusSlug = null,
}: {
  state: WorkspaceStateV1;
  focusSlug?: string | null;
}) {
  const catalog = usePublicToolCatalog();
  const [decideSlug, setDecideSlug] = useState<string | null>(focusSlug);
  const resume = chooseResumeAction(state);
  const reviewCap = resume.kind === "review_decision" ? HOME_REVIEW_CAP - 1 : HOME_REVIEW_CAP;
  const reviewQueue = listHomeReviewQueue(state, {
    excludeSlug: resume.slug,
    cap: reviewCap,
  });
  const usingSlugs = listHomeUsingSlugs(state);
  const blank = isBlankWorkspace(state);
  const resumeTool = resume.slug ? state.toolStates[resume.slug] : undefined;
  const resumeRevisit =
    resume.kind === "review_decision" && resume.slug
      ? formatRevisitLine(resumeTool?.revisitAt ?? null)
      : null;
  const copy = resume.kind !== "empty" ? RESUME_COPY[resume.kind] : null;
  const href = resume.kind !== "empty" ? resumeHref(resume.kind, resume.slug) : null;

  useEffect(() => {
    setDecideSlug(focusSlug);
  }, [focusSlug]);

  const decideName = decideSlug ? toolName(catalog, decideSlug) : "";
  const resumeColumn = resume.slug
    ? pipelineColumnForTool({
        stage: resumeTool?.stage ?? "saved",
        outcome: resumeTool?.decision?.outcome ?? null,
      })
    : null;
  const stackName = stackNameForSlug(state, resume.slug);

  return (
    <div className="tv-home">
      {blank ? (
        <section className="tv-mod tv-mod--resume" aria-labelledby="tv-home-empty-title">
          <h2 id="tv-home-empty-title" className="tv-home-title">
            Ancora niente da riprendere
          </h2>
          <p className="tv-home-copy">
            Salva un tool dal catalogo. Da lì parti a confrontare e decidere.
          </p>
          <div className="tv-home-actions">
            <Link className="account-btn-primary" href="/archivio">
              Apri il catalogo
            </Link>
          </div>
        </section>
      ) : null}

      {!blank && copy && href && resume.kind !== "empty" ? (
        <section
          className="tv-mod tv-mod--resume"
          id="tv-home-resume"
          aria-labelledby="tv-home-resume-title"
        >
          <p className="tv-home-kicker">Continua da qui</p>
          <div className="tv-resume__hero">
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
                  {state.compare.slugs.map((slug) => toolName(catalog, slug)).join(" vs ")}
                </p>
              ) : resume.slug ? (
                <p className="tv-resume__tool">{toolName(catalog, resume.slug)}</p>
              ) : null}
              <p className="tv-home-copy">
                {copy.body}
                {resumeRevisit ? ` ${resumeRevisit}.` : null}
              </p>
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
          <div className="tv-home-actions">
            {resume.kind === "confirm_usage" && resume.slug ? (
              <>
                <button
                  type="button"
                  className="account-btn-primary"
                  onClick={() => markWorkspaceToolUsing(resume.slug as string)}
                >
                  {USAGE_ACTION_LABELS.using}
                </button>
                <Link className="tv-home-textbtn" href={href}>
                  Apri
                </Link>
              </>
            ) : resume.kind === "review_decision" && resume.slug ? (
              <button
                type="button"
                className="account-btn-primary"
                onClick={() => setDecideSlug(resume.slug)}
              >
                {copy.action}
              </button>
            ) : (
              <Link className="account-btn-primary" href={href}>
                {copy.action}
              </Link>
            )}
          </div>
          {resume.kind === "review_decision" && resume.slug ? (
            <RevisitWhenChips
              onSelect={(revisitAt) => setWorkspaceRevisit(resume.slug as string, revisitAt)}
            />
          ) : null}
        </section>
      ) : null}

      {!blank && reviewQueue.length > 0 ? (
        <section className="tv-home-review" aria-labelledby="tv-home-review-title">
          <h2 id="tv-home-review-title" className="tv-home-kicker">
            Da riprendere
          </h2>
          <ul className="tv-home-list">
            {reviewQueue.map((item) => {
              const revisit = formatRevisitLine(state.toolStates[item.slug]?.revisitAt ?? null);
              return (
                <li key={item.slug}>
                  <button
                    type="button"
                    className="tv-home-row"
                    style={{
                      width: "100%",
                      border: 0,
                      background: "transparent",
                      font: "inherit",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                    onClick={() => setDecideSlug(item.slug)}
                  >
                    <span className="tv-home-row__text">{toolName(catalog, item.slug)}</span>
                    <span className="tv-home-row__meta">
                      {revisit ?? "Rimandata, da riprendere"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {!blank && usingSlugs.length > 0 ? (
        <p className="tv-home-using-line">
          In uso: {usingSlugs.map((slug) => toolName(catalog, slug)).join(" · ")}
        </p>
      ) : null}

      {!blank && resume.kind === "empty" && reviewQueue.length === 0 ? (
        <>
          <p className="tv-home-whisper">Niente da riprendere.</p>
          {state.saved.slugs.length > 0 ? (
            <Link className="tv-home-textbtn" href={workspaceViewHref("salvati")}>
              Apri i Salvati
            </Link>
          ) : null}
        </>
      ) : null}
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
