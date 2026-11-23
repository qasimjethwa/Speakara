/**
 * Server-side Gemini text helper (the key never leaves the server). Tries the configured model, then fallbacks,
 * and logs Google's error status/message (never the key) so failures are diagnosable in Vercel logs.
 */
const FALLBACKS = ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-2.5-flash-lite", "gemini-2.5-flash"];

export async function geminiText(system: string, user: string, opts: { model?: string; maxTokens?: number; temperature?: number } = {}): Promise<string> {
  const key = process.env.GEMINI_API_KEY; if (!key) throw new Error("no_key");
  const avail = await available(key);
  // free-tier friendly aliases first; skip models this key has no quota for (learned from 429s)
  const models = [...new Set([opts.model, ...FALLBACKS.filter((m) => !avail.length || avail.includes(m)), ...avail].filter((m): m is string => !!m && !noQuota.has(m)))].slice(0, 5);
  const errors: string[] = []; let last = "";
  for (const model of models) for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt) await new Promise((res) => setTimeout(res, 900));
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST", signal: AbortSignal.timeout(15_000), headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: { maxOutputTokens: opts.maxTokens ?? 400, temperature: opts.temperature ?? 0.5 } }),
    });
    if (r.ok) {
      const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";
      if (text) return text;
      last = `${model}: empty response`;
    } else {
      const body = await r.text().catch(() => "");
      last = `${model}: ${r.status} ${body.replace(/AIza[0-9A-Za-z_-]+/g, "[key]").replace(/\s+/g, " ").slice(0, 200)}`; errors.push(last);
      if (r.status === 429) noQuota.add(model);
      if (r.status === 400 && /API key|API_KEY/i.test(body)) { console.error("gemini failed: invalid key"); throw new Error("gemini_failed"); }
      if (r.status === 503) continue;   // overloaded: retry once, then the next model
      break;
    }
  }
  console.error("gemini failed:", errors.length ? errors.join(" | ") : last);
  throw new Error("gemini_failed");
}

/** Text models this key can call (cached per server instance), newest "flash" models first. */
const noQuota = new Set<string>();
let cached: { at: number; names: string[] } | null = null;
async function available(key: string): Promise<string[]> {
  if (cached && Date.now() - cached.at < 3600_000) return cached.names;
  try {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", { headers: { "x-goog-api-key": key }, signal: AbortSignal.timeout(8000) });
    const j = (await r.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
    const names = (j.models ?? []).filter((m) => m.supportedGenerationMethods?.includes("generateContent")).map((m) => m.name.replace(/^models\//, ""))
      .filter((n) => /flash/.test(n) && !/live|tts|image|audio|preview-native|embedding|thinking/.test(n))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    cached = { at: Date.now(), names }; return names;
  } catch { return []; }
}
