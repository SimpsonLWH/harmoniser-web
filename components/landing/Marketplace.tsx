import Link from "next/link";

import { OriginChip } from "@/components/frames/CapsuleFrame";

/*
 * The close-up uses the app's own origin chip drawing, at both theme settings,
 * because the site is the marketplace the chip points at.
 */
export function Marketplace() {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-center">
      <div>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">A capsule you can pass on</h2>
        <p className="mt-4 max-w-[56ch] text-[16px] leading-7 text-text-2">
          Publishing is anonymous. Your owner token is the only delete credential, and the
          marketplace stores just its hash. Every install is a JSON file that goes through the
          app&apos;s own validator and permission sheet before anything runs.
        </p>
        <ul className="mt-6 flex flex-col gap-3 text-[15px] leading-6 text-text-2">
          <li className="flex gap-3">
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
            Capsules up to 1,500 bytes share as a QR code, or as a file.
          </li>
          <li className="flex gap-3">
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
            Install counts are real numbers from the live API, not a marketing figure.
          </li>
          <li className="flex gap-3">
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
            The chip on every capsule says where it came from: your phone, a template, or someone
            else.
          </li>
        </ul>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/capsules"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand px-6 text-[15px] font-semibold text-white transition-colors hover:bg-brand-deep"
          >
            Browse the marketplace
          </Link>
          <Link
            href="/publish"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-surface-2 px-6 text-[15px] font-semibold text-text transition-colors hover:bg-brand-soft"
          >
            Publish a capsule
          </Link>
        </div>
      </div>

      <div className="rounded-card bg-surface p-6 shadow-frame sm:p-8">
        <p className="text-[15px] font-bold text-text">Origin chip</p>
        <div className="mt-5 flex flex-col items-start gap-5 rounded-tile bg-surface-2 p-6">
          <OriginChip kind="marketplace" scale={1.4} />
          <OriginChip kind="phone" scale={1.4} />
        </div>
        <p className="mt-5 text-[14px] leading-6 text-text-2">
          The same chip is drawn on the capsule itself, so the phone and the website agree on where
          a capsule came from.
        </p>
      </div>
    </div>
  );
}
