"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Button, Card, Field } from "@/components/ui";
import { useStore } from "@/lib/state/store";
import { COURSES } from "@/lib/content";
import { updateProfile } from "@/lib/state/actions";
import type { Profile } from "@/lib/state/types";

export default function SettingsPage() {
  const router = useRouter(); const { state, update, mode, signOut, resetProgress, cloudConfigured } = useStore(); const p = state.profile;
  const [name, setName] = useState(p.name); const [confirm, setConfirm] = useState(false);
  const set = (patch: Partial<Profile>) => update((s) => updateProfile(s, patch));
  const toggle = (key: "sound" | "speech" | "motion", label: string, hint: string) => (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3"><span><span className="block font-extrabold">{label}</span><span className="block text-sm text-sub">{hint}</span></span>
      <input type="checkbox" role="switch" checked={p[key]} onChange={(e) => set({ [key]: e.target.checked })} className="peer sr-only" /><span aria-hidden="true" className={`relative h-8 w-14 shrink-0 rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-sky ${p[key] ? "bg-brand" : "bg-line-dark"}`}><span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${p[key] ? "left-7" : "left-1"}`} /></span></label>
  );
  return (
    <AppShell rail={false}>
      <PageTitle title="Settings" />
      <Card className="mb-5"><h2 className="mb-3 text-lg">Profile</h2>
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) set({ name: name.trim() }); }} className="flex items-end gap-2"><div className="flex-1"><Field label="Display name" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} /></div><Button type="submit" variant="sky" disabled={!name.trim() || name.trim() === p.name}>Save</Button></form></Card>
      <Card className="mb-5"><h2 className="mb-3 text-lg">Course</h2>
        <div role="radiogroup" aria-label="Active course" className="space-y-2">{COURSES.map((c) => <button key={c.id} role="radio" aria-checked={p.courseId === c.id} onClick={() => set({ courseId: c.id })} className={`key flex w-full items-center gap-3 rounded-2xl border-2 border-b-4 px-4 py-3 text-left font-bold ${p.courseId === c.id ? "border-sky bg-sky-soft text-sky-dark" : "border-line-dark"}`}><span className="text-2xl">{c.flag}</span>{c.targetName} <span className="font-semibold text-sub">for {c.nativeName} speakers{c.status === "starter" ? " · starter" : ""}</span></button>)}</div>
        <p className="mt-2 text-sm text-sub">Progress is kept separately for every course. XP, gems and your streak are shared.</p></Card>
      <Card className="mb-5"><h2 className="mb-3 text-lg">Daily goal</h2>
        <div role="radiogroup" aria-label="Daily XP goal" className="grid grid-cols-4 gap-2">{[10, 20, 30, 50].map((x) => <button key={x} role="radio" aria-checked={p.dailyGoalXp === x} onClick={() => set({ dailyGoalXp: x })} className={`key rounded-2xl border-2 border-b-4 py-3 font-extrabold ${p.dailyGoalXp === x ? "border-sun-dark bg-sun-soft text-sun-dark" : "border-line-dark"}`}>{x} XP</button>)}</div></Card>
      <Card className="mb-5 divide-y-2 divide-line"><h2 className="pb-1 text-lg">Lesson experience</h2>
        {toggle("sound", "Sound effects & auto-play audio", "Chimes for answers and automatic sentence audio")}
        {toggle("speech", "Speaking exercises", "Turn off if you can’t use a microphone")}
        {toggle("motion", "Animations", "Celebrations and movement. Your device’s reduced-motion setting is always respected")}</Card>
      <Card><h2 className="mb-3 text-lg">Account</h2>
        <p className="mb-3 text-sm text-sub">{mode === "cloud" ? "Your progress syncs to your account." : cloudConfigured ? "You’re learning as a guest. Create an account to sync across devices." : "Guest mode: progress is stored in this browser only."}</p>
        <div className="flex flex-wrap gap-3">
          {mode === "cloud" ? <Button variant="secondary" onClick={async () => { await signOut(); router.replace("/"); }}>Log out</Button> : cloudConfigured && <Button variant="sky" onClick={() => router.push("/signup")}>Create account</Button>}
          {!confirm ? <Button variant="secondary" className="!text-coral-dark" onClick={() => setConfirm(true)}>Reset progress</Button> : <><Button variant="danger" onClick={() => { resetProgress(); router.replace("/onboarding"); }}>Yes, erase my progress</Button><Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button></>}
        </div></Card>
    </AppShell>
  );
}
