# On-device Arabic voice — evaluation and release notes

**Status: candidate.** Nabra-7M-Distill is integrated behind an opt-in "Download Arabic voice" setting. Its
pronunciation has **not** been approved by an Arabic speaker. Everything below that says "verified" was run in this
repository's test environment; everything else is marked NOT VERIFIED.

## What was built

| Requirement | Implementation |
|---|---|
| In-browser synthesis, no server or paid API | `nabra-tts` (vendored, `src/vendor/nabra-tts`) runs G2P (eSpeak NG WASM) and the ONNX model in a Web Worker. No speech is generated on a server; `/api/tts` is not used for Arabic. |
| WebGPU with WASM fallback | **Default: WebAssembly** (since `e511c32`). A learner reported crackling on a real GPU (WebGPU, FP16), a path that could not be verified here; after switching synthesis to WebAssembly they confirmed the crackle was gone. WebGPU remains behind the opt-in `localStorage["speakara:arabic-voice:webgpu"]="1"`, and if it fails it restarts on WebAssembly and remembers that. Earlier behaviour: WebGPU when a **hardware** adapter exists; WebAssembly otherwise. Software adapters (SwiftShader / `isFallbackAdapter`) are skipped: measured 27.6 s on SwiftShader vs 0.55 s on WASM for the same 2.7 s sentence. |
| FP16 where supported | FP16 model (16 MB) when the GPU reports `shader-f16`; FP32 (30 MB) otherwise. |
| Lazy loading | The engine is a separate chunk imported only by `downloadVoice()` or the first Arabic playback after download. Nothing is fetched until the learner opts in. |
| Settings | "Arabic voice" card: Download, progress bar (`role=progressbar`), Cancel, error + **Retry download**, starting state, Test, Stop, Remove, low-memory warning, licence link. |
| Offline | Model, voice and ONNX Runtime are SHA-256-verified, stored in Cache Storage and `navigator.storage.persist()` is requested. A production-only service worker (`public/sw.js`) serves the app shell network-first and versioned assets cache-first, so the app reloads offline. |
| Routing | `say()` in `src/lib/audio.ts` is the single entry point used by lessons, vocabulary, guidebook, stories and the tutor. For `ar-*` with the voice downloaded it uses Nabra; every other language is unchanged. If the engine errors, Arabic falls back to a system voice when one exists. |
| Replay, stop, slow | Replays come from an in-memory cache (40 clips): measured 0 ms. A new tap or `stopSpeaking()` cancels generation and playback. Slow uses the model's own speed 0.75 (1.37× longer, no pitch shift). 25 s generation watchdog. |
| Failures and low memory | Download errors, checksum mismatches, quota shortage, private mode (no Cache Storage), engine start failures and out-of-memory produce a message and Retry. `navigator.deviceMemory ≤ 2` shows a warning before download. A browser-evicted cache is detected and the learner is asked to download again. |
| UI never freezes | Synthesis runs in a worker. Longest main-thread frame gap while generating: 19–20 ms (Chromium, Firefox), 78–121 ms (WebKit). |

## Pinned versions

| Component | Version | Licence |
|---|---|---|
| nabra-tts | GitHub commit `16b5281ce61993df3526740990cf845a3f3036f4` (v0.1.0). **Not published on npm**, so the built ESM is vendored unmodified | Apache-2.0 |
| Nabra-7M-Distill-ONNX | revision `bbac0f1e6b001bfae89871be366a4b000180deb2`; SHA-256 fp16 `cafb38ee…`, fp32 `08c1df04…`, voice `129d447a…` | Apache-2.0 |
| onnxruntime-web | `1.30.0` exact (package.json); `ort-wasm-simd-threaded.jsep.{mjs,wasm}` self-hosted | MIT |
| eSpeak NG | 1.52.0, compiled to WASM inside the nabra-tts worker | **GPL-3.0-or-later** |

All assets are served from Speakara's own origin: `scripts/voice-assets.mjs` (runs before `dev` and `build`) copies
the ONNX Runtime files and downloads the pinned model from huggingface.co once at build time, verifying every hash.
The browser never contacts a CDN or Hugging Face. A unit test keeps the build script and runtime hashes identical.

## Licence review

- **Apache-2.0 / MIT** components: notices are kept in `src/vendor/nabra-tts/` and on `/licenses`.
- **eSpeak NG is GPL-3.0-or-later** and is shipped to browsers (as WebAssembly inside the voice worker) when a
  learner downloads the voice. What was done: the licence text is in `src/vendor/nabra-tts/COPYING.espeak-ng.GPL-3.0`;
  `/licenses` names the component, gives the GPL notice and links the exact corresponding source (eSpeak NG tag
  1.52.0 plus the nabra-tts build script and wrapper at the pinned commit) and offers it on request. The GPL
  component runs as a separate worker and communicates with Speakara's code only by messages.
- **Decision needed from the project owner (not a legal opinion):** Speakara's repository has no licence file. Shipping a
  GPL-3.0 program inside the product obliges Speakara to keep providing the corresponding source and the GPL terms for
  that component. Whether that is acceptable, and whether the worker counts as a separate program, should be confirmed
  before relying on this in production. The alternative is a G2P without eSpeak, which nabra-tts does not offer today.
- The phonemizer logic ported from bootphon/phonemizer is also GPL-3.0 (inside the same worker).

## Test results (this environment)

Real engine, no stubs for the voice. `node e2e/arabic-voice.mjs` per browser. Headless Linux browsers; audio went to a
virtual sink.

| Check | Chromium 153 | Firefox 155 | WebKit 26.6 |
|---|---|---|---|
| Failed download → error + Retry → success | PASS | PASS | PASS |
| Progress reported during download | PASS | PASS | PASS |
| Backend used | WASM FP32 (only a software GPU here) | WASM FP32 | WASM FP32 |
| 2.7 s sentence generated in | 0.55–0.62 s | 0.50 s | 1.2–2.1 s |
| Longest main-thread gap while generating | 19 ms | 19 ms | 78–121 ms |
| 8 course sentences synthesised | PASS | PASS | PASS |
| Slow speed (1.37× longer) | PASS | PASS | PASS |
| Speaker button uses Nabra; replay instant | PASS (1.5 s first tap, 0 ms replay) | PASS (1.6 s / 0 ms) | PASS (4.1 s / 0 ms) |
| New tap cancels previous generation | PASS | PASS | PASS |
| Offline: fresh reload served by service worker | PASS (emulated offline) | PASS (emulated offline) | PASS (server stopped = real network loss)¹ |
| Offline: new sentence generated and played | PASS | PASS | PASS |
| Low-memory warning | PASS | PASS | PASS |

¹ Playwright's emulated offline mode makes WebKit fail every reload, even of a plain cached page (reproduced with the
voice not involved). With the network genuinely gone (server stopped) WebKit reloads from the service worker.

**WebGPU:** NOT VERIFIED on real hardware. This container only has SwiftShader, which the app now deliberately
skips. **FP16:** NOT VERIFIED (requires a GPU with `shader-f16`). **Real Safari (macOS/iOS), Android Chrome and
real mobile devices:** NOT VERIFIED — no devices were available. iOS Safari memory limits are a known risk.

### Pronunciation (automatic proxy only)

Round trip: Nabra audio → Whisper-small (offline, `onnx-community/whisper-small`, q8) → character error rate against
the course text, ignoring diacritics. Whisper-small is itself imperfect on Arabic, so this measures intelligibility,
not correctness.

| Voice and input | CER |
|---|---|
| Nabra, course text as written (8 sentences, 3 runs/engines) | 10.0–16.4 % |
| Nabra, the same sentences **with full tashkeel** (5 sentences) | 8.8 % |
| eSpeak NG system voice (`espeak-ng -v ar`), same 8 sentences | 49.1 % |

Main finding: units 2–10 write sentences without short vowels, and eSpeak then guesses them. Phonemes show
examples: ذهبت → `ðhbt` (no vowels; should be *dhahabtu*), أريد → `ʔriːd` (missing initial *u*), فضلك → `fadlka`.
Adding a vocalised speech form for each course sentence is the largest available quality improvement, and needs an
Arabic speaker to write or check it.

## Native-speaker validation (required before calling this approved)

Listening packet: `docs/content/review/ar-voice/` (8 course sentences as written, 5 vocalised versions, manifest with
the text and phonemes). For each file, the reviewer should rate: correct sounds (especially ض ص ط ظ ق ع ح), short
vowels and case endings, stress, naturalness for a beginner, and whether a learner could imitate it. Until that is
done, the Settings card states that the voice has not been reviewed by an Arabic speaker.

## Field report (after release)

- Real device, real GPU: the first build failed to speak (WebGPU path). Fixed in `07b2a09` (automatic WebAssembly
  fallback, real error messages).
- Same device: playback crackled. Fixed in `e511c32` (WebAssembly synthesis by default, `latencyHint: "playback"`,
  invalid-sample guard, peak limit, 10 ms edge fades). The learner confirmed it works.
- Open: whether WebGPU/FP16 output is usable on real GPUs needs a listening test before it is re-enabled by default.
