import Link from "next/link";

const NAV = [
  { href: "/capsules", label: "Marketplace" },
  { href: "/publish", label: "Publish" },
  { href: "/device", label: "Devices" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-text">
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-[10px] bg-brand text-sm font-semibold text-white"
          >
            H
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Harmoniser</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-[14px]">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-text-2 transition-colors hover:bg-surface-2 hover:text-text"
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://github.com/Akshaz7/capsules-harmonyos"
            className="rounded-full px-3 py-1.5 text-text-2 transition-colors hover:bg-surface-2 hover:text-text"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
