import Link from "next/link";

import { getAffiliateRequestsRuntime } from "@/lib/admin/affiliate-request-queries";
import { getAdminActivity } from "@/lib/admin/admin-activity";
import { getAdminArticlesRuntime } from "@/lib/admin/article-queries";
import { getAdminCollectionsRuntime } from "@/lib/admin/collection-queries";
import { getSuggestionsRuntime } from "@/lib/admin/suggestion-queries";
import { getAdminToolsRuntime } from "@/lib/admin/tool-queries";
import { campaignBucket } from "@/lib/admin/campaign-schedule";
import { getManagedCampaigns } from "@/lib/sponsors/commercial-overrides";

export default async function AdminDashboardPage() {
  const [
    toolsRuntime,
    articlesRuntime,
    collectionsRuntime,
    suggestionsRuntime,
    affiliateRequestsRuntime,
  ] = await Promise.all([
    getAdminToolsRuntime(),
    getAdminArticlesRuntime(),
    getAdminCollectionsRuntime(),
    getSuggestionsRuntime(),
    getAffiliateRequestsRuntime(),
  ]);

  const draftTools = toolsRuntime.tools.filter((tool) => !tool.is_published).length;
  const openSuggestions = suggestionsRuntime.pendingCount;
  const openAffiliateRequests =
    affiliateRequestsRuntime.pendingCount + affiliateRequestsRuntime.reviewingCount;
  const endingCampaigns = getManagedCampaigns().filter((campaign) => campaignBucket(campaign) === "ending");
  const activity = getAdminActivity(8);
  const readOnly =
    !toolsRuntime.canWrite || !articlesRuntime.canWrite || !collectionsRuntime.canWrite;

  const queue = [
    openSuggestions > 0
      ? { href: "/admin/suggestions", label: `${openSuggestions} suggerimenti aperti` }
      : null,
    openAffiliateRequests > 0
      ? { href: "/admin/affiliates", label: `${openAffiliateRequests} richieste affiliate` }
      : null,
    draftTools > 0 ? { href: "/admin/tools?view=draft", label: `${draftTools} tool in bozza` } : null,
    endingCampaigns.length > 0
      ? { href: "/admin/commercial/campaigns", label: `${endingCampaigns.length} campagne in scadenza` }
      : null,
  ].filter(Boolean) as Array<{ href: string; label: string }>;

  const destinations = [
    { href: "/admin/tools", label: "Tool" },
    { href: "/admin/articles", label: "Guide" },
    { href: "/admin/collections", label: "Raccolte" },
    { href: "/admin/composer", label: "Homepage" },
    { href: "/admin/media", label: "Media" },
    { href: "/admin/commercial/partners", label: "Partner" },
  ];

  return (
    <div className="page-shell py-6 sm:py-8">
      <header className="admin-overview">
        <p className="admin-kicker">Oggi</p>
        <div className="admin-overview__top">
          <h1 className="admin-overview__title">Cosa richiede attenzione</h1>
          <div className="admin-overview__cta">
            <Link href="/admin/tools/new" className="admin-overview__primary">
              Nuovo tool
            </Link>
            <Link href="/admin/articles/new" className="admin-overview__secondary">
              Nuova guida
            </Link>
          </div>
        </div>

        {readOnly ? (
          <p className="admin-note admin-note--warn">Una o più aree sono in sola lettura.</p>
        ) : null}

        {queue.length > 0 ? (
          <ul className="admin-queue">
            {queue.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="admin-queue__item">
                  <span>{item.label}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="admin-overview__empty">Nessun blocco operativo. Puoi creare o rivedere i contenuti.</p>
        )}
      </header>

      {activity.length > 0 ? (
        <section className="admin-activity">
          <p className="admin-kicker">Attività recente</p>
          <ul>
            {activity.map((event) => (
              <li key={event.at + event.action}>
                {event.action} · {event.entity}
                {event.id ? ` · ${event.id}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav className="admin-destinations" aria-label="Aree operative">
        {destinations.map((item) => (
          <Link key={item.href} href={item.href} className="admin-destinations__item">
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
