import { NextResponse } from "next/server";
import { signById } from "@/features/isl-classroom/content";
import { geminiText } from "@/lib/server/gemini";

/**
 * ISL Classroom "Explain": a short note about the WRITTEN English/Spanish phrase being learned (meaning, usage,
 * spelling). Gemini never describes handshapes or movements — signs come only from real signers' recordings.
 * Only the sign id, course and miss count are sent: no account, name or camera data.
 * Without a key (or on failure) the classroom shows its own note instead.
 */
const WINDOW_MS = 10 * 60_000, LIMIT = 20;
const hits = new Map<string, number[]>();
function allowed(ip: string, now: number) {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) { hits.set(ip, recent); return false; }
  recent.push(now); hits.set(ip, recent); if (hits.size > 5000) hits.clear(); return true;
}

export async function POST(request: Request) {
  const now = Date.now(); const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allowed(ip, now)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  let b: { course?: string; sign?: string; misses?: number };
  try { b = await request.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  const sign = signById(String(b.sign ?? "")); const spanish = b.course === "spanish";
  if (!sign) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const phrase = spanish ? sign.es : sign.en;
  const system = [
    `You are a warm teacher helping a Deaf learner in India whose first language is Indian Sign Language learn written ${spanish ? "Spanish" : "English"} at A1 level.`,
    "Write in plain English (A2 reading level), at most 3 short sentences. No markdown.",
    "Explain the meaning and when to use the written phrase, and give one tiny written example with its meaning.",
    "Never describe handshapes, movements, facial expressions or how to sign anything. Never claim to know the ISL sign.",
    Number(b.misses) > 0 ? "The learner found this one tricky, so be encouraging." : "",
  ].filter(Boolean).join("\n");
  try {
    const text = (await geminiText(system, `Phrase: "${phrase}"${spanish ? ` (English: "${sign.en}")` : ""}.`, { maxTokens: 220, temperature: 0.4 })).trim().slice(0, 500);
    if (!text) throw new Error("empty");
    return NextResponse.json({ text });
  } catch { return NextResponse.json({ error: "unavailable" }, { status: 502 }); }
}
