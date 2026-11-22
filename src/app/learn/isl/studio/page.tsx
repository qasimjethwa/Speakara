"use client";
/**
 * Sign Studio — for ISL educators (editor/admin accounts). Author a sign as keyframes of bone rotations and facial
 * expressions, with synchronised captions, preview it on the teacher, save drafts, and record a Deaf ISL signer's review.
 * Clips can also be imported/exported as JSON (e.g. from a Blender or motion-capture pipeline).
 * The database refuses "validated" unless a reviewer is named; learners only ever see validated clips.
 */
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Copy, Plus, Save, Trash2 } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Button, Card, Loading, Notice } from "@/components/ui";
import { useStore } from "@/lib/state/store";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { SIGN_IDS } from "@/lib/isl/courses";
import { BONE_GROUPS, checkClip, FACE_KEYS, READY, RELAXED, type Euler3, type Keyframe, type SignClip } from "@/lib/isl/rig";
import type { ClipRow } from "@/lib/isl/data";

const SignTeacher = dynamic(() => import("@/components/isl/SignTeacher").then((m) => m.SignTeacher), { ssr: false, loading: () => <Loading text="Loading the signing teacher…" /> });
const ALL_SIGNS = [...SIGN_IDS, ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => `FS-${l}`)];
const blank = (id: string): SignClip => ({ id, gloss: id.toLowerCase().replace(/-/g, " "), duration: 2, status: "awaiting_validation", keys: [{ t: 0, pose: READY }, { t: 2, pose: READY }], captions: [] });

export default function SignStudio() {
  const { t } = useT(); const { state, userId } = useStore();
  const staff = state.profile.role !== "learner";
  const [signId, setSignId] = useState(ALL_SIGNS[0]); const [row, setRow] = useState<ClipRow | null>(null);
  const [clip, setClip] = useState<SignClip>(blank(ALL_SIGNS[0])); const [k, setK] = useState(0); const [group, setGroup] = useState(0);
  const [mode, setMode] = useState<"pose" | "play">("pose"); const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [reviewer, setReviewer] = useState(""); const [notes, setNotes] = useState(""); const [confirmDeaf, setConfirmDeaf] = useState(false); const [json, setJson] = useState("");

  useEffect(() => {
    if (!staff) return; const db = supabase(); if (!db) return; setMsg(null);
    void db.from("isl_sign_clips").select("*").eq("sign_id", signId).maybeSingle().then(({ data }) => {
      const r = data as ClipRow | null; setRow(r); setK(0);
      setClip(r ? { ...r.clip, id: signId, gloss: r.gloss } : blank(signId)); setReviewer(r?.reviewed_by ?? ""); setNotes(r?.reviewer_notes ?? ""); setConfirmDeaf(false);
    });
  }, [signId, staff]);

  const key = clip.keys[k] ?? clip.keys[0];
  const preview = useMemo<SignClip>(() => (mode === "pose" ? { ...clip, id: "_pose", duration: 0.001, keys: [{ t: 0, pose: key.pose }], captions: [] } : clip), [mode, clip, key]);
  const setKey = (next: Keyframe) => setClip({ ...clip, keys: clip.keys.map((x, i) => (i === k ? next : x)) });
  const setBone = (id: string, axis: number, val: number) => { const cur: Euler3 = [...(key.pose.bones[id] ?? [0, 0, 0])] as Euler3; cur[axis] = val; setKey({ ...key, pose: { ...key.pose, bones: { ...key.pose.bones, [id]: cur } } }); };
  const setFace = (id: string, val: number) => setKey({ ...key, pose: { ...key.pose, face: { ...(key.pose.face ?? {}), [id]: val } } });

  const save = async (status: "draft" | "in_review" | "validated") => {
    const db = supabase(); if (!db || !userId) return;
    const toSave: SignClip = { ...clip, status: status === "validated" ? "validated" : status === "in_review" ? "in_review" : "awaiting_validation", reviewedBy: status === "validated" ? reviewer.trim() : undefined };
    const problem = checkClip(toSave); if (problem) { setMsg({ tone: "error", text: problem }); return; }
    if (status === "validated" && !confirmDeaf) { setMsg({ tone: "error", text: /*i18n*/ "Confirm that a Deaf ISL signer reviewed and approved this sign." }); return; }
    const { error } = await db.from("isl_sign_clips").upsert({
      sign_id: signId, gloss: clip.gloss, clip: toSave, status, updated_by: userId, updated_at: new Date().toISOString(), reviewer_notes: notes,
      reviewed_by: status === "validated" ? reviewer.trim() : null, reviewed_at: status === "validated" ? new Date().toISOString() : null,
    });
    setMsg(error ? { tone: "error", text: error.message } : { tone: "success", text: status === "validated" ? /*i18n*/ "Saved as validated. Learners will see this sign." : /*i18n*/ "Saved. Learners won’t see it until it is validated." });
    if (!error) setRow({ sign_id: signId, gloss: clip.gloss, clip: toSave, status, reviewed_by: status === "validated" ? reviewer : null, reviewed_at: null, reviewer_notes: notes });
  };

  if (!staff) return <AppShell><PageTitle title={t("Sign Studio")} /><Notice tone="info">{t("The Sign Studio is for ISL educators with a Speakara editor account.")}</Notice></AppShell>;
  const slider = "h-11 w-full accent-sky";
  return (
    <AppShell rail={false} wide>
      <Link href="/learn/isl" className="mb-2 inline-flex min-h-11 items-center text-sm font-extrabold uppercase text-sky-dark">← {t("ISL courses")}</Link>
      <PageTitle title={t("Sign Studio")} sub={t("Author ISL signs as keyframes, then record their review by a Deaf ISL signer.")} />
      <Notice tone="warn">{t("Only author signs you know from qualified ISL sources, and mark a sign validated only after a Deaf ISL signer has reviewed this animation.")}</Notice>
      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-3">
          <SignTeacher clip={preview} targetLang="en" fallback={{ start: 0, end: 1, text: clip.gloss }} />
          <div className="flex gap-2"><Button variant={mode === "pose" ? "sky" : "secondary"} onClick={() => setMode("pose")}>{t("Edit keyframe")}</Button><Button variant={mode === "play" ? "sky" : "secondary"} onClick={() => setMode("play")}>{t("Play whole sign")}</Button></div>
        </div>
        <div className="space-y-3">
          <Card className="space-y-2">
            <label className="block"><span className="text-sm font-bold text-sub">{t("Sign")}</span>
              <select value={signId} onChange={(e) => setSignId(e.target.value)} className="min-h-12 w-full rounded-2xl border-2 border-line-dark bg-mist px-3 font-semibold">{ALL_SIGNS.map((s) => <option key={s}>{s}</option>)}</select></label>
            <p className="text-sm">{t("Status")}: <b>{row?.status ?? t("not started")}</b>{row?.reviewed_by ? ` · ${row.reviewed_by}` : ""}</p>
            <label className="block"><span className="text-sm font-bold text-sub">{t("Gloss")}</span><input value={clip.gloss} onChange={(e) => setClip({ ...clip, gloss: e.target.value })} className="w-full rounded-xl border-2 border-line-dark bg-mist px-3 py-2" /></label>
            <label className="block"><span className="text-sm font-bold text-sub">{t("Duration (seconds)")}</span><input type="number" min={0.2} max={30} step={0.1} value={clip.duration} onChange={(e) => setClip({ ...clip, duration: +e.target.value })} className="w-full rounded-xl border-2 border-line-dark bg-mist px-3 py-2" /></label>
          </Card>
          <Card className="space-y-2">
            <div className="flex items-center justify-between"><h2 className="text-lg">{t("Keyframes")}</h2>
              <div className="flex gap-1"><Button variant="secondary" className="!min-h-11 !px-3" aria-label={t("Add keyframe")} onClick={() => { const nk = { t: Math.min(clip.duration, key.t + 0.3), pose: structuredClone(key.pose) }; const keys = [...clip.keys, nk].sort((a, b) => a.t - b.t); setClip({ ...clip, keys }); setK(keys.indexOf(nk)); }}><Plus size={18} aria-hidden="true" /></Button>
                <Button variant="secondary" className="!min-h-11 !px-3" aria-label={t("Delete keyframe")} disabled={clip.keys.length <= 1} onClick={() => { setClip({ ...clip, keys: clip.keys.filter((_, i) => i !== k) }); setK(0); }}><Trash2 size={18} aria-hidden="true" /></Button></div></div>
            <div className="flex flex-wrap gap-1">{clip.keys.map((x, i) => <button key={i} type="button" onClick={() => setK(i)} aria-pressed={i === k} className={`min-h-11 rounded-xl border-2 px-3 font-bold ${i === k ? "border-sky bg-sky-soft" : "border-line"}`}>{x.t.toFixed(2)}s</button>)}</div>
            <label className="block"><span className="text-sm font-bold text-sub">{t("Keyframe time (seconds)")}</span><input type="number" min={0} max={clip.duration} step={0.05} value={key.t} onChange={(e) => setKey({ ...key, t: +e.target.value })} className="w-full rounded-xl border-2 border-line-dark bg-mist px-3 py-2" /></label>
            <div className="flex gap-2 text-sm"><button type="button" className="min-h-11 rounded-xl border-2 border-line px-3 font-bold" onClick={() => setKey({ ...key, pose: structuredClone(RELAXED) })}>{t("Reset to rest")}</button><button type="button" className="min-h-11 rounded-xl border-2 border-line px-3 font-bold" onClick={() => setKey({ ...key, pose: structuredClone(READY) })}>{t("Reset to signing space")}</button></div>
          </Card>
          <Card className="space-y-2">
            <select value={group} onChange={(e) => setGroup(+e.target.value)} aria-label={t("Body part")} className="min-h-12 w-full rounded-2xl border-2 border-line-dark bg-mist px-3 font-semibold">{BONE_GROUPS.map((g, i) => <option key={g.label} value={i}>{g.label}</option>)}<option value={-1}>{t("Face (non-manual markers)")}</option></select>
            <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
              {group >= 0 ? BONE_GROUPS[group].bones.map((b) => (
                <fieldset key={b.id}><legend className="text-sm font-extrabold">{b.label}</legend>
                  {[0, 1, 2].map((ax) => <label key={ax} className="flex items-center gap-2 text-xs"><span className="w-3">{"XYZ"[ax]}</span><input type="range" min={-3.14} max={3.14} step={0.01} value={key.pose.bones[b.id]?.[ax] ?? 0} onChange={(e) => setBone(b.id, ax, +e.target.value)} className={slider} /></label>)}
                </fieldset>))
                : FACE_KEYS.map((f) => <label key={f} className="block text-xs font-bold">{f.replace(/^AK_\d+_/, "")}<input type="range" min={0} max={1} step={0.01} value={key.pose.face?.[f] ?? 0} onChange={(e) => setFace(f, +e.target.value)} className={slider} /></label>)}
            </div>
          </Card>
          <Card className="space-y-2">
            <h2 className="text-lg">{t("Captions")}</h2>
            {(clip.captions ?? []).map((c, i) => (
              <div key={i} className="grid grid-cols-[4rem_4rem_1fr_auto] items-center gap-1">
                <input type="number" step={0.05} value={c.start} aria-label={t("Start")} onChange={(e) => setClip({ ...clip, captions: clip.captions!.map((x, j) => (j === i ? { ...x, start: +e.target.value } : x)) })} className="rounded-lg border-2 border-line px-1 py-2" />
                <input type="number" step={0.05} value={c.end} aria-label={t("End")} onChange={(e) => setClip({ ...clip, captions: clip.captions!.map((x, j) => (j === i ? { ...x, end: +e.target.value } : x)) })} className="rounded-lg border-2 border-line px-1 py-2" />
                <input value={c.text} aria-label={t("Caption text")} onChange={(e) => setClip({ ...clip, captions: clip.captions!.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} className="rounded-lg border-2 border-line px-2 py-2" />
                <button type="button" aria-label={t("Delete")} className="h-11 w-11" onClick={() => setClip({ ...clip, captions: clip.captions!.filter((_, j) => j !== i) })}><Trash2 size={16} aria-hidden="true" /></button>
              </div>))}
            <Button variant="secondary" onClick={() => setClip({ ...clip, captions: [...(clip.captions ?? []), { start: 0, end: clip.duration, text: clip.gloss }] })}><Plus size={18} aria-hidden="true" />{t("Add caption")}</Button>
          </Card>
          <Card className="space-y-2">
            <Button className="w-full" onClick={() => void save("draft")}><Save size={18} aria-hidden="true" />{t("Save draft")}</Button>
            <Button className="w-full" variant="secondary" onClick={() => void save("in_review")}>{t("Send for review")}</Button>
            <h2 className="pt-2 text-lg">{t("Record review")}</h2>
            <input value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder={t("Reviewer name and role (Deaf ISL signer)")} className="w-full rounded-xl border-2 border-line-dark bg-mist px-3 py-2" />
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("Review notes")} className="h-20 w-full rounded-xl border-2 border-line-dark bg-mist p-3" />
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 h-5 w-5" checked={confirmDeaf} onChange={(e) => setConfirmDeaf(e.target.checked)} />{t("A Deaf ISL signer reviewed this animation and approved it for teaching.")}</label>
            <Button className="w-full" variant="primary" disabled={!reviewer.trim() || !confirmDeaf} onClick={() => void save("validated")}>{t("Mark as validated")}</Button>
            {msg && <Notice tone={msg.tone}>{t(msg.text)}</Notice>}
          </Card>
          <Card className="space-y-2">
            <h2 className="text-lg">{t("Import / export JSON")}</h2>
            <textarea value={json} onChange={(e) => setJson(e.target.value)} className="h-28 w-full rounded-xl border-2 border-line-dark bg-mist p-2 font-mono text-xs" aria-label="JSON" />
            <div className="flex gap-2"><Button variant="secondary" onClick={() => setJson(JSON.stringify(clip))}><Copy size={18} aria-hidden="true" />{t("Export")}</Button>
              <Button variant="secondary" onClick={() => { try { const c = JSON.parse(json) as SignClip; const p = checkClip({ ...c, id: signId, status: "awaiting_validation" }); if (p) throw new Error(p); setClip({ ...c, id: signId, status: "awaiting_validation" }); setK(0); setMsg(null); } catch (e) { setMsg({ tone: "error", text: (e as Error).message }); } }}>{t("Import")}</Button></div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
