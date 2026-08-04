export const siteConfig = {
  name: "TooolVibes",
  description:
    "Sistema decisionale per tool AI, SaaS e no-code: confronta alternative e trade-off, scegli il tuo stack e conserva il motivo di ogni scelta.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  signature:
    "Costruito in Italia. Aiutiamo founder, indie developer e team SaaS a scegliere il proprio stack con evidenze, trade-off espliciti e memoria delle decisioni.",
  socialProof: "Per founder, indie developer e team SaaS che devono scegliere il proprio stack.",
} as const;
