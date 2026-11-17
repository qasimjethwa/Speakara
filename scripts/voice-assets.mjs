// Prepares the self-hosted assets for the on-device Arabic voice, served from Speakara's own origin:
//  - the pinned onnxruntime-web 1.30.0 WebAssembly runtime (copied from node_modules)
//  - the pinned Nabra-7M-Distill ONNX model and voice (downloaded once at build time, verified by SHA-256)
// Runs before dev and build. Nothing here is committed to git (public/vendor is ignored).
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const dist = dirname(require.resolve("onnxruntime-web"));
const ortVersion = JSON.parse(readFileSync(join(dist, "..", "package.json"), "utf8")).version;
if (ortVersion !== "1.30.0") throw new Error(`onnxruntime-web ${ortVersion} installed; the Arabic voice is pinned to 1.30.0`);
const ortOut = join("public", "vendor", "ort", ortVersion); mkdirSync(ortOut, { recursive: true });
for (const f of ["ort-wasm-simd-threaded.jsep.mjs", "ort-wasm-simd-threaded.jsep.wasm"]) copyFileSync(join(dist, f), join(ortOut, f));

export const REVISION = "bbac0f1e6b001bfae89871be366a4b000180deb2";
const MODEL = {
  "onnx/model_fp16.onnx": "cafb38ee0d39629c1e228fd7f120bb8dbec896342880f3ac8318cfc10e3f19ff",
  "onnx/model.onnx": "08c1df048f2decbff3f86dc8e625e10ff3c8d5f66dfc97881c6974272f41ca5e",
  "voices/af_msa.bin": "129d447a7c9bdce1d5b6cb5ecb789bbfd9f427b7775131a97dfa5638583b3b92",
};
const out = join("public", "vendor", "nabra", REVISION.slice(0, 7));
const sha = (b) => createHash("sha256").update(b).digest("hex");
for (const [file, want] of Object.entries(MODEL)) {
  const dest = join(out, file);
  if (existsSync(dest) && sha(readFileSync(dest)) === want) continue;
  const url = `https://huggingface.co/oddadmix/Nabra-7M-Distill-ONNX/resolve/${REVISION}/${file}`;
  const res = await fetch(url); if (!res.ok) throw new Error(`voice asset ${file}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (sha(buf) !== want) throw new Error(`voice asset ${file}: checksum mismatch`);
  mkdirSync(dirname(dest), { recursive: true }); writeFileSync(dest, buf);
}
console.log(`voice assets ready: onnxruntime-web ${ortVersion}, Nabra-7M-Distill-ONNX@${REVISION.slice(0, 7)}`);
