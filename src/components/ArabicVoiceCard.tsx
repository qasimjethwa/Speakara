"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, RotateCcw, Trash2, Volume2, Square } from "lucide-react";
import { Button, Card, Notice } from "./ui";
import { cancelDownload, downloadVoice, initVoice, removeVoice, speakArabic, stopArabic, subscribeVoice, type VoiceState } from "@/lib/arabic-voice";
import { useT } from "@/lib/i18n";

const SAMPLE = "مَرْحَبًا! كَيْفَ حالُكَ؟";

/** Settings card for the optional on-device Arabic voice: download with progress, retry, test and remove. */
export function ArabicVoiceCard() {
  const { t } = useT(); const [s, setS] = useState<VoiceState | null>(null); const [testing, setTesting] = useState(false);
  useEffect(() => { void initVoice(); return subscribeVoice(setS); }, []);
  if (!s) return null;
  const pct = Math.round(s.progress * 100);
  const test = async () => { setTesting(true); await speakArabic(SAMPLE, 1); setTesting(false); };
  return (
    <div data-arabic-voice={s.status}><Card className="mb-5">
      <h2 className="mb-1 text-lg">{t("Arabic voice")}</h2>
      <p className="mb-3 text-sm text-sub">{t("Download a voice that reads Arabic aloud on this device, even offline and on devices without an Arabic voice. About 45 MB, stored on this device. Speech is generated on your device; nothing is sent to a server.")}</p>
      {s.status === "unsupported" && <Notice tone="warn">{t("This browser can’t run the Arabic voice.")} {s.error}</Notice>}
      {s.lowMemory && s.status !== "unsupported" && <div className="mb-3"><Notice tone="warn">{t("This device has little memory. The Arabic voice may be slow or fail to start; close other tabs if it does.")}</Notice></div>}
      {s.status === "downloading" && <div className="mb-3" role="status" aria-live="polite">
        <div className="mb-1 flex justify-between text-sm font-bold"><span>{t("Downloading Arabic voice…")}</span><span>{pct}%</span></div>
        <div role="progressbar" aria-label={t("Arabic voice download")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-3 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${pct}%` }} /></div>
      </div>}
      {s.status === "loading" && <p role="status" className="mb-3 text-sm font-bold text-sub">{t("Starting the Arabic voice…")}</p>}
      {s.status === "error" && <div className="mb-3"><Notice tone="error" role="alert">{s.error}</Notice></div>}
      {s.status === "ready" && <p role="status" className="mb-3 text-sm font-bold text-brand-dark">{t("Arabic voice ready on this device.")}{s.device ? ` (${s.device === "webgpu" ? "WebGPU" : "WebAssembly"}, ${s.dtype?.toUpperCase()})` : ""}</p>}
      {s.status === "not-downloaded" && s.error && <div className="mb-3"><Notice tone="warn">{s.error}</Notice></div>}
      <div className="flex flex-wrap gap-3">
        {(s.status === "not-downloaded") && <Button variant="sky" onClick={() => void downloadVoice()}><Download size={18} aria-hidden="true" />{t("Download Arabic voice")}</Button>}
        {s.status === "error" && <Button variant="sky" onClick={() => void downloadVoice()}><RotateCcw size={18} aria-hidden="true" />{t("Retry download")}</Button>}
        {s.status === "downloading" && <Button variant="secondary" onClick={cancelDownload}>{t("Cancel")}</Button>}
        {(s.status === "ready" || s.status === "loading") && <>
          {testing || s.generating ? <Button variant="secondary" onClick={() => { stopArabic(); setTesting(false); }}><Square size={18} aria-hidden="true" />{t("Stop")}</Button>
            : <Button variant="sky" onClick={() => void test()} disabled={s.status === "loading"}><Volume2 size={18} aria-hidden="true" />{t("Test Arabic voice")}</Button>}
          <Button variant="secondary" className="!text-coral-dark" onClick={() => void removeVoice()}><Trash2 size={18} aria-hidden="true" />{t("Remove")}</Button>
        </>}
      </div>
      <p className="mt-3 text-xs text-sub">{t("Voice: Nabra-7M-Distill (Modern Standard Arabic, one voice, Apache-2.0), with eSpeak NG (GPL-3.0). This voice is being evaluated and has not yet been reviewed by an Arabic speaker.")} <Link href="/licenses" className="inline-flex min-h-11 items-center font-bold text-sky-dark underline">{t("Licences")}</Link></p>
    </Card></div>
  );
}
