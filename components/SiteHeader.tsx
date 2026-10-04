import Link from "next/link";

import { BrandIcon } from "@/components/frames/icons";

const NAV = [
  { href: "/capsules", label: "Marketplace" },
  { href: "/publish", label: "Publish" },
  { href: "/device", label: "Devices" },
];

const APP_REPO = "https://github.com/Akshaz7/capsules-harmonyos";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-text" aria-label="Harmoniser home">
          <BrandIcon size={30} />
          <span className="hidden text-[17px] font-bold tracking-tight sm:inline">Harmoniser</span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 text-[14px]">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 font-medium text-text-2 transition-colors hover:bg-surface-2 hover:text-text"
            >
              {item.label}
            </Link>
          ))}
          {/* The deck is a standalone static document, so this gets a full page load. */}
          <a
            href="/pitch"
            className="rounded-full px-3 py-2 font-medium text-text-2 transition-colors hover:bg-surface-2 hover:text-text"
          >
            Pitch
          </a>
          <a
            href={APP_REPO}
            className="hidden rounded-full px-3 py-2 font-medium text-text-2 transition-colors hover:bg-surface-2 hover:text-text md:inline-flex"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            href={APP_REPO}
            className="ml-1 hidden min-h-10 items-center whitespace-nowrap rounded-full bg-brand px-4 text-[14px] font-semibold text-white transition-colors hover:bg-brand-deep sm:inline-flex"
            rel="noreferrer"
          >
            Get the build
          </a>
        </nav>
      </div>
    </header>
  );
}
