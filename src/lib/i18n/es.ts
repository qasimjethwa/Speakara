import all from "./translations.json";
/** Spanish interface strings. Source of truth: translations.json — { english: [spanish, hindi] }. */
export const es: Record<string, string> = Object.fromEntries(Object.entries(all as Record<string, string[]>).map(([k, v]) => [k, v[0]]));
