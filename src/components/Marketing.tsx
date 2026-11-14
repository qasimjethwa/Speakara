import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "./Mascot";
import { LinkButton } from "./ui";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b-2 border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between px-5 py-3">
          <Link href="/" aria-label="Speakara home"><Logo size={32} /></Link>
          <nav aria-label="Site" className="flex items-center gap-1 text-sm font-extrabold uppercase text-sub sm:gap-4">
            <Link href="/features" className="hidden rounded-lg px-2 py-2 hover:text-ink sm:block">Features</Link>
            <Link href="/about" className="hidden rounded-lg px-2 py-2 hover:text-ink sm:block">About</Link>
            <Link href="/login" className="rounded-lg px-2 py-2 text-sky">Log in</Link>
            <LinkButton href="/signup" className="!min-h-10 !px-4 !text-sm">Get started</LinkButton>
          </nav>
        </div>
      </header>
      {children}
      <footer className="mt-20 border-t-2 border-line bg-mist">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-4 px-5 py-8 text-sm text-sub sm:flex-row sm:items-center sm:justify-between">
          <Logo size={24} />
          <nav aria-label="Footer" className="flex flex-wrap gap-5 font-bold"><Link href="/features">Features</Link><Link href="/about">About</Link><Link href="/admin/content">Content review</Link><Link href="/signup">Start learning</Link></nav>
          <p>An independent, free language-learning project. Course content CC BY-SA 4.0.</p>
        </div>
      </footer>
    </div>
  );
}
export function Feature({ icon, title, children, tone }: { icon: string; title: string; children: ReactNode; tone: string }) {
  return <div className="rounded-3xl border-2 border-line p-6"><div className={`mb-4 grid h-14 w-14 place-items-center rounded-2xl text-3xl ${tone}`} aria-hidden="true">{icon}</div><h3 className="text-xl">{title}</h3><p className="mt-2 text-sub">{children}</p></div>;
}
