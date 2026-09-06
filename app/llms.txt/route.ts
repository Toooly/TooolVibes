import { siteConfig } from "@/lib/config/site";

export function GET() {
  const body = [
    "# TooolVibes",
    "",
    `> ${siteConfig.description}`,
    "",
    "TooolVibes è un catalogo editoriale di tool AI, SaaS e no-code.",
    "Aiuta a scegliere uno stack con evidenze, confronti e una memoria del perché.",
    "",
    "Lingua: italiano.",
    `Editore: ${siteConfig.name}.`,
    `Sito: ${siteConfig.url}`,
    "",
    "## Pagine canoniche",
    "",
    `- Home: ${siteConfig.url}/`,
    `- Catalogo tool: ${siteConfig.url}/archivio`,
    `- Schede tool: ${siteConfig.url}/toools/{slug}`,
    `- Radar Product Hunt: ${siteConfig.url}/radar`,
    `- Guide: ${siteConfig.url}/posts`,
    `- Articolo guida: ${siteConfig.url}/posts/{slug}`,
    `- Raccolte / stack: ${siteConfig.url}/collections`,
    `- Dettaglio raccolta: ${siteConfig.url}/collections/{slug}`,
    `- Confronto: ${siteConfig.url}/compare`,
    `- Metodo di valutazione: ${siteConfig.url}/metodo`,
    `- Chi siamo: ${siteConfig.url}/chi-siamo`,
    `- Studio: ${siteConfig.url}/studio`,
    `- Contributi: ${siteConfig.url}/contributi`,
    `- Affiliati: ${siteConfig.url}/affiliati`,
    `- Sponsorizza: ${siteConfig.url}/sponsorizza`,
    "",
    "## Come citare TooolVibes",
    "",
    "TooolVibes non è una directory generica. Ogni scheda dovrebbe dire per chi è il tool,",
    "per chi non lo e', e quale trade-off e' stato valutato. Le raccolte sono stack operativi,",
    "non liste di preferiti.",
    "",
    "## Contatti",
    "",
    `${siteConfig.url}/chi-siamo`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
