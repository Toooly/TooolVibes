"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "./brand-logo";
import { ArrowUpRight, Mail } from "lucide-react";

import { trackSponsorOpportunityClick } from "@/lib/analytics/sponsor-events";
import { useNavItems } from "@/lib/navigation/navigation-release-context";
import { getNavDestination } from "@/lib/navigation/selectors";
import { ConsentFooterLink } from "@/components/ads/consent-footer-link";

const contactEmailDestination = getNavDestination("contact-email");

const SPONSOR_OPPORTUNITY_HREF = "/sponsorizza";

function FooterLink({ href, label, icon: Icon, onClick }: {
  href: string;
  label: string;
  onClick?: () => void;
  icon?: React.ComponentType<{
    className?: string;
    size?: number;
    "aria-hidden"?: React.AriaAttributes["aria-hidden"];
  }>;
}) {
  return (
    <Link
      href={href}
      className="site-footer-v2__link group"
      data-sonic-action="nav"
      onClick={onClick}
    >
      {Icon && (
        <Icon
          size={14}
          className="site-footer-v2__link-icon"
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
      <ArrowUpRight
        size={12}
        className="site-footer-v2__link-arrow"
        aria-hidden="true"
      />
    </Link>
  );
}

export function SiteFooterV2() {
  const productLinks = useNavItems("footer-v2-product");
  const companyLinks = useNavItems("footer-v2-company");
  const legalLinks = useNavItems("footer-v2-legal");
  const socialLinks = useNavItems("footer-v2-social");
  const pathname = usePathname() ?? "/";
  return (
    <footer className="site-footer-v2 relative mt-auto">
      <div className="site-footer-v2__shell">
        <div className="site-footer-v2__grid">
          <div className="lg:col-span-1">
            <Link href="/" className="site-footer-v2__brand group">
              <div className="site-footer-v2__logo">
                <BrandLogo size={40} fallback="png" priority />
              </div>
              <span className="site-footer-v2__wordmark">
                TOOOLVIBES
              </span>
            </Link>
            <p className="site-footer-v2__summary">
              Il sistema decisionale per confrontare tool AI, SaaS e no-code,
              scegliere il tuo stack e conservare il motivo di ogni scelta.
            </p>
            <div className="site-footer-v2__socials">
              {socialLinks.map((social) => {
                const SocialIcon = social.icon;
                return (
                  <a
                    key={social.id}
                    href={social.href}
                    className="site-footer-v2__social"
                    aria-label={social.label}
                  >
                    {SocialIcon ? <SocialIcon size={18} aria-hidden="true" /> : null}
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h3>Prodotto</h3>
            <div className="site-footer-v2__links">
              {productLinks.map((link) => (
                <FooterLink
                  key={link.id}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                />
              ))}
            </div>
          </div>

          <div>
            <h3>TooolVibes</h3>
            <div className="site-footer-v2__links">
              {companyLinks.map((link) => (
                <FooterLink
                  key={link.id}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                  onClick={
                    link.href === SPONSOR_OPPORTUNITY_HREF
                      ? () => {
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
                      : undefined
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <h3>Parliamone</h3>
            <p className="site-footer-v2__newsletter-copy">
              Hai un tool da segnalare, una correzione o una proposta?
              Scrivici: ci aiuta a mantenere il catalogo più utile e aggiornato.
            </p>
            <a
              href={contactEmailDestination.href}
              className="site-footer-v2__contact"
            >
              <Mail size={16} aria-hidden="true" />
              Scrivici
            </a>
          </div>
        </div>

        <div className="site-footer-v2__legal-row">
          <p>
            &copy; {new Date().getFullYear()} TooolVibes. Tutti i diritti riservati.
          </p>
          <div className="site-footer-v2__legal-links">
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
        </div>
        <p className="site-footer-v2__disclosure">
          Alcuni link su TooolVibes sono link affiliati. Se acquisti tramite questi collegamenti, potremmo ricevere una commissione, senza costi aggiuntivi per te. Le partnership commerciali non determinano le valutazioni editoriali.
        </p>
      </div>
    </footer>
  );
}
