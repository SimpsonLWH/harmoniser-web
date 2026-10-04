import Link from "next/link";

import { BrandIcon } from "@/components/frames/icons";

/*
 * The header stays to two destinations: the pitch deck and the marketplace.
 * Publish, Devices, the source repository and the build link live on the
 * landing page (hero and Run it yourself) and in the footer.
 */
const NAV = [
  { href: "/pitch", label: "Slides", hard: true },
  { href: "/capsules", label: "Marketplace", hard: false },
] as const;

const linkClass =
  "rounded-full px-3 py-2 font-medium text-text-2 transition-colors hover:bg-surface-2 hover:text-text";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-text" aria-label="Harmoniser home">
          <BrandIcon size={30} />
          <span className="hidden text-[17px] font-bold tracking-tight sm:inline">Harmoniser</span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 text-[14px]">
          {NAV.map((item) =>
            item.hard ? (
              /* The deck is a standalone static document, so this gets a full page load. */
              <a key={item.href} href={item.href} className={linkClass}>
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href} className={linkClass}>
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}
