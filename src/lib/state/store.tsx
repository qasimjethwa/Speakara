"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cloudConfigured, supabase } from "../supabase";
import { clearLocal, loadCloud, loadLocal, saveCloud, saveLocal } from "./persistence";
import { initialState, type LearnerState } from "./types";
import { completeSession, type SessionResult, type SessionSummary } from "./actions";

interface Store {
  state: LearnerState; ready: boolean; mode: "guest" | "cloud"; userId: string | null; email: string | null; syncError: string | null; cloudConfigured: boolean;
  update: (fn: (s: LearnerState) => LearnerState) => void;
  finishSession: (r: SessionResult) => SessionSummary;
  signUp: (email: string, password: string, name: string, username: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  resetProgress: () => void;
}
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LearnerState>(() => initialState(0));
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const stateRef = useRef(state); const userRef = useRef<string | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());

  /** Applies a change, then persists it: to Supabase when signed in, otherwise to this device. */
  const commit = useCallback((next: LearnerState) => {
    const prev = stateRef.current; stateRef.current = next; setState(next);
    const db = supabase(); const uid = userRef.current;
    if (db && uid) queue.current = queue.current.then(() => saveCloud(db, uid, prev, next)).then(() => setSyncError(null), (e: Error) => setSyncError(e.message));
    else saveLocal(next);
  }, []);

  useEffect(() => {
    const db = supabase();
    const guest = () => { const s = loadLocal(Date.now()); stateRef.current = s; setState(s); setReady(true); };
    if (!db) { guest(); return; }
    const adopt = async (uid: string, mail: string | null) => {
      userRef.current = uid; setUserId(uid); setEmail(mail);
      try {
        const cloud = await loadCloud(db, uid, Date.now());
        if (!cloud) throw new Error("Profile row missing — has the database migration been applied?");
        const local = loadLocal(Date.now());
        // A guest who signs up keeps their progress: push the device state into the new, empty account once.
        if (cloud.xp === 0 && !cloud.profile.onboarded && (local.xp > 0 || local.profile.onboarded)) {
          const merged = { ...local, profile: { ...local.profile, username: cloud.profile.username, name: local.profile.name || cloud.profile.name } };
          await saveCloud(db, uid, cloud, merged); stateRef.current = merged; setState(merged); clearLocal();
        } else { stateRef.current = cloud; setState(cloud); }
        setSyncError(null);
      } catch (e) { setSyncError((e as Error).message); }
      setReady(true);
    };
    db.auth.getSession().then(({ data }) => (data.session ? adopt(data.session.user.id, data.session.user.email ?? null) : guest()));
    const { data: sub } = db.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session && session.user.id !== userRef.current) { setReady(false); void adopt(session.user.id, session.user.email ?? null); }
      if (event === "SIGNED_OUT") { userRef.current = null; setUserId(null); setEmail(null); guest(); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<Store>(() => ({
    state, ready, mode: userId ? "cloud" : "guest", userId, email, syncError, cloudConfigured,
    update: (fn) => commit(fn(stateRef.current)),
    finishSession: (r) => { const { state: next, summary } = completeSession(stateRef.current, r, Date.now()); commit(next); return summary; },
    signUp: async (mail, password, name, username) => {
      const db = supabase(); if (!db) return "Accounts are not configured on this deployment.";
      const { error, data } = await db.auth.signUp({ email: mail, password, options: { data: { display_name: name, username } } });
      if (error) return error.message;
      return data.session ? null : "Check your inbox to confirm your email, then log in.";
    },
    signIn: async (mail, password) => { const db = supabase(); if (!db) return "Accounts are not configured on this deployment."; const { error } = await db.auth.signInWithPassword({ email: mail, password }); return error?.message ?? null; },
    signOut: async () => { await supabase()?.auth.signOut(); },
    resetProgress: () => { const fresh = initialState(Date.now()); commit({ ...fresh, profile: { ...fresh.profile, name: stateRef.current.profile.name, username: stateRef.current.profile.username } }); },
  }), [state, ready, userId, email, syncError, commit]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useStore(): Store { const v = useContext(Ctx); if (!v) throw new Error("useStore outside StoreProvider"); return v; }
