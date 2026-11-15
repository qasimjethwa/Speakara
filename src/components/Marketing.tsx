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
        <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-2 px-4 py-3 sm:px-5">
          <Link href="/" aria-label="Speakara" className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center min-[400px]:justify-start"><span className="min-[400px]:hidden"><Logo size={36} iconOnly /></span><span className="hidden min-[400px]:block"><Logo size={32} /></span></Link>
          <nav aria-label={t("Site")} className="flex items-center gap-1 text-sm font-extrabold uppercase text-sub sm:gap-3">
            <Link href="/features" className="hidden min-h-11 items-center rounded-lg px-2 hover:text-ink md:inline-flex">{t("Features")}</Link>
            <Link href="/about" className="hidden min-h-11 items-center rounded-lg px-2 hover:text-ink md:inline-flex">{t("About")}</Link>
            <LanguagePicker className="hidden sm:inline-flex" />
            <Link href="/login" className="inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-2 text-sky-dark">{t("Log in")}</Link>
            <LinkButton href="/signup" className="!min-h-11 whitespace-nowrap !px-3 !text-sm min-[380px]:!px-4">{t("Get started")}</LinkButton>
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="outline-none">{children}</main>
      <footer className="mt-20 border-t-2 border-line bg-mist">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-4 px-5 py-8 text-sm text-sub sm:flex-row sm:items-center sm:justify-between">
          <Logo size={24} />
          <nav aria-label={t("Footer")} className="flex flex-wrap items-center gap-x-5 font-bold">{[["/features", "Features"], ["/about", "About"], ["/admin/content", "Content review"]].map(([href, label]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center">{t(label)}</Link>)}<LanguagePicker className="inline-flex sm:hidden" /></nav>
          <p>{t("An independent, free language-learning project.")}</p>
        </div>
      </footer>
    </div>
  );
}
export function Feature({ icon, title, children, tone }: { icon: string; title: string; children: ReactNode; tone: string }) {
  return <div className="rounded-3xl border-2 border-line p-6"><div className={`mb-4 grid h-14 w-14 place-items-center rounded-2xl text-3xl ${tone}`} aria-hidden="true">{icon}</div><h3 className="text-xl">{title}</h3><p className="mt-2 text-sub">{children}</p></div>;
}
