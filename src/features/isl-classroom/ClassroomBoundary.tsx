"use client";
/** ISL-only error boundary: a classroom failure shows a calm message and never affects the rest of Speakara. */
import { Component, type ReactNode } from "react";

export class ClassroomBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e: unknown) { console.error("[isl-classroom]", e instanceof Error ? e.message : "error"); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
