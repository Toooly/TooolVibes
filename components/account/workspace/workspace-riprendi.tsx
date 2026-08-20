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
  type ResumeKind,
  type ResurfaceKind,
} from "@/lib/account/workspace-pipeline";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import { fetchSignalHub } from "@/lib/signal-progression/client";
import type { SignalProgressHub } from "@/lib/signal-progression/hub-contracts";
import { useSignalProgressUiEnabled } from "@/lib/signal-progression/release-context";
import type { PersonalStack, WorkspaceStateV1 } from "@/lib/discovery/types";

import { RevisitWhenChips } from "./revisit-when-chips";
import {
  emailLocalPart,
  initialsFromEmail,
  workspaceFocusHref,
  workspaceViewHref,
} from "./workspace-model";
import { toolName } from "./workspace-tool-name";

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
  const resumeRevisit =
    resume.kind === "review_decision" && resume.slug
      ? formatRevisitLine(state.toolStates[resume.slug]?.revisitAt ?? null)
      : null;
  const copy = showResume && resume.kind !== "empty" ? RESUME_COPY[resume.kind] : null;
  const href =
    showResume && resume.kind !== "empty" ? resumeHref(resume.kind, resume.slug) : null;

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

      {!blank && copy && href && resume.kind !== "empty" ? (
        <section className="tv-home-section tv-home-section--resume" aria-labelledby="tv-home-resume-title">
          <p className="tv-home-kicker">Continua da qui</p>
          <h2 id="tv-home-resume-title" className="tv-home-title">
            {copy.title}
          </h2>
          <p className="tv-home-copy">
            {resume.slug
              ? `${copy.body} ${toolName(catalog, resume.slug)}${resumeRevisit ? ` · ${resumeRevisit}` : ""}.`
              : copy.body}
          </p>
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

      {!blank && showPending ? (
        <section className="tv-home-section" aria-labelledby="tv-home-pending-title">
          <h2 id="tv-home-pending-title" className="tv-home-kicker">
            Da decidere
          </h2>
          <ul className="tv-home-list">
            {pending.map((item) => (
              <li key={`${item.kind}-${item.slug}`}>
                <Link className="tv-home-row" href={pendingHref(item.kind, item.slug)}>
                  <span>{toolName(catalog, item.slug)}</span>
                  <span className="tv-home-row__meta">{RESURFACE_COPY[item.kind]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!blank && showInUse ? (
        <section className="tv-home-section" aria-labelledby="tv-home-using-title">
          <h2 id="tv-home-using-title" className="tv-home-kicker">
            In uso
          </h2>
          <ul className="tv-home-list">
            {inUse.map((slug) => (
              <li key={slug}>
                <Link className="tv-home-row" href={`/toools/${slug}`}>
                  <span>{toolName(catalog, slug)}</span>
                  <span className="tv-home-row__meta">{USAGE_STATE_LABELS.using}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!blank && signalUi && signalHub ? (
        <section className="tv-home-section" aria-labelledby="tv-home-signal-title">
          <h2 id="tv-home-signal-title" className="tv-home-kicker">
            Segnale
          </h2>
          <Link className="tv-home-row" href={workspaceViewHref("segnale")}>
            <span>
              {signalHub.levelTitle || "Esploratore"}
              {typeof signalHub.balance === "number" ? ` · ${signalHub.balance} SP` : ""}
            </span>
            <span className="tv-home-row__meta">Progresso</span>
          </Link>
        </section>
      ) : null}

      {!blank && showStacks ? (
        <section className="tv-home-section" aria-labelledby="tv-home-stacks-title">
          <h2 id="tv-home-stacks-title" className="tv-home-kicker">
            Stack attivi
          </h2>
          <ul className="tv-home-list">
            {stacks.map((stack) => {
              const meta = stackCountsLabel(state, stack);
              return (
                <li key={stack.id}>
                  <Link
                    className="tv-home-row"
                    href={workspaceViewHref("stack", { stack: stack.id })}
                  >
                    <span>{stack.name}</span>
                    {meta ? <span className="tv-home-row__meta">{meta}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
