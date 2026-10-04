import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import localFont from "next/font/local";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { siteUrl } from "@/lib/env";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Satoshi by Indian Type Foundry, from Fontshare (free for commercial use).
const satoshi = localFont({
  variable: "--font-satoshi",
  src: [
    { path: "./fonts/Satoshi-Medium.woff2", weight: "500" },
    { path: "./fonts/Satoshi-Bold.woff2", weight: "700" },
  ],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Harmoniser — tiny apps, made by asking",
    template: "%s · Harmoniser",
  },
  description:
    "Describe a tiny app in one sentence and get it running natively on HarmonyOS. Each capsule is plain JSON, checked against a strict schema, and can only use the permissions you allow.",
  applicationName: "Harmoniser",
  openGraph: {
    title: "Harmoniser — tiny apps, made by asking",
    description:
      "Small single-purpose apps for HarmonyOS, generated from a sentence, validated against a strict schema and gated by your permissions.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${satoshi.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
