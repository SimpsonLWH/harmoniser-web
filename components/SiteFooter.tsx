import Link from "next/link";

import { LogoMark } from "@/components/Logo";

const LINK = "inline-flex min-h-tap items-center text-[15px] font-medium text-text-2 transition-colors hover:text-text";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="page py-14">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 text-text">
              <LogoMark />
              <span className="font-display text-[19px] font-bold">Harmoniser</span>
            </Link>
          </div>
          <div>
            <p className="eyebrow">Marketplace</p>
            <div className="mt-3 flex flex-col">
              <Link href="/capsules" className={LINK}>Marketplace</Link>
              <Link href="/publish" className={LINK}>Publish</Link>
              <Link href="/device" className={LINK}>Device pairing</Link>
            </div>
          </div>
          <div>
            <p className="eyebrow">Legal</p>
            <div className="mt-3 flex flex-col">
              <Link href="/privacy" className={LINK}>Privacy policy</Link>
              <Link href="/terms" className={LINK}>Terms of service</Link>
            </div>
          </div>
          <div>
            <p className="eyebrow">GitHub</p>
            <div className="mt-3 flex flex-col">
              <a href="https://github.com/SimpsonLWH/harmoniser-web/issues" className={LINK} rel="noreferrer">Contact &amp; issues</a>
              <a href="https://github.com/Akshaz7/capsules-harmonyos" className={LINK} rel="noreferrer">App repository</a>
            </div>
          </div>
        </div>
        <p className="mt-12 max-w-[70ch] border-t border-line pt-6 text-[13px] leading-6 text-text-2">
          Harmoniser is a HackYeah 2026 project: an experimental HarmonyOS app and capsule
          marketplace. Capsules are plain data, not code, and every permission is shown before
          anything runs. Nothing here is affiliated with Huawei or with any other company.
        </p>
      </div>
    </footer>
  );
}
