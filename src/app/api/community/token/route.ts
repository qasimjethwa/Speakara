import { fail, json, learnerFrom, LiveError, roomToken } from "@/lib/live/server";

/** A short-lived token for an active community call. Only the two matched learners can get one, and only once both accepted. */
export async function POST(request: Request) {
  try {
    const { db, userId } = await learnerFrom(request);
    let body: { match_id?: string };
    try { body = await request.json(); } catch { throw new LiveError(400, "bad_request", /*i18n*/ "Invalid request."); }
    const { data: m } = await db.from("matches").select("id, status, room_name, user_a, user_b").eq("id", String(body.match_id ?? "")).maybeSingle();
    if (!m || ![m.user_a, m.user_b].includes(userId)) throw new LiveError(404, "not_found", /*i18n*/ "That session no longer exists.");
    if (m.status !== "active" || !m.room_name) throw new LiveError(409, "not_active", /*i18n*/ "This call has ended.");
    const { data: me } = await db.from("profiles").select("display_name").eq("id", userId).single();
    return json(await roomToken({ room: m.room_name, identity: userId, name: me?.display_name ?? "Learner", camera: true }));
  } catch (e) { return fail(e); }
}
