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
  const isHome = pathname === "/";

  if (isHome) {
    return <LaunchpadFooter year={year} legalLinks={legalLinks} />;
  }

  return (
    <footer className="site-footer-v2 tv-utility relative mt-auto">
      <div className="tv-utility__shell site-footer-v2__shell">
        <div className="tv-utility__identity">
          <Link href="/" className="tv-utility__brand">
            <BrandLogo size={36} fallback="png" />
            <span className="tv-utility__wordmark">TOOOLVIBES</span>
          </Link>
          <p className="tv-utility__summary">
            Il sistema decisionale per scegliere software con criterio,
            non l&apos;ennesima directory di tool.
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

function LaunchpadFooter({
  year,
  legalLinks,
}: {
  year: number;
  legalLinks: ReturnType<typeof useNavItems>;
}) {
  return (
    <footer className="site-footer-v2 tv-launchpad relative mt-auto">
      <div className="tv-launchpad__shell site-footer-v2__shell">
        <div>
        <Link href="/" className="tv-launchpad__brand">
          <BrandLogo size={40} fallback="png" />
          <span className="tv-launchpad__wordmark">TOOOLVIBES</span>
        </Link>
        <p className="tv-launchpad__signature" aria-hidden="true">
          TOOOLVIBES
        </p>
        <h2 id="tv-launchpad-title" className="tv-launchpad__title">
          Continua da qui.
        </h2>

        <nav className="tv-launchpad__map" aria-label="Mappa del prodotto">
          <p className="tv-launchpad__map-caption" aria-hidden="true">
            Scopri <span /> Costruisci <span /> Decidi
          </p>
          <ul className="tv-launchpad__destinations">
            <li className="tv-launchpad__tile tv-launchpad__tile--discover">
              <span className="tv-launchpad__node" aria-hidden="true" />
              <p>Scopri</p>
              <Link href="/archivio">
                Catalogo <span aria-hidden="true">→</span>
              </Link>
              <Link href="/radar">
                Radar <span aria-hidden="true">→</span>
              </Link>
            </li>
            <li className="tv-launchpad__tile tv-launchpad__tile--build">
              <span className="tv-launchpad__node" aria-hidden="true" />
              <p>Costruisci</p>
              <Link href="/collections">
                Raccolte <span aria-hidden="true">→</span>
              </Link>
              <Link href="/posts">
                Guide <span aria-hidden="true">→</span>
              </Link>
            </li>
            <li className="tv-launchpad__tile tv-launchpad__tile--decide">
              <span className="tv-launchpad__node" aria-hidden="true" />
              <p>Decidi</p>
              <Link href="/compare">
                Confronto <span aria-hidden="true">→</span>
              </Link>
              <Link href="/shortlist">
                Salvati <span aria-hidden="true">→</span>
              </Link>
            </li>
          </ul>
        </nav>

        <section className="tv-launchpad__contact" aria-labelledby="tv-launchpad-contact">
          <h3 id="tv-launchpad-contact">Parliamone</h3>
          <p>Un tool da segnalare, una correzione, una proposta.</p>
          <a href={contactEmailDestination.href} className="site-footer-v2__contact">
            <Mail size={16} aria-hidden="true" />
            Scrivici
          </a>
        </section>

        <div className="tv-launchpad__legal site-footer-v2__legal-row">
          {legalLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className="site-footer-v2__legal-link"
            >
              {link.label}
            </Link>
          ))}
          <ConsentFooterLink />
        </div>

        <p className="tv-launchpad__mark">TOOOLVIBES · {year}</p>

        <details className="tv-launchpad__disclosure">
          <summary>Trasparenza e affiliazioni</summary>
          <p className="site-footer-v2__disclosure">
            Alcuni link su TooolVibes sono link affiliati. Se acquisti tramite
            questi collegamenti, potremmo ricevere una commissione, senza costi
            aggiuntivi per te. Le partnership commerciali non determinano le
            valutazioni editoriali.
          </p>
        </details>
        </div>
      </div>
    </footer>
  );
}
