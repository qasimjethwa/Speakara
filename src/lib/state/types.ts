import type { SrsItem } from "../engine/srs";

export interface Profile {
  name: string; username: string; nativeLang: string; courseId: string; goal: string; level: "new" | "some";
  dailyGoalXp: number; onboarded: boolean; sound: boolean; speech: boolean; motion: boolean; createdAt: number;
  uiLang: "en" | "es" | "hi"; isPublic: boolean; role: "learner" | "editor" | "admin"; slowAudio: boolean; savedPhrases: { t: string; n: string; courseId: string }[];
}
export interface Completion { count: number; bestAccuracy: number; at: number }
export interface XpEvent { id: string; at: number; amount: number; source: string }
export interface Quest { id: string; progress: number; target: number; reward: number; claimed: boolean }
export interface Mistake { courseId: string; sentenceId: string; at: number }
export interface TutorMessage { role: "tutor" | "learner"; text: string; translation?: string; correction?: string; tip?: string }
export interface Conversation { id: string; scenario: string; courseId: string; at: number; messages: TutorMessage[] }

/** The learner model: everything the engines need to personalise sessions. Persisted per user. */
export interface LearnerState {
  version: 1;
  profile: Profile;
  xp: number; gems: number;
  streak: { count: number; lastDay: string | null; freezes: number; longest: number };
  completed: Record<string, Completion>;          // lessonKey → completion
  unlockedUnits: Record<string, number>;          // courseId → highest unit index opened by placement / test-out
  stories: Record<string, number>;                // storyId → completedAt
  review: Record<string, SrsItem>;                // wordKey → spaced-repetition item
  mistakes: Mistake[];
  xpEvents: XpEvent[];
  quests: { day: string; items: Quest[] };
  achievements: Record<string, number>;
  conversations: Conversation[];
  stats: { lessons: number; perfect: number; practice: number; minutes: number; tutorTurns: number };
}

export const initialState = (now: number): LearnerState => ({
  version: 1,
  profile: { name: "", username: "", nativeLang: "en", courseId: "es-en", goal: "", level: "new", dailyGoalXp: 20, onboarded: false, sound: true, speech: true, motion: true, createdAt: now, uiLang: "en", isPublic: true, role: "learner", slowAudio: false, savedPhrases: [] },
  xp: 0, gems: 0, streak: { count: 0, lastDay: null, freezes: 0, longest: 0 },
  completed: {}, unlockedUnits: {}, stories: {}, review: {}, mistakes: [], xpEvents: [],
  quests: { day: "", items: [] }, achievements: {}, conversations: [],
  stats: { lessons: 0, perfect: 0, practice: 0, minutes: 0, tutorTurns: 0 },
});
