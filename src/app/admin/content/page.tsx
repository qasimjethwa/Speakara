"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { COURSES } from "@/lib/content";
import { lintCourse } from "@/lib/content/lint";
import { useStore } from "@/lib/state/store";
import { supabase } from "@/lib/supabase";
import { Button, Dialog, Field, Notice } from "@/components/ui";

interface Suggestion { id: string; course_id: string; item_id: string; field: string; current_text: string; proposed_text: string; note: string; status: string; created_at: string }
interface Target { courseId: string; itemId: string; field: "t" | "n"; current: string }

/**
 * Content review (English only). Lists every learner-facing string with automated checks. Signed-in learners can
 * propose a correction; editors and admins approve or reject. Approved changes are applied to the course files by a
 * maintainer — the courses themselves stay version-controlled.
 */
export default function ContentReview() {
  const { state, mode } = useStore(); const db = supabase(); const staff = mode === "cloud" && state.profile.role !== "learner";
  const [items, setItems] = useState<Suggestion[]>([]); const [target, setTarget] = useState<Target | null>(null); const [proposed, setProposed] = useState(""); const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const load = async () => { if (!db || mode !== "cloud") return; const { data, error } = await db.from("content_suggestions").select("*").order("created_at", { ascending: false }).limit(100); if (error) setMsg({ tone: "error", text: error.message }); else setItems(data as Suggestion[]); };
  useEffect(() => { void load(); }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!db || !target) return;
    const { error } = await db.from("content_suggestions").insert({ course_id: target.courseId, item_id: target.itemId, field: target.field, current_text: target.current, proposed_text: proposed.trim(), note: note.trim() });
    setTarget(null); setMsg(error ? { tone: "error", text: error.message } : { tone: "success", text: "Thanks — your suggestion was sent for review." }); void load();
  };
  const decide = async (s: Suggestion, status: "approved" | "rejected") => { const { data: u } = await db!.auth.getUser(); const { error } = await db!.from("content_suggestions").update({ status, reviewed_by: u.user?.id, reviewed_at: new Date().toISOString() }).eq("id", s.id); if (error) setMsg({ tone: "error", text: error.message }); void load(); };
  const cell = (c: (typeof COURSES)[number], itemId: string, field: "t" | "n", text: string, lang?: string) => (
    <td lang={lang} className="py-1 pr-2">{text}{mode === "cloud" && <button onClick={() => { setTarget({ courseId: c.id, itemId, field, current: text }); setProposed(text); setNote(""); }} className="ml-2 text-xs font-extrabold uppercase text-sky-dark" aria-label={`Suggest a correction for ${text}`}>Suggest</button>}</td>
  );
  return (
    <main className="mx-auto max-w-[960px] px-5 py-10">
      <Link href={staff ? "/admin" : "/"} className="text-sm font-extrabold uppercase text-sky-dark">← {staff ? "Admin" : "Speakara"}</Link>
      <h1 className="mt-3 text-3xl">Content review</h1>
      <p className="mt-2 text-sub">Every course is authored as data in <code>src/lib/content/courses</code>. This page runs the automated checks reviewers rely on and lists all learner-facing text. {mode === "cloud" ? "Use “Suggest” next to any text to propose a correction." : "Log in to propose corrections."}</p>
      {msg && <div className="mt-4"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      {mode === "cloud" && <section className="mt-8"><h2 className="text-2xl">{staff ? "Suggestions to review" : "Your suggestions"}</h2>
        {items.length === 0 ? <p className="mt-2 text-sub">No suggestions yet.</p> : <ul className="mt-3 space-y-3">{items.map((s) => (
          <li key={s.id} className="rounded-2xl border-2 border-line p-4"><p className="text-sm text-sub">{s.course_id} · {s.item_id} · {s.field === "t" ? "target text" : "translation"} · {new Date(s.created_at).toLocaleDateString()} · <strong className={s.status === "open" ? "text-sun-dark" : s.status === "approved" ? "text-brand-dark" : "text-coral-dark"}>{s.status}</strong></p>
            <p className="mt-1"><del className="text-sub">{s.current_text}</del> → <strong>{s.proposed_text}</strong></p>{s.note && <p className="mt-1 text-sm">{s.note}</p>}
            {staff && s.status === "open" && <div className="mt-3 flex gap-2"><Button className="!min-h-10 !text-sm" onClick={() => decide(s, "approved")}>Approve</Button><Button variant="secondary" className="!min-h-10 !text-sm" onClick={() => decide(s, "rejected")}>Reject</Button></div>}</li>))}</ul>}</section>}
      {COURSES.map((c) => { const issues = lintCourse(c); return (
        <section key={c.id} className="mt-10">
          <h2 className="text-2xl"><span aria-hidden="true">{c.flag}</span> {c.targetName} for {c.nativeName} speakers <span className="ml-2 rounded-lg bg-mist px-2 py-1 align-middle text-sm text-sub">{c.status}</span></h2>
          <p className="mt-1 text-sm text-sub">Licence: {c.license} · Review status: {c.review}</p>
          <div className="mt-3"><Notice tone={issues.length ? "error" : "success"}>{issues.length ? `${issues.length} automated issue(s): ${issues.join("; ")}` : "Automated checks pass: unique ids, no empty text, no duplicate prompts, questions point at real lines."}</Notice></div>
          {c.units.map((u, ui) => (
            <details key={u.id} className="mt-3 rounded-2xl border-2 border-line p-4" open={ui === 0}>
              <summary className="cursor-pointer text-lg font-extrabold">Unit {ui + 1}: {u.title} <span className="font-semibold text-sub">· {u.cefr} · {u.objective}</span></summary>
              {u.lessons.map((l) => (
                <div key={l.id} className="mt-4"><h3 className="font-extrabold">{l.id} · {l.title}</h3>
                  <table className="mt-2 w-full text-left text-sm"><caption className="sr-only">Content of lesson {l.title}</caption><thead><tr className="text-sub"><th scope="col" className="w-16 py-1">Id</th><th scope="col">{c.targetName}</th><th scope="col">{c.nativeName}</th></tr></thead>
                    <tbody>{[...l.words, ...l.sentences].map((x) => <tr key={x.id} className="border-t border-line align-top"><td className="py-1 text-sub">{x.id.split(".").pop()}</td>{cell(c, x.id, "t", x.t, c.ttsLang)}{cell(c, x.id, "n", x.n)}</tr>)}</tbody></table></div>
              ))}
            </details>
          ))}
        </section>); })}
      <Dialog open={!!target} onClose={() => setTarget(null)} labelledBy="suggest-title">
        <h2 id="suggest-title" className="text-xl">Suggest a correction</h2>
        <p className="mt-1 text-sm text-sub">{target?.itemId} · current: “{target?.current}”</p>
        <form onSubmit={submit} className="mt-4 space-y-3 text-left"><Field label="Corrected text" value={proposed} onChange={(e) => setProposed(e.target.value)} maxLength={500} required /><Field label="Why? (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
          <Button type="submit" className="w-full" disabled={!proposed.trim() || proposed.trim() === target?.current}>Send suggestion</Button><Button type="button" variant="secondary" className="w-full" onClick={() => setTarget(null)}>Cancel</Button></form>
      </Dialog>
    </main>
  );
}
