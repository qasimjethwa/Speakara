"use client";
/** Classroom preferences (this device only): course, lesson, teacher and caption options. */
import { useCallback, useSyncExternalStore } from "react";
import type { CourseId } from "./content";
import type { TeacherChoice } from "./teacher/types";

export interface ClassPrefs { course: CourseId; lesson: string; started: boolean; teacher: TeacherChoice; captionSize: number; captionBg: "soft" | "solid" | "none"; contrast: boolean; hindi: boolean }
const KEY = "speakara:isl-classroom:prefs:v1";
const DEF: ClassPrefs = { course: "english", lesson: "greet", started: false, teacher: "female", captionSize: 20, captionBg: "soft", contrast: false, hindi: false };
let cur: ClassPrefs | null = null; const subs = new Set<() => void>();
function read(): ClassPrefs {
  if (cur) return cur;
  try { cur = { ...DEF, ...JSON.parse(localStorage.getItem(KEY) ?? "{}"), started: false }; } catch { cur = { ...DEF }; }
  return cur!;
}
export function usePrefs(): [ClassPrefs, (p: ClassPrefs) => void] {
  const p = useSyncExternalStore((l) => { subs.add(l); return () => { subs.delete(l); }; }, read, () => DEF);
  const set = useCallback((n: ClassPrefs) => { cur = n; try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* private mode */ } subs.forEach((l) => l()); }, []);
  return [p, set];
}
