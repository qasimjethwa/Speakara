"use client";
/**
 * Interim teacher: real Deaf ISL signers (INCLUDE dataset, CC BY 4.0) demonstrate each sign on video.
 * Authentic signing, no invented movements. Replaced by an AI avatar through the TeacherAdapter interface.
 */
import { useEffect, useRef } from "react";
import type { TeacherAdapter, TeacherProps } from "./types";

function ReferenceSignerView({ sign, demoKey, demonstrating, slow, onDemoEnd }: TeacherProps) {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = v.current; if (!el || !sign) return;
    el.playbackRate = slow ? 0.6 : 1;
    if (demonstrating) { el.currentTime = 0; void el.play().catch(() => onDemoEnd()); } else el.pause();
  // demoKey restarts the demonstration
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sign, demoKey, demonstrating, slow]);
  if (!sign) return null;
  return (
    <video ref={v} key={sign} src={`/isl-classroom/signs/${sign}.mp4`} poster={`/isl-classroom/signs/${sign}.jpg`} muted playsInline preload="auto"
      onEnded={() => demonstrating && onDemoEnd()} className="h-full w-full object-contain" aria-label="ISL sign demonstration" />
  );
}

export const referenceSigner: TeacherAdapter = {
  id: "reference-signer",
  choices: [],   // the avatar teachers (female / male) plug in here later
  credit: "Signs demonstrated by Deaf ISL signers · INCLUDE dataset, AI4Bharat (CC BY 4.0)",
  Component: ReferenceSignerView,
};
