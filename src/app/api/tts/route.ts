import { NextResponse } from "next/server";

/**
 * Optional server text-to-speech. Disabled unless TTS_BASE_URL, TTS_API_KEY and TTS_MODEL are set (any
 * OpenAI-compatible /audio/speech endpoint). Responses are cached by the browser and the CDN for a year, so each
 * sentence is synthesised once. Without it the app uses the browser's own voices.
 */
export async function GET(request: Request) {
  const { TTS_BASE_URL: base, TTS_API_KEY: key, TTS_MODEL: model, TTS_VOICE: voice } = process.env;
  if (!base || !key || !model) return NextResponse.json({ error: "Server text-to-speech is not configured." }, { status: 404 });
  const q = new URL(request.url).searchParams;
  const text = (q.get("text") ?? "").slice(0, 300);
  if (!text.trim()) return NextResponse.json({ error: "Missing text." }, { status: 400 });
  const r = await fetch(`${base.replace(/\/$/, "")}/audio/speech`, { method: "POST", signal: AbortSignal.timeout(20_000),
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` }, body: JSON.stringify({ model, voice: voice ?? "alloy", input: text, response_format: "mp3" }) }).catch(() => null);
  if (!r?.ok) return NextResponse.json({ error: "Speech provider unavailable." }, { status: 502 });
  return new NextResponse(r.body, { headers: { "content-type": "audio/mpeg", "cache-control": "public, max-age=31536000, immutable" } });
}
