"use client";
/**
 * Client store for the Personal Learning Twin.
 * Guests: everything stays in this browser (localStorage). Signed-in learners: also synced to Supabase
 * (`learning_twin`, `learning_events`; RLS: own rows only). Raw audio, video and transcripts are never stored here.
 */
import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";
import { defaultPrefs, normalisePrefs, type LearningEvent, type TwinPrefs } from "./model";

interface TwinData { prefs: TwinPrefs; events: LearningEvent[] }
const MAX_EVENTS = 1500;
const key = (uid: string | null) => `speakara:twin:v1:${uid ?? "guest"}`;
let uid: string | null = null;
let data: TwinData = { prefs: defaultPrefs(), events: [] };
let loadedFor: string | null | undefined = undefined;
const listeners = new Set<() => void>();
const emit = () => { for (const l of listeners) l(); };

function readLocal(u: string | null): TwinData {
  try { const v = JSON.parse(localStorage.getItem(key(u)) ?? "null"); if (v?.prefs) return { prefs: normalisePrefs({ ...defaultPrefs(), ...v.prefs }), events: Array.isArray(v.events) ? v.events : [] }; } catch { /* blocked */ }
  return { prefs: defaultPrefs(), events: [] };
}
function writeLocal() { try { localStorage.setItem(key(uid), JSON.stringify(data)); } catch { /* full or blocked */ } }

/** Switches the store to a learner (null = guest) and pulls their cloud copy. Guest history is carried into a new account once. */
export async function loadTwin(u: string | null) {
  if (loadedFor === u) return; loadedFor = u; uid = u;
  data = readLocal(u);
  if (u && !data.events.length) { const g = readLocal(null); if (g.events.length || g.prefs.onboarded) data = g; }
  emit();
  const db = supabase(); if (!db || !u) return;
  const [{ data: row }, { data: evs }] = await Promise.all([
    db.from("learning_twin").select("prefs").eq("user_id", u).maybeSingle(),
    db.from("learning_events").select("at, course, skill, correct, item, topic, source").eq("user_id", u).order("at", { ascending: false }).limit(MAX_EVENTS),
  ]);
  const cloud = (evs ?? []).map((e) => ({ ...e, at: Date.parse(e.at as string) })) as LearningEvent[];
  const seen = new Set(cloud.map((e) => `${e.at}|${e.item}|${e.skill}`));
  const localOnly = data.events.filter((e) => !seen.has(`${e.at}|${e.item}|${e.skill}`));
  if (localOnly.length) await db.from("learning_events").insert(localOnly.map((e) => toRow(u, e)));
  data = { prefs: row?.prefs ? normalisePrefs({ ...defaultPrefs(), ...(row.prefs as TwinPrefs) }) : data.prefs, events: [...cloud, ...localOnly].sort((a, b) => a.at - b.at).slice(-MAX_EVENTS) };
  if (!row && data.prefs.onboarded) await db.from("learning_twin").upsert({ user_id: u, prefs: data.prefs, updated_at: new Date().toISOString() });
  writeLocal(); emit();
}
const toRow = (u: string, e: LearningEvent) => ({ user_id: u, at: new Date(e.at).toISOString(), course: e.course.slice(0, 20), skill: e.skill, correct: e.correct, item: e.item?.slice(0, 60) ?? null, topic: e.topic?.slice(0, 80) ?? null, source: e.source });

/** Adds graded events (skipped when the learner turned personalisation off). */
export function recordEvents(evs: LearningEvent[]) {
  if (!evs.length || !data.prefs.personalise) return;
  data = { ...data, events: [...data.events, ...evs].slice(-MAX_EVENTS) }; writeLocal(); emit();
  const db = supabase(); if (db && uid) void db.from("learning_events").insert(evs.map((e) => toRow(uid!, e)));
}

export async function savePrefs(patch: Partial<TwinPrefs>) {
  data = { ...data, prefs: normalisePrefs({ ...data.prefs, ...patch }) }; writeLocal(); emit();
  const db = supabase(); if (db && uid) await db.from("learning_twin").upsert({ user_id: uid, prefs: data.prefs, brief: data.prefs.companionContext ? undefined : [], updated_at: new Date().toISOString() });
}
/** Explicit consent switch. Off: no personalised recommendations, no AI learning context, no new learning events; lessons, XP and progress are untouched. */
export const setPersonalisation = (on: boolean) => savePrefs(on ? { personalise: true, consentedAt: Date.now() } : { personalise: false, companionContext: false });
/** Saves the companion brief (only when the learner consented); the server reads it when a companion session starts. */
export async function saveBrief(brief: string[]) {
  const db = supabase(); if (!db || !uid) return;
  await db.from("learning_twin").upsert({ user_id: uid, prefs: data.prefs, brief: data.prefs.companionContext ? brief.slice(0, 12) : [], updated_at: new Date().toISOString() });
}
export async function resetPrefs() {
  data = { ...data, prefs: { ...defaultPrefs(), personalise: data.prefs.personalise, consentedAt: data.prefs.consentedAt } }; writeLocal(); emit();
  const db = supabase(); if (db && uid) await db.from("learning_twin").upsert({ user_id: uid, prefs: data.prefs, brief: [], updated_at: new Date().toISOString() });
}
export async function deleteHistory() {
  data = { ...data, events: [] }; writeLocal(); emit();
  const db = supabase(); if (db && uid) await db.from("learning_events").delete().eq("user_id", uid);
}
/** Deletes the AI companion's saved learning memory and the shared brief. */
export async function deleteAiMemory() {
  const db = supabase(); if (!db || !uid) return;
  await Promise.all([db.from("learning_twin").update({ brief: [] }).eq("user_id", uid), db.from("ai_memory").delete().eq("user_id", uid)]);
}

const snapshot = () => data;
export function useTwin(userId: string | null) {
  useEffect(() => { void loadTwin(userId); }, [userId]);
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, snapshot, snapshot);
}
/** Test hook. */
export function __setTwin(d: TwinData) { data = d; emit(); }
