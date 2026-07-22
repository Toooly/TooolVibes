import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdvancedSpecialIssue } from "@/components/collections/advanced-special-issue";
import { CollectionCard } from "@/components/collections/collection-card";
import { CollectionSlotCard } from "@/components/collections/collection-slot-card";
import { NativePlacement } from "@/components/monetization/native-placement";
import { SectionHeader } from "@/components/ui/section-header";
import { ButtonLink } from "@/components/ui/button";
import { siteConfig } from "@/lib/config/site";
import { getCollectionFormatMeta, hasAdvancedSpecialIssue } from "@/lib/collections/format";
import {
  getCollectionBySlug,
  getCuratedCollections,
  getRelatedCollectionsForSlug,
} from "@/lib/data/public-collections";
import {
  getCollectionAccessMeta,
  getCollectionAudienceDescription,
  getCollectionDifficultyLabel,
  getCollectionThemeLabel,
  getCollectionToneMeta,
} from "@/lib/collections/helpers";
import {
  getCollectionEditorialStateMeta,
  getCollectionSurfaceMeta,
} from "@/lib/collections/editorial";
import { resolveCollectionPremiumAccess } from "@/lib/premium/access";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);

  if (!collection) {
    return {};
  }

  return {
    title: `${collection.title} | ${siteConfig.name}`,
    description: collection.description,
    openGraph: {
      title: `${collection.title} | ${siteConfig.name}`,
      description: collection.description,
      images: [collection.cover_image_url],
    },
  };
}

export async function generateStaticParams() {
  const collections = await getCuratedCollections();
  return collections.map((collection) => ({ slug: collection.slug }));
}

export default async function CollectionDetailPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const [collection, relatedCollections] = await Promise.all([
    getCollectionBySlug(slug),
    getRelatedCollectionsForSlug(slug),
  ]);

  if (!collection) {
    notFound();
  }

  const tone = getCollectionToneMeta(collection.tone);
  const access = getCollectionAccessMeta(collection.access);
  const formatMeta = getCollectionFormatMeta(collection);
  const difficulty = getCollectionDifficultyLabel(collection.difficulty);
  const audienceDescription = getCollectionAudienceDescription(collection.audience);
  const theme = getCollectionThemeLabel(collection.theme);
  const surface = getCollectionSurfaceMeta(collection.surface);
  const editorialState = getCollectionEditorialStateMeta(collection.editorial_state);
  const leadTool = collection.featured_tool_slot?.tool ?? collection.included_tools[0]?.tool ?? null;
  const isAdvancedIssue = hasAdvancedSpecialIssue(collection);
  const premiumAccess = resolveCollectionPremiumAccess(collection.access, {
    surface: collection.surface,
  });
  const hasFullAccess = premiumAccess.has_full_access || premiumAccess.state === "open";
  const visibleHighlights = hasFullAccess
    ? collection.highlights
    : collection.highlights.slice(0, premiumAccess.preview_highlight_limit);
  const visibleSlots = hasFullAccess
    ? collection.included_tools
    : collection.included_tools.slice(0, premiumAccess.preview_tool_limit);
  const hiddenToolCount = Math.max(collection.included_tools.length - visibleSlots.length, 0);
  const hiddenHighlightCount = Math.max(collection.highlights.length - visibleHighlights.length, 0);
  const rationaleBody =
    premiumAccess.state === "locked"
      ? collection.premium_teaser ?? collection.description
      : collection.rationale;
  const boundarySummary =
    hiddenToolCount > 0 || hiddenHighlightCount > 0
      ? `Qui restano fuori ${hiddenToolCount} tool e ${hiddenHighlightCount} punti chiave della versione completa.`
      : "Tutti i moduli della raccolta sono già visibili in questa pagina.";

  return (
    <div className="internal-page internal-collection-page tone-issue page-shell space-y-4 pb-14 pt-6 sm:space-y-6 sm:pb-18 sm:pt-9">
      <section className="brand-panel brand-aura panel-lift section-stage relative overflow-hidden rounded-[36px]">
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),transparent_74%)]" />
        <div className="editorial-grid relative gap-y-0">
          <div className="col-span-12 p-5 sm:p-6 lg:col-span-7 lg:p-7">
            <div
              className="text-meta flex flex-wrap items-center gap-3 text-[0.92rem]"
              style={{ color: "var(--muted)" }}
            >
              <Link href="/collections" className="section-quiet-link">
                Raccolte curate
              </Link>
              <span className="h-1 w-1 rounded-full bg-[var(--line-strong)]" />
              <span>{theme}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="pill selection-chip">{collection.cover_kicker}</p>
              <span
                className="selection-chip rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                style={{
                  background:
                    collection.access !== "open"
                      ? "rgba(249,239,212,0.96)"
                      : "rgba(255,255,255,0.78)",
                  color: "var(--muted-strong)",
                }}
              >
                {premiumAccess.chip_label}
              </span>
              <span className="selection-status">{formatMeta.label}</span>
            </div>

            <p className="mt-6 brand-kicker">
              {isAdvancedIssue ? "Raccolta speciale TooolVibes" : "Raccolta curata TooolVibes"}
            </p>
            <h1 className="text-display-hero mt-2.5 max-w-none text-[2.44rem] sm:max-w-[13.5ch] sm:text-[3.02rem] sm:text-balance lg:max-w-[14ch] lg:text-[3.66rem]">
              {collection.title}
            </h1>
            <p
              className="text-body-soft mt-4.5 max-w-[45rem] text-[0.98rem] sm:text-[1.04rem]"
              style={{ color: "var(--muted-strong)" }}
            >
              {collection.description}
            </p>

            <div className="metadata-block mt-4.5 rounded-[24px] px-4.5 py-4">
              <p className="brand-kicker">
                {premiumAccess.state === "locked" ? "Cosa mostra l'anteprima" : "Tesi curatoriale"}
              </p>
              <p
                className="text-body-strong mt-2.5 text-[0.98rem] sm:text-[1.02rem]"
                style={{ color: "var(--muted-strong)" }}
              >
                {rationaleBody}
              </p>
            </div>

            <p className="mt-4 text-[0.88rem] leading-6" style={{ color: "var(--muted)" }}>
              {hasFullAccess
                ? `Tool guida: ${leadTool?.name ?? "nessuno esplicito"} · ${visibleSlots.length}/${collection.included_tools.length} tool leggibili in questa pagina.`
                : boundarySummary}
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {leadTool ? (
                <ButtonLink href={`/toools/${leadTool.slug}`}>
                  {premiumAccess.state === "open" || premiumAccess.state === "unlocked"
                    ? "Apri il tool guida"
                    : "Apri il tool in anteprima"}
                </ButtonLink>
              ) : null}
              {premiumAccess.state !== "open" && premiumAccess.state !== "unlocked" ? (
                <Link
                  href={premiumAccess.upgrade_href}
                  className="section-quiet-link text-sm font-semibold"
                  style={{ color: "var(--accent-strong)" }}
                >
                  {premiumAccess.upgrade_label}
                </Link>
              ) : (
                <Link
                  href="/compare"
                  className="section-quiet-link text-sm font-semibold"
                  style={{ color: "var(--accent-strong)" }}
                >
                  Apri confronto
                </Link>
              )}
            </div>
            {premiumAccess.state === "open" || premiumAccess.state === "unlocked" ? null : (
              <div className="mt-3">
                <Link
                  href="/account#member-access"
                  className="section-quiet-link text-sm font-semibold"
                  style={{ color: "var(--muted)" }}
                >
                  Apri account
                </Link>
              </div>
            )}
          </div>

          <div className="col-span-12 lg:col-span-5">
            <div className="relative h-full min-h-[22rem] overflow-hidden lg:min-h-[100%]">
              <Image
                src={collection.cover_image_url}
                alt={collection.title}
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="image-float object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,17,12,0.08),rgba(26,20,64,0.6))]" />
              <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                <span
                  className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                  style={{
                    borderColor: "rgba(255,255,255,0.22)",
                    background: "rgba(24,17,12,0.28)",
                  }}
                >
                  Raccolta
                </span>
                <span
                  className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                  style={{
                    borderColor: "rgba(255,255,255,0.18)",
                    background: "rgba(255,255,255,0.08)",
                  }}
                >
                  {collection.tool_count} tool inclusi
                </span>
              </div>

              <div className="absolute bottom-3.5 left-3.5 right-3.5 sm:bottom-4 sm:left-4 sm:right-4">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/74">
                  In breve
                </p>
                <p className="mt-2 text-sm leading-6 text-white/82">
                  {tone.label} · {audienceDescription} · {difficulty} · {access.label}
                </p>
              </div>
            </div>

            <NativePlacement placementKey="collection-native-sponsor" variant="rail" />
          </div>
        </div>
      </section>

      {collection.surface === "special-issue" ? (
        <section className="dark-panel panel-lift rounded-[34px] p-5 sm:p-6 lg:p-7">
          <div className="editorial-grid gap-y-5">
            <div className="col-span-12 lg:col-span-7">
              <SectionHeader
                eyebrow={
                  premiumAccess.state === "locked"
                    ? isAdvancedIssue
                      ? "Anteprima speciale avanzata"
                      : "Anteprima riservata"
                    : isAdvancedIssue
                      ? "Lettura speciale avanzata"
                      : "Lettura speciale"
                }
                title={
                  premiumAccess.state === "locked"
                    ? isAdvancedIssue
                      ? "Uno speciale avanzato già leggibile in anteprima, con il cuore del formato nella versione completa."
                      : "Una raccolta riservata già leggibile in anteprima, senza perdere il suo taglio curatoriale."
                    : isAdvancedIssue
                      ? "Un formato editoriale più profondo di una raccolta standard."
                      : "Una raccolta più guidata di un semplice elenco tool."
                }
                description={
                  premiumAccess.state === "locked"
                    ? premiumAccess.description
                    : isAdvancedIssue && collection.advanced_issue
                      ? collection.advanced_issue.intro
                      : surface.description
                }
              />
              <div className="mt-4.5 grid gap-3 sm:grid-cols-2">
                {visibleHighlights.map((item) => (
                  <div
                    key={item}
                    className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4 text-sm leading-6 text-white/82"
                  >
                    {item}
                  </div>
                ))}
              </div>
              {hiddenHighlightCount > 0 ? (
                <p className="mt-4 text-[0.8rem] leading-6 text-white/64">
                  {hiddenHighlightCount} punt{hiddenHighlightCount > 1 ? "i" : "o"} chiave restano nel
                  percorso completo della raccolta.
                </p>
              ) : null}
            </div>
            <aside className="col-span-12 lg:col-span-5">
              <div className="rounded-[24px] border border-white/12 bg-white/6 p-4.5 sm:p-5">
                <p className="editorial-label !text-white/60">
                  {premiumAccess.state === "locked" ? "Cosa stai leggendo" : "Stato della raccolta"}
                </p>
                <p className="mt-3 text-[1.6rem] leading-tight text-white">
                  {premiumAccess.state === "locked" ? access.label : formatMeta.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/74">
                  {premiumAccess.state === "locked"
                    ? premiumAccess.description
                    : isAdvancedIssue
                      ? formatMeta.description
                      : editorialState.description}
                </p>
                {collection.premium_teaser ? (
                  <div className="mt-5 rounded-[22px] border border-white/10 bg-white/6 px-4 py-4 text-sm leading-6 text-white/78">
                    {collection.premium_teaser}
                  </div>
                ) : null}
                {isAdvancedIssue && collection.advanced_issue ? (
                  <div className="mt-5 rounded-[22px] border border-white/10 bg-white/6 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/56">
                      Flusso di lettura
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/78">
                      {collection.advanced_issue.reading_flow}
                    </p>
                  </div>
                ) : null}
                {!hasFullAccess ? (
                  <div className="mt-5 grid gap-3">
                    <div className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/56">
                        Resta aperto
                      </p>
                    <p className="mt-2 text-sm leading-6 text-white/78">
                      {visibleSlots.length} tool e {visibleHighlights.length} punti chiave leggibili subito: abbastanza per capire il taglio e decidere se continuare.
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/56">
                        Resta nella versione completa
                      </p>
                    <p className="mt-2 text-sm leading-6 text-white/78">
                      {hiddenToolCount} tool e {hiddenHighlightCount} punti chiave con la lettura più densa della raccolta, i moduli aggiuntivi e il contesto completo.
                    </p>
                  </div>
                </div>
                ) : null}
                {premiumAccess.state === "locked" ? (
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <ButtonLink href={premiumAccess.upgrade_href}>{premiumAccess.upgrade_label}</ButtonLink>
                    <Link
                      href="/account"
                      className="section-quiet-link text-sm font-semibold"
                      style={{ color: "white" }}
                    >
                      Apri account
                    </Link>
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </section>
      ) : null}

      {isAdvancedIssue ? (
        <AdvancedSpecialIssue
          collection={collection}
          hasFullAccess={hasFullAccess}
          premiumUpgradeHref={premiumAccess.upgrade_href}
          premiumUpgradeLabel={premiumAccess.upgrade_label}
        />
      ) : null}

      <section id="collection-content" className="editorial-grid gap-y-4">
        <div className="col-span-12 lg:col-span-8">
          <div className="brand-panel panel-lift rounded-[32px] p-5 sm:p-6">
            <SectionHeader
              eyebrow="Tool inclusi"
              title={
                hasFullAccess
                  ? isAdvancedIssue
                    ? "Dentro il formato lungo restano comunque profili pronti da usare."
                    : "Qui i tool si leggono come percorso, non come card isolate."
                  : isAdvancedIssue
                    ? "L'anteprima mostra i momenti chiave, lasciando l'approfondimento alla versione completa."
                    : "L'anteprima fa capire il percorso, lasciando l'approfondimento alla versione completa."
              }
              description={
                hasFullAccess
                  ? isAdvancedIssue
                    ? "La raccolta approfondisce il perché, ma resta operativa: puoi salvare, confrontare e aprire i profili senza uscire dal formato."
                    : "Ogni slot ha un ruolo chiaro dentro la raccolta. Puoi salvare i tool, portarli nel confronto e aprire il profilo singolo senza perdere il filo."
                  : isAdvancedIssue
                    ? "L'anteprima narrativa resta leggibile, ma la versione completa conserva più moduli editoriali e una lettura più profonda del ruolo di ogni tool."
                    : "Vedi gli snodi principali della raccolta e puoi comunque salvare i tool più convincenti, portarli nel confronto e capire se vale lo sblocco."
              }
            />

            <div className="mt-6 grid gap-4">
              {visibleSlots.map((slot, index) => (
                <CollectionSlotCard
                  key={`${collection.slug}-${slot.tool.slug}`}
                  slot={slot}
                  index={index}
                  collectionTitle={collection.title}
                />
              ))}
              {hiddenToolCount > 0 ? (
                <div
                  className="rounded-[26px] border px-5 py-5"
                  style={{
                    borderColor: "rgba(242, 179, 71, 0.28)",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(249,239,212,0.84))",
                  }}
                >
                  <p className="pill pill-premium">Accesso riservato</p>
                  <h3 className="text-display-card mt-3 max-w-none text-[1.34rem] sm:max-w-[16ch] sm:text-balance">
                    {hiddenToolCount} tool restano nella versione completa.
                  </h3>
                  <p className="text-body-soft mt-3 text-[0.95rem]" style={{ color: "var(--muted-strong)" }}>
                    L&apos;anteprima lascia visibile la struttura del percorso, ma tiene fuori i passaggi
                    più densi, le note più specifiche e la lettura completa della sequenza.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <ButtonLink href={premiumAccess.upgrade_href}>{premiumAccess.upgrade_label}</ButtonLink>
                    <Link
                      href="/account#member-access"
                      className="section-quiet-link text-sm font-semibold"
                      style={{ color: "var(--accent-strong)" }}
                    >
                      Apri account
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="space-y-3 lg:sticky lg:top-28">
            <div className="brand-panel panel-lift rounded-[28px] p-4 sm:p-4.5">
              <div className="flex flex-wrap items-center gap-2">
                {premiumAccess.is_premium ? (
                  <p className="pill pill-premium">
                    {premiumAccess.state === "locked" ? "Raccolta riservata" : "Anteprima premium"}
                  </p>
                ) : null}
                <span className="selection-status">
                  {hasFullAccess ? "Passo successivo" : "Accesso chiaro"}
                </span>
              </div>
              <p className="text-display-card mt-3 max-w-none text-[1.34rem] sm:max-w-[16ch] sm:text-balance">
                {hasFullAccess
                  ? "Porta fuori pochi tool forti e chiudi il campo."
                  : "L'anteprima deve bastare a farti capire se vale lo sblocco."}
              </p>
              <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                {hasFullAccess
                  ? "Usa questa raccolta come contesto di partenza, poi sposta nei salvati o nel confronto solo i profili che reggono davvero."
                  : collection.premium_teaser ?? premiumAccess.description}
              </p>
              {!hasFullAccess ? (
                <p className="mt-3 text-[0.82rem] leading-6" style={{ color: "var(--muted)" }}>
                  {boundarySummary}
                </p>
              ) : null}
              <div className="mt-4 grid gap-3">
                {hasFullAccess ? (
                  <>
                    <Link
                      href="/shortlist"
                      className="metadata-block rounded-[22px] px-4 py-4 transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <p className="editorial-label">Salvati</p>
                      <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                        Porta nei salvati i tool che reggono davvero e usa la raccolta come filtro di partenza.
                      </p>
                    </Link>
                    <Link
                      href="/compare"
                      className="metadata-block rounded-[22px] px-4 py-4 transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <p className="editorial-label">Confronto</p>
                      <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                        Quando restano 2 o 3 profili veri, il passo naturale è confrontarli.
                      </p>
                    </Link>
                  </>
                ) : (
                  <div
                    className="metadata-block rounded-[22px] px-4 py-4"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.84), rgba(249,239,212,0.8))",
                    }}
                  >
                    <p className="editorial-label">Cosa resta aperto</p>
                    <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                      Restano leggibili i momenti chiave della raccolta e i tool necessari per capire il taglio, non l&apos;intero percorso editoriale.
                    </p>
                  </div>
                )}
              </div>
              {!hasFullAccess && premiumAccess.state !== "open" && premiumAccess.state !== "unlocked" ? (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <ButtonLink href={premiumAccess.upgrade_href}>{premiumAccess.upgrade_label}</ButtonLink>
                  <Link
                    href="/account#member-access"
                    className="section-quiet-link text-sm font-semibold"
                    style={{ color: "var(--accent-strong)" }}
                  >
                    Apri account
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {relatedCollections.length > 0 ? (
        <section className="brand-panel panel-lift rounded-[34px] p-5 sm:p-6 lg:p-7">
          <SectionHeader
            eyebrow="Raccolte correlate"
            title="Se questa raccolta ti interessa, queste sono le transizioni più naturali."
            description="Le relazioni non sono casuali: tono, audience, superficie e tool condivisi tengono insieme il passaggio tra una raccolta e l'altra."
          />
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {relatedCollections.map((relatedCollection) => (
              <CollectionCard
                key={relatedCollection.id}
                collection={relatedCollection}
                variant="standard"
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
