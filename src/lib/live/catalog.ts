/**
 * Speakara Live: shared choices for the AI companion and community calls. Used by the browser and the server, so it
 * holds no secrets. The server re-validates every value before it reaches the database or the agent worker.
 */
import { TARGET_LANGUAGES } from "@/lib/content/languages";
import { SCENARIOS } from "@/lib/tutor/scenarios";

/** Languages a learner can practise live: the seven course languages. */
export const LIVE_LANGS = TARGET_LANGUAGES.map((l) => ({ code: l.code as string, name: l.name, flag: l.flag, rtl: !!l.rtl }));
/** Languages a learner can speak natively in the community exchange (course languages plus English and Hindi). */
export const NATIVE_LANGS = [
  { code: "en", name: "English", flag: "🇬🇧" }, { code: "hi", name: "Hindi", flag: "🇮🇳" },
  ...TARGET_LANGUAGES.map((l) => ({ code: l.code as string, name: l.name, flag: l.flag })),
];
export const langName = (code: string) => NATIVE_LANGS.find((l) => l.code === code)?.name ?? code;
export const langFlag = (code: string) => NATIVE_LANGS.find((l) => l.code === code)?.flag ?? "🏳️";

export const LIVE_SCENARIO_IDS = ["meet", "restaurant", "airport", "hotel", "shopping", "interview", "everyday"] as const;
export type LiveScenarioId = (typeof LIVE_SCENARIO_IDS)[number];
export const LIVE_SCENARIOS = LIVE_SCENARIO_IDS.map((id) => SCENARIOS.find((s) => s.id === id)!);

export const LEVELS = [
  { value: 1, label: /*i18n*/ "Beginner", cefr: "A1" }, { value: 2, label: /*i18n*/ "Elementary", cefr: "A2" },
  { value: 3, label: /*i18n*/ "Intermediate", cefr: "B1" }, { value: 4, label: /*i18n*/ "Upper intermediate", cefr: "B2" },
  { value: 5, label: /*i18n*/ "Advanced", cefr: "C1" },
] as const;

export const PERSONALITIES = [
  { id: "friendly", label: /*i18n*/ "Friendly", hint: /*i18n*/ "Warm and encouraging" },
  { id: "calm", label: /*i18n*/ "Calm", hint: /*i18n*/ "Patient and unhurried" },
  { id: "playful", label: /*i18n*/ "Playful", hint: /*i18n*/ "Jokes and light teasing" },
  { id: "professional", label: /*i18n*/ "Professional", hint: /*i18n*/ "Clear and to the point" },
] as const;
export const TEACHING_STYLES = [
  { id: "gentle", label: /*i18n*/ "Gentle", hint: /*i18n*/ "Only corrects big mistakes" },
  { id: "balanced", label: /*i18n*/ "Balanced", hint: /*i18n*/ "Corrects the most useful mistakes" },
  { id: "strict", label: /*i18n*/ "Strict", hint: /*i18n*/ "Corrects every mistake" },
  { id: "immersive", label: /*i18n*/ "Immersive", hint: /*i18n*/ "Stays in the language, minimal English" },
] as const;
/** Gemini Live prebuilt voices offered to learners (names are Google's). */
export const VOICES = [
  { id: "Puck", label: /*i18n*/ "Upbeat" }, { id: "Kore", label: /*i18n*/ "Firm" }, { id: "Aoede", label: /*i18n*/ "Breezy" },
  { id: "Charon", label: /*i18n*/ "Informative" }, { id: "Leda", label: /*i18n*/ "Youthful" }, { id: "Orus", label: /*i18n*/ "Steady" },
] as const;

export const INTERESTS = [
  /*i18n*/ "Travel", /*i18n*/ "Food", /*i18n*/ "Music", /*i18n*/ "Films", /*i18n*/ "Sport", /*i18n*/ "Books",
  /*i18n*/ "Technology", /*i18n*/ "Work", /*i18n*/ "Study", /*i18n*/ "Culture",
] as const;
export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export const DAY_LABELS: Record<(typeof DAYS)[number], string> = { mon: /*i18n*/ "Mon", tue: /*i18n*/ "Tue", wed: /*i18n*/ "Wed", thu: /*i18n*/ "Thu", fri: /*i18n*/ "Fri", sat: /*i18n*/ "Sat", sun: /*i18n*/ "Sun" };
export const SLOTS = [{ id: "morning", label: /*i18n*/ "Morning" }, { id: "afternoon", label: /*i18n*/ "Afternoon" }, { id: "evening", label: /*i18n*/ "Evening" }] as const;

/** A pre-made Anam avatar. Speakara never accepts custom or uploaded faces. */
export interface AvatarChoice { id: string; name: string; imageUrl?: string }

export interface CompanionPrefs {
  avatar_id: string; companion_name: string; personality: string; teaching_style: string; voice: string;
  target_lang: string; level: number; scenario: string;
}
export const DEFAULT_PREFS = (lang: string): Omit<CompanionPrefs, "avatar_id"> => ({
  companion_name: "Kiko", personality: "friendly", teaching_style: "balanced", voice: "Puck", target_lang: lang, level: 1, scenario: "meet",
});

/** Validates companion preferences against the fixed choices. Returns a clean copy or an error message. */
export function cleanPrefs(p: Partial<CompanionPrefs>, avatars: AvatarChoice[]): CompanionPrefs | string {
  const name = String(p.companion_name ?? "").trim().replace(/\s+/g, " ");
  if (!avatars.some((a) => a.id === p.avatar_id)) return /*i18n*/ "Choose one of the companions.";
  if (name.length < 1 || name.length > 24 || /[<>{}\\]/.test(name)) return /*i18n*/ "Give your companion a name of up to 24 letters.";
  if (!PERSONALITIES.some((x) => x.id === p.personality)) return /*i18n*/ "Choose a personality.";
  if (!TEACHING_STYLES.some((x) => x.id === p.teaching_style)) return /*i18n*/ "Choose a teaching style.";
  if (!VOICES.some((x) => x.id === p.voice)) return /*i18n*/ "Choose a voice.";
  if (!LIVE_LANGS.some((x) => x.code === p.target_lang)) return /*i18n*/ "Choose a language to practise.";
  if (!LEVELS.some((x) => x.value === p.level)) return /*i18n*/ "Choose your level.";
  if (!LIVE_SCENARIO_IDS.includes(p.scenario as LiveScenarioId)) return /*i18n*/ "Choose a conversation scenario.";
  return { avatar_id: p.avatar_id!, companion_name: name, personality: p.personality!, teaching_style: p.teaching_style!, voice: p.voice!, target_lang: p.target_lang!, level: p.level!, scenario: p.scenario! };
}

/** Formats seconds as m:ss. */
export const clock = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, "0")}`;

/** The learning report the agent worker produces after each AI conversation. */
export interface LearningReport {
  summary: string;
  vocabulary: { term: string; meaning: string }[];
  mistakes: { said: string; better: string; why: string }[];
  pronunciation: { word: string; tip: string }[];
  next_steps: string[];
  fluency?: number;
}
