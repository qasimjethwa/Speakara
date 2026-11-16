"use client";
import { useEffect, useState } from "react";
import { COURSES } from "@/lib/content";
import { useT } from "@/lib/i18n";

/** Explains, once per language and visit, why a "hear" button stayed silent: the device has no voice for it. */
export function VoiceNotice() {
  const { t } = useT(); const [lang, setLang] = useState<string | null>(null);
  useEffect(() => {
    const shown = new Set<string>();
    const on = (e: Event) => { const l = (e as CustomEvent<string>).detail; if (shown.has(l)) return; shown.add(l); setLang(l); };
    window.addEventListener("speakara:no-voice", on); return () => window.removeEventListener("speakara:no-voice", on);
  }, []);
  useEffect(() => { if (!lang) return; const id = setTimeout(() => setLang(null), 7000); return () => clearTimeout(id); }, [lang]);
  if (!lang) return null;
  const name = COURSES.find((c) => c.ttsLang === lang)?.targetName ?? lang;
  return (
    <div role="status" className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md rounded-2xl border-2 border-sun-edge bg-sun-soft px-4 py-3 text-[15px] font-semibold text-ink shadow-lg">
      {t("This device has no {lang} voice, so it can’t be read aloud. Install a {lang} voice in your device settings to hear it.", { lang: t(name) })}
      <button type="button" onClick={() => setLang(null)} className="ml-2 inline-flex min-h-11 items-center font-extrabold uppercase text-sky-dark">{t("OK")}</button>
    </div>
  );
}
