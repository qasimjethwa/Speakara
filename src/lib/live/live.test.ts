import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { avatarCatalog, roomToken, verifyWorker } from "./server";
import { cleanPrefs, clock } from "./catalog";

const decode = (jwt: string) => JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString());
const saved = { ...process.env };
beforeEach(() => { Object.assign(process.env, { LIVEKIT_URL: "wss://example.livekit.cloud", LIVEKIT_API_KEY: "APIkey", LIVEKIT_API_SECRET: "s".repeat(40), LIVE_WORKER_SECRET: "w".repeat(40) }); });
afterEach(() => { process.env = { ...saved }; });

describe("room tokens", () => {
  it("lets an AI-room learner publish only their microphone, for five minutes, and dispatches the companion", async () => {
    const { token, url } = await roomToken({ room: "ai_abc", identity: "u1", name: "Ana", camera: false, dispatch: { sessionId: "s1" } });
    const c = decode(token);
    expect(url).toBe("wss://example.livekit.cloud");
    expect(c.exp - c.nbf).toBeLessThanOrEqual(300);
    expect(c.video).toMatchObject({ room: "ai_abc", roomJoin: true, roomCreate: false, roomAdmin: false, roomList: false, roomRecord: false, canPublishData: false, canPublishSources: ["microphone"] });
    expect(c.roomConfig.agents[0]).toMatchObject({ agentName: "speakara-companion", metadata: JSON.stringify({ session_id: "s1" }) });
  });
  it("gives community calls camera and microphone but no agent", async () => {
    const c = decode((await roomToken({ room: "cm_x", identity: "u1", name: "Ana", camera: true })).token);
    expect(c.video.canPublishSources).toEqual(["microphone", "camera"]);
    expect(c.roomConfig?.agents ?? []).toEqual([]);
    expect(c.roomConfig.maxParticipants).toBe(2);
  });
});

describe("worker signatures", () => {
  const sign = (ts: string, body: string, key = "w".repeat(40)) => createHmac("sha256", key).update(`${ts}.${body}`).digest("hex");
  it("accepts a fresh, correctly signed request", () => { const ts = String(Date.now()); expect(verifyWorker("{}", ts, sign(ts, "{}"))).toBe(true); });
  it("rejects wrong keys, tampered bodies, stale timestamps and missing headers", () => {
    const ts = String(Date.now()); const old = String(Date.now() - 120_000);
    expect(verifyWorker("{}", ts, sign(ts, "{}", "x".repeat(40)))).toBe(false);
    expect(verifyWorker('{"a":1}', ts, sign(ts, "{}"))).toBe(false);
    expect(verifyWorker("{}", old, sign(old, "{}"))).toBe(false);
    expect(verifyWorker("{}", null, null)).toBe(false);
    delete process.env.LIVE_WORKER_SECRET;
    expect(verifyWorker("{}", ts, sign(ts, "{}"))).toBe(false);
  });
});

describe("avatar catalog", () => {
  it("defaults to a stock avatar and filters unsafe entries", () => {
    expect(avatarCatalog()).toHaveLength(1);
    process.env.LIVE_AVATAR_CATALOG = JSON.stringify([{ id: "abc-1", name: "Mia", imageUrl: "http://insecure" }, { id: "../etc", name: "X" }, { id: "def-2", name: "Ben", imageUrl: "https://cdn/x.png" }]);
    expect(avatarCatalog()).toEqual([{ id: "abc-1", name: "Mia", imageUrl: undefined }, { id: "def-2", name: "Ben", imageUrl: "https://cdn/x.png" }]);
    process.env.LIVE_AVATAR_CATALOG = "not json";
    expect(avatarCatalog()[0].name).toBe("Liv");
  });
});

describe("companion preferences", () => {
  const avatars = [{ id: "a1", name: "Mia" }];
  const ok = { avatar_id: "a1", companion_name: "  Kiko  ", personality: "calm", teaching_style: "strict", voice: "Puck", target_lang: "ar", level: 2, scenario: "hotel" };
  it("accepts valid choices and trims the name", () => { expect(cleanPrefs(ok, avatars)).toMatchObject({ companion_name: "Kiko", target_lang: "ar" }); });
  it("rejects anything outside the fixed choices", () => {
    for (const bad of [{ avatar_id: "custom-face" }, { companion_name: "" }, { companion_name: "<script>" }, { personality: "evil" }, { voice: "Custom" }, { target_lang: "zz" }, { level: 9 }, { scenario: "university" }])
      expect(typeof cleanPrefs({ ...ok, ...bad }, avatars)).toBe("string");
  });
  it("formats the countdown", () => { expect(clock(165)).toBe("2:45"); expect(clock(-3)).toBe("0:00"); });
});
