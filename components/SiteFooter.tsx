import Link from "next/link";

import { LogoMark } from "@/components/Logo";

const LINK = "inline-flex min-h-tap items-center text-[15px] font-semibold text-text-2 transition-colors hover:text-blue";

export function SiteFooter() {
  return (
    <footer className="mt-16">
      <div className="page pb-10">
        <div className="frame flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <LogoMark size={26} />
            <span className="text-[17px] font-bold">Harmoniser</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5">
            <Link href="/privacy" className={LINK}>
              Privacy policy
            </Link>
            <Link href="/terms" className={LINK}>
              Terms of service
            </Link>
            <Link href="/device" className={LINK}>
              Device pairing
            </Link>
            <a href="https://github.com/SimpsonLWH/harmoniser-web/issues" className={LINK} rel="noreferrer">
              Contact &amp; issues
            </a>
            <a href="https://github.com/Akshaz7/capsules-harmonyos" className={LINK} rel="noreferrer">
              App repository
            </a>
          </div>
          <p className="caption max-w-[70ch]">
            Harmoniser is a HackYeah 2026 project: an experimental HarmonyOS app and capsule
            marketplace. Capsules are plain data, not code, and every permission is shown before
            anything runs. Nothing here is affiliated with Huawei or with any other company.
          </p>
        </div>
      </div>
    </footer>
  );
}
