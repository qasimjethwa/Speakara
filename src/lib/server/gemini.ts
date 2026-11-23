/**
 * Server-side Gemini text helper (the key never leaves the server). Tries the configured model, then fallbacks,
 * and logs Google's error status/message (never the key) so failures are diagnosable in Vercel logs.
 */
const FALLBACKS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-flash-latest"];

export async function geminiText(system: string, user: string, opts: { model?: string; maxTokens?: number; temperature?: number } = {}): Promise<string> {
  const key = process.env.GEMINI_API_KEY; if (!key) throw new Error("no_key");
  const models = [...new Set([opts.model, ...FALLBACKS].filter((m): m is string => !!m))];
  let last = "";
  for (const model of models) {
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
      last = `${model}: ${r.status} ${body.replace(/AIza[0-9A-Za-z_-]+/g, "[key]").slice(0, 300)}`;
      if (r.status === 400 && /API key|API_KEY/i.test(body)) break;   // a bad key fails every model
    }
  }
  console.error("gemini failed:", last);
  throw new Error("gemini_failed");
}
