"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCommercialNow } from "@/components/monetization/commercial-clock";
import { Mail } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";

import { trackSponsorOpportunityClick } from "@/lib/analytics/sponsor-events";
import { useNavItems } from "@/lib/navigation/navigation-release-context";
import { getNavDestination } from "@/lib/navigation/selectors";
import { ConsentFooterLink } from "@/components/ads/consent-footer-link";

const contactEmailDestination = getNavDestination("contact-email");

const SPONSOR_OPPORTUNITY_HREF = "/sponsorizza";

function trackFooterSponsor(pathname: string) {
  try {
    trackSponsorOpportunityClick({
      placementId: "footer-sponsor-opportunity",
      route: pathname,
      destination: SPONSOR_OPPORTUNITY_HREF,
    });
  } catch {
    // Analytics failure is non-fatal and must not block navigation.
  }
}

export function SiteFooterV2() {
  const year = useCommercialNow().getFullYear();
  const productLinks = useNavItems("footer-v2-product");
  const companyLinks = useNavItems("footer-v2-company");
  const legalLinks = useNavItems("footer-v2-legal");
  const pathname = usePathname() ?? "/";

  return (
    <CoreFooter
      year={year}
      productLinks={productLinks}
      companyLinks={companyLinks}
      legalLinks={legalLinks}
      pathname={pathname}
    />
  );
}

function CoreFooter({
  year,
  productLinks,
  companyLinks,
  legalLinks,
  pathname,
}: {
  year: number;
  productLinks: ReturnType<typeof useNavItems>;
  companyLinks: ReturnType<typeof useNavItems>;
  legalLinks: ReturnType<typeof useNavItems>;
  pathname: string;
}) {
  return (
    <footer className="site-footer-v2 tv-utility tv-launchpad relative mt-auto">
      <LaunchpadMap />
      <div className="tv-utility__shell site-footer-v2__shell">
        <div className="tv-utility__identity">
          <Link href="/" className="tv-utility__brand">
            <BrandLogo size={36} fallback="png" />
            <span className="tv-utility__wordmark">TOOOLVIBES</span>
          </Link>
          <p className="tv-utility__summary">
            Il sistema per scoprire tool AI, SaaS e no-code.
            Trova, confronta e costruisci la lista giusta per te.
          </p>
        </div>

        <div className="tv-utility__contact-block">
          <h3 className="tv-utility__contact-title">Parliamone</h3>
          <p className="tv-utility__contact-copy">
            Un tool da segnalare, una correzione, una proposta.
          </p>
          <a
            href={contactEmailDestination.href}
            className="tv-utility__contact"
          >
            <Mail size={14} aria-hidden="true" />
            Scrivici
          </a>
        </div>

        <nav aria-label="Navigazione del sito" className="tv-utility__nav">
          <div className="tv-utility__group">
            <h3>Esplora</h3>
            <ul>
              {productLinks.map((link) => (
                <li key={link.id}>
                  <Link href={link.href} className="tv-utility__link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="tv-utility__group">
            <h3>TooolVibes</h3>
            <ul>
              {companyLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    className="tv-utility__link"
                    onClick={
                      link.href === SPONSOR_OPPORTUNITY_HREF
                        ? () => trackFooterSponsor(pathname)
                        : undefined
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="tv-utility__legal">
          {legalLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className="tv-utility__legal-link"
            >
              {link.label}
            </Link>
          ))}
          <ConsentFooterLink />
        </div>

        <details className="tv-utility__disclosure">
          <summary>Trasparenza e affiliazioni</summary>
          <p className="tv-utility__disclosure-body">
            Alcuni link su TooolVibes sono link affiliati. Se acquisti tramite
            questi collegamenti, potremmo ricevere una commissione, senza costi
            aggiuntivi per te. Le partnership commerciali non determinano le
            valutazioni editoriali.
          </p>
        </details>
        <p className="tv-utility__mark">TOOOLVIBES · {year}</p>
      </div>
    </footer>
  );
}

function LaunchpadMap() {
  return (
    <section className="tv-launchpad__shell" aria-labelledby="tv-launchpad-title">
      <div>
        <p className="tv-launchpad__signature" aria-hidden="true">TOOOLVIBES</p>
        <h2 id="tv-launchpad-title" className="tv-launchpad__title">Dove vuoi andare adesso?</h2>

        <nav className="tv-launchpad__map" aria-label="Mappa del prodotto">
          <p className="tv-launchpad__map-caption" aria-hidden="true">
            Scopri <span /> Costruisci <span /> Decidi
          </p>
          <ul className="tv-launchpad__destinations">
            <li className="tv-launchpad__tile tv-launchpad__tile--discover">
              <span className="tv-launchpad__node" aria-hidden="true" />
              <p>Scopri</p>
              <Link href="/archivio">Catalogo <span aria-hidden="true">→</span></Link>
              <Link href="/radar">Radar <span aria-hidden="true">→</span></Link>
            </li>
            <li className="tv-launchpad__tile tv-launchpad__tile--build">
              <span className="tv-launchpad__node" aria-hidden="true" />
              <p>Costruisci</p>
              <Link href="/collections">Raccolte <span aria-hidden="true">→</span></Link>
              <Link href="/posts">Guide <span aria-hidden="true">→</span></Link>
            </li>
            <li className="tv-launchpad__tile tv-launchpad__tile--decide">
              <span className="tv-launchpad__node" aria-hidden="true" />
              <p>Decidi</p>
              <Link href="/compare">Confronto <span aria-hidden="true">→</span></Link>
              <Link href="/shortlist">Salvati <span aria-hidden="true">→</span></Link>
            </li>
          </ul>
        </nav>
      </div>
    </section>
  );
}
