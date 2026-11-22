"use client";
import { Check } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useTeacherPref, type TeacherId } from "@/lib/isl/data";

const TEACHERS: { id: TeacherId; label: string; img: string }[] = [
  { id: "female", label: /*i18n*/ "Female teacher", img: "/isl/teacher-female.webp" },
  { id: "male", label: /*i18n*/ "Male teacher", img: "/isl/teacher-male.webp" },
];

/** Choose the signing teacher. Both use the same rig, so every reviewed sign plays identically on either. */
export function TeacherPicker({ size = "lg" }: { size?: "lg" | "sm" }) {
  const { t } = useT(); const [who, setWho] = useTeacherPref();
  if (size === "sm") return (
    <div className="inline-flex rounded-full border border-line bg-paper p-1" role="radiogroup" aria-label={t("Teacher")}>
      {TEACHERS.map((x) => <button key={x.id} type="button" role="radio" aria-checked={who === x.id} onClick={() => setWho(x.id)}
        className={`flex min-h-10 items-center gap-2 rounded-full pl-1 pr-3 text-sm font-bold ${who === x.id ? "bg-ink text-white" : "text-ink"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={x.img} alt="" width={32} height={32} className="h-8 w-8 rounded-full bg-[#ece6da] object-cover" />{t(x.label)}</button>)}
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={t("Choose your teacher")}>
      {TEACHERS.map((x) => (
        <button key={x.id} type="button" role="radio" aria-checked={who === x.id} onClick={() => setWho(x.id)}
          className={`relative overflow-hidden rounded-3xl border-2 bg-[#ece6da] text-left ${who === x.id ? "border-ink" : "border-transparent hover:border-line-dark"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={x.img} alt="" width={360} height={360} className="aspect-square w-full object-cover" />
          <span className="flex items-center justify-between bg-paper px-4 py-3 font-extrabold">{t(x.label)}{who === x.id && <Check size={18} aria-hidden="true" />}</span>
        </button>))}
    </div>
  );
}
