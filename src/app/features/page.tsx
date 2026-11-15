import type { Metadata } from "next";
import { Feature, MarketingShell } from "@/components/Marketing";
import { LinkButton } from "@/components/ui";
export const metadata: Metadata = { title: "Features" };
export default function Features() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-[1080px] px-5 py-14">
        <h1 className="text-4xl">What’s inside Speakara</h1>
        <p className="mt-3 max-w-2xl text-lg text-sub">Everything below works today, for every learner, at no cost.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <Feature icon="🗺️" title="A guided learning path" tone="bg-brand-soft">Units build on each other, each with a guidebook of grammar tips. Already know the basics? Take a placement test or jump ahead by passing a unit test.</Feature>
          <Feature icon="🧩" title="Eight exercise types" tone="bg-sky-soft">Multiple choice, word bank, typed translation, listening, dictation, speaking, matching pairs and fill-in-the-blank — graded instantly, with tolerance for small typos.</Feature>
          <Feature icon="♾️" title="Unlimited mistakes" tone="bg-coral-soft">There are no lives or energy. Miss something and it simply comes back at the end of the session until it sticks.</Feature>
          <Feature icon="🔁" title="Practice hub" tone="bg-sun-soft">Review due words, fix past mistakes, or run listening, speaking, writing and timed matching sessions.</Feature>
          <Feature icon="💬" title="Tutor and role-play" tone="bg-grape-soft">Nine scenarios with scripted scenes that work everywhere. Sites connected to an AI provider add open-ended conversation with corrections.</Feature>
          <Feature icon="🏆" title="Streaks, quests and leagues" tone="bg-brand-soft">A published XP formula, three daily quests, achievements and weekly leaderboards. Streak freezes are earned with gems, never bought.</Feature>
        </div>
        <div className="mt-10"><LinkButton href="/signup">Start learning</LinkButton></div>
      </section>
    </MarketingShell>
  );
}
