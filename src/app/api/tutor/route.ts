import { NextResponse } from "next/server";
import { scriptedReply, type TutorRequest } from "@/lib/tutor/engine";
import { aiReply, configuredProvider } from "@/lib/tutor/providers";
import { SCENARIOS } from "@/lib/tutor/scenarios";

/** Abuse guard: a generous sliding window per client. Normal practice never reaches it; runaway scripts do. */
const WINDOW_MS = 10 * 60_000, LIMIT = 40;
const hits = new Map<string, number[]>();
function allowed(ip: string, now: number): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) { hits.set(ip, recent); return false; }
  recent.push(now); hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  return true;
}
const LANGS = ["es", "en", "fr", "hi"];

export async function GET() {
  return NextResponse.json({ provider: configuredProvider()?.name ?? "scripted" });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allowed(ip, Date.now())) return NextResponse.json({ error: "You're practising fast! Take a short breather and try again in a few minutes." }, { status: 429 });
  let body: Partial<TutorRequest>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const history = Array.isArray(body.history) ? body.history.filter((t) => t && (t.role === "tutor" || t.role === "learner") && typeof t.text === "string").slice(-16).map((t) => ({ role: t.role, text: t.text.slice(0, 500) })) : [];
  if (!SCENARIOS.some((s) => s.id === body.scenario) || !LANGS.includes(body.target ?? "")) return NextResponse.json({ error: "Unknown scenario or language." }, { status: 400 });
  const req: TutorRequest = { scenario: body.scenario!, target: body.target!, targetName: String(body.targetName ?? "").slice(0, 30), nativeName: String(body.nativeName ?? "").slice(0, 30),
    level: String(body.level ?? "beginner").slice(0, 40), history, step: Number.isInteger(body.step) ? Math.max(0, body.step!) : 0, retry: !!body.retry };

  const provider = configuredProvider();
  if (provider) {
    try { const r = await aiReply(provider, req); if (r) return NextResponse.json(r); } catch { /* provider down: fall through to the scripted tutor */ }
  }
  const scripted = scriptedReply(req);
  if (scripted) return NextResponse.json(scripted);
  return NextResponse.json({ error: provider ? "The AI tutor is unavailable right now. Scripted scenes still work — try Restaurant or Meeting new people." : "This scenario needs an AI provider, and none is configured on this deployment. Scripted scenes still work — try Restaurant or Meeting new people." }, { status: 503 });
}
