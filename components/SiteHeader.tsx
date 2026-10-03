import Link from "next/link";

import { LogoMark } from "@/components/Logo";

const NAV = [
  { href: "/capsules", label: "Marketplace" },
  { href: "/publish", label: "Publish" },
  { href: "/device", label: "Devices" },
];

const NAV_ITEM =
  "inline-flex min-h-tap shrink-0 items-center rounded-btn px-3 text-label font-semibold text-text-2 transition-colors hover:bg-chip hover:text-chip-text";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line-2 bg-[var(--header-bg)] backdrop-blur-[16px]">
      <div className="page flex flex-wrap items-center gap-x-3 py-1.5">
        <Link href="/" className="-ml-1 inline-flex min-h-tap items-center gap-2 rounded-btn px-1 text-text">
          <LogoMark />
          <span className="text-[19px] font-bold tracking-[-0.2px]">Harmoniser</span>
        </Link>
        {/* Under 600px the nav takes its own row and scrolls inside itself if it ever overflows. */}
        <nav className="-mx-1 flex w-full items-center gap-1 overflow-x-auto pb-1 sm:mx-0 sm:ml-auto sm:w-auto sm:overflow-visible sm:pb-0">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={NAV_ITEM}>
              {item.label}
            </Link>
          ))}
          <a href="https://github.com/Akshaz7/capsules-harmonyos" className={NAV_ITEM} rel="noreferrer">
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
