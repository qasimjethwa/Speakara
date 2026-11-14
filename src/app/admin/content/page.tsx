import type { Metadata } from "next";
import Link from "next/link";
import { COURSES } from "@/lib/content";
import { lintCourse } from "@/lib/content/lint";
export const metadata: Metadata = { title: "Content review" };

/** Read-only content review: what reviewers check before a unit is promoted. Editing happens through pull requests. */
export default function ContentReview() {
  return (
    <main className="mx-auto max-w-[960px] px-5 py-10">
      <Link href="/" className="text-sm font-extrabold uppercase text-sky">← Speakara</Link>
      <h1 className="mt-3 text-3xl">Content review</h1>
      <p className="mt-2 text-sub">Every course is authored as data in <code>src/lib/content/courses</code> and reviewed through pull requests. This page runs the automated checks reviewers rely on and lists all learner-facing text.</p>
      {COURSES.map((c) => { const issues = lintCourse(c); return (
        <section key={c.id} className="mt-10">
          <h2 className="text-2xl">{c.flag} {c.targetName} for {c.nativeName} speakers <span className="ml-2 rounded-lg bg-mist px-2 py-1 align-middle text-sm text-sub">{c.status}</span></h2>
          <p className="mt-1 text-sm text-sub">Licence: {c.license} · Review status: {c.review}</p>
          <p className={`mt-3 rounded-xl p-3 text-sm ${issues.length ? "bg-coral-soft text-coral-dark" : "bg-brand-soft text-brand-dark"}`}>{issues.length ? `${issues.length} automated issue(s): ${issues.join("; ")}` : "Automated checks pass: unique ids, no empty text, no duplicate prompts, questions point at real lines."}</p>
          {c.units.map((u, ui) => (
            <details key={u.id} className="mt-3 rounded-2xl border-2 border-line p-4" open={ui === 0}>
              <summary className="cursor-pointer text-lg font-extrabold">Unit {ui + 1}: {u.title} <span className="font-semibold text-sub">· {u.cefr} · {u.objective}</span></summary>
              {u.lessons.map((l) => (
                <div key={l.id} className="mt-4"><h3 className="font-extrabold">{l.id} · {l.title}</h3>
                  <table className="mt-2 w-full text-left text-sm"><caption className="sr-only">Content of lesson {l.title}</caption><thead><tr className="text-sub"><th scope="col" className="w-24 py-1">Id</th><th scope="col">{c.targetName}</th><th scope="col">{c.nativeName}</th></tr></thead>
                    <tbody>{[...l.words, ...l.sentences].map((x) => <tr key={x.id} className="border-t border-line"><td className="py-1 text-sub">{x.id.split(".").pop()}</td><td lang={c.ttsLang}>{x.t}</td><td>{x.n}{(x as { alt?: string[] }).alt ? <span className="text-sub"> · also: {(x as { alt?: string[] }).alt!.join(" / ")}</span> : null}</td></tr>)}</tbody></table></div>
              ))}
            </details>
          ))}
        </section>); })}
    </main>
  );
}
