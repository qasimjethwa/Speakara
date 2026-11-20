import { closeRoom, fail, json, liveOp, LiveError, verifyWorker } from "@/lib/live/server";

/**
 * Called only by the companion agent worker (signed with LIVE_WORKER_SECRET).
 *  claim  – before starting Gemini or Anam: is this dispatch legitimate, and how long may it run?
 *  report – after the conversation: close the room, store the learning report and settle the minutes.
 */
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (!verifyWorker(raw, request.headers.get("x-speakara-ts"), request.headers.get("x-speakara-signature"))) throw new LiveError(401, "unauthenticated", "Unauthorised.");
    const body = JSON.parse(raw) as { op?: string; session_id?: string; room_name?: string; report?: unknown; memory?: unknown };
    if (typeof body.session_id !== "string" || typeof body.room_name !== "string" || !/^ai_[0-9a-f]{32}$/.test(body.room_name)) throw new LiveError(400, "bad_request", "Invalid request.");
    if (body.op === "claim") return json(await liveOp({ op: "worker_claim", session_id: body.session_id, room_name: body.room_name }));
    if (body.op === "report") {
      const closed = await closeRoom(body.room_name);
      return json(await liveOp({ op: "worker_report", session_id: body.session_id, room_closed: closed, report: body.report ?? null, memory: Array.isArray(body.memory) ? body.memory.slice(0, 30) : [] }));
    }
    throw new LiveError(400, "bad_request", "Invalid request.");
  } catch (e) { return fail(e); }
}
