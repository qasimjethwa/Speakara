import { es } from "./es";
import { hi } from "./hi";
export type UiLang = "en" | "es" | "hi";
const DICTS: Record<UiLang, Record<string, string>> = { en: {}, es, hi };
/** English text is the key. Missing translations fall back to English, and a test fails if any key is missing. */
export function translate(lang: UiLang, key: string, vars?: Record<string, string | number>): string {
  let out = DICTS[lang][key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
  return out;
}
