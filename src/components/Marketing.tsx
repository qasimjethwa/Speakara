"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { LanguagePicker, useT } from "@/lib/i18n";
import { Logo } from "./Mascot";
import { LinkButton } from "./ui";

export function MarketingShell({ children }: { children: ReactNode }) {
  const { t } = useT();
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only-focusable fixed left-3 top-3 z-50 rounded-xl bg-ink px-4 py-2 font-bold text-white">{t("Skip to content")}</a>
      <header className="sticky top-0 z-20 border-b-2 border-line bg-paper">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-2 px-5 py-3">
          <Link href="/" aria-label="Speakara"><Logo size={32} /></Link>
          <nav aria-label={t("Site")} className="flex items-center gap-1 text-sm font-extrabold uppercase text-sub sm:gap-3">
            <Link href="/features" className="hidden rounded-lg px-2 py-2 hover:text-ink md:block">{t("Features")}</Link>
            <Link href="/about" className="hidden rounded-lg px-2 py-2 hover:text-ink md:block">{t("About")}</Link>
            <LanguagePicker className="hidden sm:inline-flex" />
            <Link href="/login" className="rounded-lg px-2 py-2 text-sky-dark">{t("Log in")}</Link>
            <LinkButton href="/signup" className="!min-h-11 !px-4 !text-sm">{t("Get started")}</LinkButton>
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="outline-none">{children}</main>
      <footer className="mt-20 border-t-2 border-line bg-mist">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-4 px-5 py-8 text-sm text-sub sm:flex-row sm:items-center sm:justify-between">
          <Logo size={24} />
          <nav aria-label={t("Footer")} className="flex flex-wrap items-center gap-5 font-bold"><Link href="/features">{t("Features")}</Link><Link href="/about">{t("About")}</Link><Link href="/admin/content">{t("Content review")}</Link><LanguagePicker className="sm:hidden" /></nav>
          <p>{t("An independent, free language-learning project.")}</p>
        </div>
      </footer>
    </div>
  );
}
export function Feature({ icon, title, children, tone }: { icon: string; title: string; children: ReactNode; tone: string }) {
  return <div className="rounded-3xl border-2 border-line p-6"><div className={`mb-4 grid h-14 w-14 place-items-center rounded-2xl text-3xl ${tone}`} aria-hidden="true">{icon}</div><h3 className="text-xl">{title}</h3><p className="mt-2 text-sub">{children}</p></div>;
}
