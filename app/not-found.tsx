import { BrandLogo } from "@/components/layout/brand-logo";
import { PremiumBadge, PremiumLink, PremiumPanel } from "@/components/ui/premium";

export default function NotFound() {
  return (
    <div className="page-shell py-16 sm:py-24">
      <PremiumPanel tone="light" className="p-8 text-center sm:p-12">
        <div className="flex justify-center">
          <BrandLogo size={88} priority />
        </div>
        <PremiumBadge tone="accent" className="mt-5">
          404
        </PremiumBadge>
        <h1 className="mt-5 text-4xl sm:text-5xl">Questa pagina non è disponibile.</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7" style={{ color: "var(--muted)" }}>
          Il contenuto che stai cercando non è stato trovato oppure non è ancora pubblicato.
        </p>
        <PremiumLink href="/" className="mt-8">
          Torna alla home
        </PremiumLink>
      </PremiumPanel>
    </div>
  );
}
