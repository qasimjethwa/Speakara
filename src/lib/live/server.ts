/**
 * Speakara Live server helpers. Server-only: imports secrets from the environment and must never reach the browser.
 *
 * Secrets used here (Vercel): LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, PROGRESS_SIGNING_SECRET (already used by
 * /api/progress; live payloads are signed with a key derived from it), LIVE_WORKER_SECRET (shared with the agent worker).
 * ANAM_API_KEY and GEMINI_API_KEY are NOT needed here: they live only in the agent worker.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { AccessToken, RoomAgentDispatch, RoomConfiguration, RoomServiceClient, TrackSource } from "livekit-server-sdk";
import { asLearner } from "@/lib/server/progress";
import type { AvatarChoice } from "./catalog";

export const AGENT_NAME = "speakara-companion";
const env = (k: string) => process.env[k]?.trim() || undefined;

export class LiveError extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }

/** What is configured on this deployment, without revealing any value. */
export function liveStatus() {
  return {
    livekit: !!(env("LIVEKIT_URL") && env("LIVEKIT_API_KEY") && env("LIVEKIT_API_SECRET")),
    signing: !!env("PROGRESS_SIGNING_SECRET"),
    worker: !!env("LIVE_WORKER_SECRET"),
    /** "staff" until the owner confirms Anam's free-plan terms allow public use; then "everyone". */
    avatarAccess: env("LIVE_AVATAR_ACCESS") === "everyone" ? "everyone" as const : "staff" as const,
  };
}

/**
 * Pre-made Anam avatars offered to learners. Set LIVE_AVATAR_CATALOG to a JSON array of {id, name, imageUrl?} copied
 * from Anam's stock gallery (agent/list_avatars.py prints it). The default is the stock avatar used in Anam's own docs.
 */
export function avatarCatalog(): AvatarChoice[] {
  const raw = env("LIVE_AVATAR_CATALOG");
  if (raw) {
    try {
      const list = (JSON.parse(raw) as AvatarChoice[]).filter((a) => typeof a?.id === "string" && /^[A-Za-z0-9-]{1,64}$/.test(a.id) && typeof a.name === "string")
        .map((a) => ({ id: a.id, name: a.name.slice(0, 24), imageUrl: typeof a.imageUrl === "string" && a.imageUrl.startsWith("https://") ? a.imageUrl : undefined }));
      if (list.length) return list.slice(0, 12);
    } catch { /* fall through to the default */ }
  }
  return [{ id: "071b0286-4cce-4808-bee2-e642f1062de3", name: "Liv" }];
}

/** Signs and runs one operation through public.live_op. With a learner token the call runs as that learner. */
export async function liveOp<T = Record<string, unknown>>(op: Record<string, unknown>, learnerToken?: string): Promise<T> {
  const secret = env("PROGRESS_SIGNING_SECRET");
  const url = env("NEXT_PUBLIC_SUPABASE_URL"); const key = env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ?? env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!secret || !url || !key) throw new LiveError(503, "not_configured", /*i18n*/ "Live practice isn’t set up on this server yet.");
  const payload = JSON.stringify({ ...op, domain: "speakara-live", issued_at: Date.now(), nonce: randomBytes(16).toString("hex") });
  const signature = createHmac("sha256", `${secret}:live`).update(payload, "utf8").digest("hex");
  const db = learnerToken
    ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${learnerToken}` } } })
    : createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.rpc("live_op", { p_payload: payload, p_signature: signature });
  if (error) throw opError(error.message);
  return data as T;
}

const OP_ERRORS: Record<string, [number, string]> = {
  quota_exhausted: [429, /*i18n*/ "This month’s free avatar minutes are used up. They reset at the start of next month."],
  avatar_busy: [409, /*i18n*/ "Another learner is talking to a companion right now. Please try again in a few minutes."],
  rate_limited: [429, /*i18n*/ "You’re going a bit fast. Please wait a little and try again."],
  consent_required: [403, /*i18n*/ "Please confirm the community rules and your age first."],
  preferences_required: [400, /*i18n*/ "Save your language preferences first."],
  already_matched: [409, /*i18n*/ "You already have a call invitation open."],
  invitation_closed: [410, /*i18n*/ "That invitation has expired."],
  not_found: [404, /*i18n*/ "That session no longer exists."],
  not_claimable: [409, /*i18n*/ "That session has already started or ended."],
  not_authorised: [403, /*i18n*/ "You don’t have access to that."],
};
function opError(message: string) {
  const code = Object.keys(OP_ERRORS).find((c) => message.includes(c));
  if (code) return new LiveError(OP_ERRORS[code][0], code, OP_ERRORS[code][1]);
  console.error("live_op failed", message);
  return new LiveError(500, "server", /*i18n*/ "Something went wrong. Please try again.");
}

/** Verifies the Supabase session token sent by the browser. */
export async function learnerFrom(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new LiveError(401, "unauthenticated", /*i18n*/ "Please log in to use live practice.");
  try { const { db, userId } = await asLearner(token); return { db, userId, token }; }
  catch { throw new LiveError(401, "unauthenticated", /*i18n*/ "Your session has expired. Please log in again."); }
}

function livekit() {
  const url = env("LIVEKIT_URL"), apiKey = env("LIVEKIT_API_KEY"), apiSecret = env("LIVEKIT_API_SECRET");
  if (!url || !apiKey || !apiSecret) throw new LiveError(503, "not_configured", /*i18n*/ "Live practice isn’t set up on this server yet.");
  return { url, apiKey, apiSecret };
}

/**
 * A short-lived token for one room. Learners may publish only their microphone (and camera in community calls), may
 * not create, list or administer rooms, and may not send data messages. AI rooms dispatch the companion agent.
 */
export async function roomToken(o: { room: string; identity: string; name: string; camera: boolean; dispatch?: { sessionId: string } }) {
  const lk = livekit();
  const at = new AccessToken(lk.apiKey, lk.apiSecret, { identity: o.identity, name: o.name.slice(0, 40), ttl: "5m" });
  at.addGrant({
    room: o.room, roomJoin: true, roomCreate: false, roomList: false, roomAdmin: false, roomRecord: false,
    canPublish: true, canSubscribe: true, canPublishData: false, canUpdateOwnMetadata: false,
    canPublishSources: o.camera ? [TrackSource.MICROPHONE, TrackSource.CAMERA] : [TrackSource.MICROPHONE],
  });
  if (o.dispatch) at.roomConfig = new RoomConfiguration({ agents: [new RoomAgentDispatch({ agentName: AGENT_NAME, metadata: JSON.stringify({ session_id: o.dispatch.sessionId }) })], emptyTimeout: 30, maxParticipants: 3 });
  else at.roomConfig = new RoomConfiguration({ emptyTimeout: 60, maxParticipants: 2 });
  return { token: await at.toJwt(), url: lk.url };
}

/** Closes a room, disconnecting everyone (including the agent and avatar). Returns true when the room is gone. */
export async function closeRoom(room: string): Promise<boolean> {
  try {
    const lk = livekit();
    await new RoomServiceClient(lk.url.replace(/^wss:/, "https:").replace(/^ws:/, "http:"), lk.apiKey, lk.apiSecret).deleteRoom(room);
    return true;
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    if (/not.?found|does not exist|404/i.test(msg)) return true;    // already closed
    console.error("closeRoom failed", msg);
    return false;
  }
}

/** Verifies a request from the agent worker: HMAC-SHA256 over "<timestamp>.<body>" with LIVE_WORKER_SECRET. */
export function verifyWorker(body: string, ts: string | null, signature: string | null): boolean {
  const secret = env("LIVE_WORKER_SECRET");
  if (!secret || !ts || !signature || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  if (Math.abs(Date.now() - Number(ts)) > 60_000) return false;
  const expected = createHmac("sha256", secret).update(`${ts}.${body}`, "utf8").digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

export const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "cache-control": "no-store" } });
export function fail(e: unknown) {
  if (e instanceof LiveError) return json({ error: e.message, code: e.code }, e.status);
  console.error("live route failed", e);
  return json({ error: "Something went wrong. Please try again.", code: "server" }, 500);
}
