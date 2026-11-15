/**
 * Transparent spaced repetition (SM-2 family, simplified). Every number here is explainable to the learner:
 * a correct recall grows the gap (1 day → 3 days → gap × ease); a miss resets the gap and lowers ease.
 */
export interface SrsItem { reps: number; interval: number; ease: number; due: number; lapses: number; seen: number; last: number }
export const DAY = 86_400_000;
/** Longest gap between reviews, in days. */
export const MAX_INTERVAL = 365;
export const newItem = (now: number): SrsItem => ({ reps: 0, interval: 0, ease: 2.3, due: now, lapses: 0, seen: 0, last: now });

export function review(item: SrsItem | undefined, correct: boolean, now: number): SrsItem {
  const it = item ?? newItem(now);
  if (!correct) return { ...it, reps: 0, interval: 0, ease: Math.max(1.3, it.ease - 0.2), lapses: it.lapses + 1, seen: it.seen + 1, due: now + 10 * 60_000, last: now };
  // Recalling a word again before it is due confirms it but does not stretch the gap; otherwise drilling one word
  // many times in a day would push its next review years (eventually beyond any valid date) into the future.
  if (it.reps > 0 && now < it.due) return { ...it, interval: Math.min(MAX_INTERVAL, it.interval), due: Math.min(it.due, now + MAX_INTERVAL * DAY), seen: it.seen + 1, last: now };
  const reps = it.reps + 1;
  const interval = Math.min(MAX_INTERVAL, reps === 1 ? 1 : reps === 2 ? 3 : Math.round(it.interval * it.ease));
  return { ...it, reps, interval, ease: Math.min(2.8, it.ease + 0.05), seen: it.seen + 1, due: now + interval * DAY, last: now };
}
export const isDue = (it: SrsItem, now: number) => it.due <= now;
/** 0–4 strength bars shown in the vocabulary notebook. */
export const strength = (it: SrsItem): number => (it.reps === 0 ? 0 : it.interval < 3 ? 1 : it.interval < 7 ? 2 : it.interval < 21 ? 3 : 4);
