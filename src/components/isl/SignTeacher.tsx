"use client";
/**
 * The ISL signing teacher: a realistic rigged 3D human (Microsoft Rocketbox, MIT) rendered with React Three Fiber.
 * It plays SignClips (keyframed bone rotations + facial blendshapes) with play / pause / replay / slow / loop, full-body
 * and hands close-up views, and synchronised captions shown BELOW the signing area so they never cover hands or face.
 *
 * When no reviewed clip exists for a sign, the teacher stays in a neutral idle stance and the UI says so plainly —
 * it never improvises a sign.
 */
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Captions, Eye, Hand, Pause, PersonStanding, Play, Repeat, RotateCcw, ScanFace, Snail, User } from "lucide-react";
import { cueAt, poseAt, RELAXED, type CaptionCue, type Pose, type SignClip } from "@/lib/isl/rig";
import { useT } from "@/lib/i18n";

export const TEACHER_URL = "/isl/teacher.glb";
type View = "signing" | "full" | "hands" | "face";
const VIEWS: Record<View, { pos: [number, number, number]; look: [number, number, number]; fov: number }> = {
  signing: { pos: [0, 1.3, 1.95], look: [0, 1.22, 0], fov: 32 },
  full: { pos: [0, 0.95, 3.6], look: [0, 0.9, 0], fov: 30 },
  hands: { pos: [0, 1.12, 1.4], look: [0, 1.06, 0.12], fov: 38 },
  face: { pos: [0, 1.6, 0.85], look: [0, 1.6, 0], fov: 30 },
};

interface PlayerState { playing: boolean; t: number; speed: number; loop: boolean }

type Rig = { bones: Record<string, THREE.Bone>; rest: Record<string, THREE.Quaternion>; meshes: THREE.Mesh[] };
const AXIS = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };

/** Advances playback; returns true when a non-looping clip has just finished. */
function stepPlayer(s: PlayerState, clip: SignClip | null, dt: number): boolean {
  if (!clip || !s.playing) return false;
  s.t += Math.min(dt, 0.25) * s.speed;   // real time even at low frame rates
  if (s.t < clip.duration) return false;
  if (s.loop) { s.t = 0; return false; }
  s.t = clip.duration; s.playing = false; return true;
}

/** Puts the rig in `pose`, adds idle life (breathing, blinks — not signing) and sets facial blendshapes. */
function applyPose(rig: Rig, pose: Pose, life: { next: number; phase: number }, now: number) {
  for (const [name, b] of Object.entries(rig.bones)) b.quaternion.copy(rig.rest[name]);
  for (const [name, [x, y, z]] of Object.entries(pose.bones)) {
    const b = rig.bones[name]; if (!b) continue;
    if (x) b.rotateOnAxis(AXIS.x, x); if (y) b.rotateOnAxis(AXIS.y, y); if (z) b.rotateOnAxis(AXIS.z, z);
  }
  const chest = rig.bones.Bip01_Spine2; if (chest) chest.rotateOnAxis(AXIS.z, Math.sin(now * 1.6) * 0.008);
  if (now > life.next) { life.phase = now; life.next = now + 2.5 + Math.random() * 3; }
  const blinkW = Math.max(0, 1 - Math.abs(now - life.phase - 0.08) / 0.08);
  for (const m of rig.meshes) {
    const dict = m.morphTargetDictionary; const inf = m.morphTargetInfluences; if (!dict || !inf) continue;
    inf.fill(0);
    for (const [k, w] of Object.entries(pose.face ?? {})) if (dict[k] !== undefined) inf[dict[k]] = w;
    for (const k of ["AK_09_EyeBlinkLeft", "AK_10_EyeBlinkRight"]) if (dict[k] !== undefined) inf[dict[k]] = Math.max(inf[dict[k]], blinkW);
  }
}

/** Builds the rig index once per loaded model and prepares materials (hair cards need alpha testing). */
function buildRig(scene: THREE.Object3D): Rig {
  const bones: Record<string, THREE.Bone> = {}; const rest: Record<string, THREE.Quaternion> = {}; const meshes: THREE.Mesh[] = [];
  scene.traverse((o) => {
    if ((o as THREE.Bone).isBone) { bones[o.name] = o as THREE.Bone; rest[o.name] = o.quaternion.clone(); }
    const m = o as THREE.Mesh; if (m.isMesh) { meshes.push(m); m.frustumCulled = false; m.castShadow = true;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mat) => { const st = mat as THREE.MeshStandardMaterial; if (st.map) st.map.anisotropy = 8; if (st.name?.includes("opacity")) { st.transparent = true; st.alphaTest = 0.4; st.depthWrite = false; } });
    }
  });
  return { bones, rest, meshes };
}

function moveCamera(cam: THREE.PerspectiveCamera, target: THREE.Vector3, view: View) {
  const v = VIEWS[view];
  cam.position.lerp(new THREE.Vector3(...v.pos), 0.12); target.lerp(new THREE.Vector3(...v.look), 0.12);
  cam.fov += (v.fov - cam.fov) * 0.12; cam.updateProjectionMatrix(); cam.lookAt(target);
}

function Teacher({ clip, state, onTime }: { clip: SignClip | null; state: React.MutableRefObject<PlayerState>; onTime: (t: number, ended: boolean) => void }) {
  const gltf = useLoader(GLTFLoader, TEACHER_URL);
  const rig = useMemo(() => buildRig(gltf.scene), [gltf]);
  const anim = useRef({ next: 2, phase: 0, lastEmit: 0 });
  useFrame((_, dt) => {
    const ended = stepPlayer(state.current, clip, dt);
    const now = performance.now() / 1000;
    applyPose(rig, clip ? poseAt(clip, state.current.t) : RELAXED, anim.current, now);
    if (ended || now - anim.current.lastEmit > 0.08) { anim.current.lastEmit = now; onTime(state.current.t, ended); }
  });
  return <primitive object={gltf.scene} />;
}

function CameraRig({ view }: { view: View }) {
  const target = useRef(new THREE.Vector3(...VIEWS.signing.look));
  useFrame((st) => moveCamera(st.camera as THREE.PerspectiveCamera, target.current, view));
  return null;
}

function Studio() {
  return (<>
    <hemisphereLight args={["#ffffff", "#9aa7b8", 1.15]} />
    <directionalLight position={[1.5, 2.6, 2.8]} intensity={2.4} castShadow />
    <directionalLight position={[-2, 1.8, 1.5]} intensity={0.9} color="#dfe9ff" />
    <directionalLight position={[0, 2.2, -2.5]} intensity={1.2} color="#fff3e0" />
    <mesh rotation-x={-Math.PI / 2} receiveShadow><circleGeometry args={[1.4, 48]} /><meshStandardMaterial color="#dfe6ee" roughness={0.9} /></mesh>
  </>);
}

export interface CaptionPrefs { size: "s" | "m" | "l"; contrast: boolean; background: boolean; meaning: boolean; hindi: boolean }
const DEFAULT_PREFS: CaptionPrefs = { size: "m", contrast: false, background: true, meaning: true, hindi: false };
function usePrefs(): [CaptionPrefs, (p: CaptionPrefs) => void] {
  const [p, setP] = useState<CaptionPrefs>(DEFAULT_PREFS);
  useEffect(() => { try { const s = localStorage.getItem("speakara:isl:captions"); if (s) setP({ ...DEFAULT_PREFS, ...JSON.parse(s) }); } catch { /* storage blocked */ } }, []);
  return [p, (n) => { setP(n); try { localStorage.setItem("speakara:isl:captions", JSON.stringify(n)); } catch { /* ignore */ } }];
}

/**
 * Player with captions. `fallback` is the caption shown when the clip has no timed cues (or there is no clip):
 * the written target-language text, its meaning and optional Hindi.
 */
export function SignTeacher({ clip, fallback, targetLang, className = "", hideCaptions = false }: { clip: SignClip | null; fallback: CaptionCue; targetLang: "en" | "es"; className?: string; hideCaptions?: boolean }) {
  const { t } = useT();
  const state = useRef<PlayerState>({ playing: !!clip, t: 0, speed: 1, loop: false });
  const [ui, setUi] = useState({ t: 0, playing: !!clip, speed: 1, loop: false });
  const [view, setView] = useState<View>("signing");
  const [prefs, setPrefs] = usePrefs();
  const [panel, setPanel] = useState<"none" | "captions" | "transcript">("none");
  const [webgl, setWebgl] = useState(true);
  useEffect(() => { state.current = { playing: !!clip, t: 0, speed: state.current.speed, loop: state.current.loop }; setUi((u) => ({ ...u, t: 0, playing: !!clip })); }, [clip]);
  useEffect(() => { try { const c = document.createElement("canvas"); setWebgl(!!(c.getContext("webgl2") || c.getContext("webgl"))); } catch { setWebgl(false); } }, []);

  const set = (patch: Partial<PlayerState>) => { Object.assign(state.current, patch); setUi((u) => ({ ...u, ...patch })); };
  const cue = cueAt(clip, clip ? Math.min(ui.t, clip.duration - 1e-3) : 0) ?? (clip?.captions?.length ? null : fallback);
  const size = { s: "text-lg", m: "text-2xl", l: "text-4xl" }[prefs.size];
  const capCls = prefs.contrast ? "bg-black text-yellow-300" : prefs.background ? "bg-ink/90 text-white" : "text-ink";
  const btn = "key inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-xl border-2 border-b-4 border-line-dark bg-paper px-3 font-extrabold";

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-3xl border-2 border-line bg-gradient-to-b from-[#f4f7fb] to-[#dfe7f0]" style={{ aspectRatio: "4 / 5", maxHeight: "72dvh", marginInline: "auto" }}>
        {webgl ? (
          <Canvas shadows dpr={[1, 2]} camera={{ position: VIEWS.signing.pos, fov: VIEWS.signing.fov }} gl={{ antialias: true, preserveDrawingBuffer: true }}
            onCreated={({ gl }) => { gl.outputColorSpace = THREE.SRGBColorSpace; gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}
            aria-label={t("3D ISL teacher")} role="img">
            <Suspense fallback={null}><Teacher clip={clip} state={state} onTime={(tt, ended) => setUi((u) => ({ ...u, t: tt, playing: ended ? false : u.playing }))} /></Suspense>
            <Studio /><CameraRig view={view} />
          </Canvas>
        ) : <p className="flex h-full items-center justify-center p-6 text-center text-sub">{t("Your browser can’t show 3D graphics, so the signing teacher can’t be displayed. Captions and exercises still work.")}</p>}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {(["signing", "full", "hands", "face"] as View[]).map((v) => {
            const Icon = v === "signing" ? PersonStanding : v === "full" ? User : v === "hands" ? Hand : ScanFace;
            return <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} aria-label={v === "signing" ? t("Signing view (waist up)") : v === "full" ? t("Full body") : v === "hands" ? t("Hands close-up") : t("Face close-up")}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 ${view === v ? "border-sky bg-sky-soft text-sky-dark" : "border-line bg-paper/90"}`}><Icon size={20} aria-hidden="true" /></button>;
          })}
        </div>
        {clip?.notTeaching && <span className="absolute right-3 top-3 rounded-full bg-sun px-3 py-1 text-xs font-extrabold text-ink">{t("Motion test — not an ISL sign")}</span>}
      </div>

      {/* captions: always below the signing area */}
      <div className={`mt-3 min-h-20 rounded-2xl p-3 text-center ${capCls}`} aria-live="polite" lang={targetLang}>
        {hideCaptions ? <p className="text-base opacity-80">{t("Captions are hidden for this question.")}</p> : cue ? <>
          <p className={`${size} font-black leading-tight`}>{cue.text}</p>
          {prefs.meaning && cue.meaning && <p className="mt-1 text-base opacity-90" lang="en">{cue.meaning}</p>}
          {prefs.hindi && cue.hi && <p className="mt-1 text-base opacity-90" lang="hi">{cue.hi}</p>}
        </> : <p className="text-base opacity-70">…</p>}
      </div>

      {!clip && <p className="mt-2 rounded-2xl bg-sun-soft p-3 text-center text-sm font-bold text-sun-dark">{t("This sign’s animation is awaiting recording and review by Deaf ISL educators.")}</p>}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2" role="toolbar" aria-label={t("Signing controls")}>
        <button type="button" className={btn} disabled={!clip} onClick={() => { if (clip && state.current.t >= clip.duration) set({ t: 0 }); set({ playing: !ui.playing }); }} aria-label={ui.playing ? t("Pause") : t("Play")}>{ui.playing ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}</button>
        <button type="button" className={btn} disabled={!clip} onClick={() => set({ t: 0, playing: true })} aria-label={t("Replay")}><RotateCcw size={20} aria-hidden="true" /></button>
        <button type="button" className={`${btn} ${ui.speed < 1 ? "!border-sky bg-sky-soft text-sky-dark" : ""}`} disabled={!clip} onClick={() => set({ speed: ui.speed === 1 ? 0.5 : ui.speed === 0.5 ? 0.25 : 1 })} aria-label={`${t("Speed")} ${ui.speed}×`}><Snail size={20} aria-hidden="true" />{ui.speed}×</button>
        <button type="button" className={`${btn} ${ui.loop ? "!border-sky bg-sky-soft text-sky-dark" : ""}`} disabled={!clip} aria-pressed={ui.loop} onClick={() => set({ loop: !ui.loop })} aria-label={t("Loop")}><Repeat size={20} aria-hidden="true" /></button>
        <button type="button" className={btn} aria-expanded={panel === "captions"} onClick={() => setPanel(panel === "captions" ? "none" : "captions")} aria-label={t("Caption settings")}><Captions size={20} aria-hidden="true" /></button>
        {!hideCaptions && <button type="button" className={btn} aria-expanded={panel === "transcript"} onClick={() => setPanel(panel === "transcript" ? "none" : "transcript")} aria-label={t("Transcript")}><Eye size={20} aria-hidden="true" /></button>}
        {clip && <input type="range" min={0} max={clip.duration} step={0.01} value={ui.t} onChange={(e) => set({ t: +e.target.value, playing: false })} aria-label={t("Position")} className="min-h-11 w-full accent-sky sm:w-40" />}
      </div>

      {panel === "captions" && (
        <fieldset className="mt-3 grid gap-2 rounded-2xl border-2 border-line p-3 text-sm sm:grid-cols-2">
          <legend className="px-1 font-extrabold">{t("Captions")}</legend>
          <div className="flex items-center gap-2">{t("Size")}: {(["s", "m", "l"] as const).map((s) => <button key={s} type="button" aria-pressed={prefs.size === s} onClick={() => setPrefs({ ...prefs, size: s })} className={`min-h-11 min-w-11 rounded-xl border-2 font-extrabold ${prefs.size === s ? "border-sky bg-sky-soft" : "border-line"}`}>{s.toUpperCase()}</button>)}</div>
          {([["contrast", t("High contrast")], ["background", t("Caption background")], ["meaning", t("Show English meaning")], ["hindi", t("Show Hindi")]] as const).map(([k, label]) => (
            <label key={k} className="flex min-h-11 items-center gap-2"><input type="checkbox" className="h-5 w-5" checked={prefs[k]} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })} />{label}</label>
          ))}
        </fieldset>
      )}
      {panel === "transcript" && (
        <div className="mt-3 rounded-2xl border-2 border-line p-3 text-left">
          <h3 className="mb-2 font-extrabold">{t("Transcript")}</h3>
          <ol className="space-y-2">{(clip?.captions?.length ? clip.captions : [fallback]).map((c, i) => (
            <li key={i}><button type="button" disabled={!clip} onClick={() => set({ t: c.start, playing: true })} className="w-full rounded-xl p-2 text-left hover:bg-mist disabled:hover:bg-transparent">
              <span className="font-extrabold" lang={targetLang}>{c.text}</span>{c.meaning && <span className="block text-sm text-sub">{c.meaning}</span>}{c.hi && prefs.hindi && <span className="block text-sm text-sub" lang="hi">{c.hi}</span>}
            </button></li>))}</ol>
          <p className="mt-2 text-xs text-sub">{t("Captions show the written target language. They support the signed explanation; they are not ISL gloss.")}</p>
        </div>
      )}
    </div>
  );
}
