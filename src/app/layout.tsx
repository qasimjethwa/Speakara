import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/state/store";
import { VoiceNotice } from "@/components/VoiceNotice";
import { ServiceWorker } from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: { default: "Speakara — learn languages free, forever", template: "%s · Speakara" },
  description: "Speakara is a free language-learning platform: bite-sized lessons, stories, speaking practice and an AI tutor. No paywalls, no lives, no subscriptions.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#12b76a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><StoreProvider>{children}<VoiceNotice /><ServiceWorker /></StoreProvider></body>
    </html>
  );
}
