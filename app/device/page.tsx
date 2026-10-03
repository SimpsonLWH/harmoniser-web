import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Device pairing",
  description:
    "The planned Harmoniser pairing flow for TVs, watches and companion boards: a short-lived code, an explicit approval, and the phone gatekeeper deciding what may be sent.",
};

export default function DevicePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Pair another device</h1>
      <p className="mt-3 inline-flex rounded-full bg-warning-soft px-3 py-1 text-[12px] font-medium text-warning">
        Coming next · not live in this build
      </p>
      <div className="mt-8 space-y-8 text-[15px] leading-7 text-text-2">
        <section>
          <h2 className="text-[18px] font-semibold text-text">The planned flow</h2>
          <ol className="mt-2 list-decimal space-y-2 pl-5">
            <li>
              The other device shows a short code and a word phrase, and creates a short-lived
              pairing session (about ten minutes).
            </li>
            <li>
              The signed-in phone or this website enters the code. The session is bound to your
              account, and only a hash of the pairing material is stored.
            </li>
            <li>
              The device receives its own device token and polls for capsule updates. Every send is
              bounded by what the phone&apos;s gatekeeper already allows: a capsule is not a
              blanket permission.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-text">What exists today</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              Phone: the tested target. <Link href="/capsules" className="text-brand hover:underline">Install a capsule</Link>{" "}
              from the marketplace and import it in the app.
            </li>
            <li>
              Home-screen widgets: 2×2 and 2×4, for capsules that pass the app&apos;s widget router.
            </li>
            <li>
              ESP32 wrist prototype: a cheap stand-in for a watch, built by the team, driven over
              your local network. It is not a Huawei device and it does not run HarmonyOS.
            </li>
            <li>
              TV, watch and remote installs: not available yet, and they will not be shown as
              working until they genuinely work.
            </li>
          </ul>
        </section>

        <section className="rounded-card bg-surface p-5 shadow-[var(--h-shadow)]">
          <h2 className="text-[17px] font-semibold text-text">For the team</h2>
          <p className="mt-2">
            The relay endpoints (<code className="font-mono text-[13px]">/api/devices/**</code>)
            are a separate workstream. This site ships the database helper, the environment
            contract and a{" "}
            <code className="font-mono text-[13px]">DeviceSession</code> schema placeholder, so the
            relay can be added without another migration.
          </p>
        </section>
      </div>
    </div>
  );
}
