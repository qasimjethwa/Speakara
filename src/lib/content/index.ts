import { esEn } from "./courses/es-en";
import { frEn, enEs, enHi } from "./courses/starters";
import { deEn, itEn, koEn, ruEn } from "./courses/languages";
import type { Course, Lesson, Unit, Word, Sentence } from "./types";

/** Every course. The six target languages come first; English-taught reverse courses follow. */
export const COURSES: Course[] = [esEn, frEn, deEn, koEn, itEn, ruEn, enEs, enHi];
export const DEFAULT_COURSE = "es-en";
export const getCourse = (id: string): Course => COURSES.find((c) => c.id === id) ?? esEn;
export const allLessons = (c: Course): { unit: Unit; lesson: Lesson; index: number }[] =>
  c.units.flatMap((unit) => unit.lessons.map((lesson) => ({ unit, lesson }))).map((x, index) => ({ ...x, index }));
export const allWords = (c: Course): Word[] => c.units.flatMap((u) => u.lessons.flatMap((l) => l.words));
export const allSentences = (c: Course): Sentence[] => c.units.flatMap((u) => u.lessons.flatMap((l) => l.sentences));
export const findLesson = (c: Course, lessonId: string) => allLessons(c).find((x) => x.lesson.id === lessonId);
export const lessonKey = (courseId: string, lessonId: string) => `${courseId}:${lessonId}`;
export const wordKey = (courseId: string, wordId: string) => `${courseId}:${wordId}`;
export type { Course, Lesson, Unit, Word, Sentence } from "./types";
