export const siteConfig = {
  name: "TooolVibes",
  description:
    "Scegli i tool AI, SaaS e no-code con evidenze, confronti onesti e una memoria di perché li hai scelti.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  signature:
    "Costruito in Italia. Per founder, indie e team che devono decidere lo stack — e ricordarsene.",
  socialProof: "Per chi sceglie lo stack, non la lista della spesa.",
} as const;
