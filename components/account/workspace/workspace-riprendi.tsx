"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAccount } from "@/components/account/account-provider";
import { recommendWorkspaceTools } from "@/lib/account/personalization";
import { setWorkspaceRevisit } from "@/lib/account/workspace-actions";
import {
  activePersonalStacks,
  chooseResumeAction,
  deriveResurfaceSignals,
  deriveWorkspaceActivity,
  type DerivedActivityItem,
  type ResumeKind,
  type ResurfaceKind,
} from "@/lib/account/workspace-pipeline";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";
import { fetchSignalHub } from "@/lib/signal-progression/client";
import type { SignalProgressHub } from "@/lib/signal-progression/hub-contracts";
import {
  FOCUS_AREA_LABELS,
  PRIMARY_GOAL_LABELS,
} from "@/lib/signal-progression/profile-context";
import { useSignalProgressUiEnabled } from "@/lib/signal-progression/release-context";

import {
  emailLocalPart,
  initialsFromEmail,
  workspaceViewHref,
} from "./workspace-model";
import { toolName } from "./workspace-tool-name";

const RESUME_COPY: Record<
  Exclude<ResumeKind, "empty">,
  { title: string; body: string; href: string; action: string }
> = {
  continue_compare: {
    title: "Continua il confronto",
    body: "Hai un confronto aperto. Chiudilo quando hai abbastanza evidenza.",
    href: "/compare",
    action: "Apri il confronto",
  },
  review_decision: {
    title: "Rivedi questa decisione",
    body: "L’avevi rimandata. Vale la pena riprenderla ora.",
    href: workspaceViewHref("decisioni"),
    action: "Apri le decisioni",
  },
  close_decision: {
    title: "Chiudi la decisione",
    body: "È tra i candidati ma non ha ancora un verdetto.",
    href: workspaceViewHref("decisioni"),
    action: "Chiudi la decisione",
  },
  evaluate_saved: {
    title: "Valuta questo candidato",
    body: "Salvato, ancora da passare in rassegna.",
    href: workspaceViewHref("biblioteca"),
    action: "Apri la biblioteca",
  },
};

const RESURFACE_COPY: Record<Extract<ResurfaceKind, "top_without_verdict" | "deferred_due">, string> = {
  top_without_verdict: "In cima, senza verdetto",
  deferred_due: "Rimandata, da riprendere",
};

const ACTIVITY_COPY: Record<DerivedActivityItem["kind"], string> = {
  saved: "Salvataggio",
  compared: "Confronto",
  decision: "Decisione",
  stack: "Stack",
  journal: "Nota",
};

function useSignalHubPreview() {
  const enabled = useSignalProgressUiEnabled();
  const [hub, setHub] = useState<SignalProgressHub | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchSignalHub().then((next) => {
      if (!cancelled) setHub(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const focusArea = hub?.profileContext?.focusArea ?? null;
  const primaryGoal = hub?.profileContext?.primaryGoal ?? null;
  const focusLabel = focusArea ? FOCUS_AREA_LABELS[focusArea] : null;
  const goalLabel = primaryGoal ? PRIMARY_GOAL_LABELS[primaryGoal] : null;
  const showSignal = enabled && hub !== null && Boolean(hub.levelTitle || focusLabel);

  return { hub, focusLabel, goalLabel, showSignal };
}

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

function snoozeRevisit(slug: string) {
  const next = new Date();
  next.setTime(next.getTime() + 7 * 24 * 60 * 60 * 1000);
  setWorkspaceRevisit(slug, next.toISOString());
}

function activityHref(item: DerivedActivityItem) {
  if (item.kind === "compared") return "/compare";
  if (item.kind === "saved") return workspaceViewHref("biblioteca");
  if (item.kind === "stack") return workspaceViewHref("stack");
  return workspaceViewHref("decisioni");
}

export function WorkspaceRiprendi({
  state,
}: {
  state: WorkspaceStateV1;
}) {
  const account = useAccount();
  const catalog = usePublicToolCatalog();
  const { hub, focusLabel, goalLabel, showSignal } = useSignalHubPreview();
  const resume = chooseResumeAction(state);
  const resurface = deriveResurfaceSignals(state);
  const recs = recommendWorkspaceTools({
    catalog,
    workspace: state,
    focusArea: hub?.profileContext?.focusArea ?? null,
    primaryGoal: hub?.profileContext?.primaryGoal ?? null,
    limit: 3,
  });
  const activity = deriveWorkspaceActivity(state).slice(0, 5);
  const stacks = activePersonalStacks(state);
  const email = account.user?.email ?? null;
  const localPart = emailLocalPart(email);
  const initials = initialsFromEmail(email);
  const blank = isBlankWorkspace(state);
  const pending = resurface.filter(
    (item): item is typeof item & { kind: "top_without_verdict" | "deferred_due"; slug: string } =>
      (item.kind === "top_without_verdict" || item.kind === "deferred_due") &&
      Boolean(item.slug) &&
      item.slug !== resume.slug,
  ).slice(0, 3);
  const showResume = resume.kind !== "empty";
  const showCompare = state.compare.slugs.length >= 2 && resume.kind !== "continue_compare";
  const showPending = pending.length > 0;
  const showActivity = activity.length > 0;
  const showStacks = stacks.length > 0;
  const showRecs = recs.length > 0;

  return (
    <div className="tv-home">
      <p className="tv-home-hello">
        <span className="tv-home-hello__initials" aria-hidden="true">
          {initials}
        </span>
        <span>
          Ciao, <span className="tv-home-hello__name">{localPart}</span>
        </span>
      </p>

      {blank ? (
        <section className="tv-home-section tv-home-section--resume" aria-labelledby="tv-home-empty-title">
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

      {!blank && showResume && resume.kind !== "empty" ? (
        <section className="tv-home-section tv-home-section--resume" aria-labelledby="tv-home-resume-title">
          <p className="tv-home-kicker">Continua da qui</p>
          <h2 id="tv-home-resume-title" className="tv-home-title">
            {RESUME_COPY[resume.kind].title}
          </h2>
          <p className="tv-home-copy">
            {resume.slug
              ? `${RESUME_COPY[resume.kind].body} ${toolName(catalog, resume.slug)}.`
              : RESUME_COPY[resume.kind].body}
          </p>
          <div className="tv-home-actions">
            <Link className="account-btn-primary" href={RESUME_COPY[resume.kind].href}>
              {RESUME_COPY[resume.kind].action}
            </Link>
            {resume.kind === "review_decision" && resume.slug ? (
              <>
                <button
                  type="button"
                  className="tv-home-textbtn"
                  onClick={() => snoozeRevisit(resume.slug as string)}
                >
                  Posticipa
                </button>
                <Link className="tv-home-textbtn" href={workspaceViewHref("decisioni")}>
                  Cambia esito
                </Link>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      {!blank && showPending ? (
        <section className="tv-home-section" aria-labelledby="tv-home-pending-title">
          <h2 id="tv-home-pending-title" className="tv-home-kicker">
            Da decidere
          </h2>
          <ul className="tv-home-list">
            {pending.map((item) => (
              <li key={`${item.kind}-${item.slug}`}>
                <Link className="tv-home-row" href={workspaceViewHref("decisioni")}>
                  <span>{toolName(catalog, item.slug)}</span>
                  <span className="tv-home-row__meta">{RESURFACE_COPY[item.kind]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!blank && showCompare ? (
        <section className="tv-home-section" aria-labelledby="tv-home-compare-title">
          <h2 id="tv-home-compare-title" className="tv-home-kicker">
            Confronto attivo
          </h2>
          <ul className="tv-home-list">
            {state.compare.slugs.map((slug) => (
              <li key={slug}>
                <Link className="tv-home-row" href="/compare">
                  <span>{toolName(catalog, slug)}</span>
                  <span className="tv-home-row__meta">Apri</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!blank && showActivity ? (
        <section className="tv-home-section" aria-labelledby="tv-home-activity-title">
          <h2 id="tv-home-activity-title" className="tv-home-kicker">
            Recenti
          </h2>
          <ul className="tv-home-list">
            {activity.map((item) => (
              <li key={`${item.kind}-${item.slug ?? item.stackId ?? item.at}`}>
                <Link className="tv-home-row" href={activityHref(item)}>
                  <span>
                    {ACTIVITY_COPY[item.kind]}
                    {item.slug ? ` · ${toolName(catalog, item.slug)}` : ""}
                  </span>
                  <span className="tv-home-row__meta">{item.at.slice(0, 10)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!blank && showStacks ? (
        <section className="tv-home-section" aria-labelledby="tv-home-stacks-title">
          <h2 id="tv-home-stacks-title" className="tv-home-kicker">
            I tuoi stack
          </h2>
          <ul className="tv-home-list">
            {stacks.map((stack) => (
              <li key={stack.id}>
                <Link className="tv-home-row" href={workspaceViewHref("stack")}>
                  <span>{stack.name}</span>
                  <span className="tv-home-row__meta">{stack.slugs.length}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!blank && showRecs ? (
        <section className="tv-home-section" aria-labelledby="tv-home-recs-title">
          <h2 id="tv-home-recs-title" className="tv-home-kicker">
            Per te
          </h2>
          <ul className="tv-home-list">
            {recs.map((item) => (
              <li key={item.slug}>
                <Link className="tv-home-row" href={`/toools/${item.slug}`}>
                  <span>{item.name}</span>
                  <span className="tv-home-row__meta">{item.detail}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!blank && showSignal && hub ? (
        <section className="tv-home-section" aria-labelledby="tv-home-signal-title">
          <h2 id="tv-home-signal-title" className="tv-home-kicker">
            Segnale
          </h2>
          <p className="tv-home-title">{hub.levelTitle}</p>
          <p className="tv-home-copy">
            {[
              focusLabel ? `Focus: ${focusLabel}` : null,
              goalLabel ? `Obiettivo: ${goalLabel}` : null,
            ]
              .filter(Boolean)
              .join(" · ") || hub.explanation}
          </p>
          <div className="tv-home-actions">
            <Link className="account-btn-secondary" href={workspaceViewHref("segnale")}>
              Apri il segnale
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
