/**
 * Public-safe helpers for tool extended markdown.
 *
 * Strips internal editorial blocks and maps `##` headings onto the
 * public Approfondisci accordion — without rendering CTA, alternatives,
 * or snapshot-only decision copy twice.
 */

export type PublicToolMarkdownSectionId =
  | "overview"
  | "features"
  | "useCases"
  | "fit"
  | "notFit"
  | "strengths"
  | "limits"
  | "experience"
  | "pricing"
  | "alternatives"
  | "verdict"
  | "faq";

export type ToolMarkdownSection = {
  title: string;
  body: string;
};

export type PublicToolMarkdown = {
  stripped: string;
  sections: ToolMarkdownSection[];
  byId: Partial<Record<PublicToolMarkdownSectionId, string>>;
};

const INTERNAL_HEADING_IDS = new Set(["cta e stati"]);

const HEADING_ALIASES: Record<string, PublicToolMarkdownSectionId> = {
  overview: "overview",
  "overview approfondita": "overview",
  funzionalita: "features",
  "casi duso": "useCases",
  "ideale per": "fit",
  "meno adatto per": "notFit",
  "punti di forza": "strengths",
  limiti: "limits",
  "esperienza duso": "experience",
  pricing: "pricing",
  alternative: "alternatives",
  "verdetto editoriale": "verdict",
  faq: "faq",
};

function normalizeHeading(title: string) {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isInternalHeading(title: string) {
  return INTERNAL_HEADING_IDS.has(normalizeHeading(title));
}

export function splitToolMarkdownSections(markdown: string): ToolMarkdownSection[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const sections: ToolMarkdownSection[] = [];
  let current: { title: string; bodyLines: string[] } | null = null;
  const preamble: string[] = [];

  const pushCurrent = () => {
    if (!current) return;
    sections.push({
      title: current.title,
      body: current.bodyLines.join("\n").trim(),
    });
  };

  for (const line of lines) {
    const heading = /^##[ \t]+(.+?)\s*$/.exec(line);
    if (heading) {
      if (current) {
        pushCurrent();
      } else {
        const lead = preamble.join("\n").trim();
        if (lead) sections.push({ title: "", body: lead });
      }
      current = { title: heading[1].trim(), bodyLines: [] };
      continue;
    }

    if (current) current.bodyLines.push(line);
    else preamble.push(line);
  }

  if (current) pushCurrent();
  else {
    const lead = preamble.join("\n").trim();
    if (lead) sections.push({ title: "", body: lead });
  }

  return sections;
}

function serializeSections(sections: ToolMarkdownSection[]) {
  return sections
    .map((section) => {
      if (!section.title) return section.body;
      return section.body
        ? `## ${section.title}\n\n${section.body}`
        : `## ${section.title}`;
    })
    .join("\n\n")
    .trim();
}

export function stripInternalToolMarkdown(markdown: string): string {
  const kept = splitToolMarkdownSections(markdown).filter(
    (section) => !section.title || !isInternalHeading(section.title),
  );
  return serializeSections(kept);
}

function headingId(title: string): PublicToolMarkdownSectionId | null {
  if (!title || isInternalHeading(title)) return null;
  return HEADING_ALIASES[normalizeHeading(title)] ?? null;
}

export function parsePublicToolMarkdown(
  markdown: string | null | undefined,
): PublicToolMarkdown {
  const stripped = stripInternalToolMarkdown(markdown ?? "");
  const sections = splitToolMarkdownSections(stripped);
  const byId: PublicToolMarkdown["byId"] = {};

  for (const section of sections) {
    const id = headingId(section.title);
    if (!id || !section.body) continue;
    byId[id] = byId[id] ? `${byId[id]}\n\n${section.body}` : section.body;
  }

  if (!byId.overview) {
    const preamble = sections.find((section) => !section.title && section.body);
    if (preamble) byId.overview = preamble.body;
  }

  return { stripped, sections, byId };
}

export function firstListItemOrSentence(
  markdown: string | null | undefined,
  maxChars = 220,
): string | null {
  if (!markdown) return null;

  const bullet = markdown.match(/^(?:[-*]|\d+\.)\s+(.+)$/m);
  const raw = (bullet?.[1] ?? markdown)
    .replace(/\*\*/g, "")
    .replace(/^#+\s+/gm, "")
    .split("\n")
    .map((line) => line.replace(/^(?:[-*]|\d+\.)\s+/, "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!raw) return null;
  if (raw.length <= maxChars) return raw;

  const cut = raw.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : maxChars).trim()}…`;
}

export function extractMarkdownTradeOff(verdict: string | null | undefined) {
  if (!verdict) return null;
  const match = verdict.match(/\*\*Trade-off da considerare:\*\*\s*(.+)/i);
  return match?.[1]?.replace(/\*\*/g, "").trim() || null;
}

export function extractMarkdownVerdict(verdict: string | null | undefined) {
  if (!verdict) return null;
  const convince = verdict.match(/\*\*Cosa ci convince:\*\*\s*(.+)/i);
  if (convince?.[1]) return convince[1].replace(/\*\*/g, "").trim();
  return firstListItemOrSentence(verdict);
}
