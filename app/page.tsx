import Link from "next/link";

import { AppFrame } from "@/components/AppFrame";
import {
  CapsuleIcon,
  ChecklistIcon,
  CompassIcon,
  PhoneIcon,
  ShieldIcon,
} from "@/components/Icons";
import { PackingCapsule, PomodoroCapsule, SplitCapsule } from "@/components/SampleCapsules";

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

const PLACES = [
  { title: "Phone:", body: "the tested target, API 20+." },
  { title: "Home screen:", body: "2×2 and 2×4 widgets for capsules the router allows." },
];

export default function Home() {
  return (
    <div className="page">
      <section className="flex flex-col items-center pb-10 pt-8 text-center sm:pt-14">
        <p className="chip">HarmonyOS · HackYeah 2026</p>
        <h1 className="mt-4 text-[34px] font-extrabold leading-[1.1] tracking-[-0.8px] sm:text-[48px] sm:tracking-[-1.2px]">
          Tiny apps you don&apos;t need to download.
        </h1>
        <p className="lede mt-4 sm:text-[17px]">
          Describe what you need in one sentence and Harmoniser builds a capsule: a small,
          single-purpose app that runs natively on HarmonyOS. Capsules are plain JSON, checked
          against a strict schema, and can only use the device features you allow.
        </p>
        <div className="mt-7 flex w-full flex-col justify-center gap-2.5 sm:w-auto sm:flex-row">
          <Link href="/capsules" className="btn btn-primary btn-lg">
            Browse the marketplace
          </Link>
          <a href="https://github.com/Akshaz7/capsules-harmonyos" className="btn btn-secondary btn-lg text-[17px] font-bold" rel="noreferrer">
            Get the build
          </a>
        </div>
        <p className="caption mt-4">Experimental research build, tested on the HackYeah API 24 emulator.</p>
      </section>

      {/* Three capsules drawn as the app draws them. */}
      <section className="-mx-4 overflow-x-auto px-4 pb-14 pt-2 md:overflow-visible">
        <div className="mx-auto flex w-max gap-5 md:w-auto md:justify-center">
          <PomodoroCapsule className="h-[700px] w-[340px] shrink-0" />
          <PackingCapsule className="h-[700px] w-[340px] shrink-0" />
          <SplitCapsule className="h-[700px] w-[340px] shrink-0" />
        </div>
      </section>

      <div className="mx-auto flex max-w-[760px] flex-col gap-6 pt-6">
        <AppFrame icon={<ChecklistIcon />} name="How it works" nameAs="h2">
          {STEPS.map((step, index) => (
            <div key={step.title} className="card flex gap-3.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue text-[15px] font-extrabold text-white tabular-nums">
                {index + 1}
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="title">{step.title}</h3>
                <p className="text-[15px] leading-6 text-text-2">{step.body}</p>
              </div>
            </div>
          ))}
        </AppFrame>

        <AppFrame icon={<ShieldIcon />} name="What makes it different" nameAs="h2">
          {DIFFERENTIATORS.map((item, index) => (
            <div key={item.title} className="card flex gap-3.5">
              <span className="icon-tile bg-surface">{DIFFERENTIATOR_ICONS[index]}</span>
              <div className="flex flex-col gap-1">
                <h3 className="title">{item.title}</h3>
                <p className="text-[15px] leading-6 text-text-2">{item.body}</p>
              </div>
            </div>
          ))}
        </AppFrame>

        <AppFrame
          icon={<CapsuleIcon />}
          name="The capsule marketplace"
          nameAs="h2"
          footer={
            <>
              <Link href="/capsules" className="btn btn-primary flex-1">
                Browse capsules
              </Link>
              <Link href="/publish" className="btn btn-secondary flex-1">
                Publish a capsule
              </Link>
            </>
          }
        >
          <p className="text-[16px] leading-7 text-text-2">
            Share a capsule you made, or install one someone else published. Publishing is
            anonymous: your owner token is the only delete credential, and the marketplace stores
            just its hash. Every download is a JSON file that goes through the app&apos;s own
            validator and permission sheet before anything runs.
          </p>
        </AppFrame>

        <AppFrame icon={<CompassIcon />} name="Where capsules run today" nameAs="h2">
          <ul className="flex flex-col rounded-[20px] bg-card">
            {PLACES.map((place, index) => (
              <li key={place.title} className={`px-4 py-3.5 text-[15px] leading-6 text-text-2 ${index > 0 ? "card-row" : ""}`}>
                <strong className="font-bold text-text">{place.title}</strong> {place.body}
              </li>
            ))}
            <li className="card-row px-4 py-3.5 text-[15px] leading-6 text-text-2">
              <strong className="font-bold text-text">TV and watch:</strong> coming next —{" "}
              <Link href="/device" className="link">
                device pairing preview
              </Link>
              .
            </li>
            <li className="card-row px-4 py-3.5 text-[15px] leading-6 text-text-2">
              <strong className="font-bold text-text">ESP32 wrist prototype:</strong> a lab
              stand-in, not a Huawei device; the phone gatekeeper still decides what may be sent.
            </li>
          </ul>
        </AppFrame>
      </div>
    </div>
  );
}
