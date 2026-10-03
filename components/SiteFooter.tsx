import Link from "next/link";

const FOOTER_LINK =
  "inline-flex min-h-tap items-center rounded-btn text-label font-semibold text-text-2 transition-colors hover:text-chip-text";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line-2 sm:mt-18">
      <div className="page flex flex-col gap-3 py-8 text-caption text-text-2">
        <div className="flex flex-wrap items-center gap-x-5">
          <Link href="/privacy" className={FOOTER_LINK}>
            Privacy policy
          </Link>
          <Link href="/terms" className={FOOTER_LINK}>
            Terms of service
          </Link>
          <Link href="/device" className={FOOTER_LINK}>
            Device pairing
          </Link>
          <a href="https://github.com/SimpsonLWH/harmoniser-web/issues" className={FOOTER_LINK} rel="noreferrer">
            Contact &amp; issues
          </a>
          <a href="https://github.com/Akshaz7/capsules-harmonyos" className={FOOTER_LINK} rel="noreferrer">
            App repository
          </a>
        </div>
        <p className="max-w-[65ch] leading-5">
          Harmoniser is a HackYeah 2026 project: an experimental HarmonyOS app and capsule
          marketplace. Capsules are plain data, not code, and every permission is shown before
          anything runs. Nothing here is affiliated with Huawei or with any other company.
        </p>
      </div>
    </footer>
  );
}
