"use client";

import { useLocale } from "@/components/i18n/locale-provider";
export function GuideMasthead() {
  const { locale } = useLocale();
  return (
    <header className="guides-masthead" aria-labelledby="guides-masthead-title">
      <div className="guides-masthead__lede">
        <h1 id="guides-masthead-title" className="guides-masthead__title">{locale === "en" ? <>Guides to help you <em>choose</em>.</> : <>Guide scritte per <em>decidere</em>.</>}
        </h1>
        <p className="guides-masthead__dek">{locale === "en" ? "Use cases, practical steps and clear limits to help you choose a tool and put it to work." : "Casi d’uso, passaggi pratici e limiti dei tool: scegli cosa provare e come inserirlo nel tuo lavoro."}</p>
      </div>
    </header>
  );
}
