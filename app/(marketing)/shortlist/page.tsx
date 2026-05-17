import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
        title="La memoria viva dei pochi tool che restano davvero in gioco."
        description="Qui non salvi tutto. Tieni vivi solo i profili che meritano ancora attenzione, priorità o una nota vera."
        helperEyebrow="Come usarla"
        helperCopy="Salva un tool ovunque lo incontri, poi torna qui per fissare il motivo per cui resta dentro. Quando il set si stringe davvero, passa al compare."
        actions={
          <>
            <ButtonLink href="/archivio">Apri archivio</ButtonLink>
            <Link
              href="/compare"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/14 bg-white/8 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/80"
            >
              Apri compare
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </>
        }
        asideEyebrow="Workspace personale"
        asideTitle="Ricorda meglio prima di scegliere."
        asideCopy="La shortlist non serve a collezionare tool. Serve a tenere memoria del motivo per cui alcuni meritano ancora spazio."
      />

      <section className="brand-panel panel-lift rounded-[34px] p-5 sm:p-6 lg:p-7">
        <ShortlistBoard tools={tools} />
      </section>
    </div>
  );
}
