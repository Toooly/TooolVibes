import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  BadgeDollarSign,
  Boxes,
  FileText,
  Flag,
  Gamepad2,
  Layers3,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Tags,
  Users,
  Wrench,
} from "lucide-react";

import { SectionHeader } from "@/components/ui/section-header";
import { getAffiliateRequestsRuntime } from "@/lib/admin/affiliate-request-queries";
import { getAffiliateRuntime } from "@/lib/admin/affiliate-queries";
import { getAdminArticlesRuntime } from "@/lib/admin/article-queries";
import { getAdminCollectionsRuntime } from "@/lib/admin/collection-queries";
import { getSuggestionsRuntime } from "@/lib/admin/suggestion-queries";
import { getAdminToolsRuntime, isSupabaseAdminEnabled } from "@/lib/admin/tool-queries";
import { getAdminActivity } from "@/lib/admin/admin-activity";
import { campaignBucket } from "@/lib/admin/campaign-schedule";
import { getManagedCampaigns } from "@/lib/sponsors/commercial-overrides";
import { getMonetizationPlacementStats } from "@/lib/monetization/placements";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";

type AdminDashboardPageProps = {
  searchParams: Promise<{ status?: string }>;
};

type CountKey =
  | "viewer_profiles"
  | "game_profiles"
  | "game_missions"
  | "badges"
  | "shop_products"
  | "sponsorship_placements";

async function readAdminCount(table: CountKey) {
  if (!isSupabaseAdminEnabled()) {
    return null;
  }

  try {
    const client = createAdminSupabaseClient();
    const { count, error } = await client
      .from(table)
      .select("id", { count: "exact", head: true });

    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

function StatusChip({
  tone,
  children,
}: {
  tone: "ready" | "partial" | "missing";
  children: ReactNode;
}) {
  const styles = {
    ready: {
      borderColor: "rgba(57,210,246,0.28)",
      background: "rgba(57,210,246,0.1)",
      color: "#9eefff",
    },
    partial: {
      borderColor: "rgba(243,191,76,0.3)",
      background: "rgba(243,191,76,0.1)",
      color: "#f3bf4c",
    },
    missing: {
      borderColor: "rgba(255,82,82,0.28)",
      background: "rgba(255,82,82,0.1)",
      color: "#ffb6b6",
    },
  }[tone];

  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]"
      style={styles}
    >
      {children}
    </span>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <article
      className="rounded-[24px] border p-5"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.045)",
      }}
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-white/58">{detail}</p>
    </article>
  );
}

function AdminAreaCard({
  href,
  title,
  description,
  value,
  meta,
  icon: Icon,
  tone,
  cta = "Apri area",
}: {
  href?: string;
  title: string;
  description: string;
  value: string;
  meta: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  tone: "ready" | "partial" | "missing";
  cta?: string;
}) {
  const card = (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border p-5 transition duration-200 hover:-translate-y-1"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        background:
          "radial-gradient(circle at 90% 0%, rgba(57,210,246,0.1), transparent 30%), linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.035))",
        boxShadow: "0 18px 50px rgba(0,0,0,0.2)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/8 text-white">
          <Icon size={18} />
        </span>
        <StatusChip tone={tone}>
          {tone === "ready" ? "Attivo" : tone === "partial" ? "Parziale" : "Da creare"}
        </StatusChip>
      </div>
      <h2 className="mt-5 text-[1.35rem] font-semibold leading-tight text-white">{title}</h2>
      <p className="mt-3 flex-1 text-sm leading-6 text-white/62">{description}</p>
      <div className="mt-5 rounded-[20px] border border-white/8 bg-white/[0.045] px-4 py-3">
        <p className="text-2xl font-semibold text-white">{value}</p>
        <p className="mt-1 text-xs leading-5 text-white/48">{meta}</p>
      </div>
      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#9eefff]">
        {href ? cta : "In roadmap"}
        {href ? <Sparkles size={14} className="transition group-hover:translate-x-0.5" /> : null}
      </div>
    </article>
  );

  if (!href) return card;

  return (
    <Link href={href} className="block h-full">
      {card}
    </Link>
  );
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  await searchParams;

  const [
    toolsRuntime,
    articlesRuntime,
    collectionsRuntime,
    suggestionsRuntime,
    affiliateRequestsRuntime,
    affiliateRuntime,
    viewerCount,
    gameProfileCount,
    gameMissionCount,
    badgeCount,
    shopProductCount,
    sponsorshipPlacementCount,
  ] = await Promise.all([
    getAdminToolsRuntime(),
    getAdminArticlesRuntime(),
    getAdminCollectionsRuntime(),
    getSuggestionsRuntime(),
    getAffiliateRequestsRuntime(),
    getAffiliateRuntime(),
    readAdminCount("viewer_profiles"),
    readAdminCount("game_profiles"),
    readAdminCount("game_missions"),
    readAdminCount("badges"),
    readAdminCount("shop_products"),
    readAdminCount("sponsorship_placements"),
  ]);

  const publishedTools = toolsRuntime.tools.filter((tool) => tool.is_published).length;
  const draftTools = toolsRuntime.tools.length - publishedTools;
  const publishedArticles = articlesRuntime.articles.filter((article) => article.status === "published").length;
  const openSuggestions = suggestionsRuntime.pendingCount;
  const openAffiliateRequests =
    affiliateRequestsRuntime.pendingCount + affiliateRequestsRuntime.reviewingCount;
  const activeAffiliateLinks = affiliateRuntime.activeCount;
  const monetizationStats = getMonetizationPlacementStats();
  const activity = getAdminActivity(8);
  const endingCampaigns = getManagedCampaigns().filter((campaign) => campaignBucket(campaign) === "ending");
  const collectionPublicCount = collectionsRuntime.collections.filter(
    (collection) => collection.editorial_state === "published" || collection.editorial_state === "featured",
  ).length;
  const platformIssues = [
    !toolsRuntime.canWrite ? "Tool in sola lettura" : null,
    !articlesRuntime.canWrite ? "Articoli in sola lettura" : null,
    !collectionsRuntime.canWrite ? "Raccolte in sola lettura" : null,
    openSuggestions > 0 ? `${openSuggestions} suggerimenti aperti` : null,
    openAffiliateRequests > 0 ? `${openAffiliateRequests} richieste affiliate aperte` : null,
    endingCampaigns.length > 0 ? `${endingCampaigns.length} campagne in scadenza` : null,
  ].filter(Boolean);

  return (
    <div className="page-shell py-8 sm:py-10">
      <div className="space-y-6">
        
        {activity.length > 0 ? (
          <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">Attività recente</p>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              {activity.map((event) => (
                <li key={event.at + event.action}>{event.action} · {event.entity}{event.id ? ` · ${event.id}` : ""}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section
          className="relative overflow-hidden rounded-[32px] border p-6 text-white sm:p-8"
          style={{
            borderColor: "rgba(255,255,255,0.09)",
            background:
              "radial-gradient(circle at 82% 10%, rgba(57,210,246,0.15), transparent 30%), radial-gradient(circle at 5% 0%, rgba(106,60,255,0.2), transparent 34%), linear-gradient(145deg, rgba(18,13,46,0.98), rgba(7,6,18,0.98))",
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <SectionHeader
              eyebrow="Control Center"
              title="Da gestire oggi"
              description="Coda operativa del back office: suggerimenti, bozze, affiliate e stato di scrittura. Solo dati reali del sistema."
              invert
            />
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/tools/new"
                className="rounded-full bg-white px-4 py-2.5 text-sm font-bold text-[#160d3d]"
              >
                Nuovo tool
              </Link>
              <Link
                href="/admin/articles/new"
                className="rounded-full border border-white/14 bg-white/8 px-4 py-2.5 text-sm font-bold text-white"
              >
                Nuovo articolo
              </Link>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Tool" value={toolsRuntime.tools.length} detail={`${publishedTools} pubblicati, ${draftTools} bozze`} />
            <MetricCard label="Contenuti" value={articlesRuntime.articles.length} detail={`${publishedArticles} pubblicati nel blog/guide`} />
            <MetricCard label="Submission" value={openSuggestions} detail="Suggerimenti tool ancora da gestire" />
            <MetricCard label="Utenti gioco" value={gameProfileCount ?? "-"} detail="Profili con progressione XP rilevati" />
          </div>

          <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.045] p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                  Cosa richiede attenzione
                </p>
                <p className="mt-1 text-sm text-white/58">
                  Coda operativa derivata dai dati reali del back office.
                </p>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
                {platformIssues.length > 0
                  ? `${platformIssues.length} punti aperti`
                  : "Coda vuota"}
              </p>
            </div>
            {platformIssues.length > 0 ? (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {openSuggestions > 0 ? (
                  <li>
                    <Link
                      href="/admin/suggestions"
                      className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-[rgba(57,210,246,0.22)] bg-[rgba(57,210,246,0.08)] px-3.5 py-2.5 text-sm font-semibold text-[#9eefff] transition-colors hover:bg-[rgba(57,210,246,0.14)]"
                    >
                      <span>{openSuggestions} suggerimenti aperti</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ) : null}
                {openAffiliateRequests > 0 ? (
                  <li>
                    <Link
                      href="/admin/affiliates"
                      className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-[rgba(243,191,76,0.24)] bg-[rgba(243,191,76,0.08)] px-3.5 py-2.5 text-sm font-semibold text-[#f3bf4c] transition-colors hover:bg-[rgba(243,191,76,0.14)]"
                    >
                      <span>{openAffiliateRequests} richieste affiliate</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ) : null}
                {draftTools > 0 ? (
                  <li>
                    <Link
                      href="/admin/tools"
                      className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm font-semibold text-white/85 transition-colors hover:bg-white/[0.07]"
                    >
                      <span>{draftTools} tool in bozza</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ) : null}
                {!toolsRuntime.canWrite || !articlesRuntime.canWrite || !collectionsRuntime.canWrite ? (
                  <li className="rounded-2xl border border-[rgba(255,82,82,0.22)] bg-[rgba(255,82,82,0.08)] px-3.5 py-2.5 text-sm font-semibold text-[#ffb6b6]">
                    Una o più aree sono in sola lettura
                  </li>
                ) : null}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-6 text-white/68">
                Nessun blocco operativo evidente. Puoi proseguire con tool, contenuti o monetizzazione.
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AdminAreaCard
            href="/admin/tools"
            title="Tool"
            description="Inventario, pubblicazione, featured e schede del catalogo. Questa e' la base del prodotto."
            value={`${publishedTools}/${toolsRuntime.tools.length}`}
            meta="Tool pubblicati rispetto al totale"
            icon={Wrench}
            tone={toolsRuntime.canWrite ? "ready" : "partial"}
          />
          <AdminAreaCard
            href="/admin/articles"
            title="Guide e articoli"
            description="Blog, guide e write-up editoriali con stato bozza/pubblicato e media."
            value={String(articlesRuntime.articles.length)}
            meta={`${articlesRuntime.canWrite ? "Scrittura attiva" : "Sola lettura"}`}
            icon={FileText}
            tone={articlesRuntime.canWrite ? "ready" : "partial"}
          />
          <AdminAreaCard
            href="/admin/collections"
            title="Raccolte"
            description="Collection editoriali, slot tool, stati, conflitti e riallineamenti sicuri."
            value={`${collectionPublicCount}/${collectionsRuntime.collections.length}`}
            meta="Raccolte pubbliche rispetto al totale"
            icon={Layers3}
            tone={collectionsRuntime.canWrite ? "ready" : "partial"}
          />
          <AdminAreaCard
            href="/admin/suggestions"
            title="Submission tool"
            description="Richieste degli utenti: revisione, approvazione e conversione in tool."
            value={String(openSuggestions)}
            meta="Richieste aperte"
            icon={Flag}
            tone={suggestionsRuntime.canWrite ? "ready" : "partial"}
          />
          <AdminAreaCard
            href="/admin/affiliates"
            title="Richieste affiliate"
            description="Candidature, decisioni, referral code e QR code per affiliati."
            value={String(openAffiliateRequests)}
            meta="Candidature aperte"
            icon={BadgeDollarSign}
            tone={affiliateRequestsRuntime.canWrite ? "ready" : "partial"}
          />
          <AdminAreaCard
            href="/admin/affiliate-links"
            title="Link affiliati"
            description="Link outbound dei tool, tracking UTM, attivazione e disattivazione."
            value={String(activeAffiliateLinks)}
            meta="Link attivi"
            icon={Megaphone}
            tone={affiliateRuntime.canWrite ? "ready" : "partial"}
          />
          <AdminAreaCard
            title="Utenti"
            description="Serve una console per profili, workspace, supporto, stato account e moderazione."
            value={viewerCount === null ? "-" : String(viewerCount)}
            meta="Viewer/account rilevati"
            icon={Users}
            tone="missing"
          />
          <AdminAreaCard
            title="Gamification"
            description="Serve gestione di XP, missioni, badge, leaderboard, storico minigame e reward."
            value={gameMissionCount === null ? "-" : `${gameMissionCount} missioni`}
            meta={badgeCount === null ? "Badge non rilevati" : `${badgeCount} badge configurati`}
            icon={Gamepad2}
            tone="partial"
          />
          <AdminAreaCard
            title="Categorie"
            description="Oggi sono taxonomy statica e stringhe sui tool. Serve CRUD per ordine, icone, colori e SEO."
            value="-"
            meta="Modello dati assente"
            icon={Tags}
            tone="missing"
          />
          <AdminAreaCard
            title="Founder request"
            description="Serve un flusso dedicato per richieste founder, partnership o supporto strategico."
            value="-"
            meta="Modello dati assente"
            icon={ShieldCheck}
            tone="missing"
          />
          <AdminAreaCard
            href="/admin/monetization"
            title="Sponsorship e listing"
            description="Inventory placement, pacchetti nativi e superfici pronte per sponsor, banner, listing e founder pack."
            value={`${monetizationStats.visible}/${monetizationStats.total}`}
            meta={
              sponsorshipPlacementCount === null
                ? `${monetizationStats.reserved} prenotabili, ${monetizationStats.planned} pianificati`
                : `${sponsorshipPlacementCount} placement nel database`
            }
            icon={Sparkles}
            tone="partial"
          />
          <AdminAreaCard
            title="Shop digitale"
            description="La pagina shop e' pubblica, ma mancano prodotti, ordini, download, coupon ed entitlement."
            value={shopProductCount === null ? "-" : String(shopProductCount)}
            meta="Prodotti digitali"
            icon={Boxes}
            tone="missing"
          />
        </section>
      </div>
    </div>
  );
}
