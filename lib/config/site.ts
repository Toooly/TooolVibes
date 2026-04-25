export const siteConfig = {
  name: "TooolVibes",
  description:
    "Archivio editoriale italiano per orientarsi tra strumenti AI e SaaS con piu` criterio e meno rumore.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  shopUrl: "https://shop.tooolvibes.com",
  signature: "Curato in Italia per chi vuole orientarsi bene, stringere il campo e scegliere con piu` lucidita`.",
  socialProof: "Archivio editoriale AI e SaaS",
} as const;
