import Link from "next/link";

import { SurfaceIntro } from "@/components/sections/surface-intro";
import { ButtonLink } from "@/components/ui/button";
import { ShortlistBoard } from "@/components/tools/shortlist-board";
import { getPublishedTools } from "@/lib/data/public-tools";

export default async function ShortlistPage() {
  const tools = await getPublishedTools();

  return (
    <div className="tone-workspace page-shell space-y-4 pb-14 pt-6 sm:space-y-6 sm:pb-18 sm:pt-9">
      <SurfaceIntro
        eyebrow="Workspace"
        title="La memoria di lavoro dei pochi tool che restano davvero in gioco."
        description="Qui non salvi tutto. Tieni vivi solo i profili che meritano ancora attenzione, priorit? o una nota vera."
        helperEyebrow="Come usarla"
        helperCopy="Salva un tool ovunque lo incontri, poi torna qui per fissare il motivo per cui resta dentro. Quando il set si restringe davvero, passa al compare."
        actions={
          <>
            <ButtonLink href="/archivio">Apri archivio</ButtonLink>
            <Link
              href="/compare"
              className="section-quiet-link text-sm font-semibold"
              style={{ color: "var(--accent-strong)" }}
            >
              Apri compare
            </Link>
          </>
        }
        asideEyebrow="Workspace personale"
        asideTitle="Ricorda bene prima di scegliere."
        asideCopy="La shortlist non serve a collezionare tool. Serve a tenere memoria del motivo per cui alcuni meritano ancora spazio."
      />

      <section className="brand-panel panel-lift rounded-[34px] p-5 sm:p-6 lg:p-7">
        <ShortlistBoard tools={tools} />
      </section>
    </div>
  );
}
