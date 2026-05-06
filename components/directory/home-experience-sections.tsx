"use client";

import Link from "next/link";
import {
  Bot,
  Boxes,
  ChevronRight,
  Code2,
  Compass,
  GitCompare,
  Layers3,
  Sparkles,
  Workflow,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PremiumBadge, PremiumLink, PremiumPanel } from "@/components/ui/premium";
import { DecorativeGlow, SectionHeader } from "@/components/ui/premium-section";
import { cn } from "@/lib/utils";

const categories = [
  {
    label: "Vibe Coding",
    href: "/archivio?group=vibe-coding",
    icon: Code2,
    detail: "Prompt-to-app, UI builder e prototipi rapidi.",
    badge: "Build",
  },
  {
    label: "AI App Builder",
    href: "/archivio?group=ai-app-builder",
    icon: Bot,
    detail: "Da idea a prodotto navigabile con meno passaggi.",
    badge: "MVP",
  },
  {
    label: "Automation",
    href: "/archivio?group=automation",
    icon: Workflow,
    detail: "Workflow, agenti e integrazioni operative.",
    badge: "Ops",
  },
  {
    label: "No-Code",
    href: "/archivio?group=no-code",
    icon: Boxes,
    detail: "Builder visuali e stack senza codice pesante.",
    badge: "Stack",
  },
  {
    label: "Compare",
    href: "/compare",
    icon: GitCompare,
    detail: "Metti alternative una accanto all'altra.",
    badge: "Scelta",
  },
  {
    label: "Stack",
    href: "/shortlist",
    icon: Layers3,
    detail: "Salva e costruisci una shortlist di lavoro.",
    badge: "Memo",
  },
];

const steps = [
  {
    title: "Scopri",
    text: "Parti da categorie curate e segnali leggibili, non da una lista infinita.",
    icon: Compass,
  },
  {
    title: "Confronta",
    text: "Seleziona fino a 4 tool e valuta differenze reali: fonte, categoria e use case.",
    icon: GitCompare,
  },
  {
    title: "Costruisci",
    text: "Aggiungi allo stack i tool migliori e riordinali in base al workflow.",
    icon: Layers3,
  },
];

const features = [
  {
    value: "curation",
    title: "Curation editoriale invece di catalogo piatto",
    description:
      "Ogni tool ha categoria, livello, descrizione, link esterno e contesto. La UI spinge a scegliere, non a scorrere senza direzione.",
  },
  {
    value: "workspace",
    title: "Workspace: salvati, confronto e stack",
    description:
      "La directory diventa uno spazio operativo: salvi candidati, confronti alternative e trasformi la scoperta in una shortlist utile.",
  },
  {
    value: "radar",
    title: "Radar Product Hunt con fallback pulito",
    description:
      "Il ranking viene letto lato server con token protetto. Se l'integrazione non risponde, l'utente vede uno stato chiaro e non una sezione rotta.",
  },
  {
    value: "mobile",
    title: "Mobile guidato, non scroll infinito",
    description:
      "Percorsi rapidi, bottom nav, filtri in sheet e card compatte riducono la fatica su schermi piccoli.",
  },
];

const faqs = [
  {
    value: "how",
    question: "TooolVibes è solo una lista di link?",
    answer:
      "No. La directory unisce selezione editoriale, azioni workspace, filtri, confronto e stack builder per aiutarti a decidere cosa provare davvero.",
  },
  {
    value: "product-hunt",
    question: "I dati Product Hunt sono reali?",
    answer:
      "Quando PRODUCTHUNT_TOKEN è configurato, la sezione usa l'API Product Hunt lato server. Se manca o fallisce, viene mostrato un fallback dichiarato.",
  },
  {
    value: "suggest",
    question: "Posso suggerire un tool?",
    answer:
      "Sì. La wishlist raccoglie nome, URL, categoria, livello suggerito, email opzionale e messaggio, pronta per essere collegata a Supabase.",
  },
];

function AppAccordion({
  items,
  dark = false,
}: {
  items: { value: string; title?: string; question?: string; description?: string; answer?: string }[];
  dark?: boolean;
}) {
  return (
    <Accordion className="gap-3">
      {items.map((item) => (
        <AccordionItem
          key={item.value}
          value={item.value}
          className={cn(
            "motion-accordion-item rounded-[24px] border px-4 transition duration-200 hover:-translate-y-0.5 hover:border-violet-200/30",
            "dynamic-card",
            dark ? "border-white/12 bg-white/9" : "border-white/12 bg-white/9",
          )}
        >
          <AccordionTrigger className="py-4 text-base font-semibold text-white hover:no-underline">
            {item.title ?? item.question}
          </AccordionTrigger>
          <AccordionContent className="pb-5 text-sm leading-7 text-white/66">
            {item.description ?? item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function HomeExperienceSections() {
  const visibleCategories = categories.slice(0, 3);
  const extraCategories = categories.slice(3);

  return (
    <>
      <section className="page-shell">
        <PremiumPanel tone="violet" className="relative px-5 py-6 sm:px-7 sm:py-8">
          <DecorativeGlow className="-right-14 top-4" tone="violet" />
          <SectionHeader
            eyebrow="Categorie"
            title="Scegli il percorso, non la card a caso."
            description="Le categorie diventano ingressi operativi: sviluppo, automazione, contenuti, confronto e stack."
            className="[&_h2]:text-[var(--foreground)] [&_p]:text-[var(--muted-strong)]"
            action={
              <PremiumLink href="/tags" tone="dark" size="sm">
                Vedi categorie
              </PremiumLink>
            }
          />

          <div className="mt-4 grid gap-2.5 sm:hidden">
            {visibleCategories.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="dynamic-link-card flex items-center justify-between gap-3 rounded-[20px] border border-white/12 bg-white/9 p-3 transition active:scale-[0.99]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-[16px] border border-white/10 bg-white/9">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[0.94rem] font-semibold">{item.label}</span>
                      <span className="mt-0.5 block truncate text-[0.78rem] leading-5 text-white/64">
                        {item.detail}
                      </span>
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-white/42" aria-hidden="true" />
                </Link>
              );
            })}

            <Accordion className="gap-2">
              <AccordionItem
                value="more-categories"
                className="motion-accordion-item rounded-[20px] border border-white/12 bg-white/9 px-3"
              >
                <AccordionTrigger className="py-3 text-[0.92rem] font-semibold hover:no-underline">
                  Altre categorie
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="grid gap-2">
                    {extraCategories.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="dynamic-link-card flex items-center justify-between gap-3 rounded-[16px] border border-white/10 bg-white/8 px-3 py-2.5 text-sm font-semibold transition active:scale-[0.99]"
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <Icon className="size-4 shrink-0" aria-hidden="true" />
                            <span className="truncate">{item.label}</span>
                          </span>
                          <ChevronRight className="size-4 shrink-0 text-white/42" aria-hidden="true" />
                        </Link>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="grid gap-2 pt-1">
              <details className="mobile-native-accordion rounded-[20px] border border-white/12 bg-white/76 px-4 py-3">
                <summary>Come funziona</summary>
                <div className="mt-3 grid gap-2">
                  {steps.map((step, index) => (
                    <div key={step.title} className="rounded-[16px] border border-[var(--line)] bg-white/72 px-3 py-2.5">
                      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
                        Step {String(index + 1).padStart(2, "0")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                        {step.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                        {step.text}
                      </p>
                    </div>
                  ))}
                </div>
              </details>

              <details className="mobile-native-accordion rounded-[20px] border border-white/12 bg-white/76 px-4 py-3">
                <summary>Sistema e FAQ</summary>
                <div className="mt-3 grid gap-2">
                  {[features[0], features[1], faqs[0]].map((item) => (
                    <div key={item.value} className="rounded-[16px] border border-[var(--line)] bg-white/72 px-3 py-2.5">
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {"title" in item ? item.title : item.question}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                        {"description" in item ? item.description : item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </details>

              <PremiumLink href="/archivio" tone="dark" size="sm" className="w-full">
                Apri il catalogo
              </PremiumLink>
            </div>
          </div>

          <div className="motion-stagger tool-rail -mx-2 mt-5 hidden snap-x gap-3 overflow-x-auto px-2 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
            {categories.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="dynamic-link-card group w-[min(76vw,18rem)] shrink-0 snap-start rounded-[26px] border border-white/12 bg-white/9 p-4 transition duration-200 hover:-translate-y-1 hover:border-violet-200/34 hover:bg-white/14 hover:shadow-[0_18px_44px_rgba(8,14,38,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60 sm:w-auto"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-11 place-items-center rounded-[18px] border border-white/10 bg-white/9 text-white">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/7 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-white/54">
                        {item.badge}
                      </span>
                      <ChevronRight className="size-4 text-white/42 transition group-hover:translate-x-1 group-hover:text-white" />
                    </span>
                  </div>
                  <h3 className="mt-4 text-[1.1rem] font-semibold text-white">{item.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/62">{item.detail}</p>
                </Link>
              );
            })}
          </div>
        </PremiumPanel>
      </section>

      <section className="page-shell hidden sm:block">
        <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <PremiumPanel tone="blue" className="p-5 sm:p-7">
            <PremiumBadge tone="dark">Come funziona</PremiumBadge>
            <h2 className="text-display-card mt-4 text-[2.15rem] text-white sm:text-[2.8rem]">
              Dal rumore allo stack in tre passaggi.
            </h2>
            <div className="mt-5 sm:hidden">
              <AppAccordion
                dark
                items={steps.map((step, index) => ({
                  value: step.title,
                  title: `Step ${String(index + 1).padStart(2, "0")} - ${step.title}`,
                  description: step.text,
                }))}
              />
            </div>

            <div className="motion-stagger mt-6 hidden gap-3 sm:grid">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="dynamic-card rounded-[24px] border border-white/10 bg-white/7 p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-[16px] bg-white text-[#17112f]">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/44">
                          Step {String(index + 1).padStart(2, "0")}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-white">{step.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-white/64">{step.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </PremiumPanel>

          <PremiumPanel tone="airy" className="p-5 sm:p-7">
            <SectionHeader
              eyebrow="Sistema"
              title="Segnali utili, senza disperdere il percorso."
              description="I dettagli restano raccolti: curation, workspace, radar e mobile hanno un ruolo chiaro nella scelta."
              className="[&_h2]:text-[var(--foreground)] [&_p]:text-[var(--muted-strong)]"
            />
            <div className="mt-6">
              <AppAccordion items={features} dark />
            </div>
          </PremiumPanel>
        </div>
      </section>

      <section className="page-shell hidden sm:block">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <PremiumPanel tone="airy" className="p-5 sm:p-7">
            <SectionHeader
              eyebrow="FAQ"
              title="Domande frequenti, senza blocchi infiniti."
              description="Le risposte stanno compatte e accessibili, così la home non diventa una parete di testo."
              className="[&_h2]:text-[var(--foreground)] [&_p]:text-[var(--muted-strong)]"
            />
            <div className="mt-6">
              <AppAccordion items={faqs} dark />
            </div>
          </PremiumPanel>

          <PremiumPanel tone="warm" className="relative overflow-hidden p-5 sm:p-7">
            <DecorativeGlow className="-right-16 -top-16" tone="gold" />
            <PremiumBadge tone="warning">Ready to explore</PremiumBadge>
            <h2 className="text-display-card mt-4 text-[2.1rem] text-white sm:text-[2.75rem]">
              Costruisci una shortlist migliore oggi.
            </h2>
            <p className="mt-4 text-[1rem] leading-7 text-white/66">
              Entra nel catalogo, salva i candidati, confronta alternative e crea uno stack
              pronto da testare senza perdere contesto.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <PremiumLink href="/archivio">Apri il catalogo</PremiumLink>
              <PremiumLink href="/wishlist" tone="secondary">
                Suggerisci tool
              </PremiumLink>
            </div>
            <div className="dynamic-card mt-7 rounded-[24px] border border-white/10 bg-white/7 p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-[16px] bg-white text-[#17112f]">
                  <Sparkles className="size-5" aria-hidden="true" />
                </span>
                <p className="text-sm leading-6 text-white/68">
                  Un percorso più corto tra scoperta, memoria e decisione, con i
                  candidati giusti sempre a portata di mano.
                </p>
              </div>
            </div>
          </PremiumPanel>
        </div>
      </section>
    </>
  );
}
