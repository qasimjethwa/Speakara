"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Card, Loading } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { ISLRTC_DICTIONARY } from "@/lib/isl/courses";
import { useValidatedClips } from "@/lib/isl/data";
import type { SignClip } from "@/lib/isl/rig";

const SignTeacher = dynamic(() => import("@/components/isl/SignTeacher").then((m) => m.SignTeacher), { ssr: false, loading: () => <Loading text="Loading the signing teacher…" /> });
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const letterSign = (l: string) => `FS-${l}`;

/** Joins validated letter clips into one clip, with a caption per letter, for name spelling. */
function sequence(letters: string[], clips: Record<string, SignClip>): SignClip | null {
  const parts = letters.map((l) => clips[letterSign(l)]).filter(Boolean);
  if (!parts.length || parts.length !== letters.length) return null;
  let at = 0; const keys: SignClip["keys"] = []; const captions: NonNullable<SignClip["captions"]> = [];
  parts.forEach((c, i) => { c.keys.forEach((k) => keys.push({ ...k, t: at + k.t })); captions.push({ start: at, end: at + c.duration, text: letters.slice(0, i + 1).join("") }); at += c.duration; });
  return { id: "fs-seq", gloss: letters.join(""), duration: at, keys, captions, status: "validated", reviewedBy: [...new Set(parts.map((p) => p.reviewedBy))].join(", ") };
}

export default function Fingerspelling() {
  const { t } = useT(); const { clips } = useValidatedClips();
  const [letter, setLetter] = useState("A"); const [name, setName] = useState("");
  const spelled = useMemo(() => name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 16).split("").filter(Boolean), [name]);
  const seq = useMemo(() => sequence(spelled, clips), [spelled, clips]);
  const clip = spelled.length ? seq : clips[letterSign(letter)] ?? null;
  return (
    <AppShell rail={false} wide>
      <Link href="/learn/isl" className="mb-2 inline-flex min-h-11 items-center text-sm font-extrabold uppercase text-sky-dark">← {t("ISL courses")}</Link>
      <PageTitle title={t("Fingerspelling")} sub={t("The English alphabet in ISL fingerspelling, for names and new words.")} />
      <p className="text-sub">{t("ISL fingerspelling mostly uses two hands and is different from American Sign Language.")}</p>
      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <SignTeacher clip={clip} initialView="hands" targetLang="en" fallback={{ start: 0, end: 1, text: spelled.length ? spelled.join("") : letter, meaning: spelled.length ? t("Spelling a name") : t("Letter {l}", { l: letter }) }} />
        <div className="space-y-4">
          <Card>
            <h2 className="mb-2 text-lg">{t("Alphabet")}</h2>
            <div className="grid grid-cols-6 gap-2">{LETTERS.map((l) => (
              <button key={l} type="button" onClick={() => { setLetter(l); setName(""); }} aria-pressed={letter === l && !spelled.length}
                className={`flex min-h-12 flex-col items-center justify-center rounded-xl border-2 text-lg font-black ${letter === l && !spelled.length ? "border-ink bg-ink text-white" : "border-line"}`}>
                {l}</button>))}</div>
          </Card>
          <Card>
            <label className="block"><span className="mb-1 block font-extrabold">{t("Spell a name")}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={16} placeholder={t("e.g. RAVI")} className="w-full rounded-2xl border-2 border-line-dark bg-mist px-4 py-3 text-lg font-bold uppercase" /></label>
            {spelled.length > 0 && <p className="mt-2 text-sm text-sub">{seq ? t("Play to watch the name spelled letter by letter.") : t("Spell it letter by letter: {l}", { l: spelled.join(" – ") })}</p>}
          </Card>
          <a href={ISLRTC_DICTIONARY} target="_blank" rel="noopener noreferrer" className="block text-sm font-bold text-ink underline underline-offset-4">{t("See the official handshapes in the ISLRTC dictionary")}</a>
        </div>
      </div>
    </AppShell>
  );
}
