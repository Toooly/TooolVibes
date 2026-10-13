import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";

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
        <p className="admin-kicker"><LocalizedText>{"Oggi"}</LocalizedText></p>
        <div className="admin-overview__top">
          <h1 className="admin-overview__title"><LocalizedText>{"Cosa richiede attenzione"}</LocalizedText></h1>
          <div className="admin-overview__cta">
            <Link href="/admin/tools/new" className="admin-overview__primary"><LocalizedText>{"Nuovo tool "}</LocalizedText></Link>
            <Link href="/admin/articles/new" className="admin-overview__secondary"><LocalizedText>{"Nuova guida "}</LocalizedText></Link>
          </div>
        </div>

        {readOnly ? (
          <p className="admin-note admin-note--warn"><LocalizedText>{"Una o più aree sono in sola lettura."}</LocalizedText></p>
        ) : null}

        {queue.length > 0 ? (
          <ul className="admin-queue">
            {queue.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="admin-queue__item">
                  <span><LocalizedText>{item.label}</LocalizedText></span>
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="admin-overview__empty"><LocalizedText>{"Nessun blocco operativo. Puoi creare o rivedere i contenuti."}</LocalizedText></p>
        )}
      </header>

      {activity.length > 0 ? (
        <section className="admin-activity">
          <p className="admin-kicker"><LocalizedText>{"Attività recente"}</LocalizedText></p>
          <ul>
            {activity.map((event) => (
              <li key={event.at + event.action}>
                <LocalizedText>{event.action}</LocalizedText> · <LocalizedText>{event.entity}</LocalizedText>
                {event.id ? ` · ${event.id}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <LocalizedAttributes><nav className="admin-destinations" aria-label="Aree operative">
        {destinations.map((item) => (
          <Link key={item.href} href={item.href} className="admin-destinations__item">
            <LocalizedText>{item.label}</LocalizedText>
          </Link>
        ))}
      </nav></LocalizedAttributes>
    </div>
  );
}
