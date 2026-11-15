import { NextResponse } from "next/server";
import { handleProgress, ProgressError, type ProgressRequest } from "@/lib/server/progress";

/** The only way a signed-in learner's XP, gems, streak, completions, quests or achievements can change. */
export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Please log in.", code: "unauthenticated" }, { status: 401 });
  let body: ProgressRequest;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request.", code: "bad_request" }, { status: 400 }); }
  try { return NextResponse.json(await handleProgress(token, body)); }
  catch (e) {
    if (e instanceof ProgressError) return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    console.error("progress failed", e);
    return NextResponse.json({ error: "Something went wrong saving your progress. Please try again.", code: "server" }, { status: 500 });
  }
}
