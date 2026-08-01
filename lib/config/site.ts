export const siteConfig = {
  name: "TooolVibes",
  description:
    "TooolVibes ti aiuta a smettere di cercare tool e iniziare a scegliere: evidenze, confronti e raccolte editoriali per decisioni software difendibili.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  signature:
    "Curato in Italia per chi vuole scegliere meglio, testare più velocemente e lanciare con più lucidità.",
  socialProof: "Tool AI selezionati e spiegati con criterio",
} as const;
