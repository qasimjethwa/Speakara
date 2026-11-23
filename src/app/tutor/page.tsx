"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { ArrowLeft, Mic, Send, Volume2, BookmarkPlus, Check } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Mascot } from "@/components/Mascot";
import { Notice } from "@/components/ui";
import { useStore } from "@/lib/state/store";
import { useSearchParams } from "next/navigation";
import { useTwinView } from "@/lib/twin/view";
import { getCourse } from "@/lib/content";
import { SCENARIOS, hasScript, type Scenario } from "@/lib/tutor/scenarios";
import type { TutorReply } from "@/lib/tutor/engine";
import type { Conversation, TutorMessage } from "@/lib/state/types";
import { listenOnce, say, speechRecognizer } from "@/lib/audio";
import { useT } from "@/lib/i18n";
import { ArabicKeyboard } from "@/components/lesson/ArabicKeyboard";

/** Learning Twin: the level line sent to the tutor, adjusted by measured difficulty and the learner's stated preferences. */
function tutorLevel(d: 1 | 2 | 3, base: string, brief: string[]) {
  const pace = ["Use very short, simple sentences.", "Use short everyday sentences.", "You can use richer vocabulary and longer sentences."][d - 1];
  // most useful lines first: weaker areas, correction style, confidence; the long mistakes list last
  const rank = (l: string) => /weaker/.test(l) ? 0 : /^Correct/.test(l) ? 1 : /speaking feels hard/.test(l) ? 2 : /Topics|goal/.test(l) ? 3 : /strengths/i.test(l) ? 4 : 5;
  return [base, pace, ...brief.slice(1).sort((x, y) => rank(x) - rank(y))].join(" ").slice(0, 600);
}

function Chat({ scenario, onBack, resume }: { scenario: Scenario; onBack: () => void; resume?: Conversation }) {
  const twin = useTwinView();
  const { state, saveConversation, setProfile } = useStore(); const { t } = useT(); const course = getCourse(state.profile.courseId);
  const [id] = useState(() => resume?.id ?? `c-${Date.now().toString(36)}`);
  const [messages, setMessages] = useState<TutorMessage[]>(resume?.messages ?? []); const [input, setInput] = useState(""); const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null); const [done, setDone] = useState(!!resume); const [vocab, setVocab] = useState<{ t: string; n: string }[]>([]); const [hearing, setHearing] = useState(false);
  const cursor = useRef({ step: 0, retry: false }); const box = useRef<HTMLInputElement>(null); const end = useRef<HTMLDivElement>(null); const booted = useRef(false);
  const rate = state.profile.slowAudio ? 0.75 : 1;
  const saved = (p: { t: string }) => state.profile.savedPhrases.some((x) => x.t === p.t && x.courseId === course.id);
  const save = (p: { t: string; n: string }) => { if (!saved(p)) setProfile({ savedPhrases: [{ ...p, courseId: course.id }, ...state.profile.savedPhrases].slice(0, 100) }); };

  const call = async (history: TutorMessage[]) => {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/tutor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scenario: scenario.id, target: course.target, targetName: course.targetName, nativeName: course.nativeName,
        level: tutorLevel(twin.difficulty, Object.keys(state.completed).length > 8 ? "beginner (CEFR A1–A2), knows basic greetings, family and food words" : state.profile.level === "new" ? "absolute beginner (CEFR A1)" : "beginner (CEFR A1–A2)", twin.prefs.personalise ? twin.brief : []), history: history.map((m) => ({ role: m.role, text: m.text })), ...cursor.current }) });
      const data = (await res.json()) as TutorReply & { error?: string };
      if (!res.ok || data.error) { setError(data.error ?? "The tutor couldn’t answer. Please try again."); return; }
      cursor.current = { step: data.step, retry: data.retry };
      const withFix = history.map((m, i) => (i === history.length - 1 && m.role === "learner" && data.correction ? { ...m, correction: data.correction } : m));
      const next: TutorMessage[] = [...withFix, { role: "tutor", text: data.reply, translation: data.translation, tip: data.tip }];
      setMessages(next); setDone(data.done); if (data.vocab?.length) setVocab(data.vocab);
      if (state.profile.sound && data.reply.length > 2) void say(data.reply, course.ttsLang, rate);
      if (next.some((m) => m.role === "learner")) saveConversation({ id, scenario: scenario.id, courseId: course.id, at: Date.now(), messages: next });
    } catch { setError("You seem to be offline. Check your connection and try again."); } finally { setBusy(false); }
  };
  useEffect(() => { if (!booted.current && !resume) { booted.current = true; void call([]); } }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy]);
  const send = (text: string) => { const v = text.trim(); if (!v || busy) return; const next: TutorMessage[] = [...messages, { role: "learner", text: v.slice(0, 500) }]; setMessages(next); setInput(""); void call(next); };
  const dictate = () => { setHearing(true); listenOnce(course.sttLang).promise.then((v) => { setHearing(false); setInput(v); }, (e: Error) => { setHearing(false); setError(e.message === "not-allowed" ? "Microphone access is blocked. Allow the microphone for this site in your browser’s address bar, then try again." : "I couldn’t hear you. You can type instead."); }); };

  return (
    <div className="flex min-h-[calc(100dvh-160px)] flex-col">
      <div className="mb-4 flex items-center gap-3"><button onClick={onBack} aria-label={t("Back to scenarios")} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-sub"><ArrowLeft /></button><h1 className="text-xl">{scenario.emoji} {t(scenario.title)}</h1></div>
      <div className="flex-1 space-y-4 pb-36">
        <div role="log" aria-live="polite" aria-label={t("Conversation")} className="space-y-4">
          {messages.map((m, i) => m.role === "tutor" ? (
            <div key={i} className="flex items-end gap-2"><Mascot size={54} mood={m.tip ? "think" : "happy"} className="shrink-0" />
              <div className="max-w-[85%] rounded-2xl rounded-bl-md border-2 border-line-dark px-4 py-3"><p className="flex items-start gap-2 text-lg" lang={course.ttsLang}><button aria-label={t("Hear this message")} onClick={() => void say(m.text, course.ttsLang, rate)} className="-ml-2 -mt-1.5 grid h-11 w-11 shrink-0 place-items-center rounded-lg text-sky-dark"><Volume2 size={18} /></button>{m.text}</p>
                {m.translation && <p className="mt-1 text-sm text-sub">{m.translation}</p>}{m.tip && <p className="mt-2 rounded-xl bg-sun-soft p-2 text-sm text-sun-dark">💡 {m.tip}</p>}</div></div>
          ) : (
            <div key={i} className="flex flex-col items-end"><p className="max-w-[85%] rounded-2xl rounded-br-md bg-sky px-4 py-3 text-lg text-white" lang={course.ttsLang}>{m.text}</p>
              {m.correction && <p className="mt-1 max-w-[85%] rounded-xl bg-brand-soft px-3 py-2 text-sm text-brand-dark">✍️ {t("Better:")} <strong lang={course.ttsLang}>{m.correction}</strong></p>}</div>
          ))}
        </div>
        {busy && <p className="text-sub" role="status">{t("Kiko is typing…")}</p>}
        {error && <Notice tone="error">{t(error)}</Notice>}
        {vocab.length > 0 && <div className="rounded-2xl border-2 border-line p-4"><h2 className="mb-2 text-base">{t("Useful phrases from this chat")}</h2><ul className="space-y-2 text-[15px]">{vocab.map((v) => (
          <li key={v.t} className="flex items-center justify-between gap-3"><span><strong lang={course.ttsLang}>{v.t}</strong> — {v.n}</span>
            <button onClick={() => save(v)} disabled={saved(v)} className="flex shrink-0 items-center gap-1 rounded-lg border-2 border-line-dark px-2 py-1 text-xs font-extrabold uppercase text-sky-dark disabled:border-line disabled:text-sub">{saved(v) ? <><Check size={14} />{t("Saved")}</> : <><BookmarkPlus size={14} />{t("Save")}</>}</button></li>))}</ul></div>}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="fixed inset-x-0 bottom-[68px] z-20 border-t-2 border-line bg-paper p-3 md:bottom-0 md:left-[88px] lg:left-[240px] xl:right-[340px]">
        <div className="mx-auto flex max-w-[640px] gap-2">
          {speechRecognizer() && <button type="button" onClick={dictate} disabled={busy || done} aria-label={t("Speak your reply")} className={`key grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-b-4 text-white disabled:border-line-dark disabled:bg-line disabled:text-sub ${hearing ? "border-coral-dark bg-coral" : "border-sky-dark bg-sky"}`}><Mic size={22} /></button>}
          <input ref={box} dir={course.target === "ar" ? "rtl" : undefined} value={input} onChange={(e) => setInput(e.target.value)} disabled={done} maxLength={500} aria-label={t("Your reply")} placeholder={done ? t("Scene finished") : t("Type in {lang}", { lang: t(course.targetName) })} lang={course.ttsLang} autoComplete="off" className="min-w-0 flex-1 rounded-2xl border-2 border-line-dark bg-mist px-4 text-base font-semibold placeholder:text-sub focus:border-sky-dark focus:bg-paper focus:outline-none" />
          <button type="submit" disabled={!input.trim() || busy || done} aria-label={t("Send")} className="key grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-b-4 border-brand-dark bg-brand text-white disabled:border-line-dark disabled:bg-line disabled:text-sub"><Send size={22} /></button>
        </div>
        {course.target === "ar" && !done && <div className="mx-auto mt-2 max-w-[640px]"><ArabicKeyboard target={box} disabled={done} onChange={setInput} defaultOpen={false} /></div>}
      </form>
    </div>
  );
}

function Tutor() {
  const { state } = useStore(); const { t, date } = useT(); const course = getCourse(state.profile.courseId);
  const [active, setActive] = useState<{ s: Scenario; resume?: Conversation } | null>(null); const [provider, setProvider] = useState<string | null>(null);
  useEffect(() => { fetch("/api/tutor").then((r) => r.json()).then((d: { provider: string }) => setProvider(d.provider), () => setProvider("scripted")); }, []);
  const ai = provider !== null && provider !== "scripted";
  const past = state.conversations.filter((c) => c.courseId === course.id);
  const twin = useTwinView(); const wanted = useSearchParams().get("scenario");
  const fav = new Set<string>(twin.prefs.personalise ? [...twin.prefs.interests, twin.prefs.goal ?? ""].map((i) => ({ travel: "travel", study: "university", work: "interview", food: "restaurant", social: "meet", everyday: "everyday", family: "meet", culture: "everyday" } as Record<string, string>)[i]).filter(Boolean) : []);
  const ordered = [...SCENARIOS].sort((a, b) => Number(fav.has(b.id)) - Number(fav.has(a.id)));
  useEffect(() => { const s = SCENARIOS.find((x) => x.id === wanted); if (s && (ai || hasScript(s, course.target))) setActive({ s }); }, [wanted, ai, course.target]);
  return (
    <AppShell>
      {active ? <Chat key={active.resume?.id ?? active.s.id} scenario={active.s} resume={active.resume} onBack={() => setActive(null)} /> : <>
        <PageTitle title={t("Tutor & role-play")} sub={t("Practise real conversations. Free, with no message cap for normal use.")} />
        {provider !== null && <div className="mb-4"><Notice tone={ai ? "success" : "info"}>{ai ? t("AI tutor connected: open-ended conversation with corrections is on for every scenario.") : t("Kiko is running scripted scenes with instant feedback. Open-ended AI conversation switches on when this site is connected to an AI provider.")}</Notice></div>}
        <div className="grid gap-3 sm:grid-cols-2">{ordered.map((s) => {
          const ok = ai || hasScript(s, course.target);
          return <button key={s.id} disabled={!ok} onClick={() => setActive({ s })} className={`key rounded-2xl border-2 border-b-4 p-4 text-left ${ok ? "border-line-dark" : "border-line bg-mist text-sub"}`}><span className="text-3xl" aria-hidden="true">{s.emoji}</span><span className="mt-1 block text-lg font-extrabold">{t(s.title)}</span>{fav.has(s.id) && <span className="mt-1 inline-block rounded-full bg-grape-soft px-2 py-0.5 text-xs font-extrabold text-grape-dark">{t("Matches your goals")}</span>}<span className="block text-sm text-sub">{ok ? t(s.description) : t("This scene isn’t available in this course yet.")}</span></button>;
        })}</div>
        {past.length > 0 && <><h2 className="mb-3 mt-8 text-lg">{t("Conversation history")}</h2><ul className="divide-y-2 divide-line rounded-2xl border-2 border-line">{past.map((c) => { const s = SCENARIOS.find((x) => x.id === c.scenario) ?? SCENARIOS[0]; return (
          <li key={c.id}><button onClick={() => setActive({ s, resume: c })} className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-mist"><span>{s.emoji} <strong>{t(s.title)}</strong><span className="block text-sm text-sub">{t("{n} replies", { n: c.messages.filter((m) => m.role === "learner").length })} · {date(c.at)}</span></span><span className="text-sm font-extrabold uppercase text-sky-dark">{t("Transcript")}</span></button></li>); })}</ul></>}
      </>}
    </AppShell>
  );
}

export default function TutorPage() { return <Suspense fallback={null}><Tutor /></Suspense>; }
