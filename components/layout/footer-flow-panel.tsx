"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useDiscoverySnapshot } from "@/lib/discovery/client-store";
import { useDiscoveryPersistence } from "@/components/discovery/discovery-persistence-provider";

type FlowMeta = {
  eyebrow: string;
  title: string;
  description: string;
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
};

export function FooterFlowPanel() {
  const pathname = usePathname();
  const persistence = useDiscoveryPersistence();
  const discovery = useDiscoverySnapshot();
  const shortlistCount = discovery.shortlist.length;
  const compareCount = discovery.compare.length;

  const persistenceLabel =
    persistence.mode === "remote"
      ? persistence.phase === "saving"
        ? "Sync in corso"
        : persistence.phase === "error"
          ? "Sync in pausa"
          : "Workspace salvata"
      : "Sessione locale";

  const flow = useMemo<FlowMeta>(() => {
    if (pathname.startsWith("/archivio")) {
      return {
        eyebrow: "Fine discovery",
        title: "Dall'archivio devi uscire con un candidato chiaro.",
        description: "Se un profilo regge, salvalo. Se i candidati sono gia` pochi, confrontali.",
        primary: { href: "/shortlist", label: shortlistCount > 0 ? "Apri shortlist" : "Inizia shortlist" },
        secondary: { href: compareCount > 1 ? "/compare" : "/collections", label: compareCount > 1 ? "Apri compare" : "Apri collections" },
      };
    }

    if (pathname.startsWith("/shortlist")) {
      return {
        eyebrow: "Fine workspace",
        title: "La shortlist serve a ricordare bene e poi a tagliare.",
        description: "Quando il set comincia a stringersi, il passo successivo deve essere compare.",
        primary: { href: "/compare", label: compareCount > 1 ? "Apri compare" : "Prepara compare" },
        secondary: { href: "/archivio", label: "Torna all'archivio" },
      };
    }

    if (pathname.startsWith("/compare")) {
      return {
        eyebrow: "Fine confronto",
        title: "Dopo il confronto conta fissare cosa resta davvero in gioco.",
        description: "Il compare chiarisce il distacco. La shortlist tiene memoria del verdetto.",
        primary: { href: shortlistCount > 0 ? "/shortlist" : "/archivio", label: shortlistCount > 0 ? "Riapri la shortlist" : "Torna all'archivio" },
        secondary: { href: "/account", label: "Apri account" },
      };
    }

    if (pathname.startsWith("/toools/")) {
      return {
        eyebrow: "Dopo il profilo",
        title: "Il profilo non chiude la lettura: apre una decisione.",
        description: "Da qui devi salvare, confrontare o riportare il tool dentro un percorso piu` guidato.",
        primary: { href: "/shortlist", label: "Vai a shortlist" },
        secondary: { href: "/compare", label: "Apri compare" },
      };
    }

    if (pathname.startsWith("/collections")) {
      return {
        eyebrow: "Dopo la collection",
        title: "La collection vale quando lascia in mano candidati piu` chiari.",
        description: "Usala come contesto di partenza, poi sposta i tool forti in workspace o in compare.",
        primary: { href: "/shortlist", label: "Apri shortlist" },
        secondary: { href: compareCount > 1 ? "/compare" : "/archivio", label: compareCount > 1 ? "Apri compare" : "Torna all'archivio" },
      };
    }

    if (pathname.startsWith("/account")) {
      return {
        eyebrow: "Stato account",
        title: "L'account serve a non perdere continuita`, non a deviare il percorso.",
        description: "Dopo aver chiarito stato e accesso, il prodotto deve riportarti subito alla selezione attiva.",
        primary: { href: compareCount > 1 ? "/compare" : "/shortlist", label: compareCount > 1 ? "Continua compare" : "Apri shortlist" },
        secondary: { href: "/collections", label: "Apri collections" },
      };
    }

    return {
      eyebrow: "Continua da qui",
      title: "TooolVibes funziona quando ogni pagina ti lascia un passo chiaro.",
      description: "Orientamento, discovery, workspace e accesso devono restare leggibili come ruoli distinti.",
      primary: { href: "/archivio", label: "Apri archivio" },
      secondary: { href: "/collections", label: "Apri collections" },
    };
  }, [compareCount, pathname, shortlistCount]);

  return (
    <div className="rounded-[26px] border border-white/10 bg-white/6 px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[36rem]">
          <p className="editorial-label !text-white/60">{flow.eyebrow}</p>
          <h3 className="text-display-card mt-3 max-w-none text-[1.42rem] text-white sm:max-w-[18ch] sm:text-balance">
            {flow.title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-white/74">{flow.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Shortlist", value: shortlistCount },
            { label: "Compare", value: compareCount },
            { label: "Workspace", value: persistenceLabel },
          ].map((item) => (
            <span
              key={item.label}
              className="selection-chip rounded-full border border-white/12 px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-white/84"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              {item.label}: {item.value}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href={flow.primary.href}
          className="button-shell button-primary text-ui-strong inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white"
        >
          {flow.primary.label}
          <span aria-hidden="true" className="button-arrow">
            →
          </span>
        </Link>
        <Link
          href={flow.secondary.href}
          className="button-shell button-secondary text-ui-strong inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
        >
          {flow.secondary.label}
        </Link>
      </div>
    </div>
  );
}
