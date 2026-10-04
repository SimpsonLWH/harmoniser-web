import Link from "next/link";

import { BrandIcon } from "@/components/frames/icons";

const GROUPS = [
  {
    title: "Product",
    links: [
      { href: "/capsules", label: "Marketplace" },
      { href: "/publish", label: "Publish a capsule" },
      { href: "/device", label: "A second device" },
    ],
  },
  {
    title: "Project",
    links: [
      { href: "https://github.com/Akshaz7/capsules-harmonyos", label: "App repository", external: true },
      { href: "https://github.com/SimpsonLWH/harmoniser-web/issues", label: "Contact and issues", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <BrandIcon size={30} />
              <span className="text-[17px] font-bold tracking-tight">Harmoniser</span>
            </div>
            <p className="mt-4 max-w-[42ch] text-[14px] leading-6 text-text-2">
              A HackYeah 2026 project: an experimental HarmonyOS app and an anonymous capsule
              marketplace. Capsules are plain data, not code, and every permission is shown before
              anything runs.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {GROUPS.map((group) => (
              <div key={group.title}>
                <h2 className="text-[13px] font-bold text-text">{group.title}</h2>
                <ul className="mt-3 flex flex-col gap-2">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      {"external" in link && link.external ? (
                        <a
                          href={link.href}
                          className="text-[14px] text-text-2 transition-colors hover:text-text"
                          rel="noreferrer"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className="text-[14px] text-text-2 transition-colors hover:text-text">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-10 max-w-[80ch] text-[13px] leading-6 text-text-2">
          The build in the app repository is a research build tested on an emulator. Nothing here is
          affiliated with Huawei or with any other company.
        </p>
      </div>
    </footer>
  );
}
