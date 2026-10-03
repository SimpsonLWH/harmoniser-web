import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { siteUrl } from "@/lib/env";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
      className={`${manrope.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
