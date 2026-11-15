"use client";
import { useCallback, useEffect, useState } from "react";
import { useStore } from "../state/store";
import { translate, type UiLang } from "./translate";
export { translate, type UiLang };

export const UI_LANGS: { code: UiLang; label: string; locale: string }[] = [
  { code: "en", label: "English", locale: "en" }, { code: "es", label: "Español", locale: "es" }, { code: "hi", label: "हिन्दी", locale: "hi-IN" },
];
const PREF = "speakara:ui-lang";
export const localeOf = (lang: UiLang) => UI_LANGS.find((l) => l.code === lang)?.locale ?? "en";

/** Interface language: the learner's saved choice, else the choice made before onboarding, else the browser's. */
export function useUiLang(): [UiLang, (l: UiLang) => void] {
  const { state, ready, setProfile } = useStore();
  const [pre, setPre] = useState<UiLang>("en");
  useEffect(() => {
    let stored: string | null = null; try { stored = localStorage.getItem(PREF); } catch { /* blocked */ }
    const guess = stored ?? navigator.language.slice(0, 2);
    if (guess === "es" || guess === "hi" || guess === "en") setPre(guess);
  }, []);
  const lang: UiLang = ready && state.profile.onboarded ? state.profile.uiLang : pre;
  const set = useCallback((l: UiLang) => { setPre(l); try { localStorage.setItem(PREF, l); } catch { /* blocked */ } setProfile({ uiLang: l }); }, [setProfile]);
  useEffect(() => { document.documentElement.lang = localeOf(lang); }, [lang]);
  return [lang, set];
}
export function useT() {
  const [lang] = useUiLang();
  const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  const num = useCallback((n: number) => new Intl.NumberFormat(localeOf(lang)).format(n), [lang]);
  const date = useCallback((ms: number, opts?: Intl.DateTimeFormatOptions) => new Date(ms).toLocaleDateString(localeOf(lang), opts), [lang]);
  return { t, num, date, lang };
}
export function LanguagePicker({ className = "" }: { className?: string }) {
  const [lang, set] = useUiLang();
  return (
    <label className={`inline-flex items-center gap-2 text-sm font-bold text-sub ${className}`}>
      <span className="sr-only">Interface language / Idioma / भाषा</span><span aria-hidden="true">🌐</span>
      <select value={lang} onChange={(e) => set(e.target.value as UiLang)} className="rounded-xl border-2 border-line-dark bg-paper px-2 py-1.5 font-bold text-ink">
        {UI_LANGS.map((l) => <option key={l.code} value={l.code} lang={l.locale}>{l.label}</option>)}
      </select>
    </label>
  );
}
