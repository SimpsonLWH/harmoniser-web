import Image from "next/image";
import Link from "next/link";

import { CapsuleIcon, PhoneIcon, ShieldIcon } from "@/components/Icons";

const STEPS = [
  {
    title: "Ask",
    body: "Type what you need — \u201cpasta 9 min, sauce 15 min\u201d — or tap an example. A rule parser answers instantly; the on-device model handles many of the rest with no network; a cloud model is optional and off by default.",
  },
  {
    title: "Approve",
    body: "Harmoniser shows every permission the capsule needs and lets you allow or deny each one. A denied feature is drawn as blocked, refused when tapped, and written to the log.",
  },
  {
    title: "Use",
    body: "The capsule runs natively: timers ring, counters count, checklists tick, and capsules that fit can live on your home screen as a widget.",
  },
];

const DIFFERENTIATORS = [
  {
    title: "No code inside a capsule",
    body: "A capsule is JSON, checked against a strict schema. Unknown fields, types and actions are rejected. Schema v1 expressions are parsed by our own parser — never eval.",
  },
  {
    title: "On-device first",
    body: "Rules run offline. The on-device model (LFM2-VL-450M on the Cactus engine) runs locally with telemetry stubbed out. Cloud AI is a switch you turn on, and your API key is never packed into the app.",
  },
  {
    title: "Permissions are the API",
    body: "A timer needs reminders. A motion counter needs motion. The validator rejects anything undeclared, and the gatekeeper is the only path to the device.",
  },
];

const STEP_ICONS = [<CapsuleIcon key="ask" size={28} />, <ShieldIcon key="approve" size={28} />, <PhoneIcon key="use" size={28} />];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pb-16 pt-10 lg:pb-24 lg:pt-16">
        <div className="page grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="eyebrow">HarmonyOS · HackYeah 2026</p>
            <h1 className="display-1 mt-4">
              Tiny apps,
              <br />
              made by <span className="highlight">asking</span>.
            </h1>
            <p className="lede mt-6">
              Describe what you need in one sentence and Harmoniser builds a capsule: a small,
              single-purpose app that runs natively on HarmonyOS. Capsules are plain JSON, checked
              against a strict schema, and can only use the device features you allow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/capsules" className="btn btn-primary btn-lg">
                Browse the marketplace
              </Link>
              <a href="https://github.com/Akshaz7/capsules-harmonyos" className="btn btn-secondary btn-lg" rel="noreferrer">
                Get the build
              </a>
            </div>
            <p className="mt-4 text-[14px] text-text-2">
              Experimental research build, tested on the HackYeah API 24 emulator.
            </p>
          </div>
          <div className="relative flex justify-center">
            <span aria-hidden="true" className="absolute left-[calc(50%-230px)] top-16 hidden h-40 w-32 -rotate-6 rounded-card border border-line bg-surface/80 shadow-[var(--shadow-card)] sm:block" />
            <span aria-hidden="true" className="absolute right-[calc(50%-230px)] top-28 hidden h-40 w-32 rotate-6 rounded-card border border-line bg-surface/80 shadow-[var(--shadow-card)] sm:block" />
            <div className="relative w-[270px] rounded-[44px] border-[10px] border-text bg-text shadow-[var(--shadow-raised)]">
              <Image
                src="/shots/home.jpg"
                alt="Harmoniser home screen with a request box, example chips and a grid of saved capsules"
                width={947}
                height={2048}
                priority
                className="h-auto w-full rounded-[34px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Numbered list, like LUME's "The problem" */}
      <section aria-labelledby="why" className="border-t border-line">
        <div className="page grid gap-12 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="eyebrow">Why Harmoniser</p>
            <h2 id="why" className="display-2 mt-4">
              What makes it different
            </h2>
          </div>
          <ol className="border-t border-line">
            {DIFFERENTIATORS.map((item, index) => (
              <li key={item.title} className="flex gap-6 border-b border-line py-6">
                <span className="w-6 shrink-0 pt-0.5 font-display text-[15px] font-bold text-text-2 tabular-nums">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="font-display text-[18px] font-bold">{item.title}</h3>
                  <p className="mt-1.5 text-[16px] leading-7 text-text-2">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Three steps */}
      <section aria-labelledby="how" className="section-dots border-t border-line">
        <div className="page py-20 text-center lg:py-28">
          <p className="eyebrow">How it works</p>
          <h2 id="how" className="display-2 mx-auto mt-4 max-w-3xl">
            {STEPS.map((step) => step.title).join(". ")}.
          </h2>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="flex flex-col items-center">
                <div className="flex h-32 w-full max-w-[220px] items-center justify-center rounded-card border border-line bg-surface shadow-[var(--shadow-card)]">
                  <span className="icon-tile size-14 rounded-2xl">{STEP_ICONS[index]}</span>
                </div>
                <h3 className="mt-6 flex items-center gap-3 font-display text-[18px] font-bold">
                  <span className="grid size-7 place-items-center rounded-full bg-tint text-[13px] text-blue tabular-nums">
                    {index + 1}
                  </span>
                  {step.title}
                </h3>
                <p className="mt-3 max-w-sm text-[16px] leading-7 text-text-2">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace feature, like LUME's role panel */}
      <section className="border-t border-line">
        <div className="page py-20 lg:py-28">
          <div className="grid items-center gap-10 overflow-hidden rounded-card border border-line bg-surface p-6 shadow-[var(--shadow-card)] md:grid-cols-[1fr_1.2fr] md:p-10">
            <div className="flex justify-center rounded-card bg-bg py-8">
              <Image
                src="/shots/detail.jpg"
                alt="A capsule detail screen showing blocked components that need a denied permission"
                width={947}
                height={2048}
                className="h-auto w-full max-w-[220px] rounded-[28px] border border-line shadow-[var(--shadow-raised)]"
              />
            </div>
            <div>
              <h2 className="display-2">The capsule marketplace</h2>
              <p className="mt-4 text-[17px] leading-7 text-text-2">
                Share a capsule you made, or install one someone else published. Publishing is
                anonymous: your owner token is the only delete credential, and the marketplace
                stores just its hash. Every download is a JSON file that goes through the app&apos;s
                own validator and permission sheet before anything runs.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/capsules" className="btn btn-primary btn-lg">
                  Browse capsules
                </Link>
                <Link href="/publish" className="btn btn-secondary btn-lg">
                  Publish a capsule
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento, like LUME's features grid */}
      <section className="border-t border-line">
        <div className="page py-20 lg:py-28">
          <p className="eyebrow">Devices</p>
          <h2 className="display-2 mt-4">Where capsules run today</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="card md:col-span-2">
              <h3 className="display-3">Phone</h3>
              <p className="mt-2 text-[16px] leading-7 text-text-2">the tested target, API 20+.</p>
              <span className="chip mt-5"><PhoneIcon size={14} /> HarmonyOS</span>
            </div>
            <div className="card">
              <h3 className="display-3">Home screen</h3>
              <p className="mt-2 text-[16px] leading-7 text-text-2">2×2 and 2×4 widgets for capsules the router allows.</p>
            </div>
            <div className="card">
              <h3 className="display-3">TV and watch</h3>
              <p className="mt-2 text-[16px] leading-7 text-text-2">
                coming next —{" "}
                <Link href="/device" className="link">
                  device pairing preview
                </Link>
                .
              </p>
            </div>
            <div className="card md:col-span-2">
              <h3 className="display-3">ESP32 wrist prototype</h3>
              <p className="mt-2 text-[16px] leading-7 text-text-2">
                a lab stand-in, not a Huawei device; the phone gatekeeper still decides what may be sent.
              </p>
              <span className="chip chip-orange mt-5"><ShieldIcon size={14} /> Permissions are the API</span>
            </div>
          </div>
        </div>
      </section>

      {/* Blue band, like LUME's "Pick your seat" */}
      <section className="section-dots bg-blue [--dot:rgba(255,255,255,0.14)]">
        <div className="page grid items-center gap-8 py-20 lg:grid-cols-[1.4fr_1fr] lg:py-24">
          <div>
            <h2 className="display-2 !text-white">Tiny apps, made by asking.</h2>
            <p className="mt-4 max-w-xl text-[17px] leading-7 text-white/85">
              Experimental research build, tested on the HackYeah API 24 emulator.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/capsules" className="btn btn-white btn-lg">
              Browse the marketplace
            </Link>
            <Link href="/publish" className="btn btn-outline-white btn-lg">
              Publish a capsule
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
