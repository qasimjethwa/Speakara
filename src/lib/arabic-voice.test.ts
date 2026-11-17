import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const runtime = readFileSync("src/lib/arabic-voice.ts", "utf8");
const build = readFileSync("scripts/voice-assets.mjs", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const hashes = (s: string) => [...s.matchAll(/[0-9a-f]{64}/g)].map((m) => m[0]).sort();

describe("Arabic voice pinning", () => {
  it("build script and runtime pin the same model revision and file hashes", () => {
    const rev = (s: string) => s.match(/REVISION = "([0-9a-f]{40})"/)![1];
    expect(rev(runtime)).toBe(rev(build));
    expect(hashes(runtime)).toEqual(hashes(build));
    expect(hashes(runtime)).toHaveLength(3);
  });
  it("onnxruntime-web is pinned to an exact version that matches the runtime path", () => {
    expect(pkg.dependencies["onnxruntime-web"]).toBe("1.30.0");
    expect(runtime).toContain('const ORT = "1.30.0"');
  });
  it("the vendored engine records its source commit and the eSpeak NG GPL licence", () => {
    const prov = readFileSync("src/vendor/nabra-tts/PROVENANCE.md", "utf8");
    expect(prov).toContain("16b5281ce61993df3526740990cf845a3f3036f4");
    expect(readFileSync("src/vendor/nabra-tts/COPYING.espeak-ng.GPL-3.0", "utf8")).toContain("GNU GENERAL PUBLIC LICENSE");
  });
  it("no third-party CDN or model host is contacted at runtime", () => {
    expect(runtime).not.toMatch(/https?:\/\//);
  });
});
