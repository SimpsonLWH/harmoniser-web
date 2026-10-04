import Link from "next/link";

import { LogoMark } from "@/components/Logo";

const NAV = [
  { href: "/capsules", label: "Marketplace" },
  { href: "/publish", label: "Publish" },
  { href: "/device", label: "Devices" },
];

const NAV_ITEM =
  "inline-flex min-h-tap shrink-0 items-center px-2.5 text-[15px] font-medium text-text-2 transition-colors hover:text-text";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-[var(--header-bg)] backdrop-blur-md">
      <div className="page flex flex-wrap items-center gap-x-4 py-2.5">
        <Link href="/" className="inline-flex min-h-tap items-center gap-2.5 text-text">
          <LogoMark />
          <span className="font-display text-[19px] font-bold tracking-[-0.2px]">Harmoniser</span>
        </Link>
        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto sm:order-none sm:mx-auto sm:w-auto">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={NAV_ITEM}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <a href="https://github.com/Akshaz7/capsules-harmonyos" className="btn btn-secondary" rel="noreferrer">
            GitHub
          </a>
          <Link href="/capsules" className="btn btn-primary hidden sm:inline-flex">
            Browse capsules
          </Link>
        </div>
      </div>
    </header>
  );
}
