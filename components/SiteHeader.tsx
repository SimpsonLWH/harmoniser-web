import Link from "next/link";

import { BrandIcon } from "@/components/frames/icons";

/*
 * Three destinations plus the connect call to action. Publish, the source
 * repository and the build link live on the landing page (hero and Run it
 * yourself) and in the footer.
 */
interface NavItem {
  href: string;
  label: string;
  /* Standalone documents and cross-page anchors take a full page load. */
  hard?: boolean;
  /* The hero scroll cue covers the video on small screens. */
  hideBelowSm?: boolean;
}

const NAV: NavItem[] = [
  { href: "/pitch", label: "Slides", hard: true },
  { href: "/#trailer", label: "Video", hard: true, hideBelowSm: true },
  { href: "/capsules", label: "Marketplace" },
];

const linkClass =
  "rounded-full px-2.5 py-2 font-medium text-text-2 transition-colors hover:bg-surface-2 hover:text-text sm:px-3";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-text" aria-label="Harmoniser home">
          <BrandIcon size={30} />
          <span className="hidden text-[17px] font-bold tracking-tight sm:inline">Harmoniser</span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 text-[14px]">
          {NAV.map((item) => {
            const className = item.hideBelowSm
              ? `${linkClass} hidden sm:inline-flex`
              : linkClass;
            return item.hard ? (
              /* The deck is a standalone static document, so this gets a full page load. */
              <a key={item.href} href={item.href} className={className}>
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href} className={className}>
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/device"
            className="ml-1 inline-flex min-h-10 items-center whitespace-nowrap rounded-full bg-brand px-3.5 text-[14px] font-semibold text-white transition-colors hover:bg-brand-deep sm:px-4"
          >
            Connect phone
          </Link>
        </nav>
      </div>
    </header>
  );
}
