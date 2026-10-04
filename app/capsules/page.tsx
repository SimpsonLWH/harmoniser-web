import type { Metadata } from "next";
import Link from "next/link";

import { getInitialCapsulePage } from "@/lib/seo/data";

import { CapsulesBrowser } from "./CapsulesBrowser";

const APP_REPO = "https://github.com/Akshaz7/capsules-harmonyos";

const moreLinkClass =
  "inline-flex min-h-9 items-center rounded-full bg-surface px-4 text-[13px] font-medium text-text-2 transition-colors hover:bg-surface-2 hover:text-text";

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
    <>
      <CapsulesBrowser
        initialItems={initial?.items ?? []}
        initialNextCursor={initial?.nextCursor ?? null}
      />
      <section
        aria-labelledby="project-links"
        className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6"
      >
        <div className="border-t border-line pt-8">
          <h2 id="project-links" className="text-[13px] font-bold text-text">
            More from the project
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {/* The deck is a standalone static document, so it gets a full page load. */}
            <a href="/pitch" className={moreLinkClass}>
              Slides
            </a>
            <Link href="/publish" className={moreLinkClass}>
              Publish a capsule
            </Link>
            <Link href="/device" className={moreLinkClass}>
              A second device
            </Link>
            <a href={APP_REPO} className={moreLinkClass} rel="noreferrer">
              Source on GitHub
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
