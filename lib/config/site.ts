export const siteConfig = {
  name: "TooolVibes",
  description:
    "Catalogo editoriale di tool AI, SaaS, no-code. Selezione, confronti e raccolte per scegliere con criterio.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  signature:
    "Curato in Italia. Selezioniamo, confrontiamo e spieghiamo tool AI, SaaS e no-code per aiutarti a scegliere con più contesto.",
  socialProof: "Tool AI, SaaS e no-code. Selezionati, confrontati, spiegati.",
} as const;
