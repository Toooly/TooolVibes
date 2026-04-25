import Link from "next/link";

import { SurfaceIntro } from "@/components/sections/surface-intro";
import { ButtonLink } from "@/components/ui/button";
import {
  getPremiumCollections,
  getPremiumPreviewCollections,
} from "@/lib/data/public-collections";
import { siteConfig } from "@/lib/config/site";

export default async function ShopPage() {
  const [premiumCollections, premiumPreviewCollections] = await Promise.all([
    getPremiumCollections(),
    getPremiumPreviewCollections(),
  ]);
  const reservedCount = premiumCollections.filter((collection) => collection.access === "premium").length;

  return (
    <div className="tone-premium page-shell space-y-4 pb-14 pt-6 sm:space-y-6 sm:pb-18 sm:pt-9">
      <SurfaceIntro
        eyebrow="Premium"
        title="La pagina che chiarisce accesso, valore e shop esterno."
        description="Qui il premium non va raccontato in astratto: deve chiarire subito cosa resta aperto, cosa mostra una preview e cosa appartiene davvero al layer member."
        helperEyebrow="Come leggerlo"
        helperCopy="Prima guarda il confine tra open, preview e member issue. Lo shop esterno ha senso solo come estensione finale, non come primo invito all'azione."
        actions={
          <>
            <ButtonLink href="/collections">Apri le collection</ButtonLink>
            <Link
              href="/account#member-access"
              className="section-quiet-link text-sm font-semibold"
              style={{ color: "var(--accent-strong)" }}
            >
              Vedi cosa sblocchi
            </Link>
          </>
        }
        asideEyebrow="Premium layer"
        asideTitle="Piu` profondita`, non piu` rumore."
        asideCopy="Il premium ha senso solo se resta collegato a collection e issue gia` credibili, con un confine netto tra open, preview e member."
      />

      <div className="px-1">
        <Link
          href={siteConfig.shopUrl}
          target="_blank"
          rel="noreferrer"
          className="section-quiet-link text-sm font-semibold"
          style={{ color: "var(--accent-strong)" }}
        >
          Vai allo shop esterno solo dopo aver capito bene il confine premium
        </Link>
      </div>

      <section className="brand-panel panel-lift rounded-[34px] p-5 sm:p-6 lg:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5 soft-divider">
          <div className="max-w-[42rem]">
            <p className="editorial-label">Cosa deve essere chiaro</p>
            <h2 className="text-display-card mt-2.5 max-w-none text-[1.58rem] sm:max-w-[18ch] sm:text-[1.88rem] sm:text-balance">
              Tre modi concreti in cui il member layer aggiunge valore.
            </h2>
          </div>
          <span className="selection-status">Accesso leggibile</span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Collection aperta",
              copy: "Qui l'accesso pieno deve essere leggibile subito: entri, capisci il percorso e usi i tool senza altri strati da interpretare.",
            },
            {
              title: "Preview leggibile",
              copy: `Le ${premiumPreviewCollections.length} preview devono mostrare abbastanza per far capire il taglio, ma lasciare evidente cosa resta nel layer completo.`,
            },
            {
              title: "Issue member piu` densa",
              copy: `Le ${reservedCount} issue riservate devono aggiungere moduli, tool e profondita reale, non solo una cornice premium.`,
            },
          ].map((item, index) => (
            <article
              key={item.title}
              className="rounded-[26px] border p-4.5"
              style={{
                borderColor: index === 0 ? "rgba(112,82,255,0.16)" : "var(--line)",
                background:
                  index === 0
                    ? "linear-gradient(180deg, rgba(247,241,255,0.92), rgba(233,224,255,0.84))"
                    : "linear-gradient(180deg, rgba(255,255,255,0.8), rgba(243,237,255,0.72))",
              }}
            >
              <p className="editorial-label">Formato</p>
              <h3 className="text-display-card mt-3 text-[1.24rem]">{item.title}</h3>
              <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
                {item.copy}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
