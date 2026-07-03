"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, GitCompare, Rocket, Search, Zap } from "lucide-react";

const STEPS = [
  {
    num: "01",
    label: "Scopri",
    title: "Parti da tool già curati",
    description:
      "Categorie leggibili, filtri utili e una selezione editoriale che tiene fuori il rumore. Nessuna vetrina infinita.",
    href: "/archivio",
    cta: "Apri catalogo",
    color: "#6a3cff",
    colorB: "#9f5bff",
    icon: Search,
    stat: "120+",
    statLabel: "Tool curati",
  },
  {
    num: "02",
    label: "Confronta",
    title: "Confronta solo i candidati forti",
    description:
      "Porta avanti pochi tool alla volta e guarda differenze, livello e casi d'uso reali. La matrice serve a isolare gli scarti.",
    href: "/compare",
    cta: "Vai al confronto",
    color: "#39d2f6",
    colorB: "#0ea5e9",
    icon: GitCompare,
    stat: "5",
    statLabel: "Al massimo",
  },
  {
    num: "03",
    label: "Salva",
    title: "Chiudi con una scelta rapida",
    description:
      "Salva, rivedi e trasforma la ricerca in una lista operativa pronta da provare. Dai salvati si passa all'azione.",
    href: "/shortlist",
    cta: "Apri salvati",
    color: "#f3bf4c",
    colorB: "#ff8a00",
    icon: Bookmark,
    stat: "Senza limite",
    statLabel: "Salvabili",
  },
];

function MethodPanel({
  step,
  index,
}: {
  step: (typeof STEPS)[number];
  index: number;
}) {
  const Icon = step.icon;
  return (
    <article
      className="mobile-method-room__panel"
      style={
        {
          "--method-a": step.color,
          "--method-b": step.colorB,
          "--method-delay": `${index * 120}ms`,
        } as CSSProperties
      }
    >
      <div className="mobile-method-room__panel-inner">
        <div className="mobile-method-room__panel-top">
          <span className="mobile-method-room__panel-num">{step.num}</span>
          <div className="mobile-method-room__panel-icon">
            <Icon className="size-5" />
          </div>
        </div>

        <span className="mobile-method-room__panel-label">{step.label}</span>
        <h3 className="mobile-method-room__panel-title">{step.title}</h3>
        <p className="mobile-method-room__panel-desc">{step.description}</p>

        <div className="mobile-method-room__panel-stat">
          <strong>{step.stat}</strong>
          <span>{step.statLabel}</span>
        </div>

        <Link
          href={step.href}
          className="mobile-method-room__panel-cta"
        >
          {step.cta}
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}

export function MobileMethodRoom() {
  return (
    <div className="mobile-method-room">
      {/* Sfondo stellato */}
      <div className="mobile-method-room__stars" aria-hidden="true" />

      <header className="mobile-method-room__header">
        <div className="mobile-method-room__badge">
          <Rocket className="size-4" />
          <span>Metodo</span>
        </div>
        <h1>Scopri, confronta, salva</h1>
        <p>
          Un percorso chiaro: scopri, confronta, decidi. Senza perdere tempo tra decine di schede uguali.
        </p>
      </header>

      <div className="mobile-method-room__grid">
        {STEPS.map((step, i) => (
          <MethodPanel key={step.label} step={step} index={i} />
        ))}
      </div>

      <div className="mobile-method-room__footer">
        <p className="mobile-method-room__footer-label">Pronto a iniziare?</p>
        <Link
          href="/archivio"
          className="mobile-method-room__footer-cta"
        >
          <Zap className="size-4" />
          Inizia il percorso
        </Link>
        <div className="mobile-method-room__footer-links">
          <Link href="/compare">Confronto</Link>
          <span>·</span>
          <Link href="/shortlist">Salvati</Link>
          <span>·</span>
          <Link href="/radar">Radar</Link>
        </div>
      </div>
    </div>
  );
}
