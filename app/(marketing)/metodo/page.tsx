import Link from "next/link";
import { ArrowRight, Bookmark, GitCompare, Rocket, Search, Zap } from "lucide-react";
import { MobileMethodRoom } from "@/components/method/mobile-method-room";

const STEPS = [
  {
    num: "01",
    label: "Discover",
    title: "Parti da tool già curati",
    description:
      "Categorie leggibili, filtri utili e una selezione editoriale che tiene fuori il rumore.",
    href: "/archivio",
    cta: "Apri catalogo",
    color: "#6a3cff",
    icon: Search,
  },
  {
    num: "02",
    label: "Compare",
    title: "Confronta solo i candidati forti",
    description:
      "Porta avanti pochi tool alla volta e guarda differenze, livello e casi d'uso reali.",
    href: "/compare",
    cta: "Vai all'arena",
    color: "#39d2f6",
    icon: GitCompare,
  },
  {
    num: "03",
    label: "Shortlist",
    title: "Chiudi con una scelta rapida",
    description:
      "Salva, rivedi e trasforma la ricerca in una lista operativa pronta da provare.",
    href: "/shortlist",
    cta: "Crea shortlist",
    color: "#f3bf4c",
    icon: Bookmark,
  },
];

export const metadata = {
  title: "Metodo — TooolVibes",
  description: "Discover, Compare, Shortlist. Il percorso chiaro per scegliere tool AI validi.",
};

export default function MetodoPage() {
  return (
    <>
      {/* Mobile — Opzione C */}
      <div className="md:hidden">
        <MobileMethodRoom />
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="page-shell space-y-8 pb-24 pt-10">
          <section className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-semibold text-violet-700">
              <Rocket className="size-4" />
              Metodo
            </div>
            <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
              Discover, Compare, Shortlist
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--muted-strong)]">
              Un percorso chiaro: scopri, confronta, decidi. Senza perdere tempo tra decine di schede uguali.
            </p>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.label}
                  className="brand-panel panel-lift rounded-[28px] border p-6"
                  style={{ borderColor: "var(--line)" }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-5xl font-extrabold opacity-20"
                      style={{ color: step.color }}
                    >
                      {step.num}
                    </span>
                    <div
                      className="grid h-10 w-10 place-items-center rounded-full text-white"
                      style={{ background: step.color }}
                    >
                      <Icon className="size-5" />
                    </div>
                  </div>
                  <p className="mt-4 text-xs font-bold uppercase tracking-widest" style={{ color: step.color }}>
                    {step.label}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-[var(--foreground)]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{step.description}</p>
                  <Link
                    href={step.href}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold"
                    style={{ color: step.color }}
                  >
                    {step.cta}
                    <ArrowRight className="size-4" />
                  </Link>
                </article>
              );
            })}
          </section>

          <section className="flex flex-col items-center gap-4 rounded-[28px] bg-gradient-to-r from-violet-600 to-sky-500 px-6 py-10 text-center text-white">
            <Zap className="size-8" />
            <h2 className="text-2xl font-bold">Pronto a iniziare?</h2>
            <p className="max-w-md text-white/80">
              Esplora il catalogo, confronta i candidati e costruisci la tua shortlist operativa.
            </p>
            <Link
              href="/archivio"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-violet-700 shadow-lg"
            >
              Lancia il percorso
              <ArrowRight className="size-4" />
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
