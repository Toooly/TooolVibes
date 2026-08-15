"use client";

import Link from "next/link";
import { Bookmark, GitCompare, NotebookPen, ArrowUpRight } from "lucide-react";

import type { WorkspaceSnapshot } from "./account-panel-model";

export function AccountWorkspaceBoard({
  workspace,
  decisionCount,
}: {
  workspace: WorkspaceSnapshot;
  decisionCount: number;
}) {
  const hasWork = workspace.saved > 0 || workspace.compare > 0 || decisionCount > 0;

  return (
    <section className="account-board" aria-label="Il tuo TooolVibes">
      <div className="account-board__stats">
        <Link href="/shortlist" className="account-stat">
          <span className="account-stat__icon" aria-hidden>
            <Bookmark size={18} />
          </span>
          <strong className="account-stat__value">{workspace.saved}</strong>
          <span className="account-stat__label">Salvati</span>
        </Link>
        <Link href="/compare" className="account-stat">
          <span className="account-stat__icon" aria-hidden>
            <GitCompare size={18} />
          </span>
          <strong className="account-stat__value">{workspace.compare}</strong>
          <span className="account-stat__label">Confronto</span>
        </Link>
        <div className="account-stat">
          <span className="account-stat__icon" aria-hidden>
            <NotebookPen size={18} />
          </span>
          <strong className="account-stat__value">{decisionCount}</strong>
          <span className="account-stat__label">Decisioni</span>
        </div>
      </div>

      <div className="account-board__actions">
        <Link
          href={workspace.compare > 1 ? "/compare" : workspace.saved > 0 ? "/shortlist" : "/archivio"}
          className="account-action account-action--primary"
        >
          <span>
            {workspace.compare > 1
              ? "Continua il confronto"
              : workspace.saved > 0
                ? "Apri i salvati"
                : "Esplora il catalogo"}
          </span>
          <ArrowUpRight size={18} aria-hidden />
        </Link>
        {hasWork ? (
          <Link href="/archivio" className="account-action">
            <span>Aggiungi candidati</span>
            <ArrowUpRight size={18} aria-hidden />
          </Link>
        ) : (
          <Link href="/collections" className="account-action">
            <span>Vedi le raccolte</span>
            <ArrowUpRight size={18} aria-hidden />
          </Link>
        )}
      </div>
    </section>
  );
}
