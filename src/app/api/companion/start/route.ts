import { avatarCatalog, closeRoom, fail, json, learnerFrom, liveOp, liveStatus, LiveError, roomToken } from "@/lib/live/server";
import { cleanPrefs, type CompanionPrefs } from "@/lib/live/catalog";

interface Started { session_id: string; room_name: string; reserved_seconds: number; remaining_seconds: number }

/**
 * Starts an AI companion conversation: reserves avatar time from the shared monthly allowance (refusing when the
 * allowance is spent or another avatar session is live), then returns a five-minute token for that one room. The room's
 * token dispatches the companion agent, which re-checks the session with the server before starting Gemini or Anam.
 */
export async function POST(request: Request) {
  try {
    const { db, userId, token } = await learnerFrom(request);
    const status = liveStatus();
    if (!status.livekit || !status.signing || !status.worker) throw new LiveError(503, "not_configured", /*i18n*/ "Live practice isn’t set up on this server yet.");
    const { data: me } = await db.from("profiles").select("role, display_name").eq("id", userId).single();
    if (status.avatarAccess === "staff" && !["editor", "admin"].includes(me?.role ?? ""))
      throw new LiveError(403, "preview_only", /*i18n*/ "The AI companion is in a limited preview and isn’t open to everyone yet.");
    let body: Partial<CompanionPrefs>;
    try { body = await request.json(); } catch { throw new LiveError(400, "bad_request", /*i18n*/ "Invalid request."); }
    const prefs = cleanPrefs(body, avatarCatalog());
    if (typeof prefs === "string") throw new LiveError(400, "bad_prefs", prefs);
    await db.from("avatar_preferences").upsert({ user_id: userId, ...prefs, updated_at: new Date().toISOString() });

    const avatar = avatarCatalog().find((a) => a.id === prefs.avatar_id)!;
    // Personal Learning Twin: a short, learner-consented teaching brief (measured facts and stated preferences only).
    const { data: twin } = await db.from("learning_twin").select("prefs, brief").eq("user_id", userId).maybeSingle();
    const twinBrief = twin?.prefs?.personalise && twin.prefs.consentedAt && twin.prefs.companionContext && Array.isArray(twin.brief) ? (twin.brief as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 12).map((x) => x.slice(0, 300)) : [];
    const started = await liveOp<Started>({ op: "avatar_start", uid: userId, config: { ...prefs, avatar_name: avatar.name, ...(twinBrief.length ? { twin_brief: twinBrief } : {}) } }, token);
    try {
      const t = await roomToken({ room: started.room_name, identity: userId, name: me?.display_name ?? "Learner", camera: false, dispatch: { sessionId: started.session_id } });
      return json({ ...started, ...t });
    } catch (e) {
      // No token means nobody can join; return the reserved time.
      await liveOp({ op: "avatar_end", uid: userId, session_id: started.session_id, room_closed: await closeRoom(started.room_name) }, token).catch(() => undefined);
      throw e;
    }
  } catch (e) { return fail(e); }
}
