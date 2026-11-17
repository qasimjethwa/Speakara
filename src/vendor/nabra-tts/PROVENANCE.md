# nabra-tts — vendored build (candidate Arabic voice, not yet approved for production quality)

`nabra-tts` is not published on npm, so its built ESM output is vendored here at an exact commit.

| Item | Pinned value |
|---|---|
| Source | https://github.com/Oddadmix/nabra-tts |
| Commit | `16b5281ce61993df3526740990cf845a3f3036f4` (2026-10-02), package version 0.1.0 |
| Build | `npm ci && npm run build` (tsup), files copied unmodified from `dist/` (ESM only; React hook and CJS omitted) |
| Runtime dependency | `onnxruntime-web` **1.30.0** (exact, in Speakara's package.json). Its WASM files are self-hosted from `/vendor/ort/1.30.0/`, copied at build time by `scripts/copy-ort.mjs` |
| Model | `oddadmix/Nabra-7M-Distill-ONNX` at revision `bbac0f1e6b001bfae89871be366a4b000180deb2`, downloaded on demand from huggingface.co and verified by SHA-256 (see `src/lib/arabic-voice.ts`) |

## Licences

- nabra-tts code: Apache-2.0 (`LICENSE`).
- Nabra-7M-Distill model weights: Apache-2.0 (model card), not bundled; fetched at runtime.
- ONNX Runtime Web: MIT.
- **eSpeak NG 1.52.0 (compiled to WebAssembly inside `worker-*.js` and `espeak-ng-ar-*.js`): GPL-3.0-or-later**
  (`COPYING.espeak-ng.GPL-3.0`). Corresponding source: upstream eSpeak NG at tag 1.52.0
  (https://github.com/espeak-ng/espeak-ng/tree/1.52.0) built with `source/build.sh` and `source/wrapper.c`
  from the nabra-tts commit above. Phonemizer logic ported from bootphon/phonemizer (GPL-3.0).

The GPL-3.0 component is shipped to browsers as a separate, lazily loaded worker that runs only after the learner
chooses "Download Arabic voice". Whether this distribution meets Speakara's licensing policy must be confirmed by
the project owner (see docs/quality/ARABIC-VOICE.md).
