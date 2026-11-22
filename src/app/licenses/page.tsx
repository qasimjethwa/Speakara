import type { Metadata } from "next";
import { MarketingShell } from "@/components/Marketing";
export const metadata: Metadata = { title: "Open-source licences" };

const ROWS: { name: string; use: string; license: string; source: string }[] = [
  { name: "nabra-tts 0.1.0 (commit 16b5281)", use: "On-device Arabic voice engine (downloaded only if you choose the Arabic voice)", license: "Apache-2.0", source: "https://github.com/Oddadmix/nabra-tts/tree/16b5281ce61993df3526740990cf845a3f3036f4" },
  { name: "Nabra-7M-Distill ONNX (revision bbac0f1)", use: "Arabic voice model", license: "Apache-2.0", source: "https://huggingface.co/oddadmix/Nabra-7M-Distill-ONNX/tree/bbac0f1e6b001bfae89871be366a4b000180deb2" },
  { name: "eSpeak NG 1.52.0 (WebAssembly build inside the Arabic voice)", use: "Turns Arabic text into phonemes for the voice model", license: "GPL-3.0-or-later", source: "https://github.com/espeak-ng/espeak-ng/tree/1.52.0 — built with espeak/build.sh and espeak/wrapper.c from the nabra-tts commit above" },
  { name: "Microsoft Rocketbox avatars “Female_Adult_13” and “Business_Male_03”", use: "The two 3D ISL teachers (converted to glTF with Blender; textures recoloured and resized)", license: "MIT", source: "https://github.com/microsoft/Microsoft-Rocketbox" },
  { name: "three.js 0.187.0 and React Three Fiber 9.8.2", use: "Renders the 3D signing teacher in the browser", license: "MIT", source: "https://github.com/mrdoob/three.js · https://github.com/pmndrs/react-three-fiber" },
  { name: "MediaPipe Tasks Vision 1.2.3 and Hand Landmarker model", use: "Hand tracking in ISL camera practice (runs on your device; no recognition or scoring)", license: "Apache-2.0", source: "https://github.com/google-ai-edge/mediapipe" },
  { name: "ISL Dictionary — Indian Sign Language Research and Training Centre (ISLRTC), DEPwD, Ministry of Social Justice and Empowerment, Govt. of India", use: "Linked as the official reference for signs (not copied or re-hosted)", license: "Acknowledged; used per ISLRTC FAQ (no resale or profiteering)", source: "https://islrtc.nic.in/ · https://divyangjan.depwd.gov.in/islrtc/" },
  { name: "ONNX Runtime Web 1.30.0", use: "Runs the voice model (WebGPU or WebAssembly)", license: "MIT", source: "https://github.com/microsoft/onnxruntime/tree/v1.30.0" },
];

export default function Licenses() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-[760px] px-5 py-14 leading-relaxed">
        <h1 className="text-3xl">Open-source licences</h1>
        <p className="mt-4">The optional Arabic voice is built from the open-source components below. They run in your browser and are only downloaded when you choose “Download Arabic voice” in Settings.</p>
        <div className="mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b-2 border-line"><th className="py-2 pr-3">Component</th><th className="py-2 pr-3">Used for</th><th className="py-2 pr-3">Licence</th><th className="py-2">Source</th></tr></thead>
          <tbody>{ROWS.map((r) => <tr key={r.name} className="border-b border-line align-top"><td className="py-2 pr-3 font-bold">{r.name}</td><td className="py-2 pr-3">{r.use}</td><td className="py-2 pr-3">{r.license}</td><td className="break-all py-2">{r.source}</td></tr>)}</tbody></table></div>
        <h2 className="mt-8 text-xl">GNU GPL v3 notice for eSpeak NG</h2>
        <p className="mt-2">eSpeak NG is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. It is distributed WITHOUT ANY WARRANTY. The complete corresponding source code is available at the links above; Speakara will also provide it on request. Full licence text: https://www.gnu.org/licenses/gpl-3.0.html</p>
      </article>
    </MarketingShell>
  );
}
