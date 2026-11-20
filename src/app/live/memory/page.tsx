"use client";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Button, Card, Dialog, Notice } from "@/components/ui";
import { BackLink, EmptyState, LiveGate } from "@/components/live/LiveUi";
import { useStore } from "@/lib/state/store";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { langFlag, langName } from "@/lib/live/catalog";

interface Item { id: string; lang: string; kind: "vocabulary" | "mistake" | "pronunciation" | "note"; content: Record<string, string>; source: string; created_at: string }
const KIND: Record<Item["kind"], string> = { vocabulary: /*i18n*/ "Word", mistake: /*i18n*/ "Correction", pronunciation: /*i18n*/ "Pronunciation", note: /*i18n*/ "Note" };

function Memory() {
  const { userId } = useStore(); const { t } = useT();
  const [items, setItems] = useState<Item[] | null>(null); const [consent, setConsent] = useState(false); const [confirm, setConfirm] = useState(false); const [error, setError] = useState(false);
  useEffect(() => {
    if (!userId) return; const db = supabase(); if (!db) return;
    void Promise.all([db.from("ai_memory").select("*").order("created_at", { ascending: false }).limit(300), db.from("consents").select("granted").eq("user_id", userId).eq("kind", "ai_memory").maybeSingle()])
      .then(([m, c]) => { if (m.error) setError(true); setItems((m.data as Item[]) ?? []); setConsent(!!c.data?.granted); });
  }, [userId]);
  const toggle = async (granted: boolean) => { setConsent(granted); await supabase()?.from("consents").upsert({ user_id: userId, kind: "ai_memory", granted, updated_at: new Date().toISOString() }); };
  const remove = async (id: string) => { const { error: e } = await supabase()!.from("ai_memory").delete().eq("id", id); if (!e) setItems((l) => l?.filter((x) => x.id !== id) ?? null); else setError(true); };
  const removeAll = async () => { const { error: e } = await supabase()!.from("ai_memory").delete().eq("user_id", userId!); setConfirm(false); if (!e) setItems([]); else setError(true); };
  const line = (i: Item) => i.kind === "mistake" ? `${i.content.said ?? ""} → ${i.content.better ?? ""}` : i.kind === "pronunciation" ? `${i.content.word ?? ""}: ${i.content.tip ?? ""}` : `${i.content.term ?? ""} — ${i.content.meaning ?? ""}`;
  return (
    <div className="space-y-4">
      <Card><label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5 accent-brand" checked={consent} onChange={(e) => void toggle(e.target.checked)} />
        <span><span className="block font-extrabold">{t("Remember what I learn")}</span><span className="text-sm text-sub">{t("When this is off, nothing new is saved. Turning it off doesn’t delete what’s already here.")}</span></span></label></Card>
      {error && <Notice tone="error">{t("Something went wrong. Please try again.")}</Notice>}
      {items && items.length === 0 && <EmptyState mood="think" title={t("Nothing saved yet")} text={t("After a conversation, the words and corrections you choose to keep will appear here.")} />}
      {items && items.length > 0 && <>
        <ul className="space-y-2">{items.map((i) => (
          <li key={i.id} className="flex items-center gap-3 rounded-2xl border-2 border-line p-3">
            <span aria-hidden="true" className="text-xl">{langFlag(i.lang)}</span>
            <span className="flex-1"><span className="block text-xs font-extrabold uppercase text-sub">{t(KIND[i.kind])} · {t(langName(i.lang))}</span><span className="block font-bold">{line(i)}</span>{i.content.why && <span className="block text-sm text-sub">{i.content.why}</span>}</span>
            <button type="button" onClick={() => void remove(i.id)} aria-label={t("Delete")} className="flex h-11 w-11 items-center justify-center rounded-xl text-coral-dark hover:bg-coral-soft"><Trash2 size={20} aria-hidden="true" /></button>
          </li>))}</ul>
        <Button variant="danger" onClick={() => setConfirm(true)}><Trash2 size={18} aria-hidden="true" />{t("Delete everything")}</Button>
      </>}
      <Dialog open={confirm} onClose={() => setConfirm(false)} labelledBy="del-title">
        <h2 id="del-title" className="mb-2 text-xl">{t("Delete your whole learning memory?")}</h2><p className="mb-4 text-sub">{t("This can’t be undone. Your lessons, XP and streak are not affected.")}</p>
        <div className="flex justify-center gap-3"><Button variant="secondary" onClick={() => setConfirm(false)}>{t("Cancel")}</Button><Button variant="danger" onClick={() => void removeAll()}>{t("Delete everything")}</Button></div>
      </Dialog>
    </div>
  );
}

export default function MemoryPage() {
  const { t } = useT();
  return <AppShell rail={false}><BackLink href="/live" label={t("Live")} /><PageTitle title={t("My learning memory")} sub={t("Only you can see this.")} /><LiveGate ready={true}><Memory /></LiveGate></AppShell>;
}
