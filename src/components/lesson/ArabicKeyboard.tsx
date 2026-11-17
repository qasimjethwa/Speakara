"use client";
import { useState } from "react";
import { Delete } from "lucide-react";
import { useT } from "@/lib/i18n";

/** Letters in the order of the common Arabic (101) keyboard, then hamza forms and endings. */
const LETTERS = "ض ص ث ق ف غ ع ه خ ح ج د ش س ي ب ل ا ت ن م ك ط ئ ء ؤ ر ى ة و ز ظ ذ أ إ آ".split(" ");
/** fatha, kasra, damma, sukun, shadda, tanwin fath — optional reading aids; answers are accepted without them. */
const MARKS = ["َ", "ِ", "ُ", "ْ", "ّ", "ً"];
const PUNCT = ["؟", "،"];

/**
 * On-screen Arabic keyboard for typed answers, so learners without an Arabic layout can still answer. It inserts at the
 * caret of the textarea it controls. Every key is at least 40×44 px and the grid wraps, so it fits a 320 px screen.
 */
export function ArabicKeyboard({ target, disabled, onChange, defaultOpen = true }: { target: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>; disabled: boolean; onChange: (v: string) => void; defaultOpen?: boolean }) {
  const { t } = useT();
  const [open, setOpen] = useState(defaultOpen);
  const [marks, setMarks] = useState(false);
  const edit = (fn: (v: string, a: number, b: number) => [string, number]) => {
    const el = target.current; if (!el || disabled) return;
    const a = el.selectionStart ?? el.value.length, b = el.selectionEnd ?? el.value.length;
    const [next, caret] = fn(el.value, a, b);
    // Use the native setter so React's onChange-driven state and the DOM stay in step.
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")!.set!.call(el, next);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.setSelectionRange(caret, caret); onChange(next);
  };
  const insert = (s: string) => edit((v, a, b) => [v.slice(0, a) + s + v.slice(b), a + s.length]);
  const back = () => edit((v, a, b) => (a !== b ? [v.slice(0, a) + v.slice(b), a] : a > 0 ? [v.slice(0, a - 1) + v.slice(a), a - 1] : [v, 0]));
  const key = "key grid min-h-11 min-w-10 place-items-center rounded-lg border-2 border-b-4 border-line-dark bg-paper text-xl font-bold disabled:opacity-50";
  const keys = marks ? MARKS : LETTERS;
  return (
    <div data-arabic-keyboard className="rounded-2xl border-2 border-line bg-mist p-2">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="min-h-11 rounded-lg px-3 text-sm font-extrabold uppercase text-sky-dark">{open ? t("Hide Arabic keyboard") : t("Show Arabic keyboard")}</button>
        {open && <button type="button" aria-pressed={marks} onClick={() => setMarks(!marks)} className="min-h-11 rounded-lg px-3 text-sm font-extrabold uppercase text-sky-dark">{marks ? t("Letters") : t("Vowel marks")}</button>}
      </div>
      {open && <>
        <div role="group" aria-label={t("Arabic keyboard")} dir="rtl" lang="ar" className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1">
          {keys.map((k) => <button key={k} type="button" disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => insert(k)} className={key} aria-label={marks ? `${t("Vowel mark")} ${k}` : k}>{marks ? `ـ${k}` : k}</button>)}
          {PUNCT.map((k) => <button key={k} type="button" disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => insert(k)} className={key}>{k}</button>)}
        </div>
        <div className="mt-1 grid grid-cols-[1fr_auto] gap-1">
          <button type="button" disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => insert(" ")} className={`${key} text-sm`}>{t("Space")}</button>
          <button type="button" disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={back} className={`${key} px-4`} aria-label={t("Delete")}><Delete size={20} aria-hidden="true" /></button>
        </div>
      </>}
    </div>
  );
}
