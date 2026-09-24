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
    <footer className="site-footer-v2 tv-utility relative mt-auto">
      <div className="tv-utility__shell site-footer-v2__shell">
        <div className="tv-utility__identity">
          <Link href="/" className="tv-utility__brand">
            <BrandLogo size={36} fallback="png" />
            <span className="tv-utility__wordmark">TooolVibes</span>
          </Link>
          <p className="tv-utility__summary">
            Il sistema decisionale per scegliere software con criterio,
            non l&apos;ennesima directory di tool.
          </p>
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

        <div className="tv-utility__service">
          <a
            href={contactEmailDestination.href}
            className="tv-utility__contact"
          >
            <Mail size={14} aria-hidden="true" />
            Scrivici
          </a>
        </div>

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
