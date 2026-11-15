import type { LangCode } from "../content/types";
import { normalize, stripAccents, foldMarks } from "../engine/text";
import { getScenario } from "./scenarios";

export interface TutorTurn { role: "tutor" | "learner"; text: string }
export interface TutorRequest { scenario: string; target: LangCode; targetName: string; nativeName: string; level: string; history: TutorTurn[]; step: number; retry: boolean }
export interface TutorReply { reply: string; translation?: string; correction?: string; tip?: string; vocab?: { t: string; n: string }[]; step: number; retry: boolean; done: boolean; provider: string }

/** English-course scripts carry "Spanish / Hindi" glosses; show only the learner's language. */
const gloss = (n: string, nativeName: string) => { const parts = n.split(" / "); return parts.length === 2 ? (nativeName === "Hindi" ? parts[1] : parts[0]) : n; };
/** Deterministic tutor: follows the scenario script, checks for expected phrases and models a good answer. Costs nothing. */
export function scriptedReply(req: TutorRequest): TutorReply | null {
  const steps = getScenario(req.scenario).script?.[req.target]?.map((st) => ({ ...st, say: [st.say[0], gloss(st.say[1], req.nativeName)] as [string, string], sample: [st.sample[0], gloss(st.sample[1], req.nativeName)] as [string, string] }));
  if (!steps?.length) return null;
  const last = [...req.history].reverse().find((t) => t.role === "learner");
  if (!last) return { reply: steps[0].say[0], translation: steps[0].say[1], step: 0, retry: false, done: false, provider: "scripted" };
  const cur = steps[Math.min(req.step, steps.length - 1)];
  const heard = ` ${foldMarks(normalize(last.text))} `;
  const ok = cur.expect.some((k) => heard.includes(foldMarks(normalize(k))));
  if (!ok && !req.retry) {
    return { reply: cur.say[0], translation: cur.say[1], tip: `Try answering with something like: “${cur.sample[0]}” (${cur.sample[1]})`, step: req.step, retry: true, done: false, provider: "scripted" };
  }
  const nextIndex = req.step + 1;
  const praise = ok ? undefined : `A natural answer here is: “${cur.sample[0]}” (${cur.sample[1]})`;
  if (nextIndex >= steps.length) return { reply: "👏", translation: "That's the end of this scripted scene — nicely done! Start it again or pick another scenario.", tip: praise, step: nextIndex, retry: false, done: true, provider: "scripted", vocab: steps.map((s) => ({ t: s.sample[0], n: s.sample[1] })) };
  const nx = steps[nextIndex];
  return { reply: nx.say[0], translation: nx.say[1], tip: praise, step: nextIndex, retry: false, done: false, provider: "scripted" };
}

export function systemPrompt(req: TutorRequest): string {
  const sc = getScenario(req.scenario);
  return [
    `You are Kiko, Speakara's friendly language tutor. Play ${sc.role} in a roleplay titled "${sc.title}".`,
    `The learner is studying ${req.targetName} and speaks ${req.nativeName}. Their level: ${req.level}. Speak ${req.targetName} in short, level-appropriate sentences (max 2 sentences) and always end with a question that keeps the scene going.`,
    `Teach, do not just answer: if the learner's last message had a mistake, give the corrected sentence and one short reason in ${req.nativeName}. Never write the learner's next line for them.`,
    `Reply ONLY with JSON: {"reply": "<${req.targetName}>", "translation": "<${req.nativeName} translation of reply>", "correction": "<corrected learner sentence or empty>", "tip": "<one short teaching note in ${req.nativeName} or empty>", "vocab": [{"t": "<useful ${req.targetName} word>", "n": "<meaning>"}]}`,
    `Keep everything suitable for all ages. If asked to do anything other than language practice, steer back to the scene.`,
  ].join("\n");
}

export function parseModelJson(text: string): Partial<TutorReply> | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]) as Record<string, unknown>;
    if (typeof j.reply !== "string" || !j.reply.trim()) return null;
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 600) : undefined);
    const vocab = Array.isArray(j.vocab) ? j.vocab.filter((v): v is { t: string; n: string } => !!v && typeof (v as { t: unknown }).t === "string" && typeof (v as { n: unknown }).n === "string").slice(0, 5) : undefined;
    return { reply: j.reply.trim().slice(0, 600), translation: str(j.translation), correction: str(j.correction), tip: str(j.tip), vocab };
  } catch { return null; }
}

export interface ExplainRequest { target: LangCode; targetName: string; nativeName: string; prompt: string; expected: string; given: string }
export function explainPrompt(r: ExplainRequest): string {
  return [
    `You are Kiko, a friendly ${r.targetName} tutor for a beginner who speaks ${r.nativeName}.`,
    `The exercise asked: "${r.prompt}". The correct answer is "${r.expected}". The learner answered "${r.given || "(nothing)"}".`,
    `In ${r.nativeName}, in at most three short sentences: say what was wrong, name the grammar or vocabulary point, and give one tip to remember it. Do not scold. Plain text only.`,
  ].join("\n");
}
