"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  GitCompare,
  Layers,
  LogOut,
  Mail,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  Star,
  User,
  Zap,
} from "lucide-react";

import { useAccount } from "@/components/account/account-provider";
import { AccountVibesBackground } from "@/components/account/account-vibes-background";
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [vibeContext, setVibeContext] = useState({
    source: "",
    email: "",
    vibes: "",
    xp: "",
  });
  const workspace = useMemo(() => readWorkspaceSnapshot(discovery), [discovery]);
  const vibeScore = vibeContext.vibes;
  const vibeXp = vibeContext.xp;
  const isVibeRushSignup = vibeContext.source === "vibe-rush";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const nextContext = {
      source: params.get("source") ?? "",
      email: params.get("email") ?? "",
      vibes: params.get("vibes") ?? "",
      xp: params.get("xp") ?? "",
    };
    setVibeContext(nextContext);

    if (nextContext.email) {
      setEmail(nextContext.email);
    }
  }, []);

  const persistenceLabel =
    persistence.mode === "remote"
      ? persistence.phase === "saving"
        ? "Salvataggio in corso"
        : persistence.phase === "error"
          ? "Salvataggio in pausa"
          : "Selezione sincronizzata"
      : "Salvato su questo dispositivo";
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
    ? "Stiamo collegando salvati, confronto e note all'account corrente senza perdere il lavoro già fatto."
    : account.status === "authenticated"
      ? "La selezione è agganciata all'account e resta pronta quando torni da un altro browser o da una nuova sessione."
      : account.authEnabled
        ? "La selezione esiste già e può essere collegata con una mail di conferma senza ricominciare da zero."
        : "La selezione resta in questo browser finché l'accesso email non viene attivato.";
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
    const metadata = isVibeRushSignup
      ? {
          source: "vibe-rush",
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
          vibe_score: vibeScore ? Number(vibeScore) : 0,
          vibe_xp: vibeXp ? Number(vibeXp) : 0,
        }
      : undefined;
    const result = await account.sendMagicLink(email, metadata);

    if (result.ok) {
      setEmail("");
      setFirstName("");
      setLastName("");
      setPhone("");
    }
  };

  return (
    <>
      <AccountVibesBackground />
      <div className="tone-account relative z-10 space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        {/* Hero */}
        <div className="account-hero p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="account-status-badge">Account</span>
          <span className="account-status-badge">
            {account.isAttaching ? "Collegamento in corso" : accountStateLabel}
          </span>
        </div>
        <h1 className="account-title mt-5 max-w-[22ch]">
          Il tuo spazio personale TooolVibes
        </h1>
        <p className="account-subtitle mt-4 max-w-[44rem]">
          Qui capisci se la selezione resta solo in questo browser o segue il tuo account, cosa sblocca l&apos;accesso riservato e da dove conviene ripartire.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {account.status === "authenticated" ? (
            <>
              <Link
                href={workspace.compare > 1 ? "/compare" : "/shortlist"}
                className="account-btn-primary"
              >
                <ArrowRight size={16} />
                {workspace.compare > 1 ? "Continua il confronto" : "Apri i salvati"}
              </Link>
              <Link href="/collections" className="account-link">
                Apri le raccolte
                <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <>
              <Link href="#account-upgrade" className="account-btn-primary">
                <Mail size={16} />
                Continua con email
              </Link>
              <Link href="/collections" className="account-link">
                Vedi raccolte e anteprime
                <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} />
            {persistenceLabel}
          </span>
          <span style={{ color: "var(--line-strong)" }}>·</span>
          <span className="inline-flex items-center gap-1.5">
            <Save size={14} />
            {workspace.saved} tool salvati
          </span>
          <span style={{ color: "var(--line-strong)" }}>·</span>
          <span className="inline-flex items-center gap-1.5">
            <GitCompare size={14} />
            {workspace.compare} nel confronto
          </span>
        </div>
      </div>

      {/* Editorial grid */}
      <div className="editorial-grid gap-y-5">
        {/* Left column */}
        <section className="col-span-12 space-y-5 lg:col-span-7">
          {/* Stato attuale */}
          <div className="account-section-panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-[var(--accent-purple)]" />
              <p className="account-label">Stato attuale</p>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="account-stat-card p-5">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-[var(--accent-purple)]" />
                  <p className="account-label">Modalità</p>
                </div>
                <p className="account-stat-value mt-3">{accountStateLabel}</p>
              </div>
              <div className="account-stat-card p-5">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-[var(--accent-purple)]" />
                  <p className="account-label">Continuità</p>
                </div>
                <p className="account-stat-value mt-3">
                  {account.isAttaching
                    ? "Collegamento in corso"
                    : account.status === "authenticated"
                      ? "Account agganciato"
                      : "Sessione pronta da collegare"}
                </p>
              </div>
            </div>
          </div>

          {/* Accesso riservato */}
          <div className="account-meta-block p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="account-status-badge">Accesso riservato</span>
              <span className="account-status-badge">{premiumMeta.short_label}</span>
            </div>
            <p className="account-title mt-4 max-w-[20ch] text-[1.5rem] sm:text-[1.7rem]">
              {premiumMeta.label}
            </p>
            <p className="account-subtitle mt-3">
              {premiumMeta.description}
            </p>
            <p className="mt-3 text-[0.9rem] leading-7" style={{ color: "var(--muted)" }}>
              {workspace.saved > 0
                ? `Hai già ${workspace.saved} tool salvati: account e premium servono a dare continuità e accesso, non a rimettere in discussione la selezione.`
                : "Qui si chiarisce il rapporto tra accesso, anteprime e raccolte riservate senza aggiungere frizione inutile."}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href={premiumActionHref} className="account-btn-secondary">
                {premiumActionLabel}
              </Link>
              <Link href="/collections" className="account-link">
                Vedi raccolte e anteprime
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Account connesso / Registrati */}
          {account.status === "authenticated" ? (
            <div className="account-section-panel p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[var(--success)]" />
                <p className="account-label">Account connesso</p>
              </div>
              <p className="account-subtitle mt-3">
                {account.user?.email ?? "Account attivo"} è collegato alla selezione corrente. I
                tool salvati, il confronto e le note sono rimasti al loro posto.
              </p>
              <p className="mt-3 text-[0.9rem] leading-7" style={{ color: "var(--muted)" }}>
                {continuityCopy}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void account.signOut()}
                  className="account-btn-secondary"
                >
                  <LogOut size={16} />
                  Esci dall&apos;account
                </button>
              </div>
            </div>
          ) : (
            <form
              id="account-upgrade"
              onSubmit={handleSubmit}
              className="account-section-panel p-5 sm:p-6"
            >
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-[var(--accent-purple)]" />
                <p className="account-label">
                  {isVibeRushSignup ? "Salva Vibe Rush" : "Continua con email"}
                </p>
              </div>
              <p className="account-subtitle mt-3">
                {isVibeRushSignup
                  ? `Completa il profilo e ti mandiamo la mail di conferma con il riepilogo: ${vibeScore || 0} vibe raccolti, ${vibeXp || 0} XP.`
                  : "Ti mandiamo una mail di conferma. Quando entri, la selezione viene collegata senza perdere ciò che hai già salvato."}
              </p>
              <p className="mt-3 text-[0.88rem] leading-7" style={{ color: "var(--muted)" }}>
                {continuityCopy}
              </p>
              {isVibeRushSignup ? (
                <>
                  <p className="mt-3 text-[0.88rem] leading-7 font-semibold" style={{ color: "var(--accent-strong)" }}>
                    Riepilogo partita: {vibeScore ?? 0} vibe raccolti, {vibeXp ?? 0} XP.
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="Nome"
                      className="account-input"
                      required
                    />
                    <input
                      type="text"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder="Cognome"
                      className="account-input"
                      required
                    />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="Telefono (opzionale)"
                      className="account-input sm:col-span-2"
                    />
                  </div>
                </>
              ) : null}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nome@email.com"
                  className="account-input"
                />
                <button
                  type="submit"
                  disabled={account.isSendingLink || !account.authEnabled}
                  className="account-btn-primary disabled:cursor-default disabled:opacity-60 shrink-0"
                >
                  {account.isSendingLink
                    ? (
                      <>
                        <Sparkles size={16} className="animate-spin" />
                        Invio...
                      </>
                    )
                    : isVibeRushSignup
                      ? "Registrati"
                      : "Invia link"}
                </button>
              </div>
              <p className="mt-3 text-[0.72rem] uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                {account.authEnabled
                  ? isVibeRushSignup
                    ? "Conferma la mail per salvare la partita e ritrovare il tuo progresso."
                    : "Conferma la mail per entrare e ritrovare la tua selezione."
                  : account.status === "loading"
                    ? "Prepariamo l'accesso sicuro..."
                    : "Accesso email non disponibile in questo momento."}
              </p>
            </form>
          )}

          {account.authMessage ? (
            <div
              className={`account-message ${account.authMessage?.includes("non disponibile") || account.authMessage?.includes("pausa") || account.authMessage?.includes("errore") ? "account-message--warning" : "account-message--success"}`}
              style={authMessageTone}
            >
              <p className="text-sm leading-6">{account.authMessage}</p>
            </div>
          ) : null}
        </section>

        {/* Right column */}
        <aside className="col-span-12 space-y-5 lg:col-span-5">
          {/* La tua selezione */}
          <div className="account-section-panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-[var(--accent-purple)]" />
              <p className="account-label">La tua selezione</p>
            </div>
            <h2 className="account-title mt-3 text-[1.3rem] sm:text-[1.5rem]">
              La selezione che hai già costruito resta leggibile.
            </h2>
            <p className="account-subtitle mt-3">
              La pagina account non serve solo per entrare: rende visibile quanta selezione reale hai già costruito e da dove conviene ripartire adesso.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { label: "Salvati", value: workspace.saved, detail: "tool salvati", icon: Save },
                { label: "Confronto", value: workspace.compare, detail: "profili da confrontare", icon: GitCompare },
                { label: "Priorità alta", value: workspace.top, detail: "priorità alte", icon: Star },
                { label: "Da rivedere", value: workspace.review, detail: "tool ancora aperti", icon: RotateCcw },
              ].map((item) => (
                <div key={item.label} className="account-selection-card p-4">
                  <div className="flex items-center gap-2">
                    <item.icon size={14} className="text-[var(--accent-purple)]" />
                    <p className="account-label">{item.label}</p>
                  </div>
                  <p className="account-number mt-3">{item.value}</p>
                  <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={workspace.saved > 0 ? "/shortlist" : "/archivio"}
                className="account-btn-secondary"
              >
                <BookOpen size={16} />
                {workspace.saved > 0 ? `Apri salvati (${workspace.saved})` : "Inizia dal catalogo"}
              </Link>
              <Link
                href={workspace.compare > 1 ? "/compare" : "/archivio"}
                className="account-link"
              >
                {workspace.compare > 1 ? "Continua il confronto" : "Aggiungi candidati"}
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Percorso di continuità — dark */}
          <div className="account-journey-panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-white/70" />
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/60">
                Percorso di continuità
              </p>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="account-journey-step px-4 py-4">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/50">
                  1. Sessione locale
                </p>
                <p className="mt-2 text-sm leading-6 text-white/85">
                  Continui a esplorare e salvare tool senza attrito iniziale.
                </p>
              </div>
              <div className="account-journey-step px-4 py-4">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/50">
                  2. Mail di conferma
                </p>
                <p className="mt-2 text-sm leading-6 text-white/85">
                  Colleghi l&apos;email con un passaggio minimo, senza schermate pesanti.
                </p>
              </div>
              <div className="account-journey-step px-4 py-4">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/50">
                  3. Collegamento sicuro
                </p>
                <p className="mt-2 text-sm leading-6 text-white/85">
                  Salvati, confronto, note e priorità vengono agganciati all&apos;account
                  senza perdere il contesto costruito in questo browser.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
    </>
  );
}
