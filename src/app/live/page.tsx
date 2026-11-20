"use client";
import Link from "next/link";
import { Bot, Brain, ChevronRight, Users } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Mascot } from "@/components/Mascot";
import { Card } from "@/components/ui";
import { QuotaMeter } from "@/components/live/LiveUi";
import { useStore } from "@/lib/state/store";
import { useT } from "@/lib/i18n";
import { useLiveConfig, useQuota } from "@/lib/live/client";

/** Live hub: the AI companion and the community language exchange. The scripted tutor stays at /tutor. */
export default function LivePage() {
  const { t } = useT(); const { mode } = useStore();
  const { config } = useLiveConfig(); const { quota } = useQuota(mode === "cloud" && !!config?.ready);
  const tile = "flex items-center gap-4 rounded-2xl border-2 border-b-4 border-line bg-paper p-5 hover:bg-mist";
  return (
    <AppShell>
      <PageTitle title={t("Live practice")} sub={t("Speak out loud, in real time.")} />
      <div className="space-y-4">
        <Link href="/live/companion" className={tile}>
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-grape-soft text-grape-dark"><Bot size={34} aria-hidden="true" /></span>
          <span className="flex-1"><span className="block text-lg font-extrabold">{t("AI companion")}</span><span className="block text-sub">{t("A video conversation with an AI avatar who adapts to your level and corrects you kindly.")}</span></span>
          <ChevronRight className="text-sub" aria-hidden="true" />
        </Link>
        <Link href="/live/community" className={tile}>
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sky-soft text-sky-dark"><Users size={34} aria-hidden="true" /></span>
          <span className="flex-1"><span className="block text-lg font-extrabold">{t("Language exchange")}</span><span className="block text-sub">{t("Video calls with other learners: you help with your language, they help with theirs. Adults only.")}</span></span>
          <ChevronRight className="text-sub" aria-hidden="true" />
        </Link>
        <Link href="/live/memory" className={tile}>
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark"><Brain size={34} aria-hidden="true" /></span>
          <span className="flex-1"><span className="block text-lg font-extrabold">{t("My learning memory")}</span><span className="block text-sub">{t("Words, corrections and tips saved from your conversations.")}</span></span>
          <ChevronRight className="text-sub" aria-hidden="true" />
        </Link>
        {mode === "cloud" && <QuotaMeter quota={quota} />}
        <Card className="flex items-center gap-4"><Mascot mood="happy" size={64} /><p className="text-sub">{t("Prefer typing? The scripted tutor is still in Tutor, free and unlimited.")}</p></Card>
      </div>
    </AppShell>
  );
}
