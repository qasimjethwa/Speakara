import { Mascot } from "@/components/Mascot";
import { Feature, MarketingShell } from "@/components/Marketing";
import { LinkButton } from "@/components/ui";
import { COURSES } from "@/lib/content";

export default function Landing() {
  return (
    <MarketingShell>
      <section className="mx-auto grid max-w-[1080px] items-center gap-10 px-5 py-14 md:grid-cols-2 md:py-24">
        <div className="order-2 text-center md:order-1 md:text-left">
          <h1 className="text-4xl leading-tight md:text-5xl">Learn a language for free. <span className="text-brand">All of it.</span></h1>
          <p className="mt-5 text-lg text-sub">Bite-sized lessons, stories, speaking practice and a patient tutor. No lives that run out, no locked lessons, no subscription — ever.</p>
          <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3 md:mx-0"><LinkButton href="/signup">Get started</LinkButton><LinkButton href="/login" variant="secondary" className="!text-sky">I already have an account</LinkButton></div>
        </div>
        <div className="order-1 flex justify-center md:order-2">
          <div className="relative grid h-72 w-72 place-items-center rounded-full bg-brand-soft md:h-96 md:w-96">
            <Mascot mood="wave" size={250} className="anim-bob" />
            <span className="anim-pop absolute -right-2 top-8 rounded-2xl border-2 border-line bg-paper px-4 py-2 text-lg shadow-sm">¡Hola!</span>
            <span className="anim-pop absolute -left-3 bottom-12 rounded-2xl border-2 border-line bg-paper px-4 py-2 text-lg shadow-sm" style={{ animationDelay: ".25s" }}>Bonjour !</span>
          </div>
        </div>
      </section>
      <section aria-label="Available courses" className="border-y-2 border-line bg-mist">
        <ul className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-5 font-bold text-sub">
          {COURSES.map((c) => <li key={c.id} className="flex items-center gap-2"><span className="text-2xl">{c.flag}</span>{c.targetName} <span className="font-semibold">for {c.nativeName} speakers</span></li>)}
        </ul>
      </section>
      <section className="mx-auto max-w-[1080px] px-5 py-16">
        <h2 className="text-center text-3xl">Everything you need to actually speak</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Feature icon="🧩" title="Lessons that fit in a coffee break" tone="bg-brand-soft">Seven exercise types — tap, type, listen, speak, match — mixed into five-minute sessions.</Feature>
          <Feature icon="🔁" title="Review that knows what you forget" tone="bg-sky-soft">A transparent spaced-repetition schedule brings words back just before they slip away.</Feature>
          <Feature icon="🎙️" title="Speak from day one" tone="bg-coral-soft">Say sentences aloud and get instant feedback, right in your browser.</Feature>
          <Feature icon="💬" title="A tutor who never gets tired" tone="bg-grape-soft">Role-play a restaurant, an airport or a first hello. Kiko corrects gently and explains why.</Feature>
          <Feature icon="📖" title="Stories" tone="bg-sun-soft">Short dialogues with comprehension checks turn vocabulary into understanding.</Feature>
          <Feature icon="🔥" title="Motivation without pressure" tone="bg-brand-soft">Streaks, quests, leagues and achievements — and mistakes never lock you out.</Feature>
        </div>
      </section>
      <section className="mx-auto max-w-[1080px] px-5">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-brand px-6 py-12 text-center text-white md:flex-row md:text-left">
          <Mascot mood="cheer" size={150} />
          <div className="flex-1"><h2 className="text-3xl">Education shouldn’t have a checkout page.</h2><p className="mt-2 text-lg opacity-95">Speakara’s learning features are free for everyone. Gems are earned by learning and can’t be bought.</p></div>
          <LinkButton href="/signup" variant="secondary" className="!text-brand-dark">Start now</LinkButton>
        </div>
      </section>
    </MarketingShell>
  );
}
