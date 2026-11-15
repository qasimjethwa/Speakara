import { COURSES } from "./index";
import type { LangCode } from "./types";

/**
 * The six target languages Speakara teaches, each to English speakers. Interface languages (English, Spanish, Hindi)
 * are separate and live in src/lib/i18n. Do not add other target languages without a product decision.
 */
export interface TargetLanguage {
  code: LangCode; courseId: string; name: string; native: string; flag: string;
  tts: string; stt: string; script: "Latin" | "Cyrillic" | "Hangul";
}

export const TARGET_LANGUAGES: TargetLanguage[] = [
  { code: "es", courseId: "es-en", name: "Spanish", native: "Español", flag: "🇪🇸", tts: "es-ES", stt: "es-ES", script: "Latin" },
  { code: "fr", courseId: "fr-en", name: "French", native: "Français", flag: "🇫🇷", tts: "fr-FR", stt: "fr-FR", script: "Latin" },
  { code: "de", courseId: "de-en", name: "German", native: "Deutsch", flag: "🇩🇪", tts: "de-DE", stt: "de-DE", script: "Latin" },
  { code: "ko", courseId: "ko-en", name: "Korean", native: "한국어", flag: "🇰🇷", tts: "ko-KR", stt: "ko-KR", script: "Hangul" },
  { code: "it", courseId: "it-en", name: "Italian", native: "Italiano", flag: "🇮🇹", tts: "it-IT", stt: "it-IT", script: "Latin" },
  { code: "ru", courseId: "ru-en", name: "Russian", native: "Русский", flag: "🇷🇺", tts: "ru-RU", stt: "ru-RU", script: "Cyrillic" },
];

/** Each target language with its course's size, for language cards. Missing courses are reported, never hidden. */
export function targetLanguageSummaries() {
  return TARGET_LANGUAGES.map((l) => {
    const course = COURSES.find((c) => c.id === l.courseId);
    const lessons = course ? course.units.reduce((n, u) => n + u.lessons.length, 0) : 0;
    return { ...l, available: !!course && lessons > 0, units: course?.units.length ?? 0, lessons };
  });
}

/** Card metadata for any course, including the reverse English courses. */
export function courseCard(courseId: string) {
  const c = COURSES.find((x) => x.id === courseId)!;
  const lang = TARGET_LANGUAGES.find((l) => l.courseId === courseId);
  return {
    id: c.id, flag: c.flag, name: c.targetName, native: lang?.native ?? "English", script: lang?.script ?? "Latin", taughtIn: c.nativeName,
    units: c.units.length, lessons: c.units.reduce((n, u) => n + u.lessons.length, 0), level: c.units[0]?.cefr ?? "A1",
    reviewPending: /pending|needs/i.test(c.review), target: c.ttsLang,
  };
}
