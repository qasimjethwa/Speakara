"use client";
import { useEffect } from "react";
/** Registers the offline service worker in production builds only (development keeps normal reload behaviour). */
export function ServiceWorker() {
  useEffect(() => { if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => {}); }, []);
  return null;
}
