import {
  Bookmark,
  Columns3,
  Compass,
  Heart,
  Home,
  LayoutGrid,
  Mail,
  Radar,
  ShoppingBag,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import { siteConfig } from "@/lib/config/site";

import type { NavDestination } from "./types";

/**
 * BATCH 29 — Registry canonico delle destinazioni di navigazione
 * (IA-501 "Config navigazione unica", IA-503 "Scope delle route secondarie").
 *
 * INVENTARIO PRE-MIGRAZIONE (reversibilità): questa configurazione riproduce
 * esattamente la visibilità corrente dei consumer, che prima mantenevano
 * registry separati:
 *
 * - `site-header-v2.tsx`: navLinks locali (7 voci mobile, prime 5 su desktop)
 *   con icona e tone per voce; CTA account esclusa (Account state → B30).
 * - `site-header.tsx` (legacy): primaryNav locale (7 voci, "Radar live"),
 *   CTA "Admin" e "Suggerisci"; oggi non importato da alcun layout.
 * - `mobile-bottom-nav.tsx`: mobileItems locali (5 voci) con badge compare.
 * - `site-footer.tsx` (legacy): footerNav (9), categoryNav (6 facet
 *   `/archivio?group=*`), meta bar (Shop esterno, "Product Hunt" → /radar,
 *   Suggerisci, Diventa affiliato, "Archivio" → /archivio), CTA hero.
 * - `site-footer-v2.tsx`: footerLinks locali explore/community/legal, social
 *   mailto e CTA newsletter "Scrivici".
 *
 * DECISIONI IA-503 (visibilità INVARIATA in questo batch):
 * - Community e Shop restano route secondarie raggiungibili: i contenuti
 *   esistono e sono curati, ma non sono il flusso primario; nessuna rimozione
 *   o noindex viene applicato qui. Le proposte di cambio visibilità sono
 *   registrate nel campo `proposal` e richiedono un batch dedicato.
 * - Il link "Product Hunt" della meta bar legacy punta a `/radar` perché
 *   `/product-hunt` esegue un permanentRedirect verso `/radar`: la label
 *   storica è preservata e la divergenza è documentata come proposta.
 * - Le label non canoniche ("Radar live", "Shop digitale", "Affiliati",
 *   "Archivio", "Admin") sono override di placement espliciti, così il
 *   canonical resta univoco (Catalogo/Salvati/Confronto).
 */

export const navigationRegistry: readonly NavDestination[] = [
  {
    id: "home",
    kind: "route",
    href: "/",
    label: "Home",
    owner: "product-catalog",
    audience: "public",
    kpi: "ingressi al catalogo dalla home",
    releaseFlag: "home",
    scope: "primary",
    scopeDecision:
      "Route primaria di ingresso: resta su header v2, header legacy, bottom nav e footer legacy.",
    placements: [
      {
        surface: "header-v2-desktop",
        order: 0,
        icon: Sparkles,
      },
      {
        surface: "header-v2-mobile",
        order: 0,
        icon: Sparkles,
        tone: ["#7C4DFF", "#39D2F6", "#B388FF"],
      },
      { surface: "header-legacy-nav", order: 0 },
      { surface: "bottom-nav", order: 0, icon: Home },
      { surface: "footer-nav", order: 0 },
    ],
  },
  {
    id: "catalog",
    kind: "route",
    href: "/archivio",
    label: "Catalogo",
    owner: "product-catalog",
    audience: "public",
    kpi: "ricerche avviate e schede tool aperte",
    releaseFlag: "catalog",
    scope: "primary",
    scopeDecision:
      "Cuore del prodotto: presente su ogni surface pubblica principale.",
    placements: [
      {
        surface: "header-v2-desktop",
        order: 1,
        icon: LayoutGrid,
      },
      {
        surface: "header-v2-mobile",
        order: 1,
        icon: LayoutGrid,
        tone: ["#6A3CFF", "#00E5FF", "#8B6CFF"],
      },
      { surface: "header-legacy-nav", order: 1 },
      { surface: "bottom-nav", order: 1, icon: LayoutGrid },
      { surface: "footer-nav", order: 1 },
      { surface: "footer-meta", order: 4, label: "Archivio" },
      { surface: "footer-v2-explore", order: 0, icon: LayoutGrid },
    ],
  },
  {
    id: "radar",
    kind: "route",
    href: "/radar",
    label: "Radar",
    owner: "product-radar",
    audience: "public",
    kpi: "visite radar e click verso i tool segnalati",
    releaseFlag: "radar",
    scope: "primary",
    scopeDecision:
      "Route primaria di scoperta settimanale; la meta bar legacy la raggiunge con label storica \"Product Hunt\" perché /product-hunt fa permanentRedirect verso /radar.",
    proposal:
      "Valutare il riallineamento della label meta \"Product Hunt\" a \"Radar\" (o il redirect inverso) in un batch dedicato: cambia il copy visibile, quindi NON applicato in B29.",
    placements: [
      {
        surface: "header-v2-desktop",
        order: 2,
        icon: Radar,
      },
      {
        surface: "header-v2-mobile",
        order: 2,
        icon: Radar,
        tone: ["#7C4DFF", "#39D2F6", "#F3BF4C"],
      },
      { surface: "header-legacy-nav", order: 2, label: "Radar live" },
      { surface: "bottom-nav", order: 2, icon: Radar },
      { surface: "footer-nav", order: 5 },
      { surface: "footer-meta", order: 1, label: "Product Hunt" },
      { surface: "footer-v2-explore", order: 1, icon: Radar },
    ],
  },
  {
    id: "compare",
    kind: "route",
    href: "/compare",
    label: "Confronto",
    owner: "product-decision",
    audience: "public",
    kpi: "confronti avviati e completati",
    releaseFlag: "compare",
    scope: "primary",
    scopeDecision:
      "Flusso decisionale primario: header v2 e bottom nav (con badge conteggio).",
    placements: [
      {
        surface: "header-v2-desktop",
        order: 3,
        icon: Zap,
      },
      {
        surface: "header-v2-mobile",
        order: 3,
        icon: Zap,
        tone: ["#8B6CFF", "#FF5EB8", "#39D2F6"],
      },
      { surface: "bottom-nav", order: 4, icon: Columns3 },
      { surface: "footer-v2-explore", order: 2, icon: Sparkles },
    ],
  },
  {
    id: "shortlist",
    kind: "route",
    href: "/shortlist",
    label: "Salvati",
    owner: "product-decision",
    audience: "public",
    kpi: "tool salvati per utente",
    releaseFlag: "shortlist",
    scope: "primary",
    scopeDecision:
      "Flusso decisionale primario: header v2 e bottom nav; il footer v2 la espone come voce explore.",
    placements: [
      {
        surface: "header-v2-desktop",
        order: 4,
        icon: Compass,
      },
      {
        surface: "header-v2-mobile",
        order: 4,
        icon: Compass,
        tone: ["#6A3CFF", "#B388FF", "#00E5FF"],
      },
      { surface: "bottom-nav", order: 3, icon: Bookmark },
      { surface: "footer-v2-explore", order: 3, icon: Heart },
    ],
  },
  {
    id: "shop",
    kind: "route",
    href: "/shop",
    label: "Shop",
    owner: "revenue",
    audience: "public",
    kpi: "click verso lo shop esterno e pagine kit viste",
    releaseFlag: "shop",
    scope: "secondary",
    scopeDecision:
      "IA-503: keep secondary. La pagina esiste ed è curata, ma lo shop non è il flusso primario: resta fuori dalla desktop nav v2 e dalla bottom nav; visibilità invariata (menu mobile v2, header legacy, entrambi i footer).",
    proposal:
      "Proposta NON applicata: valutare de-enfatizzazione (solo footer) o label \"Premium\" quando la strategia monetizzazione sarà definita dal product owner.",
    placements: [
      {
        surface: "header-v2-mobile",
        order: 5,
        icon: ShoppingBag,
        tone: ["#7C4DFF", "#F3BF4C", "#39D2F6"],
      },
      { surface: "header-legacy-nav", order: 5 },
      { surface: "footer-nav", order: 7, label: "Shop digitale" },
      { surface: "footer-v2-community", order: 1, icon: ShoppingBag },
    ],
  },
  {
    id: "community",
    kind: "route",
    href: "/community",
    label: "Community",
    owner: "product-engagement",
    audience: "public",
    kpi: "segnalazioni e contributi ricevuti dalla community",
    releaseFlag: "community",
    scope: "secondary",
    scopeDecision:
      "IA-503: keep secondary. La pagina è una vetrina di contributi senza piattaforma attiva: resta raggiungibile e indicizzata, fuori dalla desktop nav v2 e dalla bottom nav; visibilità invariata.",
    proposal:
      "Proposta NON applicata: valutare label preview/beta o spostamento ai soli footer finché la piattaforma community non è attiva (decisione product owner).",
    placements: [
      {
        surface: "header-v2-mobile",
        order: 6,
        icon: Users,
        tone: ["#8B6CFF", "#39D2F6", "#FF5EB8"],
      },
      { surface: "header-legacy-nav", order: 6 },
      { surface: "footer-nav", order: 6 },
      { surface: "footer-v2-community", order: 2, icon: Users },
    ],
  },
  {
    id: "suggest",
    kind: "route",
    href: "/shortlist#wishlist",
    label: "Suggerisci",
    owner: "product-catalog",
    audience: "public",
    kpi: "suggerimenti di tool inviati",
    releaseFlag: "suggest",
    scope: "secondary",
    scopeDecision:
      "Entry point di submission: anchor della route /shortlist, presente su header legacy e footer legacy.",
    placements: [
      { surface: "header-legacy-nav", order: 3 },
      { surface: "footer-nav", order: 3 },
      { surface: "footer-meta", order: 2 },
    ],
  },
  {
    id: "affiliates",
    kind: "route",
    href: "/affiliati",
    label: "Diventa affiliato",
    owner: "revenue",
    audience: "public",
    kpi: "richieste di affiliazione inviate",
    releaseFlag: "affiliates",
    scope: "secondary",
    scopeDecision:
      "Programma affiliati attivo ma secondario: header legacy, footer legacy e colonna community del footer v2 (label breve \"Affiliati\").",
    placements: [
      { surface: "header-legacy-nav", order: 4 },
      { surface: "footer-nav", order: 4 },
      { surface: "footer-meta", order: 3 },
      {
        surface: "footer-v2-community",
        order: 4,
        label: "Affiliati",
        icon: Heart,
      },
    ],
  },
  {
    id: "tags",
    kind: "route",
    href: "/tags",
    label: "Categorie",
    owner: "product-catalog",
    audience: "public",
    kpi: "navigazioni per categoria dal footer",
    releaseFlag: "tags",
    scope: "secondary",
    scopeDecision:
      "Mappa tag del catalogo: esposta solo dal footer legacy come voce \"Categorie\".",
    placements: [{ surface: "footer-nav", order: 2 }],
  },
  {
    id: "admin-login",
    kind: "route",
    href: "/admin/login",
    label: "Login amministratore",
    owner: "platform-admin",
    audience: "admin",
    kpi: "accessi redazionali riusciti",
    releaseFlag: "adminLogin",
    scope: "secondary",
    scopeDecision:
      "Accesso back office: nessuna evidenza pubblica primaria; resta su header legacy (CTA \"Admin\") e footer legacy.",
    placements: [
      { surface: "header-legacy-actions", order: 0, label: "Admin" },
      { surface: "footer-nav", order: 8 },
    ],
  },
  {
    id: "facet-vibe-coding",
    kind: "facet",
    href: "/archivio?group=vibe-coding",
    label: "Vibe coding",
    owner: "product-catalog",
    audience: "public",
    kpi: "click su facet catalogo dal footer",
    releaseFlag: "facetVibeCoding",
    scope: "secondary",
    scopeDecision:
      "Facet del catalogo (/archivio?group=*): shortcut editoriale del footer legacy, non una route autonoma.",
    placements: [{ surface: "footer-categories", order: 0 }],
  },
  {
    id: "facet-ai-app-builder",
    kind: "facet",
    href: "/archivio?group=ai-app-builder",
    label: "Builder app AI",
    owner: "product-catalog",
    audience: "public",
    kpi: "click su facet catalogo dal footer",
    releaseFlag: "facetAiAppBuilder",
    scope: "secondary",
    scopeDecision:
      "Facet del catalogo (/archivio?group=*): shortcut editoriale del footer legacy, non una route autonoma.",
    placements: [{ surface: "footer-categories", order: 1 }],
  },
  {
    id: "facet-no-code",
    kind: "facet",
    href: "/archivio?group=no-code",
    label: "No-code",
    owner: "product-catalog",
    audience: "public",
    kpi: "click su facet catalogo dal footer",
    releaseFlag: "facetNoCode",
    scope: "secondary",
    scopeDecision:
      "Facet del catalogo (/archivio?group=*): shortcut editoriale del footer legacy, non una route autonoma.",
    placements: [{ surface: "footer-categories", order: 2 }],
  },
  {
    id: "facet-automation",
    kind: "facet",
    href: "/archivio?group=automation",
    label: "Automazioni",
    owner: "product-catalog",
    audience: "public",
    kpi: "click su facet catalogo dal footer",
    releaseFlag: "facetAutomation",
    scope: "secondary",
    scopeDecision:
      "Facet del catalogo (/archivio?group=*): shortcut editoriale del footer legacy, non una route autonoma.",
    placements: [{ surface: "footer-categories", order: 3 }],
  },
  {
    id: "facet-ai-agents",
    kind: "facet",
    href: "/archivio?group=ai-agents",
    label: "Agenti AI",
    owner: "product-catalog",
    audience: "public",
    kpi: "click su facet catalogo dal footer",
    releaseFlag: "facetAiAgents",
    scope: "secondary",
    scopeDecision:
      "Facet del catalogo (/archivio?group=*): shortcut editoriale del footer legacy, non una route autonoma.",
    placements: [{ surface: "footer-categories", order: 4 }],
  },
  {
    id: "facet-ai-video",
    kind: "facet",
    href: "/archivio?group=ai-video",
    label: "Video AI",
    owner: "product-catalog",
    audience: "public",
    kpi: "click su facet catalogo dal footer",
    releaseFlag: "facetAiVideo",
    scope: "secondary",
    scopeDecision:
      "Facet del catalogo (/archivio?group=*): shortcut editoriale del footer legacy, non una route autonoma.",
    placements: [{ surface: "footer-categories", order: 5 }],
  },
  {
    id: "shop-external",
    kind: "external",
    href: siteConfig.shopUrl,
    label: "Shop",
    owner: "revenue",
    audience: "public",
    kpi: "click in uscita verso lo shop esterno",
    releaseFlag: "shopExternal",
    scope: "secondary",
    scopeDecision:
      "Vetrina esterna (siteConfig.shopUrl): link diretto nella meta bar del footer legacy e CTA hero \"Apri lo shop digitale\".",
    placements: [{ surface: "footer-meta", order: 0 }],
  },
  {
    id: "chi-siamo",
    kind: "route",
    href: "/chi-siamo",
    label: "Chi siamo",
    owner: "editorial",
    audience: "public",
    kpi: "visite pagina chi-siamo",
    releaseFlag: "chiSiamo",
    scope: "secondary",
    scopeDecision:
      "Pagina istituzionale: esposta solo dalla colonna community del footer v2.",
    placements: [{ surface: "footer-v2-community", order: 0, icon: Users }],
  },
  {
    id: "posts",
    kind: "route",
    href: "/posts",
    label: "Blog",
    owner: "editorial",
    audience: "public",
    kpi: "letture dei post dal footer",
    releaseFlag: "posts",
    scope: "secondary",
    scopeDecision:
      "Archivio editoriale: esposto solo dalla colonna community del footer v2 con label \"Blog\".",
    placements: [{ surface: "footer-v2-community", order: 3, icon: Sparkles }],
  },
  {
    id: "privacy",
    kind: "route",
    href: "/privacy",
    label: "Privacy",
    owner: "legal-compliance",
    audience: "public",
    kpi: "visite pagina privacy",
    releaseFlag: "privacy",
    scope: "secondary",
    scopeDecision:
      "Route legale obbligatoria: colonna legal del footer v2.",
    placements: [{ surface: "footer-v2-legal", order: 0 }],
  },
  {
    id: "termini",
    kind: "route",
    href: "/termini",
    label: "Termini",
    owner: "legal-compliance",
    audience: "public",
    kpi: "visite pagina termini",
    releaseFlag: "termini",
    scope: "secondary",
    scopeDecision:
      "Route legale obbligatoria: colonna legal del footer v2.",
    placements: [{ surface: "footer-v2-legal", order: 1 }],
  },
  {
    id: "cookie",
    kind: "route",
    href: "/cookie",
    label: "Cookie",
    owner: "legal-compliance",
    audience: "public",
    kpi: "visite pagina cookie",
    releaseFlag: "cookie",
    scope: "secondary",
    scopeDecision:
      "Route legale obbligatoria: colonna legal del footer v2.",
    placements: [{ surface: "footer-v2-legal", order: 2 }],
  },
  {
    id: "contact-email",
    kind: "external",
    href: "mailto:hello@tooolvibes.com",
    label: "Email",
    owner: "support",
    audience: "public",
    kpi: "contatti diretti ricevuti",
    releaseFlag: "contactEmail",
    scope: "secondary",
    scopeDecision:
      "Contatto diretto (mailto): icona social del footer v2 e CTA newsletter \"Scrivici\" finché la newsletter non è attiva.",
    placements: [{ surface: "footer-v2-social", order: 0, icon: Mail }],
  },
];
