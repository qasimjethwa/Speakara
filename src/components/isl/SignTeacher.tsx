"use client";
/**
 * The ISL signing teacher: a realistic rigged 3D human (Microsoft Rocketbox, MIT) rendered with React Three Fiber.
 *
 * - Two teachers on the same Biped rig and the same 52 ARKit blendshapes, so every reviewed clip plays on both.
 * - A large waist-up "signing" framing that widens automatically when the hands move out of frame, plus hands,
 *   face and full-body views.
 * - An emotional expression layer (src/lib/isl/expression.ts) that eases between moods and fades out while a sign
 *   plays, so it never alters a sign's own non-manual markers.
 * - Captions BELOW the stage, never over the hands or face.
 *
 * Without a reviewed clip the teacher never improvises a sign: it stays in a natural, expressive idle.
 */
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Captions, Hand, Pause, PersonStanding, Play, Repeat, RotateCcw, ScanFace, ScrollText, Snail, User } from "lucide-react";
import { ATTENTIVE, cueAt, poseAt, type CaptionCue, type Pose, type SignClip } from "@/lib/isl/rig";
import { gazeShapes, initialExpression, stepExpression, type ExpressionState, type Mood } from "@/lib/isl/expression";
import { useTeacherPref, type TeacherId } from "@/lib/isl/data";
import { useT } from "@/lib/i18n";

export const TEACHER_URLS: Record<TeacherId, string> = { female: "/isl/teacher.glb", male: "/isl/teacher-male.glb" };
export type View = "signing" | "full" | "hands" | "face";
const FOV = 30;
const VIEWS: Record<Exclude<View, "signing">, { pos: [number, number, number]; look: [number, number, number]; fov: number }> = {
  full: { pos: [0, 0.98, 3.7], look: [0, 0.92, 0], fov: 30 },
  hands: { pos: [0, 1.18, 1.05], look: [0, 1.12, 0.2], fov: 38 },
  face: { pos: [0, 1.6, 0.8], look: [0, 1.6, 0], fov: 28 },
};

interface PlayerState { playing: boolean; t: number; speed: number; loop: boolean }
type Rig = { bones: Record<string, THREE.Bone>; rest: Record<string, THREE.Quaternion>; meshes: THREE.Mesh[] };
type Hands = { l: THREE.Vector3; r: THREE.Vector3; ok: boolean };
const AXIS = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };

/** Advances playback; returns true when a non-looping clip has just finished. */
function stepPlayer(s: PlayerState, clip: SignClip | null, dt: number): boolean {
  if (!clip || !s.playing) return false;
  s.t += Math.min(dt, 0.25) * s.speed;
  if (s.t < clip.duration) return false;
  if (s.loop) { s.t = 0; return false; }
  s.t = clip.duration; s.playing = false; return true;
}

interface Life { next: number; phase: number; expr: ExpressionState; sway: number }
/** Pose + idle life (breathing, blinks, small weight shifts) + mood face and head, mixed under the sign. */
function applyPose(rig: Rig, pose: Pose, life: Life, now: number, signing: boolean) {
  for (const [name, b] of Object.entries(rig.bones)) b.quaternion.copy(rig.rest[name]);
  for (const [name, [x, y, z]] of Object.entries(pose.bones)) {
    const b = rig.bones[name]; if (!b) continue;
    if (x) b.rotateOnAxis(AXIS.x, x); if (y) b.rotateOnAxis(AXIS.y, y); if (z) b.rotateOnAxis(AXIS.z, z);
  }
  const e = life.expr, w = e.weight;
  const chest = rig.bones.Bip01_Spine2; if (chest) chest.rotateOnAxis(AXIS.z, Math.sin(now * 1.6) * 0.008);
  const spine = rig.bones.Bip01_Spine; if (spine) spine.rotateOnAxis(AXIS.x, Math.sin(now * 0.31) * 0.012 * w);
  const head = rig.bones.Bip01_Head;
  if (head && w > 0.01) {
    const nod = Math.sin(now * Math.PI * 2 * e.nod[1]) * e.nod[0];
    head.rotateOnAxis(AXIS.z, -(e.head[0] + nod) * w);
    head.rotateOnAxis(AXIS.x, (e.head[1] + Math.sin(now * 0.43) * 0.015) * w);
    head.rotateOnAxis(AXIS.y, e.head[2] * w);
  }
  if (now > life.next) { life.phase = now; life.next = now + 2.2 + Math.random() * 3.5; }
  const blinkW = Math.max(0, 1 - Math.abs(now - life.phase - 0.08) / 0.08);
  const mood = { ...e.face, ...gazeShapes(e.gaze) };
  for (const m of rig.meshes) {
    const dict = m.morphTargetDictionary; const inf = m.morphTargetInfluences; if (!dict || !inf) continue;
    inf.fill(0);
    for (const [k, v] of Object.entries(mood)) if (dict[k] !== undefined) inf[dict[k]] = v * w;
    // a sign's own face keys (non-manual markers) replace the mood entirely while it plays
    if (signing) for (const [k, v] of Object.entries(pose.face ?? {})) if (dict[k] !== undefined) inf[dict[k]] = v;
    for (const k of ["AK_09_EyeBlinkLeft", "AK_10_EyeBlinkRight"]) if (dict[k] !== undefined) inf[dict[k]] = Math.max(inf[dict[k]], blinkW);
  }
}

function buildRig(scene: THREE.Object3D): Rig {
  const bones: Record<string, THREE.Bone> = {}; const rest: Record<string, THREE.Quaternion> = {}; const meshes: THREE.Mesh[] = [];
  scene.traverse((o) => {
    if ((o as THREE.Bone).isBone) { bones[o.name] = o as THREE.Bone; rest[o.name] = o.quaternion.clone(); }
    const m = o as THREE.Mesh; if (m.isMesh) { meshes.push(m); m.frustumCulled = false; m.castShadow = true;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mat) => { const st = mat as THREE.MeshStandardMaterial; if (st.map) st.map.anisotropy = 8; st.envMapIntensity = 0.6;
        if (st.name?.includes("opacity") || st.transparent) { st.transparent = true; st.alphaTest = 0.4; st.depthWrite = false; } });
    }
  });
  return { bones, rest, meshes };
}

/** Waist-up framing that grows to keep both hands (and the head) in view while signing. */
function moveCamera(cam: THREE.PerspectiveCamera, target: THREE.Vector3, view: View, hands: Hands, aspect: number) {
  let pos: THREE.Vector3, look: THREE.Vector3, fov: number;
  if (view === "signing") {
    const lookY = 1.34; let halfH = 0.47, halfW = 0.42;
    if (hands.ok) for (const h of [hands.l, hands.r]) { halfH = Math.max(halfH, h.y - lookY + 0.14, lookY - h.y + 0.2); halfW = Math.max(halfW, Math.abs(h.x) + 0.14); }
    const d = Math.max(halfH, halfW / aspect) / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    pos = new THREE.Vector3(0, lookY + 0.04, d); look = new THREE.Vector3(0, lookY, 0); fov = FOV;
  } else { const v = VIEWS[view]; pos = new THREE.Vector3(...v.pos); look = new THREE.Vector3(...v.look); fov = v.fov; }
  cam.position.lerp(pos, 0.08); target.lerp(look, 0.08);
  cam.fov += (fov - cam.fov) * 0.08; cam.updateProjectionMatrix(); cam.lookAt(target);
}

/** Records hand positions for the auto-framing camera. */
function trackHands(scene: THREE.Object3D, l: THREE.Bone | undefined, r: THREE.Bone | undefined, out: Hands) {
  if (!l || !r) return; scene.updateMatrixWorld(); l.getWorldPosition(out.l); r.getWorldPosition(out.r); out.ok = true;
}

function Teacher({ url, clip, state, mood, hands, onTime }: { url: string; clip: SignClip | null; state: React.MutableRefObject<PlayerState>; mood: Mood; hands: React.MutableRefObject<Hands>; onTime: (t: number, ended: boolean) => void }) {
  const gltf = useLoader(GLTFLoader, url);
  const rig = useMemo(() => buildRig(gltf.scene), [gltf]);
  const life = useRef<Life & { lastEmit: number }>({ next: 1.5, phase: 0, expr: initialExpression(), sway: 0, lastEmit: 0 });
  useFrame((_, dt) => {
    const ended = stepPlayer(state.current, clip, dt);
    const now = performance.now() / 1000;
    const signing = !!clip && (state.current.playing || state.current.t > 0) && state.current.t < clip.duration;
    life.current.expr = stepExpression(life.current.expr, mood, signing, dt);
    applyPose(rig, clip ? poseAt(clip, state.current.t) : ATTENTIVE, life.current, now, !!clip);
    const l = rig.bones.Bip01_L_Hand, r = rig.bones.Bip01_R_Hand;
    trackHands(gltf.scene, l, r, hands.current);
    if (ended || now - life.current.lastEmit > 0.08) { life.current.lastEmit = now; onTime(state.current.t, ended); }
  });
  return <primitive object={gltf.scene} />;
}

function CameraRig({ view, hands }: { view: View; hands: React.MutableRefObject<Hands> }) {
  const target = useRef(new THREE.Vector3(0, 1.34, 0));
  useFrame((st) => moveCamera(st.camera as THREE.PerspectiveCamera, target.current, view, hands.current, st.size.width / Math.max(1, st.size.height)));
  return null;
}

/** A calm teaching room: warm key light, soft fill, rim light for hand/torso separation, a soft backdrop. */
function Room() {
  const backdrop = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 16; c.height = 256; const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 0, 256); grad.addColorStop(0, "#f3efe6"); grad.addColorStop(0.65, "#e9e3d6"); grad.addColorStop(1, "#ddd5c5");
    g.fillStyle = grad; g.fillRect(0, 0, 16, 256); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
  }, []);
  return (<>
    <hemisphereLight args={["#fffaf0", "#b9ad98", 1.25]} />
    <directionalLight position={[1.4, 2.8, 2.6]} intensity={2.2} color="#fff4e6" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
    <directionalLight position={[-2.2, 1.9, 1.8]} intensity={1.0} color="#e8eefc" />
    <directionalLight position={[0, 1.4, 3]} intensity={0.6} color="#ffffff" />
    <directionalLight position={[0.4, 2.4, -2.6]} intensity={1.6} color="#fff1dc" />
    <mesh position={[0, 1.6, -1.6]}><planeGeometry args={[9, 5]} /><meshBasicMaterial map={backdrop} toneMapped={false} /></mesh>
    <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[9, 6]} /><shadowMaterial opacity={0.18} /></mesh>
  </>);
}

export interface CaptionPrefs { size: "s" | "m" | "l"; contrast: boolean; background: boolean; meaning: boolean; hindi: boolean }
const DEFAULT_PREFS: CaptionPrefs = { size: "m", contrast: false, background: true, meaning: true, hindi: false };
function usePrefs(): [CaptionPrefs, (p: CaptionPrefs) => void] {
  const [p, setP] = useState<CaptionPrefs>(DEFAULT_PREFS);
  useEffect(() => { try { const s = localStorage.getItem("speakara:isl:captions"); if (s) setP({ ...DEFAULT_PREFS, ...JSON.parse(s) }); } catch { /* storage blocked */ } }, []);
  return [p, (n) => { setP(n); try { localStorage.setItem("speakara:isl:captions", JSON.stringify(n)); } catch { /* ignore */ } }];
}

export interface SignTeacherProps {
  clip: SignClip | null; fallback: CaptionCue; targetLang: "en" | "es"; className?: string; hideCaptions?: boolean;
  mood?: Mood; teacher?: TeacherId; speed?: number; initialView?: View; replayKey?: number;
  /** Extra caption lines for the teacher's explanation (already translated). */
  captionLines?: { text: string; lang?: string; strong?: boolean }[];
  compact?: boolean;
}

/** Stage + captions + controls. `fallback` is the caption when the clip has no timed cues (or there is no clip). */
export function SignTeacher({ clip, fallback, targetLang, className = "", hideCaptions = false, mood = "neutral", teacher, speed, initialView = "signing", replayKey = 0, captionLines, compact = false }: SignTeacherProps) {
  const { t } = useT();
  const [pref] = useTeacherPref(); const who = teacher ?? pref;
  const state = useRef<PlayerState>({ playing: !!clip, t: 0, speed: speed ?? 1, loop: false });
  const hands = useRef<Hands>({ l: new THREE.Vector3(), r: new THREE.Vector3(), ok: false });
  const [ui, setUi] = useState({ t: 0, playing: !!clip, speed: speed ?? 1, loop: false });
  const [view, setView] = useState<View>(initialView);
  const [prefs, setPrefs] = usePrefs();
  const [panel, setPanel] = useState<"none" | "captions" | "transcript">("none");
  const [webgl, setWebgl] = useState(true);
  useEffect(() => { state.current = { ...state.current, playing: !!clip, t: 0 }; setUi((u) => ({ ...u, t: 0, playing: !!clip })); }, [clip, replayKey]);
  useEffect(() => { if (speed) { state.current.speed = speed; setUi((u) => ({ ...u, speed })); } }, [speed]);
  useEffect(() => { try { const c = document.createElement("canvas"); setWebgl(!!(c.getContext("webgl2") || c.getContext("webgl"))); } catch { setWebgl(false); } }, []);

  const set = (patch: Partial<PlayerState>) => { Object.assign(state.current, patch); setUi((u) => ({ ...u, ...patch })); };
  const cue = cueAt(clip, clip ? Math.min(ui.t, clip.duration - 1e-3) : 0) ?? (clip?.captions?.length ? null : fallback);
  const size = { s: "text-lg", m: "text-2xl", l: "text-4xl" }[prefs.size];
  const capCls = prefs.contrast ? "bg-black text-yellow-300" : prefs.background ? "bg-ink text-white" : "border border-line bg-paper text-ink";
  const btn = "inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-xl border border-line bg-paper px-3 text-sm font-bold text-ink hover:bg-mist disabled:opacity-40";
  const on = "!border-ink !bg-ink !text-white";

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-[28px] bg-[#ece6da] shadow-[0_1px_2px_rgba(30,30,30,.06),0_12px_32px_-12px_rgba(30,30,30,.18)]"
        style={{ aspectRatio: compact ? "1 / 1" : "4 / 5", maxHeight: compact ? "56dvh" : "78dvh", marginInline: "auto" }}>
        {webgl ? (
          <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.38, 1.9], fov: FOV }} gl={{ antialias: true, preserveDrawingBuffer: true }}
            onCreated={({ gl }) => { gl.outputColorSpace = THREE.SRGBColorSpace; gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.18; gl.shadowMap.type = THREE.PCFSoftShadowMap; }}
            aria-label={who === "male" ? t("ISL teacher (male)") : t("ISL teacher (female)")} role="img">
            <Suspense fallback={null}><Teacher key={who} url={TEACHER_URLS[who]} clip={clip} state={state} mood={mood} hands={hands} onTime={(tt, ended) => setUi((u) => ({ ...u, t: tt, playing: ended ? false : u.playing }))} /></Suspense>
            <Room /><CameraRig view={view} hands={hands} />
          </Canvas>
        ) : <p className="flex h-full items-center justify-center p-6 text-center text-sub">{t("Your browser can’t show 3D graphics, so the signing teacher can’t be displayed. Captions and exercises still work.")}</p>}
        <div className="absolute right-3 top-3 flex flex-col gap-1.5 rounded-2xl bg-paper/80 p-1 backdrop-blur" role="group" aria-label={t("Camera view")}>
          {(["signing", "hands", "face", "full"] as View[]).map((v) => {
            const Icon = v === "signing" ? PersonStanding : v === "full" ? User : v === "hands" ? Hand : ScanFace;
            return <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} aria-label={v === "signing" ? t("Signing view (waist up)") : v === "full" ? t("Full body") : v === "hands" ? t("Hands close-up") : t("Face close-up")}
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${view === v ? "bg-ink text-white" : "text-ink hover:bg-paper"}`}><Icon size={18} aria-hidden="true" /></button>;
          })}
        </div>
      </div>

      {/* captions: always below the stage */}
      <div className={`mt-3 min-h-20 rounded-2xl px-4 py-3 text-center ${capCls}`} aria-live="polite">
        {hideCaptions ? <p className="text-base opacity-80">{t("Captions are hidden for this question.")}</p> : <>
          {captionLines?.length ? captionLines.map((l, i) => <p key={i} lang={l.lang} className={l.strong ? `${size} font-black leading-tight` : "mt-1 text-base opacity-90"}>{l.text}</p>) : cue ? <>
            <p className={`${size} font-black leading-tight`} lang={targetLang}>{cue.text}</p>
            {prefs.meaning && cue.meaning && <p className="mt-1 text-base opacity-90" lang="en">{cue.meaning}</p>}
          </> : <p className="text-base opacity-70">…</p>}
          {prefs.hindi && (cue?.hi) && <p className="mt-1 text-base opacity-90" lang="hi">{cue.hi}</p>}
        </>}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2" role="toolbar" aria-label={t("Signing controls")}>
        {clip && <>
          <button type="button" className={btn} onClick={() => { if (state.current.t >= clip.duration) set({ t: 0 }); set({ playing: !ui.playing }); }} aria-label={ui.playing ? t("Pause") : t("Play")}>{ui.playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}</button>
          <button type="button" className={btn} onClick={() => set({ t: 0, playing: true })} aria-label={t("Replay")}><RotateCcw size={18} aria-hidden="true" /></button>
          <button type="button" className={`${btn} ${ui.speed < 1 ? on : ""}`} onClick={() => set({ speed: ui.speed === 1 ? 0.5 : ui.speed === 0.5 ? 0.25 : 1 })} aria-label={`${t("Speed")} ${ui.speed}×`}><Snail size={18} aria-hidden="true" />{ui.speed}×</button>
          <button type="button" className={`${btn} ${ui.loop ? on : ""}`} aria-pressed={ui.loop} onClick={() => set({ loop: !ui.loop })} aria-label={t("Loop")}><Repeat size={18} aria-hidden="true" /></button>
          <input type="range" min={0} max={clip.duration} step={0.01} value={ui.t} onChange={(e) => set({ t: +e.target.value, playing: false })} aria-label={t("Position")} className="min-h-11 w-full accent-ink sm:w-40" />
        </>}
        <button type="button" className={`${btn} ${panel === "captions" ? on : ""}`} aria-expanded={panel === "captions"} onClick={() => setPanel(panel === "captions" ? "none" : "captions")} aria-label={t("Caption settings")}><Captions size={18} aria-hidden="true" /></button>
        {!hideCaptions && <button type="button" className={`${btn} ${panel === "transcript" ? on : ""}`} aria-expanded={panel === "transcript"} onClick={() => setPanel(panel === "transcript" ? "none" : "transcript")} aria-label={t("Transcript")}><ScrollText size={18} aria-hidden="true" /></button>}
      </div>

      {panel === "captions" && (
        <fieldset className="mt-3 grid gap-2 rounded-2xl border border-line bg-paper p-3 text-sm sm:grid-cols-2">
          <legend className="px-1 font-extrabold">{t("Captions")}</legend>
          <div className="flex items-center gap-2">{t("Size")}: {(["s", "m", "l"] as const).map((s) => <button key={s} type="button" aria-pressed={prefs.size === s} onClick={() => setPrefs({ ...prefs, size: s })} className={`min-h-11 min-w-11 rounded-xl border font-extrabold ${prefs.size === s ? "border-ink bg-ink text-white" : "border-line"}`}>{s.toUpperCase()}</button>)}</div>
          {([["contrast", t("High contrast")], ["background", t("Caption background")], ["meaning", t("Show English meaning")], ["hindi", t("Show Hindi")]] as const).map(([k, label]) => (
            <label key={k} className="flex min-h-11 items-center gap-2"><input type="checkbox" className="h-5 w-5 accent-ink" checked={prefs[k]} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })} />{label}</label>
          ))}
        </fieldset>
      )}
      {panel === "transcript" && (
        <div className="mt-3 rounded-2xl border border-line bg-paper p-3 text-left">
          <h3 className="mb-2 font-extrabold">{t("Transcript")}</h3>
          <ol className="space-y-1">{(captionLines?.length ? captionLines.map((l) => ({ start: 0, end: 0, text: l.text })) : clip?.captions?.length ? clip.captions : [fallback]).map((c, i) => (
            <li key={i}><button type="button" disabled={!clip} onClick={() => set({ t: c.start, playing: true })} className="w-full rounded-xl p-2 text-left hover:bg-mist disabled:hover:bg-transparent">
              <span className="font-bold">{c.text}</span>{(c as CaptionCue).meaning && <span className="block text-sm text-sub">{(c as CaptionCue).meaning}</span>}
            </button></li>))}</ol>
          <p className="mt-2 text-xs text-sub">{t("Captions show the written language. They support the signed explanation; they are not ISL gloss.")}</p>
        </div>
      )}
    </div>
  );
}
