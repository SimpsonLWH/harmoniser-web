import Link from "next/link";

import { LiveTasksFrame } from "@/components/frames/LiveTasksFrame";
import { Bento } from "@/components/landing/Bento";
import { FoldDark } from "@/components/landing/FoldDark";
import { Marketplace } from "@/components/landing/Marketplace";
import { Rail } from "@/components/landing/Rail";
import { Status } from "@/components/landing/Status";
import { Steps } from "@/components/landing/Steps";
import { WordSpring } from "@/components/landing/WordSpring";

const APP_REPO = "https://github.com/Akshaz7/capsules-harmonyos";

function PrimaryLink({ href, children, external }: { href: string; children: string; external?: boolean }) {
  const className =
    "inline-flex min-h-12 items-center justify-center rounded-full bg-brand px-6 text-[15px] font-semibold text-white transition-colors hover:bg-brand-deep";
  return external ? (
    <a href={href} className={className} rel="noreferrer">
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function Home() {
  return (
    <div className="page-wash">
      <div className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
        <section className="grid gap-10 pb-14 pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,360px)] lg:items-center lg:gap-16 lg:pb-16 lg:pt-14">
          <div>
            <p className="inline-flex items-center rounded-full bg-surface px-3.5 py-1.5 text-[13px] font-semibold text-text-2 shadow-raise">
              HackYeah 2026 &middot; HarmonyOS
            </p>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              <WordSpring text="Tiny apps, made by asking." />
            </h1>
            <p className="mt-6 max-w-[42ch] text-[17px] leading-8 text-text-2">
              Describe what you need. Harmoniser builds a small app that runs on HarmonyOS and only
              uses the permissions you allow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryLink href="/capsules">Browse the marketplace</PrimaryLink>
              <PrimaryLink href={APP_REPO} external>
                Get the build
              </PrimaryLink>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[360px]">
            <LiveTasksFrame />
          </div>
        </section>

        <section aria-labelledby="how" className="border-t border-line pt-16">
          <h2 id="how" className="text-3xl font-bold tracking-tight sm:text-4xl">
            One sentence, one capsule
          </h2>
          <p className="mt-4 max-w-[56ch] text-[16px] leading-7 text-text-2">
            Most requests never leave the phone. The parser and the templates work offline, and the
            cloud model is a switch you turn on, not the default.
          </p>
          <div className="mt-10">
            <Steps />
          </div>
        </section>

        <section aria-labelledby="checks" className="border-t border-line pt-16 lg:pt-20">
          <h2 id="checks" className="text-3xl font-bold tracking-tight sm:text-4xl">
            What the phone checks
          </h2>
          <p className="mt-4 max-w-[56ch] text-[16px] leading-7 text-text-2">
            A capsule cannot reach past what it declared, and it cannot run code at all.
          </p>
          <div className="mt-10">
            <Bento />
          </div>
        </section>

        <section aria-labelledby="shapes" className="border-t border-line pt-16 lg:pt-20">
          <h2 id="shapes" className="text-3xl font-bold tracking-tight sm:text-4xl">
            One layout pattern per capsule shape
          </h2>
          <p className="mt-4 max-w-[56ch] text-[16px] leading-7 text-text-2">
            A timer is a ring, a bill is a live number, a week of habits is a forecast. Scroll the
            row to see the shapes the renderer draws today.
          </p>
          <div className="mt-10">
            <Rail />
          </div>
        </section>

        <section aria-labelledby="fold" className="border-t border-line pt-16 lg:pt-20">
          <h2 id="fold" className="text-3xl font-bold tracking-tight sm:text-4xl">
            It folds. It goes dark.
          </h2>
          <p className="mt-4 max-w-[56ch] text-[16px] leading-7 text-text-2">
            The same capsule rearranges itself for a wider screen, and the frames follow the system
            theme.
          </p>
          <div className="mt-10">
            <FoldDark />
          </div>
        </section>

        <section className="border-t border-line pt-16 lg:pt-20">
          <Marketplace />
        </section>

        <section aria-labelledby="status" className="border-t border-line pt-16 lg:pt-20">
          <h2 id="status" className="text-3xl font-bold tracking-tight sm:text-4xl">
            What is real today
          </h2>
          <p className="mt-4 max-w-[56ch] text-[16px] leading-7 text-text-2">
            This is a research build from a weekend hackathon, so here is the honest split.
          </p>
          <div className="mt-10">
            <Status />
          </div>
        </section>

        <section aria-labelledby="run" className="border-t border-line pt-16 lg:pt-20">
          <div className="rounded-card bg-surface p-8 shadow-frame sm:p-10">
            <h2 id="run" className="text-3xl font-bold tracking-tight sm:text-4xl">
              Run it yourself
            </h2>
            <p className="mt-4 max-w-[60ch] text-[16px] leading-7 text-text-2">
              Build the app in DevEco Studio and install it on an API 24 emulator or a HarmonyOS
              phone. The marketplace and the second-device relay work in a browser tab.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <PrimaryLink href={APP_REPO} external>
                Get the build
              </PrimaryLink>
              <PrimaryLink href="/capsules">Browse the marketplace</PrimaryLink>
            </div>
            <p className="mt-5 max-w-[60ch] text-[13px] leading-6 text-text-2">
              Experimental research build, tested on the HackYeah API 24 emulator. The status list
              above says which parts were verified on a device and which were not.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
