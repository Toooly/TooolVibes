import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SurfaceIntro } from "@/components/sections/surface-intro";
import { ButtonLink } from "@/components/ui/button";
import { ShortlistBoard } from "@/components/tools/shortlist-board";
import { MobileShortlistBoard } from '@/components/tools/mobile-shortlist-board';
import { getPublishedTools } from "@/lib/data/public-tools";
import { PageOrbitShell } from "@/components/app/orbital-system";
import type { OrbitalItem } from "@/components/app/orbital-system";

const shortlistOrbitItems: OrbitalItem[] = [
  {
    id: "shortlist-main",
    title: "Shortlist",
    initials: "S",
    description: "La memoria viva dei pochi tool che restano in gioco.",
    category: "Workspace",
    href: "/shortlist",
    sectionId: "shortlist-page",
    priority: 1,
    color: "#6a3cff",
    shapeType: "gem",
    variant: "route",
    size: "lg",
    iconName: "Bookmark",
  },
  {
    id: "shortlist-compare",
    title: "Confronta",
    initials: "C",
    description: "Porta i candidati nel confronto side-by-side.",
    category: "Nav",
    href: "/compare",
    sectionId: "shortlist-page",
    priority: 1,
    color: "#39d2f6",
    shapeType: "crystal",
    variant: "step",
    size: "md",
    iconName: "GitCompare",
  },
  {
    id: "shortlist-archive",
    title: "Archivio",
    initials: "A",
    description: "Esplora il catalogo per trovare nuovi tool.",
    category: "Nav",
    href: "/archivio",
    sectionId: "shortlist-page",
    priority: 1,
    color: "#f3bf4c",
    shapeType: "hexagon",
    variant: "step",
    size: "md",
    iconName: "Boxes",
  },
];

export default async function ShortlistPage() {
  const tools = await getPublishedTools();

  return (
    <>
      {/* Mobile: Opzione C — Scrivania Kanban */}
      <div className="md:hidden">
        <PageOrbitShell sectionId="shortlist-page" label="Shortlist" items={shortlistOrbitItems}>
          <MobileShortlistBoard tools={tools} />
        </PageOrbitShell>
      </div>

      {/* Desktop: Shortlist esistente */}
      <div className="hidden md:block">
        <PageOrbitShell sectionId="shortlist-page" label="Shortlist" items={shortlistOrbitItems}>
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
        </PageOrbitShell>
      </div>
    </>
  );
}
