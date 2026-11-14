"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mic, Send, Volume2, BookmarkPlus } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Mascot } from "@/components/Mascot";
import { useStore } from "@/lib/state/store";
import { getCourse } from "@/lib/content";
import { SCENARIOS, hasScript, type Scenario } from "@/lib/tutor/scenarios";
import type { TutorReply } from "@/lib/tutor/engine";
import type { Conversation, TutorMessage } from "@/lib/state/types";
import { saveConversation } from "@/lib/state/actions";
import { listenOnce, say, speechRecognizer } from "@/lib/audio";

function Chat({ scenario, onBack, resume }: { scenario: Scenario; onBack: () => void; resume?: Conversation }) {
  const { state, update } = useStore(); const course = getCourse(state.profile.courseId);
  const [id] = useState(() => resume?.id ?? `c-${Date.now().toString(36)}`);
  const [messages, setMessages] = useState<TutorMessage[]>(resume?.messages ?? []); const [input, setInput] = useState(""); const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null); const [done, setDone] = useState(!!resume); const [vocab, setVocab] = useState<{ t: string; n: string }[]>([]); const [hearing, setHearing] = useState(false);
  const cursor = useRef({ step: 0, retry: false }); const end = useRef<HTMLDivElement>(null); const booted = useRef(false);

  const call = async (history: TutorMessage[]) => {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/tutor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scenario: scenario.id, target: course.target, targetName: course.targetName, nativeName: course.nativeName,
        level: state.profile.level === "new" ? "absolute beginner (CEFR A1)" : "beginner (CEFR A1–A2)", history: history.map((m) => ({ role: m.role, text: m.text })), ...cursor.current }) });
      const data = (await res.json()) as TutorReply & { error?: string };
      if (!res.ok || data.error) { setError(data.error ?? "The tutor couldn’t answer. Please try again."); return; }
      cursor.current = { step: data.step, retry: data.retry };
      const withFix = history.map((m, i) => (i === history.length - 1 && m.role === "learner" && data.correction ? { ...m, correction: data.correction } : m));
      const next: TutorMessage[] = [...withFix, { role: "tutor", text: data.reply, translation: data.translation, tip: data.tip }];
      setMessages(next); setDone(data.done); if (data.vocab?.length) setVocab(data.vocab);
      if (state.profile.sound && data.reply.length > 2) say(data.reply, course.ttsLang);
      if (next.some((m) => m.role === "learner")) update((s) => saveConversation(s, { id, scenario: scenario.id, courseId: course.id, at: Date.now(), messages: next }, Date.now()));
    } catch { setError("You seem to be offline. Check your connection and try again."); } finally { setBusy(false); }
  };
  useEffect(() => { if (!booted.current && !resume) { booted.current = true; void call([]); } }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy]);
  const send = (text: string) => { const t = text.trim(); if (!t || busy) return; const next: TutorMessage[] = [...messages, { role: "learner", text: t.slice(0, 500) }]; setMessages(next); setInput(""); void call(next); };
  const dictate = () => { setHearing(true); listenOnce(course.sttLang).promise.then((t) => { setHearing(false); setInput(t); }, () => { setHearing(false); setError("I couldn’t hear you. You can type instead."); }); };

  return (
    <div className="flex min-h-[calc(100dvh-160px)] flex-col">
      <div className="mb-4 flex items-center gap-3"><button onClick={onBack} aria-label="Back to scenarios" className="rounded-lg p-1 text-sub"><ArrowLeft /></button><h1 className="text-xl">{scenario.emoji} {scenario.title}</h1></div>
      <div className="flex-1 space-y-4 pb-36" aria-live="polite">
        {messages.map((m, i) => m.role === "tutor" ? (
          <div key={i} className="flex items-end gap-2"><Mascot size={54} mood={m.tip ? "think" : "happy"} className="shrink-0" />
            <div className="max-w-[85%] rounded-2xl rounded-bl-md border-2 border-line px-4 py-3"><p className="flex items-start gap-2 text-lg" lang={course.ttsLang}><button aria-label="Hear this message" onClick={() => say(m.text, course.ttsLang)} className="mt-1 shrink-0 text-sky"><Volume2 size={18} /></button>{m.text}</p>
              {m.translation && <p className="mt-1 text-sm text-sub">{m.translation}</p>}{m.tip && <p className="mt-2 rounded-xl bg-sun-soft p-2 text-sm">💡 {m.tip}</p>}</div></div>
        ) : (
          <div key={i} className="flex flex-col items-end"><p className="max-w-[85%] rounded-2xl rounded-br-md bg-sky px-4 py-3 text-lg text-white" lang={course.ttsLang}>{m.text}</p>
            {m.correction && <p className="mt-1 max-w-[85%] rounded-xl bg-brand-soft px-3 py-2 text-sm text-brand-dark">✍️ Better: <strong lang={course.ttsLang}>{m.correction}</strong></p>}</div>
        ))}
        {busy && <p className="text-sub" role="status">Kiko is typing…</p>}
        {error && <p role="alert" className="rounded-xl bg-coral-soft p-3 text-coral-dark">{error}</p>}
        {vocab.length > 0 && <div className="rounded-2xl border-2 border-line p-4"><p className="mb-2 flex items-center gap-2 font-extrabold"><BookmarkPlus size={18} />Useful phrases from this chat</p><ul className="space-y-1 text-[15px]">{vocab.map((v) => <li key={v.t}><strong lang={course.ttsLang}>{v.t}</strong> — {v.n}</li>)}</ul></div>}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="fixed inset-x-0 bottom-[68px] z-20 border-t-2 border-line bg-paper p-3 md:bottom-0 md:left-[88px] lg:left-[240px] xl:right-[340px]">
        <div className="mx-auto flex max-w-[640px] gap-2">
          {speechRecognizer() && <button type="button" onClick={dictate} disabled={busy || done} aria-label="Speak your reply" className={`key grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-b-4 text-white ${hearing ? "border-coral-dark bg-coral" : "border-sky-dark bg-sky"}`}><Mic size={22} /></button>}
          <input value={input} onChange={(e) => setInput(e.target.value)} disabled={done} maxLength={500} aria-label={`Your reply in ${course.targetName}`} placeholder={done ? "Scene finished" : `Reply in ${course.targetName}…`} lang={course.ttsLang} autoComplete="off" className="min-w-0 flex-1 rounded-2xl border-2 border-line bg-mist px-4 text-base font-semibold focus:border-sky focus:bg-paper focus:outline-none" />
          <button type="submit" disabled={!input.trim() || busy || done} aria-label="Send" className="key grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-b-4 border-brand-dark bg-brand text-white disabled:border-line-dark disabled:bg-line disabled:text-sub"><Send size={22} /></button>
        </div>
      </form>
    </div>
  );
}

export default function Tutor() {
  const { state } = useStore(); const course = getCourse(state.profile.courseId);
  const [active, setActive] = useState<{ s: Scenario; resume?: Conversation } | null>(null); const [provider, setProvider] = useState<string | null>(null);
  useEffect(() => { fetch("/api/tutor").then((r) => r.json()).then((d: { provider: string }) => setProvider(d.provider), () => setProvider("scripted")); }, []);
  const ai = provider !== null && provider !== "scripted";
  const past = state.conversations.filter((c) => c.courseId === course.id);
  return (
    <AppShell>
      {active ? <Chat key={active.resume?.id ?? active.s.id} scenario={active.s} resume={active.resume} onBack={() => setActive(null)} /> : <>
        <PageTitle title="Tutor & role-play" sub={`Practise real conversations in ${course.targetName}. Free, with no message cap for normal use.`} />
        {provider !== null && <p className={`mb-4 rounded-2xl p-3 text-sm ${ai ? "bg-brand-soft text-brand-dark" : "bg-sun-soft"}`}>{ai ? "AI tutor connected: open-ended conversation with corrections is on for every scenario." : "No AI provider is configured on this deployment, so Kiko uses scripted scenes with instant feedback. Scenarios marked “AI” switch on when a provider key is added."}</p>}
        <div className="grid gap-3 sm:grid-cols-2">{SCENARIOS.map((s) => {
          const ok = ai || hasScript(s, course.target);
          return <button key={s.id} disabled={!ok} onClick={() => setActive({ s })} className={`key rounded-2xl border-2 border-b-4 p-4 text-left ${ok ? "border-line-dark" : "border-line bg-mist text-sub"}`}><span className="text-3xl" aria-hidden="true">{s.emoji}</span><span className="mt-1 block text-lg font-extrabold">{s.title}{!ok && <span className="ml-2 rounded-md bg-line px-1.5 py-0.5 align-middle text-xs">AI</span>}</span><span className="block text-sm text-sub">{s.description}</span></button>;
        })}</div>
        {past.length > 0 && <><h2 className="mb-3 mt-8 text-lg">Conversation history</h2><ul className="divide-y-2 divide-line rounded-2xl border-2 border-line">{past.map((c) => { const s = SCENARIOS.find((x) => x.id === c.scenario) ?? SCENARIOS[0]; return (
          <li key={c.id}><button onClick={() => setActive({ s, resume: c })} className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-mist"><span>{s.emoji} <strong>{s.title}</strong><span className="block text-sm text-sub">{c.messages.filter((m) => m.role === "learner").length} replies · {new Date(c.at).toLocaleDateString()}</span></span><span className="text-sm font-extrabold uppercase text-sky">Transcript</span></button></li>); })}</ul></>}
      </>}
    </AppShell>
  );
}
