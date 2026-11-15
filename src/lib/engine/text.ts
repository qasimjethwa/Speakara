/** Answer normalisation and comparison. Deterministic: no LLM is needed to grade ordinary exercises. */
const CONTRACTIONS: Record<string, string> = {
  "i'm": "i am", "what's": "what is", "it's": "it is", "he's": "he is", "she's": "she is", "you're": "you are",
  "don't": "do not", "doesn't": "does not", "isn't": "is not", "goodnight": "good night",
};

export function normalize(s: string): string {
  // ё and е are the same letter for answer-checking purposes (Russian texts often omit the dots).
  let out = s.normalize("NFC").toLowerCase().replace(/ё/g, "е").replace(/[’‘`]/g, "'").replace(/[¿?¡!.,;:"“”।()\-–—]/g, " ");
  out = out.replace(/\s+/g, " ").trim();
  return out.split(" ").map((w) => CONTRACTIONS[w] ?? w).join(" ");
}
/**
 * Accent tolerance for Latin letters with French/Italian/Spanish-style marks only (grave, acute, circumflex, cedilla).
 * Meaningful marks are kept: ñ (año ≠ ano), umlauts (Mütter ≠ Mutter), diaeresis, breve, and every non-Latin script
 * (Devanagari vowel signs, Cyrillic й, Hangul jamo).
 */
export const stripAccents = (s: string) => s.normalize("NFD").replace(/([A-Za-z])[\u0300-\u0302\u0327]/g, "$1").normalize("NFC");

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]; prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

const baseLetter = (c: string) => c.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
/** Edit distance where swapping a letter for the same letter with a different mark costs two edits. */
export function weightedLevenshtein(a: string, b: string): number {
  const cost = (x: string, y: string) => (x === y ? 0 : baseLetter(x) === baseLetter(y) ? 2 : 1);
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]; prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + cost(a[i - 1], b[j - 1]));
      diag = tmp;
    }
  }
  return prev[b.length];
}

export type Verdict = { correct: boolean; note?: "accent" | "typo"; expected: string };

/** Exact match → accent-insensitive match → small-typo tolerance (1 edit, 2 for answers of 16+ chars). */
export function compareText(given: string, accepted: string[]): Verdict {
  const expected = accepted[0];
  const g = normalize(given);
  if (!g) return { correct: false, expected };
  const norm = accepted.map(normalize);
  if (norm.includes(g)) return { correct: true, expected };
  const gA = stripAccents(g);
  if (norm.some((a) => stripAccents(a) === gA)) return { correct: true, note: "accent", expected };
  for (const a of norm) {
    const budget = a.length >= 16 ? 2 : a.length >= 6 ? 1 : 0;
    // A diacritic-only difference (Mütter vs Mutter, año vs ano) is a different word, not a typo: it costs two edits.
    if (budget && weightedLevenshtein(g, a) <= budget) return { correct: true, note: "typo", expected };
  }
  return { correct: false, expected };
}

export const tokens = (s: string) => s.replace(/[¿?¡!.,;:"“”।]/g, " ").split(/\s+/).filter(Boolean);

/** Share of expected words heard in a speech transcript (order-insensitive, accent-insensitive). */
export function speechScore(transcript: string, expected: string): number {
  const want = stripAccents(normalize(expected)).split(" ");
  const got = new Set(stripAccents(normalize(transcript)).split(" "));
  if (!want.length) return 0;
  return want.filter((w) => got.has(w)).length / want.length;
}

/** Word-level speaking feedback: which expected words the recogniser heard (in order-insensitive, accent-insensitive form). */
export function assessSpeech(transcript: string, expected: string): { words: { word: string; heard: boolean }[]; score: number } {
  const got = new Set(stripAccents(normalize(transcript)).split(" "));
  const words = tokens(expected).map((word) => ({ word, heard: got.has(stripAccents(normalize(word))) }));
  return { words, score: words.length ? words.filter((w) => w.heard).length / words.length : 0 };
}
