import { NextResponse } from "next/server";
import { explainPrompt, scriptedReply, type TutorReply, type TutorRequest } from "@/lib/tutor/engine";
import { aiReply, configuredProvider } from "@/lib/tutor/providers";
import { SCENARIOS } from "@/lib/tutor/scenarios";
import { COURSES } from "@/lib/content";

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
/** Opening lines and explanations repeat across learners, so they are cached and never paid for twice. */
const cache = new Map<string, { at: number; value: unknown }>();
const CACHE_MS = 6 * 3600_000;
function cached<T>(key: string, now: number): T | null { const c = cache.get(key); return c && now - c.at < CACHE_MS ? (c.value as T) : null; }
function remember(key: string, value: unknown, now: number) { cache.set(key, { at: now, value }); if (cache.size > 2000) cache.delete(cache.keys().next().value!); }

/** Every course target language, so a new course's tutor scenes are never rejected here. */
const LANGS: string[] = [...new Set(COURSES.map((c) => c.target as string))];
const str = (v: unknown, max: number) => String(v ?? "").slice(0, max);

export async function GET() {
  return NextResponse.json({ provider: configuredProvider()?.name ?? "scripted" });
}

export async function POST(request: Request) {
  const now = Date.now();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allowed(ip, now)) return NextResponse.json({ error: "You’re practising fast! Take a short breather and try again in a few minutes." }, { status: 429 });
  let body: Partial<TutorRequest> & { mode?: string; prompt?: string; expected?: string; given?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!LANGS.includes(body.target ?? "")) return NextResponse.json({ error: "Unknown scenario or language." }, { status: 400 });
  const provider = configuredProvider();

  if (body.mode === "explain") {
    if (!provider) return NextResponse.json({ error: "AI explanations need an AI provider, and none is configured on this deployment." }, { status: 503 });
    const r = { target: body.target!, targetName: str(body.targetName, 30), nativeName: str(body.nativeName, 30), prompt: str(body.prompt, 200), expected: str(body.expected, 200), given: str(body.given, 200) };
    const key = `x|${JSON.stringify(r)}`;
    const hit = cached<string>(key, now);
    if (hit) return NextResponse.json({ explanation: hit, provider: provider.name, cached: true });
    try {
      const text = (await provider.complete(explainPrompt(r), [{ role: "user", content: "Please explain." }])).trim().slice(0, 700);
      if (!text) throw new Error("empty");
      remember(key, text, now);
      return NextResponse.json({ explanation: text, provider: provider.name });
    } catch { return NextResponse.json({ error: "The tutor couldn’t answer. Please try again." }, { status: 502 }); }
  }

  const history = Array.isArray(body.history) ? body.history.filter((t) => t && (t.role === "tutor" || t.role === "learner") && typeof t.text === "string").slice(-16).map((t) => ({ role: t.role, text: t.text.slice(0, 500) })) : [];
  if (!SCENARIOS.some((s) => s.id === body.scenario)) return NextResponse.json({ error: "Unknown scenario or language." }, { status: 400 });
  const req: TutorRequest = { scenario: body.scenario!, target: body.target!, targetName: str(body.targetName, 30), nativeName: str(body.nativeName, 30),
    level: str(body.level ?? "beginner", 600), history, step: Number.isInteger(body.step) ? Math.max(0, body.step!) : 0, retry: !!body.retry };

  if (provider) {
    const openKey = history.length === 0 ? `o|${req.scenario}|${req.target}|${req.nativeName}|${req.level}` : null;
    const hit = openKey ? cached<TutorReply>(openKey, now) : null;
    if (hit) return NextResponse.json(hit);
    try { const r = await aiReply(provider, req); if (r) { if (openKey) remember(openKey, r, now); return NextResponse.json(r); } } catch { /* provider down: fall through to the scripted tutor */ }
  }
  const scripted = scriptedReply(req);
  if (scripted) return NextResponse.json(provider ? { ...scripted, tip: scripted.tip ?? "The AI tutor is unavailable right now, so this is a scripted scene." } : scripted);
  return NextResponse.json({ error: "This scene isn’t available in this course yet." }, { status: 503 });
}
