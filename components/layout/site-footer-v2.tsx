"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "./brand-logo";
import { useCommercialNow } from "@/components/monetization/commercial-clock";
import { ArrowUpRight, Mail } from "lucide-react";

import { trackSponsorOpportunityClick } from "@/lib/analytics/sponsor-events";
import { useNavItems } from "@/lib/navigation/navigation-release-context";
import { getNavDestination } from "@/lib/navigation/selectors";
import { ConsentFooterLink } from "@/components/ads/consent-footer-link";
import { useOnceInView } from "@/lib/motion/use-once-in-view";

const contactEmailDestination = getNavDestination("contact-email");

const SPONSOR_OPPORTUNITY_HREF = "/sponsorizza";
const FOOTER_DESKTOP_MQ = "(min-width: 48rem)";

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

function isDesktopFooter() {
  return typeof window.matchMedia === "function"
    && window.matchMedia(FOOTER_DESKTOP_MQ).matches;
}

function FooterNavGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useLayoutEffect(() => {
    const node = detailsRef.current;
    if (!node || typeof window.matchMedia !== "function") return;

    const mq = window.matchMedia(FOOTER_DESKTOP_MQ);
    const sync = () => {
      node.open = mq.matches;
    };

    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <details
      ref={detailsRef}
      className="site-footer-v2__group"
      open
      onToggle={(event) => {
        if (isDesktopFooter()) {
          event.currentTarget.open = true;
        }
      }}
    >
      <summary className="site-footer-v2__group-summary">
        <h3>{title}</h3>
      </summary>
      {children}
    </details>
  );
}

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
  const socialLinks = useNavItems("footer-v2-social");
  const pathname = usePathname() ?? "/";
  const isHome = pathname === "/";

  if (isHome) {
    return (
      <LaunchpadFooter
        year={year}
        pathname={pathname}
        companyLinks={companyLinks}
        legalLinks={legalLinks}
        socialLinks={socialLinks}
      />
    );
  }

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

          <FooterNavGroup title="Prodotto">
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
          </FooterNavGroup>

          <FooterNavGroup title="TooolVibes">
            <div className="site-footer-v2__links">
              {companyLinks.map((link) => (
                <FooterLink
                  key={link.id}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                  onClick={
                    link.href === SPONSOR_OPPORTUNITY_HREF
                      ? () => trackFooterSponsor(pathname)
                      : undefined
                  }
                />
              ))}
            </div>
          </FooterNavGroup>

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
            &copy; {year} TooolVibes. Tutti i diritti riservati.
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

function LaunchpadFooter({
  year,
  pathname,
  companyLinks,
  legalLinks,
  socialLinks,
}: {
  year: number;
  pathname: string;
  companyLinks: ReturnType<typeof useNavItems>;
  legalLinks: ReturnType<typeof useNavItems>;
  socialLinks: ReturnType<typeof useNavItems>;
}) {
  const { ref, hasBeenVisible, preferReducedMotion } = useOnceInView<HTMLDivElement>({
    threshold: 0.4,
  });

  return (
    <footer className="site-footer-v2 tv-launchpad relative mt-auto">
      <div className="tv-launchpad__shell site-footer-v2__shell">
        <div
          ref={ref}
          className="tv-launchpad__brand"
          data-settle={hasBeenVisible && !preferReducedMotion ? "true" : "false"}
        >
          <Link href="/" className="tv-launchpad__logo site-footer-v2__brand" aria-label="TOOOLVIBES">
            <div className="site-footer-v2__logo">
              <BrandLogo size={40} fallback="png" priority />
            </div>
            <span className="site-footer-v2__wordmark">TOOOLVIBES</span>
          </Link>
        </div>

        <h2 className="tv-launchpad__title">Dove vuoi andare adesso?</h2>

        <ul className="tv-launchpad__destinations">
          <li className="tv-launchpad__tile tv-launchpad__tile--discover">
            <p>Scopri</p>
            <Link href="/archivio">Catalogo</Link>
            <Link href="/radar">Radar</Link>
          </li>
          <li className="tv-launchpad__tile tv-launchpad__tile--build">
            <p>Costruisci</p>
            <Link href="/collections">Raccolte</Link>
            <Link href="/posts">Guide</Link>
          </li>
          <li className="tv-launchpad__tile tv-launchpad__tile--decide">
            <p>Decidi</p>
            <Link href="/compare">Confronto</Link>
            <Link href="/shortlist">Salvati</Link>
          </li>
        </ul>

        <section className="tv-launchpad__contact" aria-labelledby="tv-launchpad-contact">
          <h3 id="tv-launchpad-contact">Parliamone</h3>
          <p>
            Hai un tool da segnalare, una correzione o una proposta?
          </p>
          <a href={contactEmailDestination.href} className="site-footer-v2__contact">
            <Mail size={16} aria-hidden="true" />
            Scrivici
          </a>
        </section>

        <div className="tv-launchpad__company">
          <h3>TooolVibes</h3>
          <div>
            {companyLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="site-footer-v2__link"
                onClick={
                  link.href === SPONSOR_OPPORTUNITY_HREF
                    ? () => trackFooterSponsor(pathname)
                    : undefined
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

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
            Alcuni link su TooolVibes sono link affiliati. Se acquisti tramite questi collegamenti, potremmo ricevere una commissione, senza costi aggiuntivi per te. Le partnership commerciali non determinano le valutazioni editoriali.
          </p>
        </details>

        <div className="tv-launchpad__socials site-footer-v2__socials">
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
    </footer>
  );
}
