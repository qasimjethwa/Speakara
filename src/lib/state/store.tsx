"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cloudConfigured, supabase } from "../supabase";
import { clearLocal, loadCloud, loadLocal, saveLocal, saveProfile } from "./persistence";
import { initialState, type Conversation, type LearnerState, type Profile } from "./types";
import { buyStreakFreeze, completeSession, saveConversation as saveConversationLocal, updateProfile as applyProfile, type SessionSummary } from "./actions";
import { findLesson, getCourse } from "../content";
import { eventsFromSession } from "../twin/model";
import { loadTwin, recordEvents } from "../twin/store";
import { buildSession, type SessionPlan } from "../engine/plan";
import { gradeAttempts, type Attempt } from "../engine/grade";
import type { ProgressRequest, ProgressResponse } from "../server/progress";

type Op = ProgressRequest extends infer R ? (R extends { operationId: string } ? Omit<R, "operationId"> : never) : never;
interface Store {
  state: LearnerState; ready: boolean; mode: "guest" | "cloud"; userId: string | null; email: string | null; syncError: string | null; cloudConfigured: boolean; recovering: boolean;
  setProfile: (patch: Partial<Profile>) => void;
  /** Grades and records a finished session. Signed-in learners are graded by the server; guests on the device. */
  finishSession: (plan: SessionPlan, attempts: Attempt[], seconds: number) => Promise<SessionSummary>;
  buyFreeze: () => Promise<string | null>;
  saveConversation: (c: Conversation) => void;
  claimFriendQuest: (friendId: string) => Promise<string | null>;
  signUp: (email: string, password: string, name: string, username: string) => Promise<{ error?: string; confirm?: boolean }>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
  deleteAccount: () => Promise<string | null>;
  resetProgress: () => void;
}
const Ctx = createContext<Store | null>(null);
const newOpId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 8)}`;
const hasProgress = (s: LearnerState) => s.xp > 0 || Object.keys(s.completed).length > 0;

/** Personal Learning Twin: grade first attempts with the same answer key and record skill events (never blocks a session). */
function captureTwin(plan: SessionPlan, attempts: Attempt[]) {
  try {
    const course = getCourse(plan.courseId); const built = buildSession(course, plan); if (!built) return;
    const topic = plan.type === "lesson" ? findLesson(course, plan.lessonId)?.lesson.title : plan.type === "story" ? plan.storyId : undefined;
    recordEvents(eventsFromSession(built.exercises, attempts, course.id, plan.type === "placement" ? "placement" : plan.type, Date.now(), topic));
  } catch { /* personalisation must never break learning */ }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LearnerState>(() => initialState(0));
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => { void loadTwin(userId); }, [userId]);
  const [email, setEmail] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [recovering, setRecovering] = useState(false);
  const stateRef = useRef(state); const userRef = useRef<string | null>(null);
  const put = useCallback((s: LearnerState) => { stateRef.current = s; setState(s); }, []);

  /** Calls the authoritative progress API as the signed-in learner, refreshing an expired session once. */
  const callServer = useCallback(async (op: Op, operationId = newOpId()): Promise<ProgressResponse> => {
    const db = supabase(); if (!db) throw new Error("Accounts are not configured on this deployment.");
    for (let attempt = 0; ; attempt++) {
      const { data } = attempt === 0 ? await db.auth.getSession() : await db.auth.refreshSession();
      const token = data.session?.access_token;
      if (!token) { await db.auth.signOut(); throw new Error("Your session has expired. Please log in again."); }
      let res: Response;
      try { res = await fetch("/api/progress", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ ...op, operationId }) }); }
      catch { throw new Error("You seem to be offline. Your answers are safe on this screen — check your connection and try again."); }
      if (res.status === 401 && attempt === 0) continue;
      const body = (await res.json().catch(() => ({}))) as ProgressResponse & { error?: string };
      if (res.status === 401) { await db.auth.signOut(); throw new Error("Your session has expired. Please log in again."); }
      if (!res.ok) throw new Error(body.error ?? "Something went wrong saving your progress. Please try again.");
      return body;
    }
  }, []);

  useEffect(() => {
    const db = supabase();
    const guest = () => { userRef.current = null; setUserId(null); setEmail(null); put(loadLocal(Date.now())); setReady(true); };
    if (!db) { guest(); return; }
    const adopt = async (uid: string, mail: string | null) => {
      userRef.current = uid; setUserId(uid); setEmail(mail);
      try {
        let cloud = await loadCloud(db, uid, Date.now());
        if (!cloud) throw new Error("Your profile could not be found. Please contact support.");
        const local = loadLocal(Date.now());
        // A guest who signs up keeps their device progress: profile choices are copied, progress is imported once
        // through the server (which re-validates it). An account that already has progress is never overwritten.
        if (!hasProgress(cloud.state) && (hasProgress(local) || (local.profile.onboarded && !cloud.state.profile.onboarded))) {
          const profile: Profile = { ...local.profile, name: cloud.state.profile.name !== "Learner" && cloud.state.profile.name ? cloud.state.profile.name : local.profile.name, username: cloud.state.profile.username, role: cloud.state.profile.role, createdAt: cloud.state.profile.createdAt };
          await saveProfile(db, uid, profile);
          if (hasProgress(local)) { stateRef.current = cloud.state; await callServer({ op: "import", tzOffsetMin: -new Date().getTimezoneOffset(), guest: local }, `import-${uid.replace(/-/g, "").slice(0, 24)}`); }
          cloud = (await loadCloud(db, uid, Date.now())) ?? cloud;
          clearLocal();
        }
        put(cloud.state); setSyncError(null);
      } catch (e) { setSyncError((e as Error).message); }
      setReady(true);
    };
    db.auth.getSession().then(({ data }) => (data.session ? adopt(data.session.user.id, data.session.user.email ?? null) : guest()));
    const { data: sub } = db.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      if ((event === "SIGNED_IN" || event === "PASSWORD_RECOVERY") && session && session.user.id !== userRef.current) { setReady(false); setTimeout(() => void adopt(session.user.id, session.user.email ?? null), 0); }
      if (event === "SIGNED_OUT") guest();
    });
    return () => sub.subscription.unsubscribe();
  }, [put, callServer]);

  const value = useMemo<Store>(() => ({
    state, ready, mode: userId ? "cloud" : "guest", userId, email, syncError, cloudConfigured, recovering,
    setProfile: (patch) => {
      const next = applyProfile(stateRef.current, patch); put(next);
      const db = supabase(); const uid = userRef.current;
      if (db && uid) saveProfile(db, uid, next.profile).then(() => setSyncError(null), (e: Error) => setSyncError(e.message)); else saveLocal(next);
    },
    finishSession: async (plan, attempts, seconds) => {
      if (userRef.current) {
        const r = await callServer({ op: "session", tzOffsetMin: -new Date().getTimezoneOffset(), plan, attempts, seconds });
        put(r.state); setSyncError(null);
        if (!r.summary) throw new Error("This session was already saved.");
        captureTwin(plan, attempts);
        return r.summary;
      }
      const course = getCourse(plan.courseId); const built = buildSession(course, plan);
      if (!built) throw new Error("That session does not exist.");
      const done = completeSession(stateRef.current, gradeAttempts(course, built, attempts, seconds), Date.now());
      put(done.state); saveLocal(done.state);
      captureTwin(plan, attempts);
      return done.summary;
    },
    buyFreeze: async () => {
      if (userRef.current) { try { put((await callServer({ op: "freeze" })).state); return null; } catch (e) { return (e as Error).message; } }
      const next = buyStreakFreeze(stateRef.current); if (next === stateRef.current) return "You need 50 gems and a free freeze slot.";
      put(next); saveLocal(next); return null;
    },
    saveConversation: (c) => {
      const next = saveConversationLocal(stateRef.current, c, Date.now()); put(next);
      if (userRef.current) callServer({ op: "conversation", conversation: c }).then((r) => { if (!r.duplicate) put({ ...r.state, conversations: stateRef.current.conversations.length >= r.state.conversations.length ? stateRef.current.conversations : r.state.conversations }); }, (e: Error) => setSyncError(e.message));
      else saveLocal(next);
    },
    claimFriendQuest: async (friendId) => { try { put((await callServer({ op: "friend_claim", friendId })).state); return null; } catch (e) { return (e as Error).message; } },
    signUp: async (mail, password, name, username) => {
      const db = supabase(); if (!db) return { error: "Accounts are not configured on this deployment." };
      const { error, data } = await db.auth.signUp({ email: mail, password, options: { data: { display_name: name, username }, emailRedirectTo: `${window.location.origin}/login` } });
      if (error) return { error: error.message };
      return { confirm: !data.session };
    },
    signIn: async (mail, password) => { const db = supabase(); if (!db) return "Accounts are not configured on this deployment."; const { error } = await db.auth.signInWithPassword({ email: mail, password }); return error?.message ?? null; },
    signOut: async () => { await supabase()?.auth.signOut(); },
    requestPasswordReset: async (mail) => { const db = supabase(); if (!db) return "Accounts are not configured on this deployment."; const { error } = await db.auth.resetPasswordForEmail(mail, { redirectTo: `${window.location.origin}/reset-password` }); return error?.message ?? null; },
    updatePassword: async (password) => { const db = supabase(); if (!db) return "Accounts are not configured on this deployment."; const { error } = await db.auth.updateUser({ password }); if (!error) setRecovering(false); return error?.message ?? null; },
    deleteAccount: async () => { const db = supabase(); if (!db) return "Accounts are not configured on this deployment."; const { error } = await db.rpc("delete_my_account"); if (error) return error.message; await db.auth.signOut(); return null; },
    resetProgress: () => { const fresh = initialState(Date.now()); const next = { ...fresh, profile: { ...fresh.profile, name: stateRef.current.profile.name, uiLang: stateRef.current.profile.uiLang } }; put(next); saveLocal(next); },
  }), [state, ready, userId, email, syncError, recovering, put, callServer]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useStore(): Store { const v = useContext(Ctx); if (!v) throw new Error("useStore outside StoreProvider"); return v; }
