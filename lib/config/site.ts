export const siteConfig = {
  name: "TooolVibes",
  description:
    "TooolVibes è la directory premium per scegliere AI tools, SaaS, no-code builder, vibe coding tool e automazioni senza rumore.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  shopUrl: "https://shop.tooolvibes.com",
  signature:
    "Curato in Italia per chi vuole scegliere meglio, testare più velocemente e lanciare con più lucidità.",
  socialProof: "Premium AI tools discovery system",
} as const;
