import all from "./translations.json";
/** Hindi interface strings. Drafted without a native reviewer — see docs/content/CONTENT-LICENSING.md. */
export const hi: Record<string, string> = Object.fromEntries(Object.entries(all as Record<string, string[]>).map(([k, v]) => [k, v[1]]));
