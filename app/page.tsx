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

const DIFFERENTIATOR_ICONS = [<CapsuleIcon key="capsule" />, <PhoneIcon key="phone" />, <ShieldIcon key="shield" />];

const SHOT = "h-auto w-full max-w-[240px] rounded-frame border border-[var(--frame-border)] shadow-[var(--shadow-frame)]";

export default function Home() {
  return (
    <div className="page">
      <section className="grid gap-10 py-12 sm:py-16 md:grid-cols-[1.1fr_1fr] md:items-center md:py-18">
        <div>
          <p className="chip">HarmonyOS · HackYeah 2026</p>
          <h1 className="page-title mt-4">Tiny apps, made by asking.</h1>
          <p className="lede mt-5 sm:text-[19px]">
            Describe what you need in one sentence and Harmoniser builds a capsule: a small,
            single-purpose app that runs natively on HarmonyOS. Capsules are plain JSON, checked
            against a strict schema, and can only use the device features you allow.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/capsules" className="btn btn-primary px-6 text-body">
              Browse the marketplace
            </Link>
            <a
              href="https://github.com/Akshaz7/capsules-harmonyos"
              className="btn btn-secondary px-6 text-body"
              rel="noreferrer"
            >
              Get the build
            </a>
          </div>
          <p className="mt-4 text-caption text-text-2">
            Experimental research build, tested on the HackYeah API 24 emulator.
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <Image
            src="/shots/home.jpg"
            alt="Harmoniser home screen with a request box, example chips and a grid of saved capsules"
            width={947}
            height={2048}
            priority
            className={SHOT}
          />
          <Image
            src="/shots/consent.jpg"
            alt="The gatekeeper sheet asking for permission before a capsule runs"
            width={947}
            height={2048}
            className={`${SHOT} mt-10 hidden sm:block`}
          />
        </div>
      </section>

      <section aria-labelledby="how" className="py-8 md:py-12">
        <h2 id="how" className="section-title">
          How it works
        </h2>
        <div className="mt-6 grid gap-3.5 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="card flex flex-col gap-2">
              <p className="text-caption font-semibold text-chip-text tabular-nums">Step {index + 1}</p>
              <h3 className="text-body font-bold">{step.title}</h3>
              <p className="text-label leading-6 text-text-2">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="why" className="py-8 md:py-12">
        <h2 id="why" className="section-title">
          What makes it different
        </h2>
        <div className="mt-6 grid gap-3.5 sm:grid-cols-3">
          {DIFFERENTIATORS.map((item, index) => (
            <div key={item.title} className="card flex flex-col gap-2">
              <span className="icon-tile mb-1">{DIFFERENTIATOR_ICONS[index]}</span>
              <h3 className="text-body font-bold">{item.title}</h3>
              <p className="text-label leading-6 text-text-2">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 py-8 md:grid-cols-[1.2fr_1fr] md:items-center md:py-12">
        <div className="card sm:p-7">
          <h2 className="section-title">The capsule marketplace</h2>
          <p className="mt-3 max-w-[65ch] text-label leading-7 text-text-2">
            Share a capsule you made, or install one someone else published. Publishing is
            anonymous: your owner token is the only delete credential, and the marketplace stores
            just its hash. Every download is a JSON file that goes through the app&apos;s own
            validator and permission sheet before anything runs.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/capsules" className="btn btn-primary">
              Browse capsules
            </Link>
            <Link href="/publish" className="btn btn-secondary">
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
            className={SHOT}
          />
        </div>
      </section>

      <section className="pb-4 pt-4">
        <div className="rounded-card bg-card p-4 sm:p-6">
          <h2 className="text-body font-bold">Where capsules run today</h2>
          <ul className="mt-3 grid gap-2 text-label leading-6 text-text-2 sm:grid-cols-2">
            <li>
              <strong className="font-bold text-text">Phone:</strong> the tested target, API 20+.
            </li>
            <li>
              <strong className="font-bold text-text">Home screen:</strong> 2×2 and 2×4 widgets
              for capsules the router allows.
            </li>
            <li>
              <strong className="font-bold text-text">TV and watch:</strong> coming next —{" "}
              <Link href="/device" className="link">
                device pairing preview
              </Link>
              .
            </li>
            <li>
              <strong className="font-bold text-text">ESP32 wrist prototype:</strong> a lab
              stand-in, not a Huawei device; the phone gatekeeper still decides what may be sent.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
