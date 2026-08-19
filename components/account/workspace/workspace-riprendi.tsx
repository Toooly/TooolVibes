"use client";

import Link from "next/link";
import { useAccount } from "@/components/account/account-provider";
import { setWorkspaceRevisit } from "@/lib/account/workspace-actions";
import { formatRevisitLine } from "@/lib/account/workspace-lifecycle";
import {
  activePersonalStacks,
  chooseResumeAction,
  deriveResurfaceSignals,
  type ResumeKind,
  type ResurfaceKind,
} from "@/lib/account/workspace-pipeline";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";

import { RevisitWhenChips } from "./revisit-when-chips";
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
    body: "L’avevi rimandata. È il momento di riprenderla.",
    href: workspaceViewHref("biblioteca"),
    action: "Apri i salvati",
  },
  close_decision: {
    title: "Chiudi la decisione",
    body: "È candidato, ancora senza verdetto.",
    href: workspaceViewHref("biblioteca"),
    action: "Apri i salvati",
  },
  evaluate_saved: {
    title: "Continua la valutazione",
    body: "Salvato, ancora aperto.",
    href: workspaceViewHref("biblioteca"),
    action: "Apri i salvati",
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



export function WorkspaceRiprendi({
  state,
}: {
  state: WorkspaceStateV1;
}) {
  const account = useAccount();
  const catalog = usePublicToolCatalog();
  const resume = chooseResumeAction(state);
  const resurface = deriveResurfaceSignals(state);
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
  const showStacks = stacks.length > 0;
  const resumeRevisit =
    resume.kind === "review_decision" && resume.slug
      ? formatRevisitLine(state.toolStates[resume.slug]?.revisitAt ?? null)
      : null;

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
              ? `${RESUME_COPY[resume.kind].body} ${toolName(catalog, resume.slug)}${resumeRevisit ? ` · ${resumeRevisit}` : ""}.`
              : RESUME_COPY[resume.kind].body}
          </p>
          <div className="tv-home-actions">
            <Link className="account-btn-primary" href={RESUME_COPY[resume.kind].href}>
              {RESUME_COPY[resume.kind].action}
            </Link>
            {resume.kind === "review_decision" && resume.slug ? (
              <Link className="tv-home-textbtn" href={workspaceViewHref("decisioni")}>
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
                <Link className="tv-home-row" href={workspaceViewHref("biblioteca")}>
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

    </div>
  );
}
