"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/state/store";
import { Logo, Mascot } from "./Mascot";
import { Button, Field, LinkButton } from "./ui";

export function AuthForm({ kind }: { kind: "login" | "signup" }) {
  const router = useRouter(); const { cloudConfigured, signIn, signUp, state } = useStore();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState(""); const [username, setUsername] = useState("");
  const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const signup = kind === "signup";
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null);
    if (signup && !/^[a-z0-9_]{3,20}$/.test(username)) { setMsg("Usernames are 3–20 characters: lowercase letters, numbers or underscores."); return; }
    if (password.length < 8) { setMsg("Use a password of at least 8 characters."); return; }
    setBusy(true);
    const err = signup ? await signUp(email, password, name.trim(), username) : await signIn(email, password);
    setBusy(false);
    if (err) setMsg(err); else router.replace("/learn");
  };
  return (
    <div className="mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-5 py-10 text-center">
      <Link href="/" className="mx-auto mb-6" aria-label="Speakara home"><Logo size={34} /></Link>
      <Mascot mood={signup ? "wave" : "happy"} size={110} className="mx-auto" />
      <h1 className="mt-3 text-2xl">{signup ? "Create your free profile" : "Welcome back"}</h1>
      {cloudConfigured ? (
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          {signup && <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={30} autoComplete="given-name" />}
          {signup && <Field label="Username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} required maxLength={20} autoComplete="username" />}
          <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={signup ? "new-password" : "current-password"} />
          {msg && <p role="alert" className="rounded-xl bg-coral-soft p-3 text-sm text-coral-dark">{msg}</p>}
          <Button type="submit" disabled={busy || !email || !password || (signup && (!name.trim() || !username))} className="w-full">{busy ? "One moment…" : signup ? "Create account" : "Log in"}</Button>
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="rounded-2xl bg-sun-soft p-4 text-left text-[15px]">This deployment isn’t connected to an account server yet, so Speakara runs in <strong>guest mode</strong>: everything works and your progress is saved on this device.</p>
          <LinkButton href={state.profile.onboarded ? "/learn" : "/onboarding"} className="w-full">{state.profile.onboarded ? "Continue learning" : "Start as a guest"}</LinkButton>
        </div>
      )}
      {cloudConfigured && <LinkButton href={state.profile.onboarded ? "/learn" : "/onboarding"} variant="ghost" className="mt-2 !normal-case">Try it first without an account</LinkButton>}
      <p className="mt-6 text-sm text-sub">{signup ? <>Already learning with us? <Link href="/login" className="font-extrabold text-sky">Log in</Link></> : <>New here? <Link href="/signup" className="font-extrabold text-sky">Create a free account</Link></>}</p>
    </div>
  );
}
