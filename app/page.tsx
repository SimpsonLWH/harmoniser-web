import Image from "next/image";
import Link from "next/link";

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

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
      <section className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <p className="inline-flex items-center rounded-full bg-brand-soft px-3 py-1 text-[12px] font-medium text-brand">
            HarmonyOS · HackYeah 2026
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Tiny apps, made by asking.
          </h1>
          <p className="mt-5 max-w-xl text-[16px] leading-7 text-text-2">
            Describe what you need in one sentence and Harmoniser builds a capsule: a small,
            single-purpose app that runs natively on HarmonyOS. Capsules are plain JSON, checked
            against a strict schema, and can only use the device features you allow.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/capsules"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-6 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
            >
              Browse the marketplace
            </Link>
            <a
              href="https://github.com/Akshaz7/capsules-harmonyos"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-surface px-6 text-[15px] font-medium text-text shadow-[var(--h-shadow)] transition-colors hover:bg-surface-2"
              rel="noreferrer"
            >
              Get the build
            </a>
          </div>
          <p className="mt-4 text-[13px] text-text-3">
            Experimental research build, tested on the HackYeah API 24 emulator.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Image
            src="/shots/home.jpg"
            alt="Harmoniser home screen with a request box, example chips and a grid of saved capsules"
            width={947}
            height={2048}
            priority
            className="h-auto w-full max-w-[240px] rounded-card border border-line shadow-[var(--h-shadow)]"
          />
          <Image
            src="/shots/consent.jpg"
            alt="The gatekeeper sheet asking for permission before a capsule runs"
            width={947}
            height={2048}
            className="mt-10 hidden h-auto w-full max-w-[240px] rounded-card border border-line shadow-[var(--h-shadow)] sm:block"
          />
        </div>
      </section>

      <section aria-labelledby="how" className="py-10">
        <h2 id="how" className="text-2xl font-semibold tracking-tight">
          How it works
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="rounded-card bg-surface p-5 shadow-[var(--h-shadow)]">
              <p className="text-[12px] font-medium text-brand">Step {index + 1}</p>
              <h3 className="mt-1 text-[17px] font-semibold">{step.title}</h3>
              <p className="mt-2 text-[14px] leading-6 text-text-2">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="why" className="py-10">
        <h2 id="why" className="text-2xl font-semibold tracking-tight">
          What makes it different
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {DIFFERENTIATORS.map((item) => (
            <div key={item.title} className="rounded-card bg-surface p-5 shadow-[var(--h-shadow)]">
              <h3 className="text-[17px] font-semibold">{item.title}</h3>
              <p className="mt-2 text-[14px] leading-6 text-text-2">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 py-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="rounded-card bg-surface p-6 shadow-[var(--h-shadow)]">
          <h2 className="text-2xl font-semibold tracking-tight">The capsule marketplace</h2>
          <p className="mt-3 text-[15px] leading-7 text-text-2">
            Share a capsule you made, or install one someone else published. Publishing is
            anonymous: your device token is the only owner credential, and the marketplace stores
            just its hash. Every download is a JSON file that goes through the app&apos;s own
            validator and permission sheet before anything runs.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/capsules"
              className="inline-flex min-h-11 items-center rounded-full bg-brand px-5 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
            >
              Browse capsules
            </Link>
            <Link
              href="/publish"
              className="inline-flex min-h-11 items-center rounded-full bg-surface-2 px-5 text-[15px] font-medium text-text transition-colors hover:bg-brand-soft"
            >
              Publish a capsule
            </Link>
          </div>
        </div>
        <div className="flex justify-center">
          <Image
            src="/shots/detail.jpg"
            alt="A capsule detail screen showing blocked components that need a denied permission"
            width={947}
            height={2048}
            className="h-auto w-full max-w-[240px] rounded-card border border-line shadow-[var(--h-shadow)]"
          />
        </div>
      </section>

      <section className="pb-16 pt-4">
        <div className="rounded-card border border-line p-6">
          <h2 className="text-[17px] font-semibold">Where capsules run today</h2>
          <ul className="mt-3 grid gap-2 text-[14px] leading-6 text-text-2 sm:grid-cols-2">
            <li>
              <strong className="font-medium text-text">Phone:</strong> the tested target, API 20+.
            </li>
            <li>
              <strong className="font-medium text-text">Home screen:</strong> 2×2 and 2×4 widgets
              for capsules the router allows.
            </li>
            <li>
              <strong className="font-medium text-text">TV and watch:</strong> coming next —{" "}
              <Link href="/device" className="text-brand hover:underline">
                device pairing preview
              </Link>
              .
            </li>
            <li>
              <strong className="font-medium text-text">ESP32 wrist prototype:</strong> a lab
              stand-in, not a Huawei device; the phone gatekeeper still decides what may be sent.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
