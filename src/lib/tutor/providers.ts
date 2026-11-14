import { parseModelJson, systemPrompt, type TutorReply, type TutorRequest } from "./engine";

/** Provider-independent AI layer. Keys are read server-side only; add a provider by adding one function here. */
export interface TutorProvider { name: string; complete: (system: string, turns: { role: "user" | "assistant"; content: string }[]) => Promise<string> }

export function configuredProvider(env: NodeJS.ProcessEnv = process.env): TutorProvider | null {
  const choice = (env.AI_PROVIDER ?? "").toLowerCase();
  if ((choice === "anthropic" || !choice) && env.ANTHROPIC_API_KEY) {
    const model = env.AI_TUTOR_MODEL ?? "claude-haiku-5-5";
    return { name: "anthropic", complete: async (system, messages) => {
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", signal: AbortSignal.timeout(20_000),
        headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model, max_tokens: 400, system, messages }) });
      if (!r.ok) throw new Error(`anthropic ${r.status}`);
      const j = (await r.json()) as { content: { type: string; text?: string }[] };
      return j.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    } };
  }
  if ((choice === "openai-compatible" || !choice) && env.AI_API_KEY && env.AI_BASE_URL && env.AI_TUTOR_MODEL) {
    return { name: "openai-compatible", complete: async (system, messages) => {
      const r = await fetch(`${env.AI_BASE_URL!.replace(/\/$/, "")}/chat/completions`, { method: "POST", signal: AbortSignal.timeout(20_000),
        headers: { "content-type": "application/json", authorization: `Bearer ${env.AI_API_KEY}` },
        body: JSON.stringify({ model: env.AI_TUTOR_MODEL, max_tokens: 400, messages: [{ role: "system", content: system }, ...messages] }) });
      if (!r.ok) throw new Error(`provider ${r.status}`);
      const j = (await r.json()) as { choices: { message: { content: string } }[] };
      return j.choices[0]?.message.content ?? "";
    } };
  }
  return null;
}

export async function aiReply(p: TutorProvider, req: TutorRequest): Promise<TutorReply | null> {
  const turns = req.history.slice(-12).map((t) => ({ role: t.role === "learner" ? ("user" as const) : ("assistant" as const), content: t.text }));
  if (!turns.length || turns[0].role !== "user") turns.unshift({ role: "user", content: "(The learner has just arrived. Greet them and open the scene.)" });
  const parsed = parseModelJson(await p.complete(systemPrompt(req), turns));
  if (!parsed?.reply) return null;
  return { reply: parsed.reply, translation: parsed.translation, correction: parsed.correction, tip: parsed.tip, vocab: parsed.vocab, step: req.step + 1, retry: false, done: false, provider: p.name };
}
