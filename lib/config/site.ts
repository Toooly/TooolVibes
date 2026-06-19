export const siteConfig = {
  name: "TooolVibes",
  description:
    "TooolVibes è la guida italiana per scegliere tool AI, SaaS, builder no-code e automazioni senza perdersi nel rumore.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  shopUrl: "https://shop.tooolvibes.com",
  signature:
    "Curato in Italia per chi vuole scegliere meglio, testare più velocemente e lanciare con più lucidità.",
  socialProof: "Tool AI selezionati e spiegati con criterio",
} as const;
