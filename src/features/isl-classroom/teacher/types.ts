/**
 * Teacher adapter. The classroom only talks to a teacher through this interface, so the current teacher
 * (real Deaf signers' reference recordings) can be swapped for an AI avatar later without touching the classroom.
 * An avatar must play ONLY approved sign data for `sign`; `mood` drives emotional expression and never changes a sign.
 */
import type { ComponentType } from "react";
import type { Mood } from "../engine";

export type TeacherChoice = "female" | "male";
export interface TeacherProps {
  sign: string | null;          // ClassroomSign id to demonstrate (null = idle)
  demoKey: number;              // changes every time a demonstration should (re)start
  demonstrating: boolean;
  slow: boolean;
  mood: Mood;
  choice: TeacherChoice;
  onDemoEnd: () => void;
}
export interface TeacherAdapter {
  id: string;
  /** Teacher choices this adapter can really show. Empty = no choice offered. */
  choices: TeacherChoice[];
  credit: string;
  Component: ComponentType<TeacherProps>;
}
