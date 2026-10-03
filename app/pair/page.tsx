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
    <div className="page max-w-[480px] py-10 sm:py-14">
      <h1 className="page-title">Pair this device</h1>
      <PairPanel scanned={scanned} />
      <p className="mt-10 text-badge leading-5 text-text-2">
        Pairing words come from the EFF Short Wordlist #1 by the Electronic Frontier Foundation,
        used under CC BY 3.0 US.
      </p>
    </div>
  );
}
