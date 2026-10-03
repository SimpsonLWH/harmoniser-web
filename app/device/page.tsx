import type { Metadata } from "next";
import Link from "next/link";

import { VirtualDevice } from "./VirtualDevice";

export const metadata: Metadata = {
  title: "Virtual device",
  description:
    "Turn this browser tab into a second Harmoniser device: pair it with a QR code or three words, then send it a timer or a counter.",
};

export default function DevicePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight">A second device, in this tab</h1>
      <p className="mt-3 text-[15px] leading-7 text-text-2">
        This page acts like the wrist companion: it shows a pairing code, then a timer or a counter
        sent from a paired phone. Scan the QR code with a phone camera, or type the three words on
        the <Link href="/pair" className="text-brand hover:underline">pairing page</Link>.
      </p>

      <div className="mt-8">
        <VirtualDevice />
      </div>

      <div className="mt-10 space-y-6 text-[15px] leading-7 text-text-2">
        <section>
          <h2 className="text-[18px] font-semibold text-text">How it works</h2>
          <ol className="mt-2 list-decimal space-y-2 pl-5">
            <li>The device registers and gets a pairing code that works once, for ten minutes.</li>
            <li>
              Whoever scans or types the code becomes its owner. There are no accounts: the owner is
              the anonymous token of that phone or browser.
            </li>
            <li>
              The owner sends a timer or a counter: a type, a label and one number. The device
              fetches it every two seconds and reports back what it shows.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-text">What this is not</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              Not a Huawei watch or TV. The other device today is this page, or the team&apos;s ESP32
              wrist prototype, which is not a Huawei device and does not run HarmonyOS.
            </li>
            <li>
              Not a way around the phone&apos;s gatekeeper: only timers and counters travel, and only
              after the user allowed “Show on another device”.
            </li>
          </ul>
        </section>

        <p className="text-[12px] text-text-3">
          Pairing words come from the EFF Short Wordlist #1 by the Electronic Frontier Foundation,
          used under CC BY 3.0 US.
        </p>
      </div>
    </div>
  );
}
