"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  GitCompare,
  Layers,
  LogOut,
  Mail,
  RotateCcw,
  Save,
  Send,
  Settings,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import NumberFlow from "@number-flow/react";

import { useAccount } from "@/components/account/account-provider";
import { AccountVibesBackground } from "@/components/account/account-vibes-background";
import { useDiscoveryPersistence } from "@/components/discovery/canonical-discovery-persistence-provider";
import { GameMissionPanel } from "@/components/gamification/game-mission-panel";
import { GameProfileBar } from "@/components/gamification/game-profile-bar";
import { VibeTapMiniGame } from "@/components/gamification/vibe-tap-mini-game";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import { useDiscoverySnapshot } from "@/lib/discovery/client-store";
import type { DiscoveryLocalSnapshot } from "@/lib/discovery/local-storage";
import { useGameProgressStore } from "@/lib/gamification/game-progress-store";
import { useBadges } from "@/lib/gamification/hooks/use-badges";
import { useGameProfile } from "@/lib/gamification/hooks/use-game-profile";
import {
  useGamificationReleaseSummary,
  useGamificationSurface,
} from "@/lib/gamification/release-context";
import { xpProgressInLevel } from "@/lib/gamification/level-utils";
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

type AccountSubmissionsPayload = {
  toolRequests: Array<{
    id: string;
    tool_name: string;
    tool_url: string;
    submitter_type?: "community" | "founder";
    status: string;
    created_at: string;
  }>;
  affiliateRequests: Array<{
    id: string;
    brand_name: string | null;
    status: string;
    referral_url: string | null;
    created_at: string;
  }>;
  remoteAvailable: boolean;
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
  const toolCatalog = usePublicToolCatalog();
  const persistence = useDiscoveryPersistence();
  const discovery = useDiscoverySnapshot();
  const { hasRewardedSurface, firstRewardedSurface } =
    useGamificationReleaseSummary();
  const missionsRelease = useGamificationSurface("missions");
  const vibeRushRelease = useGamificationSurface("vibeRush");
  const { profile: gameProfile, isLoading: isGameProfileLoading } =
    useGameProfile({ enabled: hasRewardedSurface });
  const { badges } = useBadges(firstRewardedSurface ?? "missions", {
    enabled: hasRewardedSurface,
  });
  const localXp = useGameProgressStore((state) => state.totalXp);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [submissions, setSubmissions] = useState<AccountSubmissionsPayload | null>(null);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [vibeRushBest, setVibeRushBest] = useState(0);
  const [vibeContext, setVibeContext] = useState({
    source: "",
    email: "",
    vibes: "",
    xp: "",
  });
  const workspace = useMemo(() => readWorkspaceSnapshot(discovery), [discovery]);
  const savedToolCards = useMemo(() => {
    return discovery.shortlist
      .map((slug) => {
        const tool = toolCatalog.find((item) => item.slug === slug);
        const memory = discovery.decisionMemories[slug];

        return {
          slug,
          name: tool?.name ?? slug,
          category: tool?.categoryLabel ?? "Tool",
          description: tool?.shortDescription ?? "Tool salvato nella tua selezione.",
          stage: discovery.shortlistStages[slug] ?? "saved",
          pinned: Boolean(memory?.is_pinned),
          note: memory?.note ?? "",
        };
      })
      .slice(0, 4);
  }, [discovery.decisionMemories, discovery.shortlist, discovery.shortlistStages, toolCatalog]);
  const recommendedTools = useMemo(() => {
    const savedSlugs = new Set(discovery.shortlist);
    const savedCategories = new Set(
      savedToolCards.map((tool) => tool.category).filter(Boolean),
    );

    return toolCatalog
      .filter((tool) => !savedSlugs.has(tool.slug))
      .filter((tool) => savedCategories.size === 0 || savedCategories.has(tool.categoryLabel))
      .slice(0, 3);
  }, [discovery.shortlist, savedToolCards, toolCatalog]);
  const vibeScore = vibeContext.vibes;
  const vibeXp = vibeContext.xp;
  const isVibeRushSignup = vibeContext.source === "vibe-rush";
  const gameXp = Math.max(gameProfile?.xp ?? 0, localXp);
  const gameLevel = gameProfile?.level ?? 1;
  const gameStreak = gameProfile?.streak_days ?? 0;
  const { current: currentLevelXp, needed: neededLevelXp } = xpProgressInLevel(gameXp);
  const gameProgressPercent = Math.min(
    100,
    Math.max(0, Math.round((currentLevelXp / neededLevelXp) * 100)),
  );
  const totalSubmissions =
    (submissions?.toolRequests.length ?? 0) + (submissions?.affiliateRequests.length ?? 0);

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

    const storedBest = Number(window.localStorage.getItem("tooolvibes:vibe-rush-best") ?? "0");
    if (Number.isFinite(storedBest)) {
      setVibeRushBest(storedBest);
    }
  }, []);

  useEffect(() => {
    if (account.status !== "authenticated" || !account.session?.access_token) {
      setSubmissions(null);
      return;
    }

    let isActive = true;
    setSubmissionsLoading(true);

    fetch("/api/account/submissions", {
      headers: {
        Authorization: `Bearer ${account.session.access_token}`,
      },
    })
      .then((response) => response.json())
      .then((payload: AccountSubmissionsPayload) => {
        if (isActive) {
          setSubmissions(payload);
        }
      })
      .catch(() => {
        if (isActive) {
          setSubmissions({
            toolRequests: [],
            affiliateRequests: [],
            remoteAvailable: false,
          });
        }
      })
      .finally(() => {
        if (isActive) {
          setSubmissionsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [account.session?.access_token, account.status]);

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
    : account.workspaceAttachPending
      ? "La selezione resta disponibile in questo browser. La sincronizzazione online è in attesa; i dati locali non vengono spostati o cancellati."
    : account.status === "authenticated"
      ? "La selezione è agganciata all'account e resta pronta quando torni da un altro browser o da una nuova sessione."
      : account.authEnabled
        ? "La selezione esiste già e può essere collegata con una mail di conferma senza ricominciare da zero."
        : "La selezione resta in questo browser finché l'accesso email non viene attivato.";
  const authMessageTone =
    account.authMessage?.includes("non disponibile") ||
    account.authMessage?.includes("pausa") ||
    account.authMessage?.includes("supera il limite") ||
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
            {account.isAttaching
              ? "Collegamento in corso"
              : account.workspaceAttachPending
                ? "Sync in attesa"
                : accountStateLabel}
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
          {hasRewardedSurface ? (
            <>
          <div className="account-game-panel p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="account-status-badge">Gamification</span>
                  <span className="account-status-badge">Punti reali</span>
                </div>
                <h2 className="account-title mt-4 text-[1.55rem] sm:text-[1.9rem]">
                  Gioca, accumula XP, sblocca reward.
                </h2>
                <p className="account-subtitle mt-3 max-w-[42rem]">
                  I minigame tornano dentro l&apos;esperienza utente: ogni run completata da loggato salva XP nel profilo e alimenta livello, missioni e badge.
                </p>
              </div>
              <GameProfileBar className="account-game-panel__profile" />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="account-game-stat">
                <span>Livello</span>
                <strong>
                  <NumberFlow value={gameLevel} />
                </strong>
              </div>
              <div className="account-game-stat">
                <span>XP totali</span>
                <strong>
                  <NumberFlow value={gameXp} />
                </strong>
              </div>
              <div className="account-game-stat">
                <span>Reward</span>
                <strong>
                  <NumberFlow value={badges.length} />
                </strong>
              </div>
            </div>

            <div className="account-game-meter mt-4" aria-label={`${gameProgressPercent}% verso il prossimo livello`}>
              <span style={{ width: `${gameProgressPercent}%` }} />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {vibeRushRelease.persistentRewardsEnabled && (
                <VibeTapMiniGame className="account-game-launcher" badge="+XP" />
              )}
              <Link href="/radar" className="account-btn-secondary">
                <Target size={16} />
                Missioni Radar
              </Link>
              <Link href="/compare" className="account-link">
                Sfide confronto
                <ArrowRight size={14} />
              </Link>
            </div>

            <p className="mt-4 text-[0.82rem] leading-6" style={{ color: "var(--account-muted)" }}>
              {isGameProfileLoading
                ? "Caricamento progressione..."
                : `Serie attuale: ${gameStreak} giorni. Mancano ${Math.max(0, neededLevelXp - currentLevelXp)} XP al prossimo livello.`}
            </p>
          </div>

          {missionsRelease.persistentRewardsEnabled && (
            <GameMissionPanel
              eyebrow="Missioni giornaliere"
              title="Azioni concrete per guadagnare punti"
              description="Le missioni tengono insieme radar, raccolta tool e progressione: quando sono completate puoi riscattare XP e reward."
              scope="radar"
              variant="radar"
            />
          )}

          <div className="account-section-panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-[var(--accent-purple)]" />
              <p className="account-label">Progressi e attivita</p>
            </div>
            <h2 className="account-title mt-3 text-[1.3rem] sm:text-[1.5rem]">
              I punti devono raccontare cosa stai facendo davvero.
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="account-selection-card p-4">
                <p className="account-label">Best Vibe Rush</p>
                <p className="account-number mt-3">{vibeRushBest}</p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                  Record locale rilevato sul dispositivo.
                </p>
              </div>
              <div className="account-selection-card p-4">
                <p className="account-label">Badge</p>
                <p className="account-number mt-3">{badges.length}</p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                  Reward gia sbloccati sul profilo.
                </p>
              </div>
              <div className="account-selection-card p-4">
                <p className="account-label">Submission</p>
                <p className="account-number mt-3">
                  {submissionsLoading ? "..." : totalSubmissions}
                </p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                  Richieste collegate alla tua email.
                </p>
              </div>
            </div>
          </div>

            </>
          ) : null}
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
                    : account.workspaceAttachPending
                      ? "Locale, sync in attesa"
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
              <p className="mt-3 text-xs uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
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

          {account.hasQuarantinedWorkspace ? (
            <div className="account-section-panel p-5 sm:p-6" role="status">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-[var(--accent-purple)]" aria-hidden="true" />
                <p className="account-label">Backup locale isolato</p>
              </div>
              <p className="account-subtitle mt-3">
                Questa selezione è precedente al sistema di proprietà del browser.
                Non è stata assegnata automaticamente al tuo account. Ripristinala
                solo se riconosci questo dispositivo e il suo contenuto.
              </p>
              <button
                type="button"
                className="account-btn-secondary mt-4 disabled:cursor-default disabled:opacity-60"
                disabled={account.isRestoringQuarantinedWorkspace || account.isAttaching}
                onClick={() => void account.restoreQuarantinedWorkspace()}
              >
                <RotateCcw size={16} aria-hidden="true" />
                {account.isRestoringQuarantinedWorkspace
                  ? "Ripristino in corso..."
                  : "Ripristina nello spazio corrente"}
              </button>
            </div>
          ) : null}

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

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="account-label">Tool salvati recenti</p>
                {workspace.saved > 0 ? (
                  <Link href="/shortlist" className="account-link text-sm">
                    Vedi tutti
                    <ArrowRight size={14} />
                  </Link>
                ) : null}
              </div>
              {savedToolCards.length > 0 ? (
                <div className="grid gap-3">
                  {savedToolCards.map((tool) => (
                    <Link
                      key={tool.slug}
                      href={`/toools/${tool.slug}`}
                      className="account-selection-card block p-4 transition hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--account-ink)]">{tool.name}</p>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                            {tool.category} · {tool.stage === "top" ? "Priorita alta" : tool.stage === "review" ? "Da rivedere" : "Salvato"}
                          </p>
                        </div>
                        {tool.pinned ? <Star size={15} className="shrink-0 text-[var(--accent-purple)]" /> : <ExternalLink size={15} className="shrink-0 text-[var(--muted)]" />}
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                        {tool.note || tool.description}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="account-selection-card p-4">
                  <p className="text-sm leading-6" style={{ color: "var(--muted)" }}>
                    Nessun tool salvato ancora. Parti dal catalogo e questa area diventera la tua base di lavoro.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <p className="account-label">Consigliati per continuare</p>
              <div className="grid gap-2">
                {recommendedTools.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/toools/${tool.slug}`}
                    className="flex items-center justify-between gap-3 rounded-[18px] border px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
                    style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.66)" }}
                  >
                    <span className="min-w-0 truncate">{tool.name}</span>
                    <span className="shrink-0 text-xs uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                      {tool.categoryLabel}
                    </span>
                  </Link>
                ))}
              </div>
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

          <div className="account-section-panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Send size={16} className="text-[var(--accent-purple)]" />
              <p className="account-label">Submission inviate</p>
            </div>
            <h2 className="account-title mt-3 text-[1.3rem] sm:text-[1.5rem]">
              Le richieste non spariscono dopo l&apos;invio.
            </h2>
            <p className="account-subtitle mt-3">
              Quando sei loggato, recuperiamo suggerimenti tool e candidature affiliate collegate alla tua email.
            </p>

            <div className="mt-5 grid gap-3">
              {account.status !== "authenticated" ? (
                <div className="account-selection-card p-4">
                  <p className="text-sm leading-6" style={{ color: "var(--muted)" }}>
                    Accedi per vedere lo stato delle submission associate alla tua email.
                  </p>
                </div>
              ) : submissionsLoading ? (
                <div className="account-selection-card p-4">
                  <p className="text-sm leading-6" style={{ color: "var(--muted)" }}>
                    Caricamento submission...
                  </p>
                </div>
              ) : totalSubmissions > 0 ? (
                <>
                  {submissions?.toolRequests.slice(0, 3).map((request) => (
                    <div key={request.id} className="account-selection-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--account-ink)]">{request.tool_name}</p>
                          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                            {request.submitter_type === "founder" ? "Proposta founder" : "Suggerimento tool"}
                          </p>
                        </div>
                        <span className="account-status-badge">{request.status}</span>
                      </div>
                    </div>
                  ))}
                  {submissions?.affiliateRequests.slice(0, 2).map((request) => (
                    <div key={request.id} className="account-selection-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--account-ink)]">
                            {request.brand_name ?? "Richiesta affiliato"}
                          </p>
                          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                            Programma affiliati
                          </p>
                        </div>
                        <span className="account-status-badge">{request.status}</span>
                      </div>
                      {request.referral_url ? (
                        <a
                          href={request.referral_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="account-link mt-3 text-sm"
                        >
                          Apri referral
                          <ExternalLink size={14} />
                        </a>
                      ) : null}
                    </div>
                  ))}
                </>
              ) : (
                <div className="account-selection-card p-4">
                  <p className="text-sm leading-6" style={{ color: "var(--muted)" }}>
                    Nessuna submission collegata. Quando suggerisci un tool o invii una candidatura, la ritrovi qui.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="account-section-panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-[var(--accent-purple)]" />
              <p className="account-label">Preferenze</p>
            </div>
            <h2 className="account-title mt-3 text-[1.3rem] sm:text-[1.5rem]">
              Il prossimo passo e&apos; personalizzare il ritorno.
            </h2>
            <div className="mt-5 grid gap-3">
              {[
                ["Interessi", workspace.saved > 0 ? `${workspace.saved} segnali dai tool salvati` : "Da costruire"],
                ["Notifiche", account.status === "authenticated" ? "Email collegata" : "Richiede login"],
                ["Shop", "Acquisti digitali in roadmap"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 rounded-[18px] border px-4 py-3"
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.66)" }}
                >
                  <span className="text-sm font-semibold text-[var(--account-ink)]">{label}</span>
                  <span className="text-right text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Percorso di continuità — dark */}
          <div className="account-journey-panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-white/70" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                Percorso di continuità
              </p>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="account-journey-step px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                  1. Sessione locale
                </p>
                <p className="mt-2 text-sm leading-6 text-white/85">
                  Continui a esplorare e salvare tool senza attrito iniziale.
                </p>
              </div>
              <div className="account-journey-step px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                  2. Mail di conferma
                </p>
                <p className="mt-2 text-sm leading-6 text-white/85">
                  Colleghi l&apos;email con un passaggio minimo, senza schermate pesanti.
                </p>
              </div>
              <div className="account-journey-step px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
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
