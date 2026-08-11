"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

export type AboutService = {
  title: string;
  label: string;
  copy: string;
  icon: ReactNode;
  accent: string;
};

type AboutServicesProps = {
  services: ReadonlyArray<AboutService>;
  children?: ReactNode;
};

export function AboutServices({ services, children }: AboutServicesProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Servizi offerti">
      {services.map((service, index) => (
        <motion.article
          key={service.title}
          initial={false}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-90px" }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  duration: 0.5,
                  delay: Math.min(index * 0.05, 0.25),
                  ease: [0.16, 1, 0.3, 1],
                }
          }
          className="v-about-service-card group"
          style={
            {
              "--card-accent": service.accent,
              "--card-accent-glow": `${service.accent}14`,
            } as React.CSSProperties
          }
        >
          <div className="flex items-start justify-between gap-4">
            <span className="v-about-service-icon" style={{ color: service.accent }}>
              {service.icon}
            </span>
            <span className="v-about-service-label">{service.label}</span>
          </div>
          <h3 className="v-about-service-title">{service.title}</h3>
          <p className="v-about-service-copy">{service.copy}</p>
        </motion.article>
      ))}
      {children}
    </div>
  );
}
