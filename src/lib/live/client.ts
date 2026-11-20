"use client";
/** Browser helpers for Speakara Live. Holds no secrets: every privileged step goes through the authenticated API. */
import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track, type RemoteTrack, type RemoteParticipant } from "livekit-client";
import { supabase } from "@/lib/supabase";
import type { AvatarChoice } from "./catalog";

export class ApiError extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }

/** POSTs to a live API route as the signed-in learner. */
export async function liveApi<T>(path: string, body: unknown): Promise<T> {
  const db = supabase();
  const { data } = (await db?.auth.getSession()) ?? { data: { session: null } };
  const token = data.session?.access_token;
  if (!token) throw new ApiError(401, "unauthenticated", /*i18n*/ "Please log in to use live practice.");
  let res: Response;
  try { res = await fetch(path, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(body) }); }
  catch { throw new ApiError(0, "offline", /*i18n*/ "You seem to be offline. Check your connection and try again."); }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json.code ?? "server", json.error ?? /*i18n*/ "Something went wrong. Please try again.");
  return json as T;
}

export interface LiveConfig { ready: boolean; companionReady: boolean; avatarAccess: "staff" | "everyone"; avatars: AvatarChoice[] }
export function useLiveConfig() {
  const [config, setConfig] = useState<LiveConfig | null>(null); const [error, setError] = useState(false);
  useEffect(() => { fetch("/api/live/config").then((r) => r.json()).then(setConfig, () => setError(true)); }, []);
  return { config, error };
}

export interface Quota { monthly_seconds: number; session_seconds: number; remaining_seconds: number; busy: boolean }
/** The shared monthly avatar allowance, refreshed every 20 s while visible. */
export function useQuota(enabled: boolean) {
  const [quota, setQuota] = useState<Quota | null>(null);
  const load = useCallback(async () => { const db = supabase(); if (!db) return; const { data } = await db.rpc("avatar_quota"); if (data) setQuota(data as Quota); }, []);
  useEffect(() => {
    if (!enabled) return;
    void load(); const id = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 20_000);
    return () => clearInterval(id);
  }, [enabled, load]);
  return { quota, reload: load };
}

export type CallState = "idle" | "connecting" | "connected" | "reconnecting" | "ended" | "failed" | "mic-denied" | "camera-denied";

/**
 * Joins one LiveKit room. Remote video goes to `videoRef`; remote audio plays through hidden elements. Mic (and
 * camera when asked) are published. Reports connection state for the loading, reconnecting and disconnected screens.
 */
export function useLiveRoom(opts: { camera: boolean; onEnded?: () => void }) {
  const [state, setState] = useState<CallState>("idle");
  const [micOn, setMicOn] = useState(true); const [camOn, setCamOn] = useState(opts.camera);
  const [remoteVideo, setRemoteVideo] = useState(false); const [remoteName, setRemoteName] = useState<string | null>(null);
  const [agentState, setAgentState] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null); const videoRef = useRef<HTMLVideoElement>(null); const localRef = useRef<HTMLVideoElement>(null);
  const audioBox = useRef<HTMLDivElement>(null); const ended = useRef(opts.onEnded); ended.current = opts.onEnded;

  const attach = useCallback((track: RemoteTrack) => {
    if (track.kind === Track.Kind.Video && videoRef.current) { track.attach(videoRef.current); setRemoteVideo(true); }
    if (track.kind === Track.Kind.Audio && audioBox.current) { const el = track.attach(); el.dataset.lk = "1"; audioBox.current.appendChild(el); }
  }, []);

  const connect = useCallback(async (url: string, token: string) => {
    setState("connecting");
    const room = new Room({ adaptiveStream: true, dynacast: true, disconnectOnPageLeave: true });
    roomRef.current = room;
    room.on(RoomEvent.TrackSubscribed, (track) => attach(track))
      .on(RoomEvent.TrackUnsubscribed, (track) => { track.detach().forEach((el) => { if (el.dataset.lk) el.remove(); }); if (track.kind === Track.Kind.Video) setRemoteVideo(false); })
      .on(RoomEvent.ParticipantConnected, (p: RemoteParticipant) => setRemoteName(p.name || null))
      .on(RoomEvent.ParticipantAttributesChanged, (changed, p) => { if ("lk.agent.state" in changed && p.identity !== room.localParticipant.identity) setAgentState(changed["lk.agent.state"]); })
      .on(RoomEvent.Reconnecting, () => setState("reconnecting"))
      .on(RoomEvent.Reconnected, () => setState("connected"))
      .on(RoomEvent.Disconnected, () => { setState((s) => (s === "failed" ? s : "ended")); ended.current?.(); });
    try { await room.connect(url, token); }
    catch { setState("failed"); return false; }
    room.remoteParticipants.forEach((p) => { setRemoteName(p.name || null); p.trackPublications.forEach((pub) => { if (pub.track) attach(pub.track as RemoteTrack); }); });
    try { await room.localParticipant.setMicrophoneEnabled(true); }
    catch { setState("mic-denied"); await room.disconnect(); return false; }
    if (opts.camera) {
      try { await room.localParticipant.setCameraEnabled(true); const pub = room.localParticipant.getTrackPublication(Track.Source.Camera); if (pub?.track && localRef.current) pub.track.attach(localRef.current); }
      catch { setCamOn(false); }
    }
    try { await room.startAudio(); } catch { /* resumes on the next tap */ }
    setState("connected");
    return true;
  }, [attach, opts.camera]);

  const toggleMic = useCallback(async () => { const r = roomRef.current; if (!r) return; const next = !micOn; await r.localParticipant.setMicrophoneEnabled(next).catch(() => undefined); setMicOn(next); }, [micOn]);
  const toggleCam = useCallback(async () => {
    const r = roomRef.current; if (!r) return; const next = !camOn;
    try { await r.localParticipant.setCameraEnabled(next); const pub = r.localParticipant.getTrackPublication(Track.Source.Camera); if (next && pub?.track && localRef.current) pub.track.attach(localRef.current); setCamOn(next); }
    catch { setState((s) => s); setCamOn(false); }
  }, [camOn]);
  const leave = useCallback(async () => { await roomRef.current?.disconnect(); }, []);
  useEffect(() => () => { void roomRef.current?.disconnect(); }, []);

  return { state, connect, leave, micOn, camOn, toggleMic, toggleCam, videoRef, localRef, audioBox, remoteVideo, remoteName, agentState, room: roomRef };
}

/** Counts down from `seconds` once `running` is true. */
export function useCountdown(seconds: number, running: boolean) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => { setLeft(seconds); }, [seconds]);
  useEffect(() => {
    if (!running) return;
    const start = Date.now(); const id = setInterval(() => setLeft(Math.max(0, seconds - Math.floor((Date.now() - start) / 1000))), 500);
    return () => clearInterval(id);
  }, [running, seconds]);
  return left;
}
