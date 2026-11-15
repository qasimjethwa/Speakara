"use client";
import { Mascot } from "@/components/Mascot";
import { Feature, MarketingShell } from "@/components/Marketing";
import { LinkButton } from "@/components/ui";
import { COURSES } from "@/lib/content";
import { useT } from "@/lib/i18n";

export default function Landing() {
  const { t } = useT();
  return (
    <MarketingShell>
      <section className="mx-auto grid max-w-[1080px] items-center gap-10 px-5 py-14 md:grid-cols-2 md:py-24">
        <div className="order-2 text-center md:order-1 md:text-left">
          <h1 className="text-4xl leading-tight md:text-5xl">{t("Learn a language for free.")} <span className="text-brand">{t("All of it.")}</span></h1>
          <p className="mt-5 text-lg text-sub">{t("Bite-sized lessons, stories, speaking practice and a patient tutor. No lives that run out, no locked lessons, no subscription — ever.")}</p>
          <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3 md:mx-0"><LinkButton href="/signup">{t("Get started")}</LinkButton><LinkButton href="/login" variant="secondary" className="!text-sky-dark">{t("I already have an account")}</LinkButton></div>
        </div>
        <div className="order-1 flex justify-center md:order-2">
          <div className="relative grid h-72 w-72 place-items-center rounded-full bg-brand-soft md:h-96 md:w-96">
            <Mascot mood="wave" size={250} className="anim-bob" />
            <span aria-hidden="true" className="anim-pop absolute -right-2 top-8 rounded-2xl border-2 border-line-dark bg-paper px-4 py-2 text-lg">¡Hola!</span>
            <span aria-hidden="true" className="anim-pop absolute -left-3 bottom-12 rounded-2xl border-2 border-line-dark bg-paper px-4 py-2 text-lg" style={{ animationDelay: ".25s" }}>Bonjour !</span>
          </div>
        </div>
      </section>
      <section aria-label={t("Course")} className="border-y-2 border-line bg-mist">
        <ul className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-5 font-bold text-sub">
          {COURSES.map((c) => <li key={c.id} className="flex items-center gap-2"><span className="text-2xl" aria-hidden="true">{c.flag}</span>{t(c.targetName)} <span className="font-semibold">· {t("Taught in {lang}", { lang: t(c.nativeName) })}</span></li>)}
        </ul>
      </section>
      <section className="mx-auto max-w-[1080px] px-5 py-16">
        <h2 className="text-center text-3xl">{t("Everything you need to actually speak")}</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Feature icon="🧩" title={t("Lessons that fit in a coffee break")} tone="bg-brand-soft">{t("Eight exercise types — tap, type, listen, speak, match — mixed into five-minute sessions.")}</Feature>
          <Feature icon="🔁" title={t("Review that knows what you forget")} tone="bg-sky-soft">{t("A transparent spaced-repetition schedule brings words back just before they slip away.")}</Feature>
          <Feature icon="🎙️" title={t("Speak from day one")} tone="bg-coral-soft">{t("Say sentences aloud and get word-by-word feedback, right in your browser.")}</Feature>
          <Feature icon="💬" title={t("A tutor who never gets tired")} tone="bg-grape-soft">{t("Role-play a restaurant, an airport or a first hello. Kiko corrects gently and explains why.")}</Feature>
          <Feature icon="📖" title={t("Stories")} tone="bg-sun-soft">{t("Short dialogues with comprehension checks turn vocabulary into understanding.")}</Feature>
          <Feature icon="🔥" title={t("Motivation without pressure")} tone="bg-brand-soft">{t("Streaks, quests, leagues and achievements — and mistakes never lock you out.")}</Feature>
        </div>
      </section>
      <section className="mx-auto max-w-[1080px] px-5">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-brand px-6 py-12 text-center text-white md:flex-row md:text-left">
          <Mascot mood="cheer" size={150} />
          <div className="flex-1"><h2 className="text-3xl">{t("Education shouldn’t have a checkout page.")}</h2><p className="mt-2 text-lg">{t("Speakara’s learning features are free for everyone. Gems are earned by learning and can’t be bought.")}</p></div>
          <LinkButton href="/signup" variant="secondary" className="!text-brand-dark">{t("Start now")}</LinkButton>
        </div>
      </section>
    </MarketingShell>
  );
}
