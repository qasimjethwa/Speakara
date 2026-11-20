import { closeRoom, fail, json, learnerFrom, liveOp, LiveError, liveStatus } from "@/lib/live/server";

const OPS = { join: "match_join", leave: "match_leave", respond: "match_respond", end: "match_end", save: "memory_add" } as const;

/** Community language exchange actions. Matching, invitations and saved words all go through the signed database entry point. */
export async function POST(request: Request) {
  try {
    const { db, userId, token } = await learnerFrom(request);
    if (!liveStatus().signing) throw new LiveError(503, "not_configured", /*i18n*/ "Live practice isn’t set up on this server yet.");
    let body: { op?: keyof typeof OPS; match_id?: string; accept?: boolean; lang?: string; items?: unknown[] };
    try { body = await request.json(); } catch { throw new LiveError(400, "bad_request", /*i18n*/ "Invalid request."); }
    const op = body.op && OPS[body.op];
    if (!op) throw new LiveError(400, "bad_request", /*i18n*/ "Invalid request.");
    const extra: Record<string, unknown> = {};
    if (body.op === "respond" || body.op === "end") extra.match_id = String(body.match_id ?? "");
    if (body.op === "respond") extra.accept = body.accept === true;
    if (body.op === "save") {
      if (!/^[a-z]{2}$/.test(body.lang ?? "")) throw new LiveError(400, "bad_request", /*i18n*/ "Invalid request.");
      extra.lang = body.lang;
      extra.items = (Array.isArray(body.items) ? body.items : []).slice(0, 20).map((x) => {
        const o = x as { term?: unknown; meaning?: unknown };
        return { term: String(o?.term ?? "").slice(0, 80), meaning: String(o?.meaning ?? "").slice(0, 160) };
      }).filter((x) => x.term);
    }
    if (body.op === "end") {
      const { data: m } = await db.from("matches").select("room_name, status").eq("id", extra.match_id as string).maybeSingle();
      if (m?.status === "active" && m.room_name) await closeRoom(m.room_name);
    }
    return json(await liveOp({ op, uid: userId, ...extra }, token));
  } catch (e) { return fail(e); }
}
