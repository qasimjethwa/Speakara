import { closeRoom, fail, json, learnerFrom, liveOp, LiveError } from "@/lib/live/server";

/** Ends the learner's AI conversation: closes the room (stopping the agent and the avatar), then settles the minutes. */
export async function POST(request: Request) {
  try {
    const { db, userId, token } = await learnerFrom(request);
    let body: { session_id?: string };
    try { body = await request.json(); } catch { throw new LiveError(400, "bad_request", /*i18n*/ "Invalid request."); }
    const { data: s } = await db.from("call_sessions").select("id, room_name, status").eq("id", String(body.session_id ?? "")).eq("kind", "ai").maybeSingle();
    if (!s) throw new LiveError(404, "not_found", /*i18n*/ "That session no longer exists.");
    const closed = s.status === "active" ? await closeRoom(s.room_name) : true;
    return json(await liveOp({ op: "avatar_end", uid: userId, session_id: s.id, room_closed: closed }, token));
  } catch (e) { return fail(e); }
}
