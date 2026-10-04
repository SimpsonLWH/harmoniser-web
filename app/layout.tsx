import type { Metadata, Viewport } from "next";
import { Geist_Mono, Manrope } from "next/font/google";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { siteUrl } from "@/lib/env";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Harmoniser: tiny apps you don't need to download",
    template: "%s · Harmoniser",
  },
  description:
    "Describe what you need and Harmoniser builds a small app that runs on HarmonyOS. Capsules are plain JSON, checked against a strict schema, and they only use the permissions you allow.",
  applicationName: "Harmoniser",
  openGraph: {
    title: "Harmoniser: tiny apps you don't need to download",
    description:
      "Small single-purpose apps for HarmonyOS, generated from a sentence, validated against a strict schema and gated by your permissions.",
    type: "website",
    images: [{ url: "/icon-1024.png", width: 1024, height: 1024, alt: "The Harmoniser app icon" }],
  },
  twitter: {
    card: "summary",
    title: "Harmoniser: tiny apps you don't need to download",
    description:
      "Small single-purpose apps for HarmonyOS, generated from a sentence, validated against a strict schema and gated by your permissions.",
    images: ["/icon-1024.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#dce5ff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
