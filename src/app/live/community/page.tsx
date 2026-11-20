"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flag, HandHelping, Search, ShieldBan, Users, Lightbulb } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Mascot } from "@/components/Mascot";
import { Button, Card, Dialog, LinkButton, Notice } from "@/components/ui";
import { BackLink, CallControls, CallStatus, LiveGate } from "@/components/live/LiveUi";
import { useStore } from "@/lib/state/store";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { COURSES } from "@/lib/content";
import { clock, DAY_LABELS, DAYS, INTERESTS, langFlag, langName, LEVELS, LIVE_LANGS, NATIVE_LANGS, SLOTS } from "@/lib/live/catalog";
import { ApiError, liveApi, useLiveConfig, useLiveRoom } from "@/lib/live/client";

interface Prefs { native_lang: string; target_lang: string; level: number; availability: Record<string, string[]>; interests: string[] }
interface Partner { id: string; display_name: string; native_lang: string | null; target_lang: string | null; level: number | null; interests: string[] | null }
interface MatchState { queued: boolean; match: null | { id: string; status: "invited" | "active" | "declined" | "expired" | "ended"; room_name: string | null; me_accepted: boolean; partner_accepted: boolean; expires_at: string; started_at: string | null; partner: Partner | null } }
type Phase = "setup" | "lobby" | "call" | "summary";

const PROMPTS = [
  /*i18n*/ "Introduce yourselves: name, city and why you’re learning.", /*i18n*/ "What did you do last weekend?", /*i18n*/ "Describe your favourite food and how to make it.",
  /*i18n*/ "What’s a place you’d love to visit, and why?", /*i18n*/ "Talk about a film, series or book you enjoyed.", /*i18n*/ "What’s a normal day like for you?",
  /*i18n*/ "Teach each other one expression people really use.", /*i18n*/ "What’s something you’re looking forward to?",
];
const REASONS = [{ id: "harassment", label: /*i18n*/ "Harassment or bullying" }, { id: "inappropriate", label: /*i18n*/ "Inappropriate or sexual content" }, { id: "underage", label: /*i18n*/ "May be under 18" }, { id: "spam", label: /*i18n*/ "Spam or selling" }, { id: "other", label: /*i18n*/ "Something else" }] as const;

/** Phrasebook for the help panel, built from Speakara's own course content (no AI, no cost). */
function usePhrasebook(lang: string) {
  return useMemo(() => {
    const c = COURSES.find((x) => x.target === lang && x.native === "en");
    const out: { t: string; n: string }[] = []; const seen = new Set<string>();
    c?.units.forEach((u) => u.lessons.forEach((l) => [...l.words, ...l.sentences].forEach((x) => { if (!seen.has(x.t)) { seen.add(x.t); out.push({ t: x.t, n: x.n }); } })));
    return out;
  }, [lang]);
}

function Community() {
  const { userId } = useStore(); const { t } = useT();
  const { config, error: configError } = useLiveConfig();
  const [prefs, setPrefs] = useState<Prefs | null>(null); const [consent, setConsent] = useState({ rules: false, adult: false, memory: false });
  const [phase, setPhase] = useState<Phase>("setup"); const [ms, setMs] = useState<MatchState | null>(null);
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [saved, setSaved] = useState(false);
  const [panel, setPanel] = useState<"prompts" | "help">("prompts"); const [q, setQ] = useState(""); const [looked, setLooked] = useState<{ t: string; n: string }[]>([]);
  const [partner, setPartner] = useState<Partner | null>(null); const [matchId, setMatchId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null); const [duration, setDuration] = useState(0);
  const [reportOpen, setReportOpen] = useState(false); const [reason, setReason] = useState<string>("harassment"); const [details, setDetails] = useState(""); const [reported, setReported] = useState(false); const [blocked, setBlocked] = useState(false);
  const [promptIx, setPromptIx] = useState(0); const [, tick] = useState(0);
  const joiningCall = useRef(false);
  const phrasebook = usePhrasebook(prefs?.target_lang ?? "es");

  useEffect(() => {
    if (!userId) return; const db = supabase(); if (!db) return;
    void (async () => {
      const [{ data: p }, { data: cs }] = await Promise.all([db.from("call_preferences").select("*").eq("user_id", userId).maybeSingle(), db.from("consents").select("kind, granted").eq("user_id", userId)]);
      const has = (k: string) => !!cs?.find((c) => c.kind === k && c.granted);
      setConsent({ rules: has("community_calls"), adult: has("adult_18"), memory: has("ai_memory") });
      setPrefs((p as Prefs | null) ?? { native_lang: "en", target_lang: "es", level: 1, availability: {}, interests: [] });
    })();
  }, [userId]);

  const endedCall = useRef(false);
  const toSummary = useCallback(() => {
    if (endedCall.current) return; endedCall.current = true;
    setDuration(startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0); setPhase("summary");
  }, [startedAt]);
  const call = useLiveRoom({ camera: true, onEnded: toSummary });

  const poll = useCallback(async () => {
    const db = supabase(); if (!db) return;
    const { data } = await db.rpc("my_match_state"); if (!data) return;
    const s = data as MatchState; setMs(s);
    if (s.match?.partner) setPartner(s.match.partner);
    if (s.match?.status === "active" && s.match.room_name && phase === "lobby" && !joiningCall.current) {
      joiningCall.current = true; setMatchId(s.match.id);
      try {
        const tok = await liveApi<{ token: string; url: string }>("/api/community/token", { match_id: s.match.id });
        endedCall.current = false; setPhase("call"); setStartedAt(Date.now());
        if (!(await call.connect(tok.url, tok.token))) { await liveApi("/api/community", { op: "end", match_id: s.match.id }).catch(() => undefined); }
      } catch (e) { setError(e instanceof ApiError ? e.message : /*i18n*/ "Something went wrong. Please try again."); joiningCall.current = false; }
    }
    if (phase === "call" && s.match && s.match.id === matchId && s.match.status !== "active") void call.leave();
  }, [phase, call, matchId]);

  useEffect(() => {
    if (phase !== "lobby" && phase !== "call") return;
    void poll(); const id = setInterval(() => void poll(), phase === "call" ? 5000 : 2000);
    return () => clearInterval(id);
  }, [phase, poll]);
  useEffect(() => { const id = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(id); }, []);

  const savePrefs = async () => {
    if (!prefs || !userId) return;
    setBusy(true); setError(null);
    const db = supabase()!;
    if (prefs.native_lang === prefs.target_lang) { setError(/*i18n*/ "Your native language and the language you’re learning must be different."); setBusy(false); return; }
    const now = new Date().toISOString();
    const r1 = await db.from("call_preferences").upsert({ user_id: userId, ...prefs, updated_at: now });
    const r2 = await db.from("consents").upsert([
      { user_id: userId, kind: "community_calls", granted: consent.rules, updated_at: now }, { user_id: userId, kind: "adult_18", granted: consent.adult, updated_at: now },
    ]);
    setBusy(false);
    if (r1.error || r2.error) { setError(/*i18n*/ "Something went wrong. Please try again."); return; }
    setPhase("lobby");
  };

  const act = async (body: Record<string, unknown>) => {
    setError(null);
    try { return await liveApi<Record<string, unknown>>("/api/community", body); }
    catch (e) { setError(e instanceof ApiError ? e.message : /*i18n*/ "Something went wrong. Please try again."); return null; }
  };
  const join = async () => { setBusy(true); joiningCall.current = false; await act({ op: "join" }); await poll(); setBusy(false); };
  const leaveQueue = async () => { await act({ op: "leave" }); await poll(); };
  const respond = async (accept: boolean) => { if (!ms?.match) return; await act({ op: "respond", match_id: ms.match.id, accept }); await poll(); };
  const hangUp = async () => { if (matchId) await act({ op: "end", match_id: matchId }); await call.leave(); toSummary(); };
  const block = async () => { if (!partner || !userId) return; await supabase()?.from("user_blocks").insert({ blocker_id: userId, blocked_id: partner.id }); setBlocked(true); if (phase === "call") await hangUp(); };
  const report = async () => {
    if (!partner) return;
    const { error: e } = await supabase()!.from("user_reports").insert({ reported_id: partner.id, match_id: matchId, reason, details: details.slice(0, 1000) });
    if (!e) { setReported(true); setReportOpen(false); } else setError(/*i18n*/ "Something went wrong. Please try again.");
  };
  const saveWords = async () => { const r = await act({ op: "save", lang: prefs?.target_lang, items: looked.map((x) => ({ term: x.t, meaning: x.n })) }); if (r) setSaved(true); };

  if (configError) return <Notice tone="error">{t("Something went wrong. Please try again.")}</Notice>;
  const invite = ms?.match?.status === "invited" ? ms.match : null;
  const inviteLeft = invite ? Math.max(0, Math.round((new Date(invite.expires_at).getTime() - Date.now()) / 1000)) : 0;
  const results = q.trim().length >= 2 ? phrasebook.filter((p) => p.t.toLowerCase().includes(q.toLowerCase()) || p.n.toLowerCase().includes(q.toLowerCase())).slice(0, 8) : [];
  const partnerLine = (p: Partner) => [p.native_lang && t("Speaks {lang}", { lang: t(langName(p.native_lang)) }), p.target_lang && t("Learning {lang}", { lang: t(langName(p.target_lang)) })].filter(Boolean).join(" · ");

  return (
    <LiveGate ready={config ? config.ready : null}>
      {phase === "setup" && prefs && (
        <div className="space-y-5">
          <Card className="space-y-4">
            <h2 className="text-lg">{t("Your languages")}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="mb-1 block text-sm font-bold text-sub">{t("I speak")}</span>
                <select value={prefs.native_lang} onChange={(e) => setPrefs({ ...prefs, native_lang: e.target.value })} className="min-h-12 w-full rounded-2xl border-2 border-line-dark bg-mist px-3 font-semibold">{NATIVE_LANGS.map((l) => <option key={l.code} value={l.code}>{l.flag} {t(l.name)}</option>)}</select></label>
              <label className="block"><span className="mb-1 block text-sm font-bold text-sub">{t("I’m learning")}</span>
                <select value={prefs.target_lang} onChange={(e) => setPrefs({ ...prefs, target_lang: e.target.value })} className="min-h-12 w-full rounded-2xl border-2 border-line-dark bg-mist px-3 font-semibold">{LIVE_LANGS.map((l) => <option key={l.code} value={l.code}>{l.flag} {t(l.name)}</option>)}</select></label>
            </div>
            <fieldset><legend className="mb-2 text-sm font-bold text-sub">{t("Your level")}</legend>
              <div className="flex flex-wrap gap-2">{LEVELS.map((l) => <button key={l.value} type="button" aria-pressed={prefs.level === l.value} onClick={() => setPrefs({ ...prefs, level: l.value })} className={`min-h-11 rounded-2xl border-2 px-3 font-extrabold ${prefs.level === l.value ? "border-sky bg-sky-soft text-sky-dark" : "border-line"}`}>{t(l.label)}</button>)}</div></fieldset>
          </Card>
          <Card className="space-y-4">
            <h2 className="text-lg">{t("Interests")}</h2>
            <div className="flex flex-wrap gap-2">{INTERESTS.map((i) => { const on = prefs.interests.includes(i); return <button key={i} type="button" aria-pressed={on} onClick={() => setPrefs({ ...prefs, interests: on ? prefs.interests.filter((x) => x !== i) : [...prefs.interests, i].slice(0, 10) })} className={`min-h-11 rounded-full border-2 px-4 font-extrabold ${on ? "border-grape bg-grape-soft text-grape-dark" : "border-line"}`}>{t(i)}</button>; })}</div>
            <h2 className="pt-2 text-lg">{t("When are you usually free?")}</h2>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className="sr-only">{t("Day")}</th>{SLOTS.map((s) => <th key={s.id} className="px-1 pb-2 font-bold text-sub">{t(s.label)}</th>)}</tr></thead>
              <tbody>{DAYS.map((d) => <tr key={d}><th scope="row" className="pr-2 text-left font-bold">{t(DAY_LABELS[d])}</th>{SLOTS.map((s) => { const on = prefs.availability[d]?.includes(s.id) ?? false; return (
                <td key={s.id} className="p-1"><button type="button" aria-pressed={on} aria-label={`${t(DAY_LABELS[d])} ${t(s.label)}`} onClick={() => setPrefs({ ...prefs, availability: { ...prefs.availability, [d]: on ? prefs.availability[d].filter((x) => x !== s.id) : [...(prefs.availability[d] ?? []), s.id] } })} className={`h-11 w-full rounded-xl border-2 ${on ? "border-brand bg-brand-soft" : "border-line"}`}>{on ? "✓" : ""}</button></td>); })}</tr>)}</tbody></table></div>
            <p className="text-xs text-sub">{t("Matching happens live: you’re paired with someone who is online at the same moment. Your usual times help us suggest when to come back.")}</p>
          </Card>
          <Card className="space-y-3">
            <h2 className="text-lg">{t("Community rules")}</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-sub">
              <li>{t("Be kind and patient. Everyone here is learning.")}</li><li>{t("Never share your address, phone number, social media or other contact details.")}</li>
              <li>{t("Calls aren’t recorded. Either person can end a call, block or report at any time.")}</li><li>{t("You both must accept before a call connects.")}</li>
            </ul>
            <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5 accent-brand" checked={consent.rules} onChange={(e) => setConsent({ ...consent, rules: e.target.checked })} /><span>{t("I agree to the community rules")}</span></label>
            <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5 accent-brand" checked={consent.adult} onChange={(e) => setConsent({ ...consent, adult: e.target.checked })} /><span>{t("I am 18 or older")}</span></label>
            <p className="text-xs text-sub">{t("Calls with strangers are only for adults. Learners under 18 can practise with the AI companion instead.")}</p>
          </Card>
          {error && <Notice tone="error">{t(error)}</Notice>}
          <Button className="w-full" disabled={busy || !consent.rules || !consent.adult} onClick={() => void savePrefs()}><Users size={20} aria-hidden="true" />{t("Continue")}</Button>
        </div>
      )}

      {phase === "lobby" && prefs && (
        <div className="space-y-4">
          <Card className="flex flex-col items-center gap-3 py-8 text-center">
            <Mascot mood={ms?.queued ? "think" : "wave"} size={96} />
            {ms?.queued
              ? <><h2 className="text-xl">{t("Looking for a partner…")}</h2><p className="text-sub" role="status">{t("We’ll pair you with someone learning {lang} or who speaks it. Keep this page open.", { lang: t(langName(prefs.target_lang)) })}</p><Button variant="secondary" onClick={() => void leaveQueue()}>{t("Stop looking")}</Button></>
              : <><h2 className="text-xl">{t("Practise {lang} with a real person", { lang: t(langName(prefs.target_lang)) })}</h2><p className="text-sub">{langFlag(prefs.native_lang)} {t(langName(prefs.native_lang))} → {langFlag(prefs.target_lang)} {t(langName(prefs.target_lang))}</p>
                  <Button onClick={() => void join()} disabled={busy}><Users size={20} aria-hidden="true" />{t("Find a partner")}</Button></>}
            {ms?.match?.status === "declined" && <Notice tone="info">{t("That invitation was declined. Try again for a new partner.")}</Notice>}
            {ms?.match?.status === "expired" && <Notice tone="info">{t("That invitation has expired.")}</Notice>}
          </Card>
          {error && <Notice tone="error">{t(error)}</Notice>}
          <Button variant="ghost" onClick={() => setPhase("setup")}>{t("Edit my preferences")}</Button>
        </div>
      )}

      <Dialog open={phase === "lobby" && !!invite} onClose={() => void respond(false)} labelledBy="invite-title">
        {invite?.partner && <div className="space-y-3">
          <Mascot mood="cheer" size={72} className="mx-auto" />
          <h2 id="invite-title" className="text-xl">{t("{name} wants to practise with you", { name: invite.partner.display_name })}</h2>
          <p className="text-sub">{partnerLine(invite.partner)}</p>
          {invite.partner.interests?.length ? <p className="text-sm">{t("Interests")}: {invite.partner.interests.map((i) => t(i)).join(", ")}</p> : null}
          <p className="text-sm text-sub" role="timer">{invite.me_accepted ? t("Waiting for {name} to accept…", { name: invite.partner.display_name }) : t("Expires in {s}", { s: clock(inviteLeft) })}</p>
          {!invite.me_accepted && <div className="flex justify-center gap-3"><Button variant="secondary" onClick={() => void respond(false)}>{t("Decline")}</Button><Button onClick={() => void respond(true)}>{t("Accept")}</Button></div>}
        </div>}
      </Dialog>

      {phase === "call" && (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl border-2 border-line bg-ink" style={{ aspectRatio: "4 / 3" }}>
            <video ref={call.videoRef} autoPlay playsInline className={`h-full w-full object-cover ${call.remoteVideo ? "" : "hidden"}`} aria-label={t("{name}’s camera", { name: partner?.display_name ?? "" })} />
            {!call.remoteVideo && <div className="flex h-full flex-col items-center justify-center gap-2 text-white"><Mascot mood="wave" size={80} /><p className="font-bold">{call.remoteName || partner?.display_name ? t("{name}’s camera is off", { name: partner?.display_name ?? call.remoteName ?? "" }) : t("Waiting for your partner to join…")}</p></div>}
            <video ref={call.localRef} autoPlay playsInline muted className={`absolute bottom-3 right-3 w-28 rounded-2xl border-2 border-white object-cover sm:w-36 ${call.camOn ? "" : "hidden"}`} aria-label={t("Your camera")} />
            <span className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-sm font-extrabold text-white">{partner?.display_name}{startedAt ? ` · ${clock((Date.now() - startedAt) / 1000)}` : ""}</span>
          </div>
          <div ref={call.audioBox} hidden />
          <CallStatus state={call.state} />
          <CallControls micOn={call.micOn} onMic={() => void call.toggleMic()} camOn={call.camOn} onCam={() => void call.toggleCam()} onEnd={() => void hangUp()} />
          <Card>
            <div className="mb-3 flex gap-2" role="tablist">
              <button role="tab" aria-selected={panel === "prompts"} onClick={() => setPanel("prompts")} className={`min-h-11 flex-1 rounded-xl border-2 font-extrabold ${panel === "prompts" ? "border-sky bg-sky-soft text-sky-dark" : "border-line"}`}><Lightbulb size={16} className="mr-1 inline" aria-hidden="true" />{t("Prompts")}</button>
              <button role="tab" aria-selected={panel === "help"} onClick={() => setPanel("help")} className={`min-h-11 flex-1 rounded-xl border-2 font-extrabold ${panel === "help" ? "border-sky bg-sky-soft text-sky-dark" : "border-line"}`}><HandHelping size={16} className="mr-1 inline" aria-hidden="true" />{t("Help")}</button>
            </div>
            {panel === "prompts" ? (
              <div className="space-y-3"><p className="text-lg font-extrabold">{t(PROMPTS[promptIx % PROMPTS.length])}</p><Button variant="secondary" onClick={() => setPromptIx((i) => i + 1)}>{t("Next prompt")}</Button></div>
            ) : (
              <div className="space-y-2">
                <label className="flex items-center gap-2 rounded-2xl border-2 border-line-dark bg-mist px-3"><Search size={18} aria-hidden="true" /><span className="sr-only">{t("Look up a word")}</span>
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Look up a word in English or {lang}", { lang: t(langName(prefs?.target_lang ?? "es")) })} className="min-h-11 w-full bg-transparent font-semibold focus:outline-none" /></label>
                <ul className="divide-y-2 divide-line">{results.map((r) => (
                  <li key={r.t}><button type="button" onClick={() => setLooked((l) => (l.some((x) => x.t === r.t) ? l : [...l, r].slice(-20)))} className="flex w-full flex-wrap justify-between gap-2 py-2 text-left"><span className="font-extrabold">{r.t}</span><span className="text-sub">{r.n}</span></button></li>))}</ul>
                {q.trim().length >= 2 && results.length === 0 && <p className="text-sm text-sub">{t("No matches in Speakara’s phrasebook.")}</p>}
                <p className="text-xs text-sub">{t("Tap a result to add it to your call notes.")}</p>
              </div>
            )}
          </Card>
          <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setReportOpen(true)}><Flag size={18} aria-hidden="true" />{t("Report")}</Button><Button variant="secondary" onClick={() => void block()}><ShieldBan size={18} aria-hidden="true" />{t("Block and leave")}</Button></div>
        </div>
      )}

      {phase === "summary" && (
        <div className="space-y-4">
          <Card className="bg-brand-soft text-center"><Mascot mood="cheer" size={80} className="mx-auto" /><h2 className="text-xl">{t("Great conversation!")}</h2>
            <p className="text-sub">{partner ? t("You practised with {name} for {time}.", { name: partner.display_name, time: clock(duration) }) : t("Call ended.")}</p></Card>
          <Card><h2 className="mb-2 text-lg">{t("Your call notes")}</h2>
            {looked.length ? <ul className="divide-y-2 divide-line">{looked.map((x) => <li key={x.t} className="flex flex-wrap justify-between gap-2 py-2"><span className="font-extrabold">{x.t}</span><span className="text-sub">{x.n}</span></li>)}</ul> : <p className="text-sub">{t("You didn’t look anything up this time.")}</p>}
            {looked.length > 0 && (consent.memory
              ? <Button className="mt-3" variant="secondary" disabled={saved} onClick={() => void saveWords()}>{saved ? t("Saved") : t("Save to my learning memory")}</Button>
              : <p className="mt-3 text-sm text-sub">{t("Turn on “Remember what I learn” in your learning memory to save these words.")}</p>)}
          </Card>
          {partner && <Card className="space-y-2"><p className="font-bold">{t("Something wrong?")}</p>
            <div className="flex flex-wrap gap-2">{!reported && <Button variant="secondary" onClick={() => setReportOpen(true)}><Flag size={18} aria-hidden="true" />{t("Report {name}", { name: partner.display_name })}</Button>}{!blocked && <Button variant="secondary" onClick={() => void block()}><ShieldBan size={18} aria-hidden="true" />{t("Block {name}", { name: partner.display_name })}</Button>}</div>
            {reported && <Notice tone="success">{t("Thanks. Our team will review your report.")}</Notice>}{blocked && <Notice tone="success">{t("Blocked. You won’t be matched again.")}</Notice>}</Card>}
          {error && <Notice tone="error">{t(error)}</Notice>}
          <div className="flex flex-wrap gap-3"><Button onClick={() => { setPhase("lobby"); setLooked([]); setSaved(false); setReported(false); setBlocked(false); setPartner(null); setMatchId(null); }}>{t("Find another partner")}</Button><LinkButton href="/live" variant="secondary">{t("Done")}</LinkButton></div>
        </div>
      )}

      <Dialog open={reportOpen} onClose={() => setReportOpen(false)} labelledBy="report-title">
        <h2 id="report-title" className="mb-3 text-xl">{t("Report {name}", { name: partner?.display_name ?? "" })}</h2>
        <fieldset className="space-y-2 text-left">{REASONS.map((r) => <label key={r.id} className="flex min-h-11 items-center gap-3"><input type="radio" name="reason" className="h-5 w-5 accent-coral" checked={reason === r.id} onChange={() => setReason(r.id)} />{t(r.label)}</label>)}</fieldset>
        <label className="mt-3 block text-left"><span className="mb-1 block text-sm font-bold text-sub">{t("Details (optional)")}</span><textarea value={details} maxLength={1000} onChange={(e) => setDetails(e.target.value)} className="h-24 w-full rounded-2xl border-2 border-line-dark bg-mist p-3 font-semibold" /></label>
        <div className="mt-4 flex justify-center gap-3"><Button variant="secondary" onClick={() => setReportOpen(false)}>{t("Cancel")}</Button><Button variant="danger" onClick={() => void report()}>{t("Send report")}</Button></div>
      </Dialog>
    </LiveGate>
  );
}

export default function CommunityPage() {
  const { t } = useT();
  return <AppShell rail={false}><BackLink href="/live" label={t("Live")} /><PageTitle title={t("Language exchange")} sub={t("One-to-one video calls with other Speakara learners.")} /><Community /></AppShell>;
}
