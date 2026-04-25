"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";

import { useAccount } from "@/components/account/account-provider";
import { useDiscoveryPersistence } from "@/components/discovery/discovery-persistence-provider";
import { useDiscoverySnapshot } from "@/lib/discovery/client-store";
import type { DiscoveryLocalSnapshot } from "@/lib/discovery/local-storage";
import { getPremiumEntitlementMeta } from "@/lib/premium/access";
import { hasToolDecisionNote } from "@/lib/tools/discovery";

type WorkspaceSnapshot = {
  saved: number;
  compare: number;
  top: number;
  review: number;
  pinned: number;
  notes: number;
};

function readWorkspaceSnapshot(snapshot: DiscoveryLocalSnapshot): WorkspaceSnapshot {
  const shortlist = snapshot.shortlist;
  const compare = snapshot.compare;
  const shortlistStages = snapshot.shortlistStages;
  const memories = snapshot.decisionMemories;

  return {
    saved: shortlist.length,
    compare: compare.length,
    top: shortlist.filter((slug) => (shortlistStages[slug] ?? "saved") === "top").length,
    review: shortlist.filter((slug) => (shortlistStages[slug] ?? "saved") === "review").length,
    pinned: shortlist.filter((slug) => Boolean(memories[slug]?.is_pinned)).length,
    notes: shortlist.filter((slug) => hasToolDecisionNote(memories[slug] ?? {})).length,
  };
}

export function AccountPanel() {
  const account = useAccount();
  const persistence = useDiscoveryPersistence();
  const discovery = useDiscoverySnapshot();
  const [email, setEmail] = useState("");
  const workspace = useMemo(() => readWorkspaceSnapshot(discovery), [discovery]);

  const persistenceLabel =
    persistence.mode === "remote"
      ? persistence.phase === "saving"
        ? "Sync in corso"
        : persistence.phase === "error"
          ? "Sync in pausa"
          : "Workspace sincronizzata"
      : "Solo browser";
  const premiumStatus = account.status === "authenticated" ? "account" : "guest";
  const premiumMeta = getPremiumEntitlementMeta(premiumStatus);
  const premiumActionHref =
    account.status === "authenticated" ? premiumMeta.cta_href : "#account-upgrade";
  const premiumActionLabel =
    account.status === "authenticated" ? premiumMeta.cta_label : "Continua con email";
  const accountStateLabel =
    account.status === "authenticated"
      ? "Account attivo"
      : account.status === "loading"
        ? "Caricamento"
        : account.authEnabled
          ? "Accesso attivabile"
          : "Sessione locale";
  const continuityCopy = account.isAttaching
    ? "Stiamo riallineando shortlist, compare e note con l'account corrente senza perdere il lavoro gia` fatto."
    : account.status === "authenticated"
      ? "La selezione e` agganciata all'account e resta pronta quando torni da un altro browser o da una nuova sessione."
      : account.authEnabled
        ? "La selezione esiste gia` e puo` essere collegata con un magic link senza ricominciare da zero."
        : "La selezione resta nel browser finche' auth e sync remota non vengono attivate.";
  const authMessageTone =
    account.authMessage?.includes("non disponibile") ||
    account.authMessage?.includes("pausa") ||
    account.authMessage?.includes("errore")
      ? {
          borderColor: "rgba(161,105,47,0.18)",
          background: "rgba(255,251,235,0.96)",
        }
      : {
          borderColor: "rgba(15,118,110,0.18)",
          background: "rgba(236,253,245,0.95)",
        };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await account.sendMagicLink(email);

    if (result.ok) {
      setEmail("");
    }
  };

  return (
    <div className="tone-account space-y-4">
      <div className="brand-panel panel-lift rounded-[32px] p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill">Account</span>
          <span className="selection-status">
            {account.isAttaching ? "Merge in corso" : accountStateLabel}
          </span>
        </div>
        <h1 className="text-display-card mt-4 max-w-none text-[1.8rem] sm:max-w-[20ch] sm:text-[2.24rem] sm:text-balance">
          Continuita` della selezione e accesso member.
        </h1>
        <p
          className="text-body-soft mt-4 max-w-[40rem] text-[0.95rem]"
          style={{ color: "var(--muted-strong)" }}
        >
          Qui capisci se la selezione resta nel browser o segue gia` l&apos;account, cosa sblocca il layer member e da dove conviene ripartire.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {account.status === "authenticated" ? (
            <>
              <Link
                href={workspace.compare > 1 ? "/compare" : "/shortlist"}
                className="button-shell button-primary text-ui-strong inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white"
              >
                {workspace.compare > 1 ? "Continua il compare" : "Apri la shortlist"}
              </Link>
              <Link
                href="/collections"
                className="section-quiet-link text-sm font-semibold"
                style={{ color: "var(--accent-strong)" }}
              >
                Apri le collection
              </Link>
            </>
          ) : (
            <>
              <Link
                href="#account-upgrade"
                className="button-shell button-primary text-ui-strong inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white"
              >
                Continua con email
              </Link>
              <Link
                href="/collections"
                className="section-quiet-link text-sm font-semibold"
                style={{ color: "var(--accent-strong)" }}
              >
                Vedi preview e issue
              </Link>
            </>
          )}
        </div>

        <p className="mt-4 text-[0.84rem] leading-6" style={{ color: "var(--muted)" }}>
          {persistenceLabel} · {workspace.saved} tool salvati · {workspace.compare} nel compare.
        </p>
      </div>

      <div className="editorial-grid gap-y-4">
        <section className="col-span-12 lg:col-span-7">
          <div className="brand-panel panel-lift rounded-[30px] p-4.5 sm:p-5">
            <p className="editorial-label">Stato attuale</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div
                className="stat-block rounded-[24px] border p-4"
                style={{
                  borderColor: "var(--line)",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(243,237,255,0.74))",
                }}
              >
                <p className="editorial-label">Modalita`</p>
                <p className="text-body-strong mt-2.5 text-[1rem]">{accountStateLabel}</p>
              </div>
              <div
                className="stat-block rounded-[24px] border p-4"
                style={{
                  borderColor: "var(--line)",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(243,237,255,0.74))",
                }}
              >
                <p className="editorial-label">Continuita`</p>
                <p className="text-body-strong mt-2.5 text-[1rem]">
                  {account.isAttaching
                    ? "Merge workspace in corso"
                    : account.status === "authenticated"
                      ? "Account agganciato"
                      : "Sessione pronta da collegare"}
                </p>
              </div>
            </div>

            <div
              id="member-access"
              className="metadata-block mt-5 rounded-[26px] px-5 py-5"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.84), rgba(249,239,212,0.8))",
              }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill pill-premium">Accesso member</span>
                <span className="selection-status">{premiumMeta.short_label}</span>
              </div>
              <p className="text-display-card mt-3 max-w-[18ch] text-[1.34rem] sm:max-w-[19ch] sm:text-[1.54rem]">
                {premiumMeta.label}
              </p>
              <p className="mt-3 text-[0.93rem] leading-7" style={{ color: "var(--muted-strong)" }}>
                {premiumMeta.description}
              </p>
              <p className="mt-3 text-[0.88rem] leading-7" style={{ color: "var(--muted)" }}>
                {workspace.saved > 0
                  ? `Hai gia' ${workspace.saved} tool salvati: account e premium servono a dare continuita' e accesso, non a rimettere in discussione la selezione.`
                  : "Qui si chiarisce il rapporto tra accesso, preview e member issue senza aggiungere frizione inutile."}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  href={premiumActionHref}
                  className="button-shell button-secondary text-ui-strong inline-flex rounded-full px-4 py-2.5 text-sm font-semibold"
                >
                  {premiumActionLabel}
                </Link>
                <Link
                  href="/collections"
                  className="section-quiet-link text-sm font-semibold"
                  style={{ color: "var(--accent-strong)" }}
                >
                  Vedi preview e issue
                </Link>
              </div>
            </div>

            {account.status === "authenticated" ? (
              <div className="metadata-block mt-5 rounded-[26px] px-5 py-5">
                <p className="brand-kicker">Account connesso</p>
                <p className="mt-2.5 text-[1rem] leading-7" style={{ color: "var(--muted-strong)" }}>
                  {account.user?.email ?? "Account attivo"} e` collegato al viewer corrente. La
                  selezione locale e` stata agganciata senza perdere shortlist, compare, note, pin,
                  reason e stage.
                </p>
                <p className="mt-3 text-[0.9rem] leading-7" style={{ color: "var(--muted)" }}>
                  {continuityCopy}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void account.signOut()}
                    className="button-shell button-secondary text-ui-strong rounded-full px-4 py-2 text-sm font-semibold"
                  >
                    Esci e torna guest
                  </button>
                </div>
              </div>
            ) : (
              <form
                id="account-upgrade"
                onSubmit={handleSubmit}
                className="metadata-block mt-5 rounded-[26px] px-5 py-5"
              >
                <p className="brand-kicker">Continua con email</p>
                <p className="mt-2.5 text-[0.98rem] leading-7" style={{ color: "var(--muted-strong)" }}>
                  Ti mandiamo un magic link minimale. Quando entri, la selezione locale viene
                  collegata all&apos;account senza perdere cio` che hai gia` salvato.
                </p>
                <p className="mt-3 text-[0.88rem] leading-7" style={{ color: "var(--muted)" }}>
                  {continuityCopy}
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nome@email.com"
                    className="filter-control w-full rounded-[20px] border px-4 py-3 outline-none"
                    style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.88)" }}
                  />
                  <button
                    type="submit"
                    disabled={account.isSendingLink || !account.authEnabled}
                    className="button-shell button-primary text-ui-strong rounded-full px-5 py-3 text-sm font-semibold text-white disabled:cursor-default disabled:opacity-60"
                  >
                    {account.isSendingLink ? "Invio..." : "Invia magic link"}
                  </button>
                </div>
                <p className="mt-3 text-[0.76rem] uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                  {account.authEnabled
                    ? "Percorso minimale: nessun onboarding pesante, solo continuita` della selezione."
                    : "Auth Supabase non configurata: il prodotto resta in fallback locale."}
                </p>
              </form>
            )}

            {account.authMessage ? (
              <div
                className="mt-4 rounded-[22px] border px-4 py-4"
                style={authMessageTone}
              >
                <p className="text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                  {account.authMessage}
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="col-span-12 space-y-4 lg:col-span-5">
          <div className="brand-panel panel-lift rounded-[28px] p-4.5 sm:p-5">
            <p className="editorial-label">Workspace snapshot</p>
            <h2 className="text-display-card mt-2 text-[1.36rem] sm:text-[1.54rem]">
              La selezione che hai gia` costruito resta leggibile.
            </h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "var(--muted)" }}>
              La pagina account non serve solo per entrare: rende visibile quanta selezione reale hai gia` costruito e da dove conviene ripartire adesso.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { label: "Shortlist", value: workspace.saved, detail: "tool salvati" },
                { label: "Compare", value: workspace.compare, detail: "profili nel tray" },
                { label: "Priorita` alta", value: workspace.top, detail: "priorita` alte" },
                { label: "Da rivedere", value: workspace.review, detail: "tool ancora aperti" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[22px] border px-4 py-4"
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.82)" }}
                >
                  <p className="editorial-label">{item.label}</p>
                  <p className="mt-2 text-[1.6rem] leading-none">{item.value}</p>
                  <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href={workspace.saved > 0 ? "/shortlist" : "/archivio"}
                className="button-shell button-secondary text-ui-strong inline-flex rounded-full px-4 py-2.5 text-sm font-semibold"
              >
                {workspace.saved > 0 ? `Apri shortlist (${workspace.saved})` : "Inizia dall'archivio"}
              </Link>
              <Link
                href={workspace.compare > 1 ? "/compare" : "/archivio"}
                className="section-quiet-link text-sm font-semibold"
                style={{ color: "var(--accent-strong)" }}
              >
                {workspace.compare > 1 ? "Continua il compare" : "Aggiungi candidati"}
              </Link>
            </div>
          </div>

          <div className="dark-panel panel-lift rounded-[28px] p-4.5 sm:p-5">
            <p className="editorial-label !text-white/60">Percorso di continuita`</p>
            <div className="mt-4 grid gap-3">
              <div className="discovery-strip-dark rounded-[22px] px-4 py-4">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/56">1. Sessione locale</p>
                <p className="mt-2 text-sm leading-6 text-white/82">
                  Continui a esplorare e salvare tool senza attrito iniziale.
                </p>
              </div>
              <div className="discovery-strip-dark rounded-[22px] px-4 py-4">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/56">
                  2. Magic link
                </p>
                <p className="mt-2 text-sm leading-6 text-white/82">
                  Colleghi l&apos;email con un passaggio minimo, senza schermate pesanti.
                </p>
              </div>
              <div className="discovery-strip-dark rounded-[22px] px-4 py-4">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/56">
                  3. Merge sicuro
                </p>
                <p className="mt-2 text-sm leading-6 text-white/82">
                  Shortlist, compare, note, pin, reason e stage vengono agganciati all&apos;account
                  senza perdere il contesto costruito da guest.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
