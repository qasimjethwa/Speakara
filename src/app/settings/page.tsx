"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Button, Card, Dialog, Field, Notice } from "@/components/ui";
import { useStore } from "@/lib/state/store";
import { COURSES } from "@/lib/content";
import { LanguagePicker, useT } from "@/lib/i18n";

/** Rendered inside AppShell, so it mounts only once the learner state has loaded and form fields start correct. */
function SettingsBody() {
  const router = useRouter(); const { state, setProfile, mode, signOut, resetProgress, cloudConfigured, deleteAccount } = useStore(); const { t } = useT(); const p = state.profile;
  const [name, setName] = useState(p.name); const [confirm, setConfirm] = useState<"reset" | "delete" | null>(null); const [err, setErr] = useState<string | null>(null);
  const toggle = (key: "sound" | "speech" | "motion" | "slowAudio" | "isPublic", label: string, hint: string) => (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3"><span><span className="block font-extrabold">{t(label)}</span><span className="block text-sm text-sub">{t(hint)}</span></span>
      <input type="checkbox" role="switch" checked={p[key]} onChange={(e) => setProfile({ [key]: e.target.checked })} className="peer sr-only" /><span aria-hidden="true" className={`relative h-8 w-14 shrink-0 rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sky-dark ${p[key] ? "bg-brand" : "bg-line-dark"}`}><span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${p[key] ? "left-7" : "left-1"}`} /></span></label>
  );
  return (
    <>
      <PageTitle title={t("Settings")} />
      <Card className="mb-5"><h2 className="mb-3 text-lg">{t("Profile")}</h2>
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) setProfile({ name: name.trim() }); }} className="flex items-end gap-2"><div className="flex-1"><Field label={t("Display name")} value={name} onChange={(e) => setName(e.target.value)} maxLength={30} /></div><Button type="submit" variant="sky" disabled={!name.trim() || name.trim() === p.name}>{t("Save")}</Button></form></Card>
      <Card className="mb-5"><h2 className="mb-3 text-lg">{t("Interface language")}</h2><LanguagePicker />
        <p className="mt-2 text-sm text-sub">{t("This changes menus and instructions. You can learn any course in any interface language.")}</p></Card>
      <Card className="mb-5"><h2 className="mb-3 text-lg">{t("Course")}</h2>
        <div role="radiogroup" aria-label={t("Course")} className="space-y-2">{COURSES.map((c) => <button key={c.id} role="radio" aria-checked={p.courseId === c.id} onClick={() => setProfile({ courseId: c.id, nativeLang: c.native })} className={`key flex w-full items-center gap-3 rounded-2xl border-2 border-b-4 px-4 py-3 text-left font-bold ${p.courseId === c.id ? "border-sky-dark bg-sky-soft text-sky-dark" : "border-line-dark"}`}><span className="text-2xl" aria-hidden="true">{c.flag}</span><span>{t(c.targetName)} <span className="block text-sm font-semibold text-sub">{t("Taught in {lang}", { lang: t(c.nativeName) })}{c.status === "starter" ? ` · ${t("starter course")}` : ""}</span></span></button>)}</div>
        <p className="mt-2 text-sm text-sub">{t("Progress is kept separately for every course. XP, gems and your streak are shared.")}</p></Card>
      <Card className="mb-5"><h2 className="mb-3 text-lg">{t("Daily goal")}</h2>
        <div role="radiogroup" aria-label={t("Daily goal")} className="grid grid-cols-4 gap-2">{[10, 20, 30, 50].map((x) => <button key={x} role="radio" aria-checked={p.dailyGoalXp === x} onClick={() => setProfile({ dailyGoalXp: x })} className={`key rounded-2xl border-2 border-b-4 py-3 font-extrabold ${p.dailyGoalXp === x ? "border-sun-edge bg-sun-soft text-sun-dark" : "border-line-dark"}`}>{x} XP</button>)}</div></Card>
      <Card className="mb-5 divide-y-2 divide-line"><h2 className="pb-1 text-lg">{t("Lesson experience")}</h2>
        {toggle("sound", "Sound effects & auto-play audio", "Chimes for answers and automatic sentence audio")}
        {toggle("slowAudio", "Slower audio", "Play sentences at three-quarter speed")}
        {toggle("speech", "Speaking exercises", "Turn off if you can’t use a microphone")}
        {toggle("motion", "Animations", "Celebrations and movement. Your device’s reduced-motion setting is always respected")}</Card>
      {mode === "cloud" && <Card className="mb-5"><h2 className="pb-1 text-lg">{t("Privacy")}</h2>{toggle("isPublic", "Public profile", "Let other learners find you by username and see your name on leaderboards")}</Card>}
      <Card><h2 className="mb-3 text-lg">{t("Account")}</h2>
        <p className="mb-3 text-sm text-sub">{mode === "cloud" ? t("Your progress syncs to your account.") : cloudConfigured ? t("You’re learning as a guest. Create an account to sync across devices.") : t("Progress is saved on this device.")}</p>
        {err && <div className="mb-3"><Notice tone="error">{t(err)}</Notice></div>}
        <div className="flex flex-wrap gap-3">
          {mode === "cloud" ? <><Button variant="secondary" onClick={async () => { await signOut(); window.location.replace("/"); }}>{t("Log out")}</Button><Button variant="secondary" className="!text-coral-dark" onClick={() => setConfirm("delete")}>{t("Delete account")}</Button></>
            : <>{cloudConfigured && <Button variant="sky" onClick={() => router.push("/signup")}>{t("Create account")}</Button>}<Button variant="secondary" className="!text-coral-dark" onClick={() => setConfirm("reset")}>{t("Reset progress")}</Button></>}
        </div></Card>
      <Dialog open={!!confirm} onClose={() => setConfirm(null)} labelledBy="confirm-title">
        <h2 id="confirm-title" className="text-xl">{confirm === "delete" ? t("Delete your account?") : t("Erase your progress?")}</h2>
        <p className="mt-2 text-sub">{confirm === "delete" ? t("This permanently deletes your account and all your learning data. It cannot be undone.") : t("This clears all learning progress stored on this device. It cannot be undone.")}</p>
        <div className="mt-5 space-y-3">
          <Button variant="danger" className="w-full" onClick={async () => { if (confirm === "delete") { const e = await deleteAccount(); setConfirm(null); if (e) setErr(e); else window.location.replace("/"); } else { resetProgress(); setConfirm(null); router.replace("/onboarding"); } }}>{confirm === "delete" ? t("Yes, delete everything") : t("Yes, erase my progress")}</Button>
          <Button autoFocus variant="secondary" className="w-full" onClick={() => setConfirm(null)}>{t("Cancel")}</Button>
        </div>
      </Dialog>
    </>
  );
}
export default function SettingsPage() { return <AppShell rail={false}><SettingsBody /></AppShell>; }
