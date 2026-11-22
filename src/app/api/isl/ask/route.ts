import { NextResponse } from "next/server";
import { getIslCourse, getIslUnit } from "@/lib/isl/courses";
import { configuredProvider } from "@/lib/tutor/providers";

/**
 * Optional text help for the ISL lesson ("Ask a question"). Server-side only; keys never reach the browser.
 * Only the question and the lesson's word/unit are sent — no account id, name or progress — because a free API tier
 * may use prompts to improve its models. The model explains written English/Spanish only and must NOT describe
 * how to sign: signs come only from reviewed animations.
 * Returns 503 when no model is configured; the lesson then answers from its own content.
 */
const WINDOW_MS = 10 * 60_000, LIMIT = 20;
const hits = new Map<string, number[]>();
function allowed(ip: string, now: number) {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) { hits.set(ip, recent); return false; }
  recent.push(now); hits.set(ip, recent); if (hits.size > 5000) hits.clear(); return true;
}

function islSystemPrompt(target: string, unitTitle: string, word?: { text: string; meaning: string; example: string }) {
  return [
    `You are a patient teacher helping a Deaf learner in India learn written ${target} at A1 level. Their first language is Indian Sign Language (ISL).`,
    `Lesson: ${unitTitle}.${word ? ` Current word: "${word.text}" (${word.meaning}). Example: "${word.example}".` : ""}`,
    "Answer in plain, short English (max 3 sentences, A2 reading level). Use one short example in the target language when useful.",
    "Never describe handshapes, movements or how to sign anything, and never claim to show or generate ISL signs. If asked how to sign something, say the teacher shows reviewed signs and suggest the ISLRTC dictionary.",
    "If the question is unrelated to learning the language, kindly bring it back to the lesson. Do not ask for personal information.",
  ].join("\n");
}

async function gemini(system: string, question: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY; if (!key) throw new Error("no key");
  const model = process.env.ISL_GEMINI_MODEL ?? "gemini-2.5-flash";
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST", signal: AbortSignal.timeout(15_000), headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: question }] }], generationConfig: { maxOutputTokens: 300, temperature: 0.4 } }),
  });
  if (!r.ok) throw new Error(`gemini ${r.status}`);
  const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
}

export async function POST(request: Request) {
  const now = Date.now(); const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allowed(ip, now)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  let body: { course?: string; unit?: string; word?: string; question?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  const course = getIslCourse(String(body.course ?? "")); const unit = course && getIslUnit(course, String(body.unit ?? ""));
  const question = String(body.question ?? "").trim().slice(0, 300);
  if (!course || !unit || !question) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const w = unit.vocab.find((x) => x.id === body.word);
  const system = islSystemPrompt(course.target, unit.titleMeaning || unit.title, w);
  try {
    let answer = "";
    if (process.env.GEMINI_API_KEY) answer = await gemini(system, question);
    else { const p = configuredProvider(); if (!p) return NextResponse.json({ error: "unavailable" }, { status: 503 }); answer = await p.complete(system, [{ role: "user", content: question }]); }
    answer = answer.trim().slice(0, 600);
    if (!answer) throw new Error("empty");
    return NextResponse.json({ answer });
  } catch { return NextResponse.json({ error: "unavailable" }, { status: 502 }); }
}
