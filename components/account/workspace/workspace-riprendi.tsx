"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "@/components/account/account-provider";
import { markWorkspaceToolUsing, setWorkspaceRevisit } from "@/lib/account/workspace-actions";
import { USAGE_ACTION_LABELS, USAGE_STATE_LABELS, formatRevisitLine } from "@/lib/account/workspace-lifecycle";
import {
  activePersonalStacks,
  chooseResumeAction,
  deriveResurfaceSignals,
  pipelineColumnForTool,
  type ResumeKind,
  type ResurfaceKind,
} from "@/lib/account/workspace-pipeline";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import { fetchSignalHub } from "@/lib/signal-progression/client";
import type { SignalProgressHub } from "@/lib/signal-progression/hub-contracts";
import {
  FOCUS_AREA_LABELS,
  PRIMARY_GOAL_LABELS,
} from "@/lib/signal-progression/profile-context";
import { useSignalProgressUiEnabled } from "@/lib/signal-progression/release-context";
import type { PersonalStack, WorkspaceStateV1 } from "@/lib/discovery/types";

import { RevisitWhenChips } from "./revisit-when-chips";
import {
  emailLocalPart,
  formatWorkspaceDate,
  initialsFromEmail,
  workspaceFocusHref,
  workspaceViewHref,
} from "./workspace-model";
import { WorkspaceCatalogMark, WorkspaceMarkStrip } from "./workspace-tool-mark";
import { toolName } from "./workspace-tool-name";
import {
  WorkspaceChip,
  WorkspaceCompositionBar,
  WorkspaceEmptyMotif,
  WorkspaceReplacement,
  pipelineTone,
} from "./workspace-visual";

const RESUME_COPY: Record<
  Exclude<ResumeKind, "empty">,
  { title: string; body: string; action: string }
> = {
  continue_compare: {
    title: "Continua il confronto",
    body: "Hai un confronto aperto. Chiudilo quando hai abbastanza evidenza.",
    action: "Apri il confronto",
  },
  review_decision: {
    title: "Rivedi questa decisione",
    body: "L’avevi rimandata. È il momento di riprenderla.",
    action: "Apri in Decisioni",
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

const RESURFACE_COPY: Record<Extract<ResurfaceKind, "top_without_verdict" | "deferred_due">, string> = {
  top_without_verdict: "In cima, senza verdetto",
  deferred_due: "Rimandata, da riprendere",
};

function isBlankWorkspace(state: WorkspaceStateV1) {
  const hasDecision = Object.values(state.toolStates).some((tool) =>
    Boolean(tool.decision?.outcome),
  );
  return (
    state.saved.slugs.length === 0 &&
    state.compare.slugs.length === 0 &&
    !hasDecision &&
    activePersonalStacks(state).length === 0
  );
}

function resumeHref(kind: Exclude<ResumeKind, "empty">, slug: string | null) {
  const focus = slug ? { focus: slug } : undefined;
  if (kind === "continue_compare") return "/compare";
  if (kind === "review_decision" || kind === "confirm_usage") {
    return workspaceViewHref("decisioni", focus);
  }
  return workspaceViewHref("biblioteca", focus);
}

function pendingHref(kind: "deferred_due" | "top_without_verdict", slug: string) {
  if (kind === "deferred_due") return workspaceFocusHref("decisioni", slug);
  return workspaceFocusHref("biblioteca", slug);
}

function usingSlugs(state: WorkspaceStateV1) {
  return Object.entries(state.toolStates)
    .filter(([, tool]) => tool.usage === "using")
    .sort((left, right) => (right[1].updatedAt ?? "").localeCompare(left[1].updatedAt ?? ""))
    .map(([slug]) => slug)
    .slice(0, 6);
}

function replacementPairs(state: WorkspaceStateV1) {
  return Object.entries(state.toolStates)
    .filter(([, tool]) => tool.usage === "replaced" && tool.replacedBy)
    .sort((left, right) => (right[1].updatedAt ?? "").localeCompare(left[1].updatedAt ?? ""))
    .slice(0, 4)
    .map(([slug, tool]) => ({
      from: slug,
      to: tool.replacedBy as string,
      at: tool.updatedAt,
    }));
}

function stackStatusCounts(state: WorkspaceStateV1, stack: PersonalStack) {
  let evaluating = 0;
  let selected = 0;
  let using = 0;
  for (const slug of stack.slugs) {
    const tool = state.toolStates[slug];
    const usage = tool?.usage ?? null;
    const outcome = tool?.decision?.outcome ?? null;
    if (usage === "using") using += 1;
    else if (outcome === "selected" && usage !== "replaced") selected += 1;
    else if (!outcome) evaluating += 1;
  }
  return { evaluating, selected, using };
}

function stackCountsLabel(state: WorkspaceStateV1, stack: PersonalStack) {
  const counts = stackStatusCounts(state, stack);
  const parts: string[] = [];
  if (counts.evaluating > 0) parts.push(`${counts.evaluating} in valutazione`);
  if (counts.selected > 0) {
    parts.push(counts.selected === 1 ? "1 scelto" : `${counts.selected} scelti`);
  }
  if (counts.using > 0) parts.push(`${counts.using} in uso`);
  return parts.join(" · ");
}

export function WorkspaceRiprendi({
  state,
}: {
  state: WorkspaceStateV1;
}) {
  const account = useAccount();
  const catalog = usePublicToolCatalog();
  const signalUi = useSignalProgressUiEnabled();
  const [signalHub, setSignalHub] = useState<SignalProgressHub | null>(null);
  useEffect(() => {
    if (!signalUi) {
      setSignalHub(null);
      return;
    }
    let cancelled = false;
    void fetchSignalHub().then((next) => {
      if (!cancelled) setSignalHub(next);
    });
    return () => {
      cancelled = true;
    };
  }, [signalUi]);
  const resume = chooseResumeAction(state);
  const resurface = deriveResurfaceSignals(state);
  const stacks = activePersonalStacks(state);
  const inUse = usingSlugs(state);
  const replacements = replacementPairs(state);
  const email = account.user?.email ?? null;
  const localPart = emailLocalPart(email);
  const initials = initialsFromEmail(email);
  const blank = isBlankWorkspace(state);
  const pending = resurface
    .filter(
      (item): item is typeof item & { kind: "top_without_verdict" | "deferred_due"; slug: string } =>
        (item.kind === "top_without_verdict" || item.kind === "deferred_due") &&
        Boolean(item.slug) &&
        item.slug !== resume.slug,
    )
    .slice(0, 3);
  const showResume = resume.kind !== "empty";
  const showPending = pending.length > 0;
  const showInUse = inUse.length > 0;
  const showStacks = stacks.length > 0;
  const showCompare =
    state.compare.slugs.length >= 2 &&
    state.compare.slugs.some((slug) => (state.toolStates[slug]?.decision?.outcome ?? null) === null);
  const showMemory = replacements.length > 0;
  const resumeTool = resume.slug ? state.toolStates[resume.slug] : undefined;
  const resumeRevisit =
    resume.kind === "review_decision" && resume.slug
      ? formatRevisitLine(resumeTool?.revisitAt ?? null)
      : null;
  const copy = showResume && resume.kind !== "empty" ? RESUME_COPY[resume.kind] : null;
  const href =
    showResume && resume.kind !== "empty" ? resumeHref(resume.kind, resume.slug) : null;
  const resumeItem = resume.slug ? catalog.find((tool) => tool.slug === resume.slug) : null;
  const resumeColumn = resume.slug
    ? pipelineColumnForTool({
        stage: resumeTool?.stage ?? "saved",
        outcome: resumeTool?.decision?.outcome ?? null,
      })
    : null;
  const focusLabel = signalHub?.profileContext
    ? FOCUS_AREA_LABELS[signalHub.profileContext.focusArea]
    : null;
  const goalLabel = signalHub?.profileContext
    ? PRIMARY_GOAL_LABELS[signalHub.profileContext.primaryGoal]
    : null;
  const progressPct = Math.round((signalHub?.progressInLevel ?? 0) * 100);

  return (
    <div className="tv-home">
      <p className="tv-home-hello">
        <span className="tv-home-hello__initials" aria-hidden="true">
          {initials}
        </span>
        <span>
          Ciao, <span className="tv-home-hello__name">{localPart}</span>
          {focusLabel || goalLabel ? (
            <span className="tv-home-hello__context">
              {focusLabel ? `Focus: ${focusLabel}` : null}
              {focusLabel && goalLabel ? " · " : null}
              {goalLabel ? `Obiettivo: ${goalLabel}` : null}
            </span>
          ) : null}
        </span>
      </p>

      {blank ? (
        <section className="tv-home-section tv-mod tv-mod--resume" aria-labelledby="tv-home-empty-title">
          <WorkspaceEmptyMotif variant="home" />
          <p className="tv-home-kicker">Inizia qui</p>
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
        <section className="tv-home-section tv-mod tv-mod--resume" aria-labelledby="tv-home-resume-title">
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
              {resume.slug ? (
                <p className="tv-resume__tool">{toolName(catalog, resume.slug)}</p>
              ) : null}
              <p className="tv-home-copy">
                {resume.slug
                  ? `${copy.body} ${toolName(catalog, resume.slug)}${resumeRevisit ? ` · ${resumeRevisit}` : ""}.`
                  : copy.body}
              </p>
              <div className="tv-resume__meta">
                {resumeItem?.categoryLabel ? (
                  <WorkspaceChip tone="stack">{resumeItem.categoryLabel}</WorkspaceChip>
                ) : null}
                {resumeColumn ? (
                  <WorkspaceChip tone={pipelineTone(resumeColumn)}>
                    {resumeColumn === "scelto"
                      ? "Scelto"
                      : resumeColumn === "candidato"
                        ? "Candidato"
                        : resumeColumn === "rimandato"
                          ? "Rimandato"
                          : "Salvato"}
                  </WorkspaceChip>
                ) : null}
                {resumeTool?.usage ? (
                  <WorkspaceChip tone={resumeTool.usage}>
                    {USAGE_STATE_LABELS[resumeTool.usage]}
                  </WorkspaceChip>
                ) : null}
                {formatWorkspaceDate(resumeTool?.updatedAt) ? (
                  <WorkspaceChip tone="note">
                    {formatWorkspaceDate(resumeTool?.updatedAt)}
                  </WorkspaceChip>
                ) : null}
              </div>
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
            ) : (
              <Link className="account-btn-primary" href={href}>
                {copy.action}
              </Link>
            )}
            {resume.kind === "review_decision" && resume.slug ? (
              <Link className="tv-home-textbtn" href={workspaceFocusHref("decisioni", resume.slug)}>
                Cambia esito
              </Link>
            ) : null}
          </div>
          {resume.kind === "review_decision" && resume.slug ? (
            <RevisitWhenChips
              onSelect={(revisitAt) => setWorkspaceRevisit(resume.slug as string, revisitAt)}
            />
          ) : null}
        </section>
      ) : null}

      {!blank && showCompare ? (
        <section className="tv-home-section tv-mod tv-mod--compare" aria-labelledby="tv-home-compare-title">
          <h2 id="tv-home-compare-title" className="tv-home-kicker">
            Confronto attivo
          </h2>
          <Link
            className="tv-home-row"
            href="/compare"
            aria-label={`Apri il confronto: ${state.compare.slugs.map((slug) => toolName(catalog, slug)).join(" vs ")}`}
          >
            <WorkspaceMarkStrip catalog={catalog} slugs={state.compare.slugs} />
            <span className="tv-home-row__text">
              {state.compare.slugs.map((slug) => toolName(catalog, slug)).join(" vs ")}
            </span>
            <span className="tv-home-row__meta">Apri</span>
          </Link>
        </section>
      ) : null}

      {!blank && showPending ? (
        <section className="tv-home-section tv-mod tv-mod--pending" aria-labelledby="tv-home-pending-title">
          <h2 id="tv-home-pending-title" className="tv-home-kicker">
            Da decidere
          </h2>
          <ul className="tv-home-list">
            {pending.map((item) => (
              <li key={`${item.kind}-${item.slug}`}>
                <Link className="tv-home-row" href={pendingHref(item.kind, item.slug)}>
                  <WorkspaceCatalogMark catalog={catalog} slug={item.slug} size="sm" />
                  <span className="tv-home-row__text">{toolName(catalog, item.slug)}</span>
                  <span className="tv-home-row__meta">{RESURFACE_COPY[item.kind]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!blank && showInUse ? (
        <section className="tv-home-section tv-mod tv-mod--using" aria-labelledby="tv-home-using-title">
          <h2 id="tv-home-using-title" className="tv-home-kicker">
            In uso
          </h2>
          <div className="tv-home-strip">
            {inUse.map((slug) => (
              <Link key={slug} className="tv-home-tile" href={`/toools/${slug}`}>
                <WorkspaceCatalogMark catalog={catalog} slug={slug} size="sm" />
                <span>
                  <span className="tv-home-tile__name">{toolName(catalog, slug)}</span>
                  <span className="tv-home-tile__meta">{USAGE_STATE_LABELS.using}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {!blank && signalUi && signalHub ? (
        <section className="tv-home-section tv-mod tv-mod--signal" aria-labelledby="tv-home-signal-title">
          <h2 id="tv-home-signal-title" className="tv-home-kicker">
            Segnale
          </h2>
          <Link className="tv-home-row" href={workspaceViewHref("segnale")}>
            <span className="tv-home-row__text">
              {signalHub.levelTitle || "Esploratore"}
              {typeof signalHub.balance === "number" ? ` · ${signalHub.balance} SP` : ""}
            </span>
            <span className="tv-home-row__meta">{progressPct}%</span>
          </Link>
          <span
            className="tv-signal-meter"
            aria-label={`${progressPct}% verso il prossimo livello`}
          >
            <span style={{ width: `${progressPct}%` }} />
          </span>
        </section>
      ) : null}

      {!blank && showStacks ? (
        <section className="tv-home-section tv-mod tv-mod--stacks" aria-labelledby="tv-home-stacks-title">
          <h2 id="tv-home-stacks-title" className="tv-home-kicker">
            Stack attivi
          </h2>
          <ul className="tv-home-list">
            {stacks.map((stack) => {
              const meta = stackCountsLabel(state, stack);
              const counts = stackStatusCounts(state, stack);
              return (
                <li key={stack.id}>
                  <Link
                    className="tv-home-row"
                    href={workspaceViewHref("stack", { stack: stack.id })}
                  >
                    <WorkspaceMarkStrip catalog={catalog} slugs={stack.slugs} limit={4} size="xs" />
                    <span className="tv-home-row__text">
                      <span className="tv-home-tile__name">{stack.name}</span>
                      {meta ? <span className="tv-home-tile__meta">{meta}</span> : null}
                    </span>
                  </Link>
                  <WorkspaceCompositionBar
                    evaluating={counts.evaluating}
                    selected={counts.selected}
                    using={counts.using}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {!blank && showMemory ? (
        <section className="tv-home-section tv-mod tv-mod--memory" aria-labelledby="tv-home-memory-title">
          <h2 id="tv-home-memory-title" className="tv-home-kicker">
            Memoria software
          </h2>
          <ul className="tv-home-list">
            {replacements.map((item) => (
              <li key={`${item.from}-${item.to}`}>
                <WorkspaceReplacement catalog={catalog} fromSlug={item.from} toSlug={item.to} at={item.at} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
