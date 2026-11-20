"use client";
import { useEffect, useRef, useState } from "react";
import { Bot, ShieldCheck, Sparkles, Timer } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Mascot } from "@/components/Mascot";
import { Button, Card, LinkButton, Notice } from "@/components/ui";
import { BackLink, CallControls, CallStatus, LiveGate, QuotaMeter, ReportView } from "@/components/live/LiveUi";
import { useStore } from "@/lib/state/store";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { getCourse } from "@/lib/content";
import { clock, DEFAULT_PREFS, LEVELS, LIVE_LANGS, LIVE_SCENARIOS, PERSONALITIES, TEACHING_STYLES, VOICES, type AvatarChoice, type CompanionPrefs, type LearningReport } from "@/lib/live/catalog";
import { ApiError, liveApi, useCountdown, useLiveConfig, useLiveRoom, useQuota } from "@/lib/live/client";

interface Started { session_id: string; room_name: string; reserved_seconds: number; token: string; url: string }
type Phase = "setup" | "call" | "report";

function AvatarTile({ a, on, onPick }: { a: AvatarChoice; on: boolean; onPick: () => void }) {
  return (
    <button type="button" onClick={onPick} aria-pressed={on} className={`key flex flex-col items-center gap-2 rounded-2xl border-2 border-b-4 p-3 ${on ? "border-grape bg-grape-soft" : "border-line bg-paper"}`}>
      {a.imageUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={a.imageUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
        : <span aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-grape to-sky text-3xl font-black text-white">{a.name.slice(0, 1)}</span>}
      <span className="font-extrabold">{a.name}</span>
    </button>
  );
}

function Choice<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: readonly { id: T; label: string; hint?: string }[]; onChange: (v: T) => void }) {
  const { t } = useT();
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-bold text-sub">{label}</legend>
      <div className="grid grid-cols-2 gap-2">{options.map((o) => (
        <button key={String(o.id)} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)}
          className={`min-h-12 rounded-2xl border-2 px-3 py-2 text-left ${value === o.id ? "border-sky bg-sky-soft text-sky-dark" : "border-line"}`}>
          <span className="block font-extrabold">{t(o.label)}</span>{o.hint && <span className="block text-xs text-sub">{t(o.hint)}</span>}
        </button>
      ))}</div>
    </fieldset>
  );
}

function Companion() {
  const { state, userId } = useStore(); const { t } = useT();
  const { config, error: configError } = useLiveConfig();
  const { quota, reload } = useQuota(!!config?.ready);
  const course = getCourse(state.profile.courseId);
  const initialLang = LIVE_LANGS.some((l) => l.code === course.target) ? course.target : "es";
  const [prefs, setPrefs] = useState<CompanionPrefs | null>(null);
  const [memoryConsent, setMemoryConsent] = useState(false);
  const [phase, setPhase] = useState<Phase>("setup");
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Started | null>(null); const [report, setReport] = useState<LearningReport | null>(null); const [reportWait, setReportWait] = useState(false);
  const endedOnce = useRef(false);

  // Load saved preferences and consent.
  useEffect(() => {
    if (!config || !userId) return;
    const db = supabase(); if (!db) return;
    void (async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        db.from("avatar_preferences").select("*").eq("user_id", userId).maybeSingle(),
        db.from("consents").select("granted").eq("user_id", userId).eq("kind", "ai_memory").maybeSingle(),
      ]);
      const first = config.avatars[0]?.id ?? "";
      const saved = p as CompanionPrefs | null;
      setPrefs(saved && config.avatars.some((a) => a.id === saved.avatar_id) ? { ...DEFAULT_PREFS(initialLang), ...saved } : { ...DEFAULT_PREFS(saved?.target_lang ?? initialLang), ...(saved ?? {}), avatar_id: first });
      setMemoryConsent(!!c?.granted);
    })();
  }, [config, userId, initialLang]);

  const finish = async () => {
    if (endedOnce.current || !session) return;
    endedOnce.current = true; setPhase("report"); setReportWait(true);
    await liveApi("/api/companion/end", { session_id: session.session_id }).catch(() => undefined);
    void reload();
    const db = supabase();
    for (let i = 0; i < 25 && db; i++) {          // the worker writes the report a few seconds after the call
      const { data } = await db.from("call_sessions").select("report").eq("id", session.session_id).maybeSingle();
      if (data?.report) { setReport(data.report as LearningReport); break; }
      await new Promise((r) => setTimeout(r, 2000));
    }
    setReportWait(false);
  };
  const call = useLiveRoom({ camera: false, onEnded: () => void finish() });
  const seconds = Math.max(0, (session?.reserved_seconds ?? 0) - 8);
  const left = useCountdown(seconds, phase === "call" && call.state === "connected");
  useEffect(() => { if (phase === "call" && call.state === "connected" && left === 0) void call.leave(); }, [left, phase, call]);

  const setConsent = async (granted: boolean) => {
    setMemoryConsent(granted);
    await supabase()?.from("consents").upsert({ user_id: userId, kind: "ai_memory", granted, updated_at: new Date().toISOString() });
  };

  const start = async () => {
    if (!prefs) return;
    setBusy(true); setError(null); endedOnce.current = false; setReport(null);
    try {
      const s = await liveApi<Started>("/api/companion/start", prefs);
      setSession(s); setPhase("call");
      const ok = await call.connect(s.url, s.token);
      if (!ok) { await liveApi("/api/companion/end", { session_id: s.session_id }).catch(() => undefined); endedOnce.current = true; setPhase("setup"); void reload(); }
    } catch (e) { setError(e instanceof ApiError ? e.message : /*i18n*/ "Something went wrong. Please try again."); void reload(); }
    finally { setBusy(false); }
  };

  if (configError) return <Notice tone="error">{t("Something went wrong. Please try again.")}</Notice>;
  return (
    <LiveGate ready={config ? config.companionReady : null}>
      {phase === "setup" && prefs && config && (
        <div className="space-y-5">
          {config.avatarAccess === "staff" && <Notice tone="info">{t("The AI companion is in a limited preview while we confirm our avatar provider’s free-plan terms. It is open to Speakara staff only for now.")}</Notice>}
          <QuotaMeter quota={quota} />
          <Card>
            <h2 className="mb-3 text-lg">{t("Choose your companion")}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{config.avatars.map((a) => <AvatarTile key={a.id} a={a} on={prefs.avatar_id === a.id} onPick={() => setPrefs({ ...prefs, avatar_id: a.id })} />)}</div>
            <p className="mt-3 text-xs text-sub">{t("Companions are ready-made AI avatars. You can’t upload a face.")}</p>
          </Card>
          <Card className="space-y-4">
            <h2 className="text-lg">{t("Make it yours")}</h2>
            <label className="block"><span className="mb-1 block text-sm font-bold text-sub">{t("Companion’s name")}</span>
              <input value={prefs.companion_name} maxLength={24} onChange={(e) => setPrefs({ ...prefs, companion_name: e.target.value })} className="w-full rounded-2xl border-2 border-line-dark bg-mist px-4 py-3 font-semibold focus:border-sky-dark focus:bg-paper focus:outline-none" /></label>
            <Choice label={t("Personality")} value={prefs.personality} options={PERSONALITIES} onChange={(v) => setPrefs({ ...prefs, personality: v })} />
            <Choice label={t("Teaching style")} value={prefs.teaching_style} options={TEACHING_STYLES} onChange={(v) => setPrefs({ ...prefs, teaching_style: v })} />
            <Choice label={t("Voice")} value={prefs.voice} options={VOICES} onChange={(v) => setPrefs({ ...prefs, voice: v })} />
          </Card>
          <Card className="space-y-4">
            <h2 className="text-lg">{t("What to practise")}</h2>
            <label className="block"><span className="mb-1 block text-sm font-bold text-sub">{t("Language")}</span>
              <select value={prefs.target_lang} onChange={(e) => setPrefs({ ...prefs, target_lang: e.target.value })} className="min-h-12 w-full rounded-2xl border-2 border-line-dark bg-mist px-3 font-semibold">
                {LIVE_LANGS.map((l) => <option key={l.code} value={l.code}>{l.flag} {t(l.name)}</option>)}</select></label>
            <Choice label={t("Your level")} value={prefs.level} options={LEVELS.map((l) => ({ id: l.value, label: l.label, hint: l.cefr }))} onChange={(v) => setPrefs({ ...prefs, level: v })} />
            <fieldset><legend className="mb-2 text-sm font-bold text-sub">{t("Scenario")}</legend>
              <div className="grid grid-cols-2 gap-2">{LIVE_SCENARIOS.map((s) => (
                <button key={s.id} type="button" aria-pressed={prefs.scenario === s.id} onClick={() => setPrefs({ ...prefs, scenario: s.id })}
                  className={`flex min-h-12 items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left ${prefs.scenario === s.id ? "border-sky bg-sky-soft text-sky-dark" : "border-line"}`}>
                  <span aria-hidden="true" className="text-xl">{s.emoji}</span><span className="font-extrabold">{t(s.title)}</span></button>))}</div></fieldset>
          </Card>
          <Card className="space-y-3">
            <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5 accent-brand" checked={memoryConsent} onChange={(e) => void setConsent(e.target.checked)} />
              <span><span className="block font-extrabold">{t("Remember what I learn")}</span><span className="text-sm text-sub">{t("Save words, corrections and pronunciation tips from my conversations so my companion can build on them. You can view or delete them at any time.")}</span></span></label>
            <p className="flex items-start gap-2 text-sm text-sub"><ShieldCheck size={18} className="mt-0.5 shrink-0" aria-hidden="true" />{t("You’ll be talking to an AI, not a person. Nothing is recorded; the conversation is transcribed only to write your report.")}</p>
          </Card>
          {error && <Notice tone="error">{t(error)}</Notice>}
          <Button className="w-full" onClick={() => void start()} disabled={busy || (quota !== null && (quota.remaining_seconds < 45 || quota.busy))} aria-busy={busy}>
            <Sparkles size={20} aria-hidden="true" />{busy ? t("Starting…") : quota?.busy ? t("Companion busy — try again soon") : quota && quota.remaining_seconds < 45 ? t("No free minutes left this month") : t("Start conversation")}</Button>
          <p className="text-center text-sm"><LinkButton href="/live/memory" variant="ghost">{t("View my learning memory")}</LinkButton></p>
        </div>
      )}

      {phase === "call" && session && prefs && (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl border-2 border-line bg-ink" style={{ aspectRatio: "3 / 4", maxHeight: "70dvh", marginInline: "auto" }}>
            <video ref={call.videoRef} autoPlay playsInline className={`h-full w-full object-cover ${call.remoteVideo ? "" : "hidden"}`} aria-label={t("{name}, your AI companion", { name: prefs.companion_name })} />
            {!call.remoteVideo && <div className="flex h-full flex-col items-center justify-center gap-3 text-white" role="status"><Mascot mood="think" size={96} /><p className="font-bold">{t("{name} is joining…", { name: prefs.companion_name })}</p></div>}
            <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-black/60 to-transparent p-3 text-white">
              <span className="flex items-center gap-2 font-extrabold"><Bot size={18} aria-hidden="true" />{prefs.companion_name}<span className="rounded-full bg-white/25 px-2 text-xs">{t("AI")}</span></span>
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-extrabold ${left <= 30 ? "bg-coral" : "bg-white/25"}`} aria-live="off"><Timer size={16} aria-hidden="true" />{clock(left)}</span>
            </div>
            {call.agentState && call.remoteVideo && <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-sm font-bold text-white" aria-live="polite">{call.agentState === "speaking" ? t("Speaking") : call.agentState === "thinking" ? t("Thinking…") : t("Listening")}</span>}
          </div>
          <div ref={call.audioBox} hidden />
          <CallStatus state={call.state} />
          {left <= 30 && call.state === "connected" && <Notice tone="warn">{t("Less than 30 seconds left. Your companion will wrap up.")}</Notice>}
          <CallControls micOn={call.micOn} onMic={() => void call.toggleMic()} onEnd={() => void call.leave().then(finish)} />
          <p className="text-center text-xs text-sub">{t("Speak whenever you like — you can interrupt your companion at any time.")}</p>
        </div>
      )}

      {phase === "report" && (
        <div className="space-y-4">
          {reportWait && !report && <Card className="flex items-center gap-3"><Mascot mood="think" size={64} /><p role="status">{t("Writing your learning report…")}</p></Card>}
          {report && <ReportView report={report}>{!memoryConsent && <Notice tone="info">{t("These notes weren’t saved to your learning memory because memory is turned off.")}</Notice>}</ReportView>}
          {!reportWait && !report && <Notice tone="warn">{t("Your report isn’t ready. It will appear in your learning memory if it arrives later.")}</Notice>}
          <div className="flex flex-wrap gap-3"><Button onClick={() => { setPhase("setup"); setSession(null); }}>{t("Practise again")}</Button><LinkButton href="/live/memory" variant="secondary">{t("My learning memory")}</LinkButton></div>
        </div>
      )}
    </LiveGate>
  );
}

export default function CompanionPage() {
  const { t } = useT();
  return <AppShell rail={false}><BackLink href="/live" label={t("Live")} /><PageTitle title={t("AI companion")} sub={t("A real-time spoken conversation with an AI avatar.")} /><Companion /></AppShell>;
}
