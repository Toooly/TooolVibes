"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

export type AboutService = {
  title: string;
  label: string;
  copy: string;
  icon: ReactNode;
};

type AboutServicesProps = {
  services: ReadonlyArray<AboutService>;
  children?: ReactNode;
};

function ServiceCard({
  service,
  index,
  shouldReduceMotion,
}: {
  service: AboutService;
  index: number;
  shouldReduceMotion: boolean | null;
}) {
  return (
    <motion.article
      key={service.title}
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-90px" }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : {
              duration: 0.4,
              delay: Math.min(index * 0.04, 0.16),
              ease: [0.16, 1, 0.3, 1],
            }
      }
      className="v-about-service-card"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="v-about-service-icon">{service.icon}</span>
        <span className="v-about-service-label">{service.label}</span>
      </div>
      <h3 className="v-about-service-title">{service.title}</h3>
      <p className="v-about-service-copy">{service.copy}</p>
    </motion.article>
  );
}

export function AboutServices({ services, children }: AboutServicesProps) {
  const shouldReduceMotion = useReducedMotion();
  const lead = services.slice(0, 2);
  const rest = services.slice(2);

  return (
    <div aria-label="Servizi offerti">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {lead.map((service, index) => (
          <ServiceCard
            key={service.title}
            service={service}
            index={index}
            shouldReduceMotion={shouldReduceMotion}
          />
        ))}
        {rest.length > 0 ? (
          <details className="v-about-services-more sm:contents">
            <summary>Altri servizi</summary>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 sm:contents">
              {rest.map((service, index) => (
                <ServiceCard
                  key={service.title}
                  service={service}
                  index={index + lead.length}
                  shouldReduceMotion={shouldReduceMotion}
                />
              ))}
            </div>
          </details>
        ) : null}
      </div>
      {children}
    </div>
  );
}
