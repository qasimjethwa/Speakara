"use client";
import { Check } from "lucide-react";
import { courseCard } from "@/lib/content/languages";
import { useT } from "@/lib/i18n";

const SCRIPT_LABEL = { Latin: "Latin alphabet", Cyrillic: "Cyrillic alphabet", Hangul: "Hangul" } as const;

/** Selectable course cards: flag, names, writing system, size and level. One column on phones, two from 480 px. */
export function CourseCards({ ids, value, onChange, label }: { ids: string[]; value: string; onChange: (id: string) => void; label: string }) {
  const { t, num } = useT();
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
      {ids.map((id) => { const c = courseCard(id); const on = value === id; return (
        <button key={id} type="button" role="radio" aria-checked={on} data-course={id} onClick={() => onChange(id)}
          className={`key relative flex min-w-0 flex-col gap-2 rounded-2xl border-2 border-b-4 p-4 text-left ${on ? "border-sky-dark bg-sky-soft" : "border-line-dark bg-paper"}`}>
          <span className="flex min-w-0 items-center gap-3">
            <span className="text-4xl leading-none" aria-hidden="true">{c.flag}</span>
            <span className="min-w-0 flex-1">
              <span className={`block truncate text-lg font-extrabold leading-tight ${on ? "text-sky-dark" : "text-ink"}`}>{t(c.name)}</span>
              <span className="block truncate text-[15px] font-bold text-sub" lang={c.target}>{c.native}</span>
            </span>
            {on && <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky text-white"><Check size={18} strokeWidth={3} aria-hidden="true" /><span className="sr-only">{t("Selected")}</span></span>}
          </span>
          <span className="flex flex-wrap gap-1.5 text-[13px] font-bold text-sub">
            <span className="rounded-lg bg-mist px-2 py-1">{t("Level {level}", { level: c.level })}</span>
            <span className="rounded-lg bg-mist px-2 py-1">{c.units === 1 ? t("1 unit") : t("{n} units", { n: num(c.units) })} · {t("{n} lessons", { n: num(c.lessons) })}</span>
            <span className="rounded-lg bg-mist px-2 py-1">{t(SCRIPT_LABEL[c.script])}</span>
          </span>
          <span className="text-[13px] font-semibold text-sub">{t("Taught in {lang}", { lang: t(c.taughtIn) })}{c.reviewPending ? ` · ${t("native review pending")}` : ""}</span>
        </button>
      ); })}
    </div>
  );
}
