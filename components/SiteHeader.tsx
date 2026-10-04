import Link from "next/link";

import { LogoMark } from "@/components/Logo";

const NAV = [
  { href: "/capsules", label: "Marketplace" },
  { href: "/publish", label: "Publish" },
  { href: "/device", label: "Devices" },
];

// The app's HostBar: logo + wordmark left, round white-72% controls right.
const NAV_ITEM =
  "inline-flex min-h-tap shrink-0 items-center rounded-[22px] bg-[var(--white-72)] px-4 text-[15px] font-semibold text-text transition-colors hover:bg-surface";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 bg-[var(--header-bg)] backdrop-blur-[16px]">
      <div className="page flex flex-wrap items-center gap-x-3 gap-y-2 pb-2.5 pt-3 sm:pt-[18px]">
        <Link href="/" className="inline-flex min-h-tap items-center gap-2.5 text-text">
          <LogoMark />
          <span className="text-[19px] font-bold tracking-[-0.2px]">Harmoniser</span>
        </Link>
        <nav className="flex w-full items-center gap-1.5 overflow-x-auto sm:ml-auto sm:w-auto">
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
