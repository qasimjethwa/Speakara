"use client";
/** ISL data in the browser: validated sign clips from Supabase, and course progress (device + account). */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/state/store";
import { checkClip, type SignClip } from "./rig";

export interface ClipRow { sign_id: string; gloss: string; clip: SignClip; status: "draft" | "in_review" | "validated"; reviewed_by: string | null; reviewed_at: string | null; reviewer_notes: string }

let cache: Record<string, SignClip> | null = null;
/** Validated clips only (RLS also enforces this for learners). Staff drafts are never played in lessons. */
export function useValidatedClips() {
  const [clips, setClips] = useState<Record<string, SignClip>>(cache ?? {});
  const [loaded, setLoaded] = useState(!!cache);
  useEffect(() => {
    if (cache) return;
    const db = supabase(); if (!db) { setLoaded(true); return; }
    void db.from("isl_sign_clips").select("sign_id, gloss, clip, status, reviewed_by, reviewed_at").eq("status", "validated").then(({ data }) => {
      const out: Record<string, SignClip> = {};
      for (const r of (data ?? []) as ClipRow[]) {
        const c: SignClip = { ...r.clip, id: r.sign_id, gloss: r.gloss, status: "validated", reviewedBy: r.reviewed_by ?? undefined, reviewedAt: r.reviewed_at ?? undefined };
        if (!checkClip(c)) out[r.sign_id] = c;
      }
      cache = out; setClips(out); setLoaded(true);
    });
  }, []);
  return { clips, loaded };
}

const KEY = "speakara:isl:progress:v1";
type Progress = Record<string, { score: number; at: number }>;
const readLocal = (): Progress => { try { return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Progress; } catch { return {}; } };
const writeLocal = (p: Progress) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ } };

/** Item ids look like "english:en1:reading". Guests keep progress on the device; signed-in learners also sync it. */
export function useIslProgress() {
  const { userId } = useStore();
  const [progress, setProgress] = useState<Progress>({});
  useEffect(() => {
    const local = readLocal(); setProgress(local);
    const db = supabase(); if (!db || !userId) return;
    void db.from("isl_progress").select("item_id, score, completed_at").then(({ data }) => {
      const merged = { ...local };
      for (const r of data ?? []) { const at = Date.parse(r.completed_at); if (!merged[r.item_id] || merged[r.item_id].score < r.score) merged[r.item_id] = { score: r.score, at }; }
      writeLocal(merged); setProgress(merged);
      // push device-only items up once
      const up = Object.entries(merged).filter(([id]) => !(data ?? []).some((r) => r.item_id === id)).map(([id, v]) => ({ user_id: userId, item_id: id, score: v.score, completed_at: new Date(v.at).toISOString() }));
      if (up.length) void db.from("isl_progress").upsert(up);
    });
  }, [userId]);
  const complete = useCallback((itemId: string, score: number) => {
    const s = Math.max(0, Math.min(100, Math.round(score)));
    setProgress((p) => {
      if (p[itemId] && p[itemId].score >= s) return p;
      const next = { ...p, [itemId]: { score: s, at: Date.now() } }; writeLocal(next);
      const db = supabase(); if (db && userId) void db.from("isl_progress").upsert({ user_id: userId, item_id: itemId, score: s, completed_at: new Date().toISOString() });
      return next;
    });
  }, [userId]);
  return { progress, complete };
}

export const ACTIVITIES = ["signs", "vocab", "grammar", "reading", "writing", "quiz"] as const;
export type Activity = (typeof ACTIVITIES)[number];
export const itemId = (course: string, unit: string, a: Activity) => `${course}:${unit}:${a}`;
