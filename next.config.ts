import type { NextConfig } from "next";
const config: NextConfig = {
  reactStrictMode: true,
  // nabra-tts's Node-only code path (`worker: false`) imports Node's "module"; Speakara always uses its Web Worker.
  turbopack: { resolveAlias: { module: { browser: "./src/vendor/node-module-stub.js" } } },
};
export default config;
