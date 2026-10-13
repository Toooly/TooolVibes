import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const dictionaryUrl = new URL("../../public/locales/en.json", import.meta.url);
const localeUrl = new URL("../../lib/i18n/locale.ts", import.meta.url);
const dictionary = await readFile(dictionaryUrl);
const version = createHash("sha256").update(dictionary).digest("hex").slice(0, 12);
const source = await readFile(localeUrl, "utf8");
const pattern = /ENGLISH_DICTIONARY_URL = "\/locales\/en\.json\?v=[a-f0-9]+"/;
if (!pattern.test(source)) throw new Error("English dictionary URL declaration was not found.");
const updated = source.replace(pattern, `ENGLISH_DICTIONARY_URL = "/locales/en.json?v=${version}"`);
if (updated !== source) await writeFile(localeUrl, updated);
process.stdout.write(`English dictionary version: ${version}\n`);
