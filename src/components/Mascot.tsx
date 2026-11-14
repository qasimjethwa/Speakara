export type Mood = "happy" | "cheer" | "think" | "oops" | "wave" | "sleepy";
const SKIN: Record<Mood, [string, string]> = {
  happy: ["#12b76a", "#0b8f52"], cheer: ["#ffb224", "#d98e04"], think: ["#2e9bff", "#1b78d6"],
  oops: ["#ff8a5d", "#d9623f"], wave: ["#12b76a", "#0b8f52"], sleepy: ["#9163f2", "#6f42d4"],
};
/**
 * Kiko the chameleon — Speakara's original mascot. Kiko changes colour with the moment:
 * green when calm, gold when celebrating, blue when thinking, warm orange for “not quite”.
 */
export function Mascot({ mood = "happy", size = 120, className = "" }: { mood?: Mood; size?: number; className?: string }) {
  const [body, shade] = SKIN[mood];
  const mouth = { happy: "M52 74 q10 9 22 0", cheer: "M50 72 q13 16 26 0 z", think: "M56 77 h14", oops: "M54 79 q9 -7 18 0", wave: "M52 74 q10 9 22 0", sleepy: "M56 77 q7 3 14 0" }[mood];
  return (
    <svg viewBox="0 0 140 130" width={size} height={(size * 130) / 140} className={className} role="img" aria-label={`Kiko the chameleon, ${mood}`}>
      <path d="M96 92 c26 6 36 -10 28 -22 c-7 -10 -22 -6 -20 5 c1 7 9 8 11 3" fill="none" stroke={shade} strokeWidth="9" strokeLinecap="round" />
      <ellipse cx="68" cy="88" rx="38" ry="27" fill={body} />
      <ellipse cx="66" cy="96" rx="24" ry="14" fill="#fff" opacity=".28" />
      <path d="M34 62 c0 -30 22 -44 40 -40 c20 4 30 22 26 42 c-4 18 -22 26 -38 24 c-16 -2 -28 -10 -28 -26z" fill={body} />
      <path d="M60 22 l8 -14 l8 13 l9 -9 l2 15" fill={shade} />
      <circle cx="54" cy="54" r="14" fill="#fff" stroke={shade} strokeWidth="3" />
      <circle cx="84" cy="52" r="11" fill="#fff" stroke={shade} strokeWidth="3" />
      {mood === "sleepy" ? (<><path d="M46 56 q8 5 16 0" stroke="#2f3540" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M78 54 q6 4 12 0" stroke="#2f3540" strokeWidth="3" fill="none" strokeLinecap="round" /></>) : (
        <><circle cx={mood === "think" ? 58 : 56} cy={mood === "think" ? 49 : 55} r="5.5" fill="#2f3540" /><circle cx={mood === "think" ? 87 : 85} cy={mood === "think" ? 48 : 53} r="4.5" fill="#2f3540" /><circle cx={mood === "think" ? 60 : 58} cy={mood === "think" ? 47 : 53} r="1.6" fill="#fff" /></>
      )}
      <path d={mouth} fill={mood === "cheer" ? "#7a2e2e" : "none"} stroke="#2f3540" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {mood === "oops" && <path d="M98 34 q4 7 0 10 q-4 -3 0 -10z" fill="#2e9bff" />}
      <path d="M44 108 q-4 10 6 10 M86 110 q4 9 -6 9" stroke={shade} strokeWidth="7" fill="none" strokeLinecap="round" />
      {mood === "wave" || mood === "cheer" ? <path d="M32 84 q-16 -8 -14 -24" stroke={shade} strokeWidth="8" fill="none" strokeLinecap="round" /> : <path d="M34 90 q-10 4 -10 12" stroke={shade} strokeWidth="8" fill="none" strokeLinecap="round" />}
      {mood === "cheer" && <path d="M102 86 q16 -8 14 -24" stroke={shade} strokeWidth="8" fill="none" strokeLinecap="round" />}
    </svg>
  );
}
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2 font-extrabold text-brand" style={{ fontSize: size * 0.9 }}>
      <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true"><rect width="32" height="32" rx="10" fill="#12b76a" /><path d="M9 20 c0 -8 6 -11 11 -10 c4 1 5 5 2 7 c-3 2 -8 0 -6 -3" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" /><circle cx="22" cy="22" r="2.2" fill="#ffb224" /></svg>
      speakara
    </span>
  );
}
