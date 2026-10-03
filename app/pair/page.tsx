import type { Metadata } from "next";

import { parseCode } from "@/lib/devices/phrase";

import { PairPanel } from "./PairPanel";

export const metadata: Metadata = {
  title: "Pair a device",
  description: "Pair a Harmoniser companion device with the three words it shows, then send it a timer or a counter.",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ code?: string | string[] }>;
}

/**
 * What the QR code on a device opens. Opening the page pairs nothing; the button does.
 * The code is only checked for its shape here: whether it is a live one is the claim's answer.
 */
export default async function PairPage({ searchParams }: Props) {
  const { code } = await searchParams;
  const scanned = typeof code === "string" ? parseCode(code) : null;
  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Pair this device</h1>
      <PairPanel scanned={scanned} />
      <p className="mt-10 text-[12px] leading-5 text-text-3">
        Pairing words come from the EFF Short Wordlist #1 by the Electronic Frontier Foundation,
        used under CC BY 3.0 US.
      </p>
    </div>
  );
}
