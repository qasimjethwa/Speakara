"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff, WifiOff, Loader2 } from "lucide-react";
import { Mascot, type Mood } from "@/components/Mascot";
import { Card, LinkButton, Notice, ProgressBar } from "@/components/ui";
import { useStore } from "@/lib/state/store";
import { useT } from "@/lib/i18n";
import { clock, type LearningReport } from "@/lib/live/catalog";
import type { CallState, Quota } from "@/lib/live/client";

/** Shown instead of a live feature when the learner is a guest or the server is not set up. */
export function LiveGate({ ready, children }: { ready: boolean | null; children: ReactNode }) {
  const { mode, cloudConfigured } = useStore(); const { t } = useT();
  if (mode === "guest") return (
    <EmptyState mood="wave" title={t("Live practice needs a free account")} text={t("Talking with a companion or another learner happens in real time, so we need to know who you are. Your guest progress stays on this device.")}>
      {cloudConfigured && <div className="flex flex-wrap justify-center gap-3"><LinkButton href="/signup">{t("Create a free account")}</LinkButton><LinkButton href="/login" variant="secondary">{t("Log in")}</LinkButton></div>}
    </EmptyState>
  );
  if (ready === null) return <div role="status" className="flex items-center justify-center gap-2 py-16 text-sub"><Loader2 className="animate-spin" size={20} aria-hidden="true" />{t("Loading…")}</div>;
  if (!ready) return <EmptyState mood="sleepy" title={t("Live practice is coming soon")} text={t("Live practice isn’t set up on this server yet.")} />;
  return <>{children}</>;
}

export function EmptyState({ mood, title, text, children }: { mood: Mood; title: string; text: string; children?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 py-8 text-center">
      <Mascot mood={mood} size={96} />
      <h2 className="text-xl">{title}</h2>
      <p className="max-w-md text-sub">{text}</p>
      {children}
    </Card>
  );
}

/** The shared monthly avatar allowance. */
export function QuotaMeter({ quota }: { quota: Quota | null }) {
  const { t, num } = useT();
  if (!quota) return null;
  const mins = Math.floor(quota.remaining_seconds / 60);
  const out = quota.remaining_seconds < 45;
  return (
    <div className="rounded-2xl border-2 border-line p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-extrabold">{t("Free avatar minutes this month")}</span>
        <span className={out ? "font-bold text-coral-dark" : "text-sub"}>{out ? t("Used up") : t("{n} min left", { n: num(mins) })}</span>
      </div>
      <ProgressBar value={quota.remaining_seconds / Math.max(1, quota.monthly_seconds)} color={out ? "bg-coral" : "bg-grape"} label={t("Free avatar minutes this month")} />
      <p className="mt-2 text-xs text-sub">{t("Shared by every Speakara learner. Each conversation lasts up to {m}.", { m: clock(quota.session_seconds) })}{quota.busy ? ` ${t("A companion is talking with someone right now.")}` : ""}</p>
    </div>
  );
}

const STATE_TEXT: Partial<Record<CallState, [string, "info" | "warn" | "error"]>> = {
  connecting: [/*i18n*/ "Connecting…", "info"], reconnecting: [/*i18n*/ "Connection lost. Reconnecting…", "warn"],
  failed: [/*i18n*/ "We couldn’t connect. Check your internet connection and try again.", "error"],
  "mic-denied": [/*i18n*/ "Microphone access is blocked. Allow the microphone for this site in your browser’s address bar, then try again.", "error"],
};
export function CallStatus({ state }: { state: CallState }) {
  const { t } = useT(); const s = STATE_TEXT[state];
  if (!s) return null;
  return <Notice tone={s[1]} role={s[1] === "error" ? "alert" : "status"}>{state === "reconnecting" && <WifiOff size={16} className="mr-1 inline" aria-hidden="true" />}{t(s[0])}</Notice>;
}

/** Big round call buttons. */
export function CallControls({ micOn, onMic, camOn, onCam, onEnd, ending }: { micOn: boolean; onMic: () => void; camOn?: boolean; onCam?: () => void; onEnd: () => void; ending?: boolean }) {
  const { t } = useT();
  const round = "key inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-b-4";
  return (
    <div className="flex items-center justify-center gap-4" role="toolbar" aria-label={t("Call controls")}>
      <button type="button" onClick={onMic} aria-pressed={!micOn} aria-label={micOn ? t("Mute microphone") : t("Unmute microphone")}
        className={`${round} ${micOn ? "border-line-dark bg-paper text-ink" : "border-coral-dark bg-coral text-white"}`}>{micOn ? <Mic aria-hidden="true" /> : <MicOff aria-hidden="true" />}</button>
      {onCam && <button type="button" onClick={onCam} aria-pressed={!camOn} aria-label={camOn ? t("Turn camera off") : t("Turn camera on")}
        className={`${round} ${camOn ? "border-line-dark bg-paper text-ink" : "border-coral-dark bg-coral text-white"}`}>{camOn ? <Video aria-hidden="true" /> : <VideoOff aria-hidden="true" />}</button>}
      <button type="button" onClick={onEnd} disabled={ending} aria-label={t("End call")} className={`${round} w-20 border-coral-dark bg-coral text-white disabled:opacity-60`}><PhoneOff aria-hidden="true" /></button>
    </div>
  );
}

/** The post-conversation learning report. */
export function ReportView({ report, children }: { report: LearningReport; children?: ReactNode }) {
  const { t } = useT();
  return (
    <div className="space-y-4">
      <Card className="bg-brand-soft"><h2 className="mb-1 text-lg">{t("How it went")}</h2><p>{report.summary}</p>
        {report.fluency && <p className="mt-2 text-sm font-bold text-brand-dark">{t("Fluency")}: {"★".repeat(report.fluency)}{"☆".repeat(5 - report.fluency)}</p>}</Card>
      {report.vocabulary.length > 0 && <Card><h2 className="mb-2 text-lg">{t("Words and phrases")}</h2>
        <ul className="divide-y-2 divide-line">{report.vocabulary.map((v, i) => <li key={i} className="flex flex-wrap justify-between gap-2 py-2"><span className="font-extrabold" lang="">{v.term}</span><span className="text-sub">{v.meaning}</span></li>)}</ul></Card>}
      {report.mistakes.length > 0 && <Card><h2 className="mb-2 text-lg">{t("Corrections")}</h2>
        <ul className="space-y-3">{report.mistakes.map((m, i) => <li key={i}><p><span className="text-coral-dark line-through">{m.said}</span> → <span className="font-extrabold text-brand-dark">{m.better}</span></p>{m.why && <p className="text-sm text-sub">{m.why}</p>}</li>)}</ul></Card>}
      {report.pronunciation.length > 0 && <Card><h2 className="mb-2 text-lg">{t("Pronunciation")}</h2>
        <ul className="space-y-2">{report.pronunciation.map((p, i) => <li key={i}><span className="font-extrabold">{p.word}</span>: <span className="text-sub">{p.tip}</span></li>)}</ul></Card>}
      {report.next_steps.length > 0 && <Card><h2 className="mb-2 text-lg">{t("Next time")}</h2><ul className="list-disc space-y-1 pl-5">{report.next_steps.map((s, i) => <li key={i}>{s}</li>)}</ul></Card>}
      {children}
    </div>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="mb-3 inline-flex min-h-11 items-center text-sm font-extrabold uppercase text-sky-dark">← {label}</Link>;
}
