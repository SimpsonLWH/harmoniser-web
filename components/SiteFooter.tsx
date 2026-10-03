import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-[13px] text-text-2 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/privacy" className="hover:text-text">
            Privacy policy
          </Link>
          <Link href="/terms" className="hover:text-text">
            Terms of service
          </Link>
          <Link href="/device" className="hover:text-text">
            Device pairing
          </Link>
          <a
            href="https://github.com/SimpsonLWH/harmoniser-web/issues"
            className="hover:text-text"
            rel="noreferrer"
          >
            Contact &amp; issues
          </a>
          <a
            href="https://github.com/Akshaz7/capsules-harmonyos"
            className="hover:text-text"
            rel="noreferrer"
          >
            App repository
          </a>
        </div>
        <p className="max-w-2xl">
          Harmoniser is a HackYeah 2026 project: an experimental HarmonyOS app and capsule
          marketplace. Capsules are plain data, not code, and every permission is shown before
          anything runs. Nothing here is affiliated with Huawei or with any other company.
        </p>
      </div>
    </footer>
  );
}
