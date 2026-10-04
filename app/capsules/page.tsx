import type { Metadata } from "next";

import { getInitialCapsulePage } from "@/lib/seo/data";

import { CapsulesBrowser } from "./CapsulesBrowser";

/*
 * Server rendered so the first page of capsule links is in the HTML for
 * crawlers; the client browser takes over for search and paging. A database
 * failure falls back to the previous client-only behaviour.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Capsule marketplace",
  description:
    "Browse capsule apps for HarmonyOS: timers, checklists, counters, converters and scoreboards built from a sentence. Every capsule is validated JSON, and browsing needs no account.",
  alternates: { canonical: "/capsules" },
  openGraph: {
    title: "Capsule marketplace · Harmoniser",
    description:
      "Capsule apps for HarmonyOS, stored as validated JSON and installed from the browser. No account needed to browse.",
    type: "website",
    url: "/capsules",
  },
};

export default async function CapsulesPage() {
  const initial = await getInitialCapsulePage();
  return (
    <CapsulesBrowser
      initialItems={initial?.items ?? []}
      initialNextCursor={initial?.nextCursor ?? null}
    />
  );
}
