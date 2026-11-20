import { closeRoom, fail, isAgentInRoom, json, liveOp, LiveError, reportToken, sameToken, verifyWorker, workerKey } from "@/lib/live/server";

/**
 * Called only by the companion agent worker.
 *  claim  – before starting Gemini or Anam: is this dispatch legitimate, and how long may it run? Authenticated by the
 *           shared key when LIVE_WORKER_SECRET is set, otherwise by LiveKit confirming the caller is the AGENT
 *           participant in that exact room. Returns a one-time report token.
 *  report – after the conversation: requires that token; closes the room, stores the report, settles the minutes.
 */
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    const signed = !!workerKey() && verifyWorker(raw, request.headers.get("x-speakara-ts"), request.headers.get("x-speakara-signature"));
    if (workerKey() && !signed) throw new LiveError(401, "unauthenticated", "Unauthorised.");
    let body: { op?: string; session_id?: string; room_name?: string; identity?: string; report_token?: string; report?: unknown; memory?: unknown };
    try { body = JSON.parse(raw); } catch { throw new LiveError(400, "bad_request", "Invalid request."); }
    if (typeof body.session_id !== "string" || !/^[0-9a-f-]{36}$/.test(body.session_id) || typeof body.room_name !== "string" || !/^ai_[0-9a-f]{32}$/.test(body.room_name)) throw new LiveError(400, "bad_request", "Invalid request.");
    if (body.op === "claim") {
      if (!signed && !(typeof body.identity === "string" && body.identity.length <= 128 && await isAgentInRoom(body.room_name, body.identity))) throw new LiveError(401, "unauthenticated", "Unauthorised.");
      const claim = await liveOp({ op: "worker_claim", session_id: body.session_id, room_name: body.room_name });
      return json({ ...claim, report_token: reportToken(body.session_id) });
    }
    if (body.op === "report") {
      if (!signed && !(typeof body.report_token === "string" && sameToken(body.report_token, reportToken(body.session_id)))) throw new LiveError(401, "unauthenticated", "Unauthorised.");
      const closed = await closeRoom(body.room_name);
      return json(await liveOp({ op: "worker_report", session_id: body.session_id, room_closed: closed, report: body.report ?? null, memory: Array.isArray(body.memory) ? body.memory.slice(0, 30) : [] }));
    }
    throw new LiveError(400, "bad_request", "Invalid request.");
  } catch (e) { return fail(e); }
}
