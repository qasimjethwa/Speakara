import type { Metadata } from "next";
import { Mascot } from "@/components/Mascot";
import { MarketingShell } from "@/components/Marketing";
export const metadata: Metadata = { title: "About" };
export default function About() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-[720px] px-5 py-14 text-lg leading-relaxed">
        <Mascot mood="happy" size={120} />
        <h1 className="mt-4 text-4xl">About Speakara</h1>
        <p className="mt-5">Speakara is an independent, free language-learning platform. We believe the complete learning experience — lessons, review, speaking practice and tutoring — should be open to everyone.</p>
        <h2 className="mt-10 text-2xl">Our promises</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>No learner paywalls and no subscription tiers.</li><li>No lives, hearts or energy that stop you from learning.</li><li>Gems and rewards are earned by learning. They are never sold.</li>
          <li>AI helps you understand; it doesn’t just hand over answers.</li><li>Course content is original, openly licensed (CC BY-SA 4.0) and tracked through human review.</li>
        </ul>
        <h2 className="mt-10 text-2xl">How it’s funded</h2>
        <p className="mt-4">Speakara is designed to run cheaply: answers are graded by deterministic code, audio uses your browser’s voices, and AI is used only where it teaches better. Long-term sustainability is planned around grants, donations and institutional sponsorship — never around restricting learning.</p>
        <h2 className="mt-10 text-2xl">Meet Kiko</h2>
        <p className="mt-4">Kiko is a chameleon who changes colour as you learn: green when things are calm, gold when you’re celebrating, blue when thinking, and a warm orange for “not quite — try again”.</p>
      </article>
    </MarketingShell>
  );
}
