"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/state/store";
import { LanguagePicker, useT } from "@/lib/i18n";
import { Logo, Mascot } from "./Mascot";
import { Button, Field, LinkButton, Notice } from "./ui";

/** Supabase returns English error text; map the common ones onto translatable, friendlier messages. */
const friendly = (m: string) => /invalid login credentials/i.test(m) ? "That email and password don’t match. Check them and try again."
  : /already registered|already been registered/i.test(m) ? "An account with that email already exists. Log in instead."
  : /email not confirmed/i.test(m) ? "Please confirm your email first — check your inbox for our message."
  : /rate limit|too many/i.test(m) ? "Too many attempts. Please wait a few minutes and try again."
  : /valid email|invalid format|invalid email/i.test(m) ? "Enter a valid email address."
  : /at least|weak|password should/i.test(m) ? "Use a password of at least 8 characters."
  : /same.*password|different from the old/i.test(m) ? "Choose a password you haven’t used before."
  : /fetch|network/i.test(m) ? "You seem to be offline. Check your connection and try again." : m;

export function AuthForm({ kind }: { kind: "login" | "signup" | "forgot" | "reset" }) {
  const router = useRouter(); const { t } = useT();
  const { cloudConfigured, signIn, signUp, requestPasswordReset, updatePassword, state, ready, userId, recovering } = useStore();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState(""); const [username, setUsername] = useState("");
  const [msg, setMsg] = useState<string | null>(null); const [ok, setOk] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const signup = kind === "signup";
  // Already signed in: sign-up and log-in pages have nothing to do.
  useEffect(() => { if (ready && userId && !recovering && (kind === "login" || kind === "signup")) router.replace(state.profile.onboarded ? "/learn" : "/onboarding"); }, [ready, userId, recovering, kind, state.profile.onboarded, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null); setOk(null);
    if (kind !== "reset" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setMsg("Enter a valid email address."); return; }
    if (signup && !/^[a-z0-9_]{3,20}$/.test(username)) { setMsg("Usernames are 3–20 characters: lowercase letters, numbers or underscores."); return; }
    if (kind !== "forgot" && password.length < 8) { setMsg("Use a password of at least 8 characters."); return; }
    setBusy(true);
    if (kind === "signup") { const r = await signUp(email.trim(), password, name.trim(), username); if (r.error) setMsg(friendly(r.error)); else if (r.confirm) setOk("Almost there! We’ve sent a confirmation link to your email. Open it, then log in."); }
    else if (kind === "login") { const err = await signIn(email.trim(), password); if (err) setMsg(friendly(err)); }
    else if (kind === "forgot") { const err = await requestPasswordReset(email.trim()); if (err) setMsg(friendly(err)); else setOk("If an account exists for that email, a reset link is on its way. Check your inbox."); }
    else { const err = await updatePassword(password); if (err) setMsg(friendly(err)); else { setOk("Your password has been changed."); setTimeout(() => router.replace("/learn"), 1200); } }
    setBusy(false);
  };
  const title = { signup: "Create your free profile", login: "Welcome back", forgot: "Reset your password", reset: "Choose a new password" }[kind];
  const cta = { signup: "Create account", login: "Log in", forgot: "Send reset link", reset: "Save new password" }[kind];
  const guestHref = state.profile.onboarded ? "/learn" : "/onboarding";
  const resetBlocked = kind === "reset" && ready && !userId;
  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-5 py-10 text-center">
      <div className="mb-6 flex items-center justify-between"><Link href="/" aria-label="Speakara"><Logo size={30} /></Link><LanguagePicker /></div>
      <Mascot mood={signup ? "wave" : kind === "login" ? "happy" : "think"} size={110} className="mx-auto" />
      <h1 className="mt-3 text-2xl">{t(title)}</h1>
      {!cloudConfigured ? (
        <div className="mt-6 space-y-4 text-left">
          <Notice tone="warn">{t("This site isn’t connected to an account server, so Speakara runs in guest mode: everything works and your progress is saved on this device.")}</Notice>
          <LinkButton href={guestHref} className="w-full">{state.profile.onboarded ? t("Continue learning") : t("Start as a guest")}</LinkButton>
        </div>
      ) : resetBlocked ? (
        <div className="mt-6 space-y-4"><Notice tone="warn">{t("This reset link has expired or was already used. Request a new one.")}</Notice><LinkButton href="/forgot-password" className="w-full">{t("Send reset link")}</LinkButton></div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate aria-describedby="auth-msg">
          {signup && <Field label={t("Name")} value={name} onChange={(e) => setName(e.target.value)} required maxLength={30} autoComplete="given-name" />}
          {signup && <Field label={t("Username")} value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} required maxLength={20} autoComplete="username" autoCapitalize="off" />}
          {kind !== "reset" && <Field label={t("Email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" inputMode="email" />}
          {kind !== "forgot" && <Field label={kind === "reset" ? t("New password") : t("Password")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={kind === "login" ? "current-password" : "new-password"} />}
          <div id="auth-msg" aria-live="polite" className="space-y-2">{msg && <Notice tone="error">{t(msg)}</Notice>}{ok && <Notice tone="success">{t(ok)}</Notice>}</div>
          <Button type="submit" disabled={busy || (kind !== "reset" && !email) || (kind !== "forgot" && !password) || (signup && (!name.trim() || !username))} aria-busy={busy} className="w-full">{busy ? t("One moment…") : t(cta)}</Button>
          {kind === "login" && <p><Link href="/forgot-password" className="text-sm font-extrabold text-sky-dark">{t("Forgot your password?")}</Link></p>}
        </form>
      )}
      {cloudConfigured && (kind === "login" || kind === "signup") && <LinkButton href={guestHref} variant="ghost" className="mt-2 !normal-case">{t("Try it first without an account")}</LinkButton>}
      <p className="mt-6 text-sm text-sub">{signup ? <>{t("Already learning with us?")} <Link href="/login" className="font-extrabold text-sky-dark">{t("Log in")}</Link></> : kind === "login" ? <>{t("New here?")} <Link href="/signup" className="font-extrabold text-sky-dark">{t("Create a free account")}</Link></> : <Link href="/login" className="font-extrabold text-sky-dark">{t("Back to log in")}</Link>}</p>
    </main>
  );
}
