import Link from "next/link";

import { SurfaceIntro } from "@/components/sections/surface-intro";
import { ButtonLink } from "@/components/ui/button";
import { CompareBoard } from "@/components/tools/compare-board";
import { getPublishedTools } from "@/lib/data/public-tools";

export default async function ComparePage() {
  const tools = await getPublishedTools();

  return (
    <div className="tone-compare page-shell space-y-4 pb-14 pt-6 sm:space-y-6 sm:pb-18 sm:pt-9">
      <SurfaceIntro
        eyebrow="Compare"
        title="Il punto in cui i candidati smettono di somigliarsi."
        description="Metti 2 o 3 profili uno accanto all'altro e leggi il distacco vero prima di scegliere."
        helperEyebrow="Come leggerlo"
        helperCopy="Parti dal workflow fit. Pricing, piattaforme e nota editoriale servono solo a chiudere il verdetto."
        actions={
          <>
            <ButtonLink href="/archivio">Aggiungi dall&apos;archivio</ButtonLink>
            <Link
              href="/shortlist"
              className="section-quiet-link text-sm font-semibold"
              style={{ color: "var(--accent-strong)" }}
            >
              Apri shortlist
            </Link>
          </>
        }
        asideEyebrow="Decisione rapida"
        asideTitle="Pochi candidati, differenze piu` leggibili."
        asideCopy="Qui non costruisci una matrice infinita. Isoli gli scarti giusti tra tool che da soli sembrano ancora troppo vicini."
      />

      <section className="brand-panel panel-lift rounded-[34px] p-5 sm:p-6 lg:p-7">
        <CompareBoard tools={tools} />
      </section>
    </div>
  );
}
