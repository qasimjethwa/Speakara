import { avatarCatalog, json, liveStatus } from "@/lib/live/server";

/** Public, non-secret configuration for the live pages: which parts are set up and the pre-made avatar list. */
export async function GET() {
  const s = liveStatus();
  return json({ ready: s.livekit && s.signing, companionReady: s.livekit && s.signing && s.worker, avatarAccess: s.avatarAccess, avatars: avatarCatalog() });
}
