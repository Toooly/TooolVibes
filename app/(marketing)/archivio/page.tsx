import { cookies } from "next/headers";
import type { Metadata } from "next";
import Link from "@/components/ui/app-link";

import { DefinitiveArchive } from "@/components/archive/definitive-archive";
import { TinyAdzInlineSlot } from "@/components/ads/tinyadz-inline-slot";
import { PartnerEditorialInsert } from "@/components/monetization/partner-placements";
import { resolvePublicMonetizationPlacement } from "@/lib/monetization/placements";
import {
  parseCatalogLevelParam,
  resolveCatalogGroupParam,
} from "@/components/directory/catalog/catalog-controller";
import {
  getPublicToolFilterGroups,
  getPublicToolViews,
} from "@/lib/data/public-tools";
import { createPublicPageMetadata } from "@/lib/seo/metadata";
import "@/styles/archive-v4.css";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Catalogo di tool AI, SaaS e no-code",
  description:
    "Cerca e filtra tool AI, SaaS e no-code, salva i candidati e confronta le alternative per il tuo stack.",
  path: "/archivio",
  openGraphDescription:
    "Cerca, filtra e confronta tool AI, SaaS e no-code. Riduci le alternative e trova i candidati da valutare.",
});

type ArchiveSearchParams = {
  q?: string | string[];
  group?: string | string[];
  level?: string | string[];
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function resolveArchiveLevel(value: string | null | undefined) {
  const parsed = parseCatalogLevelParam(value);
  return parsed === "beginner" || parsed === "intermediate" || parsed === "expert"
    ? parsed
    : "all";
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<ArchiveSearchParams>;
}) {
  const params = await searchParams;
  // tv-density is a server-readable PRESENTATION HINT — not auth.
  // Canonical auth: AccountProvider / Supabase client session.
  // This cookie only selects first-paint card geometry (compact vs
  // enriched). Enriched content is public Tool metadata only
  // (levelLabel, readingTime, tags). NEVER used for authorization.
  // If absent or invalid → defaults to "compact" (safe guest default).
  // Known limitation: first visit after deploy for already-authenticated
  // users without cookie → paints compact, upgrades once via client sync.
  let initialDensity: "compact" | "enriched" = "compact";
  try {
    const cookieStore = await cookies();
    const densityCookie = cookieStore.get("tv-density")?.value;
    initialDensity = densityCookie === "enriched" ? "enriched" : "compact";
  } catch {
    // cookies() may fail on Cloudflare Workers edge cases — default to compact
  }
  const [tools, filterGroups] = await Promise.all([
    getPublicToolViews(),
    getPublicToolFilterGroups(),
  ]);
  const initialQuery = (firstParam(params.q) ?? "").trim();
  const initialGroup = resolveCatalogGroupParam(filterGroups, firstParam(params.group));
  const initialLevel = resolveArchiveLevel(firstParam(params.level));

  /* Partner Experience V3.1 — il Catalog Insert vive DENTRO il flusso di
     discovery: viene inserito a livello di render dopo il primo gruppo di
     card organiche (vedi DefinitiveArchive), mai prima del valore
     organico e mai in coda al catalogo. L'ordine organico resta intatto. */
  // V2 contract: non renderizzare lo slot se il record è demo/fixture/
  // development/placeholder. Wrapper identico a quello della Home V2.
  const renderNow = new Date();
  const placement = resolvePublicMonetizationPlacement("catalog-native-sponsor", {
    now: renderNow,
  });

  return (
    <div className="archive-final-surface relative overflow-x-hidden">
      <DefinitiveArchive
        tools={tools}
        filterGroups={filterGroups}
        initialQuery={initialQuery}
        initialGroup={initialGroup}
        initialLevel={initialLevel}
        initialDensity={initialDensity}
        partnerInsert={
          placement ? (
            <PartnerEditorialInsert
              placementKey="catalog-native-sponsor"
              className="archive-partner-placement"
              trackerRoute="/archivio"
              context={{ now: renderNow }}
            />
          ) : null
        }
        adInsert={<TinyAdzInlineSlot placement="archive-feed" asGridItem />}
      />

      {/*
        Editorial method band — sits BETWEEN the TinyAdz mount and the
        direct-sponsor mount so the two commercial units are never
        visually adjacent on /archivio. Reinforces that the catalog
        stays editorial and that sponsored content stays labeled and
        separated. See `lib/monetization/commercial-placement-matrix.ts`
        for the canonical contract.
      */}
      <section
        className="archive-method-band"
        aria-labelledby="archive-method-band-title"
      >
        <div className="archive-method-band__inner">
          <p id="archive-method-band-title" className="archive-method-band__note">
            Il catalogo resta editoriale. Gli sponsor restano dichiarati.
          </p>
          <Link href="/metodo" className="archive-method-band__link">
            Scopri il metodo
          </Link>
        </div>
      </section>

    </div>
  );
}
