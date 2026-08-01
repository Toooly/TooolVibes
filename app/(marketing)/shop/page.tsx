import { FileText, Layers3, Sparkles } from "lucide-react";

import { PremiumLink } from "@/components/ui/premium";
import { ResponsiveDisclosureCard } from "@/components/ui/responsive-disclosure-card";
import { RouteMarker } from "@/components/ui/route-marker";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPublicPageMetadata({
  title: "Shop",
  description: "Lo Shop TooolVibes è in preparazione: oggi puoi esplorare il Catalogo e le Raccolte editoriali.",
  path: "/shop",
});

const shopCards = [
  {
    title: "Stato attuale",
    copy: "Non sono disponibili prodotti, prezzi, checkout o acquisti. Questa pagina resta visibile per spiegare con chiarezza lo stato dello Shop.",
    example: "Puoi già usare senza registrazione Catalogo, Confronto, Salvati e Raccolte.",
    icon: Layers3,
  },
  {
    title: "Contenuto editoriale",
    copy: "Le selezioni pubblicate da TooolVibes rimangono nel prodotto, dove puoi verificarne il contesto e confrontare i tool inclusi.",
    example: "Le Raccolte sono accessibili dal sito, senza una promessa di sblocco a pagamento.",
    icon: FileText,
  },
  {
    title: "Quando sarà pronto",
    copy: "Eventuali risorse future saranno pubblicate qui solo quando destinazione, contenuto e condizioni saranno verificabili.",
    example: "Fino ad allora non trovi link esterni, cataloghi fittizi o inviti all'acquisto.",
    icon: Sparkles,
  },
];

export default function ShopPage() {
  return (
    <div className="page-shell space-y-5 pb-24 pt-4 sm:space-y-7 sm:pb-16 sm:pt-6">
      <section className="hero-shell motion-reveal bg-[var(--tv-surface-raised)] px-5 py-5 text-white before:!hidden after:!hidden sm:rounded-[38px] sm:px-7 sm:py-8">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,0.94fr)_minmax(20rem,0.8fr)] lg:items-center">
          <div className="max-w-[44rem]">
            <RouteMarker
              index="06"
              label="Shop digitale"
              status="In preparazione"
              density="hero"
              className="mb-5"
            />
            <h1 className="max-w-[13ch] text-[clamp(2rem,9vw,3.3rem)] leading-[1.05] text-white sm:max-w-[22ch]">
              Lo Shop TooolVibes è in preparazione.
            </h1>
            <p className="mt-4 max-w-[40rem] text-[0.98rem] leading-7 text-white/74 sm:mt-5 sm:text-[1rem]">
              Oggi non vendiamo prodotti né indirizziamo a un checkout esterno. Per decidere meglio puoi
              partire dal Catalogo, dalle Raccolte editoriali e dal Confronto.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <PremiumLink href="/archivio">
                Esplora il Catalogo
              </PremiumLink>
              <PremiumLink href="/collections" tone="secondary">
                Vedi le Raccolte
              </PremiumLink>
            </div>
          </div>

          <div className="hero-mini-visual rounded-[30px] border border-[var(--tv-border-subtle)] bg-[var(--tv-surface-elevated)] p-4 !animate-none">
            <div className="flex items-center justify-between gap-3 rounded-[22px] border border-[var(--tv-border-subtle)] bg-[var(--tv-surface-raised)] p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/48">
                  Stato dello Shop
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  Nessun acquisto attivo
                </p>
              </div>
              <Sparkles className="size-5 text-amber-100" aria-hidden="true" />
            </div>
            <div className="mt-4 grid gap-3">
              {["Nessun catalogo esterno", "Nessun prezzo pubblicato", "Nessun checkout attivo"].map((item, index) => (
                <div
                  key={item}
                  className="rounded-[20px] border border-[var(--tv-border-subtle)] bg-[var(--tv-surface-raised)] p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-[14px] bg-[var(--tv-accent-primary)] text-xs font-semibold text-[var(--tv-ink-on-brand)]">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-white/82">{item}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="motion-stagger grid gap-2 md:grid-cols-3 md:gap-5">
        {shopCards.map((item) => {
          const Icon = item.icon;

          return (
            <ResponsiveDisclosureCard
              key={item.title}
              title={item.title}
              icon={<Icon className="size-4 md:size-5" aria-hidden="true" />}
            >
              <p className="mt-3 text-sm leading-6 text-[var(--tv-ink-secondary)] md:mt-4 md:text-[0.98rem] md:leading-7">
                {item.copy}
              </p>
              <div className="mt-3 rounded-[18px] border border-[var(--tv-border-subtle)] bg-[var(--tv-surface-elevated)] px-3 py-2 text-xs leading-5 text-[var(--tv-ink-secondary)] md:mt-5 md:rounded-[20px] md:p-4 md:text-sm md:leading-6">
                {item.example}
              </div>
            </ResponsiveDisclosureCard>
          );
        })}
      </section>

      <section className="rounded-[30px] border border-[var(--tv-border-subtle)] bg-[var(--tv-surface-raised)] p-4 text-white sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p
              data-typography="metadata"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-200"
            >
              Una promessa verificabile
            </p>
            <h2 className="mt-4 text-[1.75rem] leading-tight text-white sm:text-[2.35rem]">
              Per ora, il posto giusto per decidere resta il prodotto.
            </h2>
            <p className="mt-3 max-w-[48rem] text-sm leading-7 text-white/66">
              Se vuoi suggerire una risorsa o un flusso che merita una guida editoriale, puoi inviarlo a TooolVibes.
            </p>
          </div>
          <PremiumLink href="/contributi" tone="secondary">
            Invia un contributo
          </PremiumLink>
        </div>
      </section>
    </div>
  );
}
