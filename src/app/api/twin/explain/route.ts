import { NextResponse } from "next/server";
import { getCourse } from "@/lib/content";
import { geminiText } from "@/lib/server/gemini";

/**
 * Learning companion: natural-language coaching from Gemini (server-side key only).
 * Gemini EXPLAINS decisions the rule-based Learning Twin already made; it never decides mastery or invents scores.
 * The request carries only the learner's measured summary and stated preferences — no name, account id or free text
 * beyond an optional short question — because a free API tier may use prompts to improve its models.
 */
const WINDOW_MS = 10 * 60_000, LIMIT = 15;
const hits = new Map<string, number[]>();
function allowed(ip: string, now: number) {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) { hits.set(ip, recent); return false; }
  recent.push(now); hits.set(ip, recent); if (hits.size > 5000) hits.clear(); return true;
}
const SKILLS = ["vocabulary", "grammar", "reading", "writing", "listening", "speaking"];
const s = (v: unknown, n: number) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").slice(0, n);

interface Body {
  course?: string; lang?: string; question?: string;
  skills?: { skill: string; band: string; correct: number; total: number }[];
  mistakes?: string[]; recommendation?: { title: string; reason: string };
  goal?: string; style?: string; correction?: string; interests?: string[];
}

export async function POST(request: Request) {
  const now = Date.now(); const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allowed(ip, now)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const key = process.env.GEMINI_API_KEY; if (!key) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  let b: Body; try { b = await request.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  const course = getCourse(s(b.course, 20));
  const lang = ({ en: "English", es: "Spanish", hi: "Hindi" } as Record<string, string>)[s(b.lang, 2)] ?? "English";
  const skills = (Array.isArray(b.skills) ? b.skills : []).filter((x) => SKILLS.includes(x?.skill)).slice(0, 6)
    .map((x) => `${x.skill}: ${s(x.band, 20)} (${Math.max(0, Math.min(999, Number(x.correct) || 0))} of ${Math.max(0, Math.min(999, Number(x.total) || 0))} right in the last 30 days)`);
  const mistakes = (Array.isArray(b.mistakes) ? b.mistakes : []).slice(0, 5).map((m) => s(m, 80));
  const facts = [
    `Course: ${course.targetName} for ${course.nativeName} speakers, A1.`,
    skills.length ? `Measured skills: ${skills.join("; ")}.` : "No skills measured yet.",
    mistakes.length ? `Items answered wrong at least twice recently: ${mistakes.join("; ")}.` : "",
    b.recommendation ? `The app recommended: "${s(b.recommendation.title, 100)}" because "${s(b.recommendation.reason, 240)}".` : "",
    b.goal ? `Goal: ${s(b.goal, 20)}.` : "", b.style ? `Prefers: ${s(b.style, 20)} teaching.` : "",
    b.correction ? `Correction preference: ${s(b.correction, 20)}.` : "", b.interests?.length ? `Interests: ${b.interests.slice(0, 6).map((i) => s(i, 20)).join(", ")}.` : "",
  ].filter(Boolean).join("\n");
  const system = [
    `You are Speakara's learning companion. Write in ${lang}, warmly and plainly, for a beginner (max 110 words).`,
    "Use ONLY the facts given. Never invent scores, percentages, levels or past events. Do not judge the learner's ability beyond the facts.",
    `Explain why the recommended step helps and give ONE concrete tip with one short ${course.targetName} example (with its meaning). If a question is asked, answer it about learning ${course.targetName}.`,
    "Match their preferred teaching style. Do not ask for personal information. No markdown headings.",
  ].join("\n");
  const user = `${facts}${b.question ? `\nLearner's question: ${s(b.question, 300)}` : ""}`;
  try {
    const text = (await geminiText(system, user, { model: process.env.TWIN_GEMINI_MODEL, maxTokens: 400 })).slice(0, 1200);
    return NextResponse.json({ text });
  } catch { return NextResponse.json({ error: "unavailable" }, { status: 502 }); }
}
