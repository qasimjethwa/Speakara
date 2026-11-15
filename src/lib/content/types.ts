/** Content contracts. Course content is authored as reviewable data, never as hardcoded pages. */
export type LangCode = "es" | "en" | "fr" | "hi" | "de" | "ko" | "it" | "ru";

export interface Word { id: string; t: string; n: string }
/** t = target-language text, n = native-language text, alt = other accepted native translations */
export interface Sentence { id: string; t: string; n: string; alt?: string[] }
export interface Tip { title: string; body: string; examples: { t: string; n: string }[] }
export interface Lesson { id: string; title: string; words: Word[]; sentences: Sentence[] }
export interface StoryLine { speaker: string; t: string; n: string }
export interface StoryQuestion { afterLine: number; prompt: string; options: string[]; answer: number }
export interface Story { id: string; title: string; summary: string; lines: StoryLine[]; questions: StoryQuestion[] }
export interface Unit {
  id: string; title: string; objective: string; cefr: "A1" | "A2"; color: UnitColor;
  tips: Tip[]; lessons: Lesson[]; story?: Story;
}
export type UnitColor = "brand" | "sky" | "grape" | "sun" | "coral";
export interface Course {
  id: string; target: LangCode; native: LangCode; title: string; targetName: string; nativeName: string;
  flag: string; ttsLang: string; sttLang: string; status: "complete-unit-set" | "beginner-set" | "starter"; license: string;
  review: string; units: Unit[];
}

type RawLesson = { title: string; words: [string, string][]; sentences: ([string, string] | [string, string, string[]])[] };
type RawUnit = Omit<Unit, "lessons"> & { lessons: RawLesson[] };

/** Assigns stable ids (unit.lessonIndex.w|s index) so progress and reviews survive content edits that append. */
export function buildCourse(meta: Omit<Course, "units">, units: RawUnit[]): Course {
  return {
    ...meta,
    units: units.map((u) => ({
      ...u,
      lessons: u.lessons.map((l, li) => ({
        id: `${u.id}.${li + 1}`,
        title: l.title,
        words: l.words.map(([t, n], i) => ({ id: `${u.id}.${li + 1}.w${i + 1}`, t, n })),
        sentences: l.sentences.map(([t, n, alt], i) => ({ id: `${u.id}.${li + 1}.s${i + 1}`, t, n, alt })),
      })),
    })),
  };
}
