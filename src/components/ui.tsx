"use client";
import Link from "next/link";
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "sky" | "secondary" | "danger" | "ghost" | "sun";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand border-brand-dark text-white", sky: "bg-sky border-sky-dark text-white", sun: "bg-sun border-sun-edge text-ink",
  danger: "bg-coral border-coral-dark text-white", secondary: "bg-paper border-line-dark border-2 border-b-4 text-ink",
  ghost: "bg-transparent border-transparent text-sky-dark !border-b-0",
};
const BASE = "key inline-flex items-center justify-center gap-2 rounded-2xl px-5 min-h-12 text-[15px] font-extrabold uppercase tracking-wide select-none disabled:bg-line disabled:border-line-dark disabled:text-sub aria-busy:opacity-80";
export function Button({ variant = "primary", className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button {...p} className={`${BASE} ${VARIANTS[variant]} ${className}`} />;
}
export function LinkButton({ href, variant = "primary", className = "", children }: { href: string; variant?: Variant; className?: string; children: ReactNode }) {
  return <Link href={href} className={`${BASE} ${VARIANTS[variant]} ${className}`}>{children}</Link>;
}
export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-2xl border-2 border-line bg-paper p-5 ${className}`}>{children}</div>;
}
export function ProgressBar({ value, color = "bg-brand", className = "", label }: { value: number; color?: string; className?: string; label?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={`h-4 w-full overflow-hidden rounded-full bg-line ${className}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? "Progress"}>
      <div className={`relative h-full rounded-full ${color} transition-[width] duration-500`} style={{ width: `${Math.max(pct, pct > 0 ? 6 : 0)}%` }}>
        <span className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/35" />
      </div>
    </div>
  );
}
export function Field({ label, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-left">
      <span className="mb-1 block text-sm font-bold text-sub">{label}</span>
      <input {...p} className="w-full rounded-2xl border-2 border-line-dark bg-mist px-4 py-3 text-base font-semibold text-ink placeholder:text-sub focus:border-sky-dark focus:bg-paper focus:outline-none" />
    </label>
  );
}
export function Confetti({ count = 36 }: { count?: number }) {
  const colors = ["#12b76a", "#1a73d1", "#ffb224", "#d43838", "#7a4fe0"];
  return <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden">{Array.from({ length: count }, (_, i) => (
    <span key={i} className="confetti" style={{ left: `calc((100% - 40px) * ${((i * 37) % 100) / 100})`, background: colors[i % 5], animationDuration: `${1.6 + ((i * 13) % 10) / 6}s`, animationDelay: `${(i % 9) / 12}s` }} />
  ))}</div>;
}
export function Loading({ text = "Loading…" }: { text?: string }) {
  return <div className="flex min-h-[60vh] items-center justify-center text-sub" role="status"><span className="mr-3 inline-block h-5 w-5 animate-spin rounded-full border-4 border-line border-t-brand" />{text}</div>;
}

/** Modal dialog on the native <dialog>: focus is trapped, Escape closes, focus returns to the opener. */
export function Dialog({ open, onClose, labelledBy, children }: { open: boolean; onClose: () => void; labelledBy: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = ref.current; if (!d) return; if (open && !d.open) d.showModal(); if (!open && d.open) d.close(); }, [open]);
  return (
    <dialog ref={ref} aria-labelledby={labelledBy} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className="m-auto mb-0 w-full max-w-md rounded-t-3xl bg-paper p-0 text-ink sm:mb-auto sm:rounded-3xl">
      <div className="p-6 text-center">{children}</div>
    </dialog>
  );
}
export function Notice({ tone = "info", children, role }: { tone?: "info" | "warn" | "error" | "success"; children: ReactNode; role?: "alert" | "status" }) {
  const cls = { info: "bg-sky-soft text-sky-dark", warn: "bg-sun-soft text-sun-dark", error: "bg-coral-soft text-coral-dark", success: "bg-brand-soft text-brand-dark" }[tone];
  return <p role={role ?? (tone === "error" ? "alert" : "status")} className={`rounded-2xl p-3 text-[15px] ${cls}`}>{children}</p>;
}
