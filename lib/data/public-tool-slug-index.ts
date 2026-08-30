export type PublicToolSlugIndexEntry = {
  slug: string;
  name: string;
};

export const PUBLIC_TOOL_SLUG_INDEX: readonly PublicToolSlugIndexEntry[] = [
  { slug: "blink", name: "Blink" },
  { slug: "vibecode", name: "VibeCode" },
  { slug: "weweb", name: "WeWeb" },
  { slug: "cosmicjs", name: "CosmicJS" },
  { slug: "mocha", name: "Mocha" },
  { slug: "v0", name: "v0" },
  { slug: "meku", name: "Meku" },
  { slug: "jenni-ai", name: "Jenni AI" },
  { slug: "betterpic", name: "BetterPic" },
  { slug: "imagine-art", name: "Imagine Art" },
  { slug: "muse-ai", name: "Muse AI" },
  { slug: "socleads", name: "Socleads" },
  { slug: "windsor-ai", name: "Windsor AI" },
  { slug: "frase-ai", name: "Frase AI" },
  { slug: "synthesia-ai", name: "Synthesia AI" },
  { slug: "notionapps", name: "NotionApps" },
  { slug: "blogify", name: "Blogify" },
  { slug: "livechat", name: "LiveChat" },
  { slug: "chatbot", name: "ChatBot" },
  { slug: "helpdesk", name: "HelpDesk" },
  { slug: "wegic", name: "Wegic" },
  { slug: "vidau", name: "Vidau" },
  { slug: "lemon-squeezy", name: "Lemon Squeezy" },
  { slug: "vibrantsnap", name: "VibrantSnap" },
  { slug: "reachifyme", name: "ReachifyMe" },
  { slug: "make", name: "Make" },
  { slug: "omi", name: "Omi" },
  { slug: "flowise", name: "Flowise" },
  { slug: "tolt", name: "Tolt" },
  { slug: "agentx", name: "AgentX" },
];

export function findPublicToolIndexEntry(slug: string) {
  return PUBLIC_TOOL_SLUG_INDEX.find((tool) => tool.slug === slug) ?? null;
}
