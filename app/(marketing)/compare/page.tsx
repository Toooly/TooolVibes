import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DesktopVibeCompare } from "@/components/desktop/desktop-vibe-compare";
import { SurfaceIntro } from "@/components/sections/surface-intro";
import { ButtonLink } from "@/components/ui/button";
import { UnifiedCompareBoard } from "@/components/tools/unified-compare-board";
import { getPublishedTools } from "@/lib/data/public-tools";
import { directoryTools } from "@/lib/data/tooolvibes-directory";

export default async function ComparePage() {
  const tools = await getPublishedTools();

  return (
    <>
      <DesktopVibeCompare directoryTools={directoryTools} legacyTools={tools} />

      <div className="tone-compare page-shell space-y-4 pb-14 pt-6 sm:space-y-6 sm:pb-18 sm:pt-9 lg:hidden">
        <SurfaceIntro
          eyebrow="Compare"
          title="Il punto in cui i candidati smettono di somigliarsi."
          description="Metti fino a 5 profili uno accanto all'altro e fai emergere il distacco vero prima di scegliere."
          helperEyebrow="Come leggerlo"
          helperCopy="Parti dal workflow fit. Pricing, piattaforme e nota editoriale servono solo a chiudere il verdetto."
          actions={
            <>
              <ButtonLink href="/archivio">Aggiungi dall&apos;archivio</ButtonLink>
              <Link
                href="/shortlist"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[rgba(76,55,166,0.14)] bg-white/78 px-4 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5 hover:bg-white/92 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/80"
              >
                Apri shortlist
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </>
          }
          asideEyebrow="Decisione rapida"
          asideTitle="Pochi candidati, differenze piu leggibili."
          asideCopy="Qui non costruisci una matrice infinita. Isoli gli scarti giusti tra tool che da soli sembrano ancora troppo vicini."
        />

        <section className="brand-panel panel-lift rounded-[34px] p-5 sm:p-6 lg:p-7">
          <UnifiedCompareBoard directoryTools={directoryTools} legacyTools={tools} />
        </section>
      </div>
    </>
  );
}
