# Web redesign: recon (T8)

Written on 2026-10-04 before any code edit, on branch `redesign-web` cut from `main` at
`f13b42d` (Merge PR #5).

## Stack

| Item | Value |
| --- | --- |
| Framework | Next.js 16.3.8, App Router, Turbopack build, React 19.2.8, no `src/` directory |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`), utility classes inline in TSX. No CSS modules, no styled-components |
| Global styles | `app/globals.css`: `@import "tailwindcss"`, `--h-*` custom properties, `@theme inline` mapping (`bg`, `surface`, `surface-2`, `text`, `text-2`, `text-3`, `brand`, `brand-soft`, `warning(-soft)`, `danger(-soft)`, `line`, `rounded-card` 20px, `rounded-input` 24px), focus ring, reduced motion |
| Fonts | `next/font/google` in `app/layout.tsx`: Geist and Geist Mono, exposed as `--font-geist-sans` / `--font-geist-mono` |
| Icons | No icon library. The only glyphs are text (`←`, `+`, `·`) |
| CSP | `next.config.ts`: `style-src 'self' 'unsafe-inline'`, `font-src 'self' data:`. `next/font/google` self-hosts at build time, so a Google Fonts font loaded that way is CSP-safe; a `<link>` to fonts.googleapis.com would be blocked |

## Baseline route list (from `next build`)

Pages:

| Route | File | Kind |
| --- | --- | --- |
| `/` | `app/page.tsx` | static |
| `/_not-found` | `app/not-found.tsx` | static |
| `/capsules` | `app/capsules/page.tsx` | static shell, client fetch |
| `/capsules/[id]` | `app/capsules/[id]/page.tsx` | dynamic, client fetch (share target) |
| `/device` | `app/device/page.tsx` + `app/device/VirtualDevice.tsx` | static shell, client relay |
| `/pair` | `app/pair/page.tsx` + `app/pair/PairPanel.tsx` | dynamic (`?code=`), QR target |
| `/privacy` | `app/privacy/page.tsx` | static |
| `/publish` | `app/publish/page.tsx` | static shell, client |
| `/terms` | `app/terms/page.tsx` | static |
| `/robots.txt` | `app/robots.ts` | static |
| `/sitemap.xml` | `app/sitemap.ts` | static |

API (all DO NOT TOUCH):

```
/api/capsules                    GET list (q, tag, limit, cursor, include), POST publish
/api/capsules/[id]               GET detail, DELETE
/api/capsules/[id]/install       POST
/api/capsules/[id]/report        POST
/api/devices                     GET
/api/devices/[id]                GET, DELETE
/api/devices/[id]/action         POST
/api/devices/[id]/capsule        GET, PUT
/api/devices/[id]/state          GET, POST
/api/devices/claim               POST
/api/devices/register            POST
```

## Shared components

| Component | File |
| --- | --- |
| `SiteHeader` (logo "H" tile + wordmark, nav: Marketplace, Publish, Devices, GitHub) | `components/SiteHeader.tsx` |
| `SiteFooter` (5 links + disclaimer) | `components/SiteFooter.tsx` |
| `CapsuleCard` (marketplace tile, a single link) | `components/CapsuleCard.tsx` |
| `VirtualDevice` (page-local) | `app/device/VirtualDevice.tsx` |
| `PairPanel`, `Remote` (page-local) | `app/pair/PairPanel.tsx` |

Buttons, inputs, chips and cards are not components: they are repeated class strings
(`PairPanel.tsx` has `BUTTON`/`PRIMARY`/`QUIET`/`CARD` constants).

There are no modals, sheets, dialogs or toasts. The capsule page and publish page show inline
`role="status"` notices; `<details>` disclosures show capsule JSON.

## States per page

| Page | Loading | Empty | Error | 404 / missing |
| --- | --- | --- | --- | --- |
| `/` | none | none | none | none |
| `/capsules` | 3 pulsing skeleton cards | "No capsules match that yet." | red card + "Try again" | n/a; "Load more" has its own "Loading…" label |
| `/capsules/[id]` | pulsing title + block | n/a | "The marketplace is unavailable" + "Try again" | "This capsule is not available" + back link |
| `/publish` | "Publishing…" label | n/a | validation error list, failure card | n/a; success card "Published." |
| `/device` | "connecting…", "Getting a pairing code…" | "Paired. Send a timer…" | "cloud offline" | n/a |
| `/pair` | "Pairing…" label | "Nothing reported yet." | failure status line, device error line | n/a |
| `/privacy`, `/terms` | static | | | |
| any unknown URL | | | | `app/not-found.tsx` "That page isn't here" |

Not present: no `loading.tsx`, no `error.tsx` route boundary, no global-error. Listed as missing,
not to be added.

## DO NOT TOUCH

- Every file under `app/api/**`, `lib/**`, `models/**`, `scripts/**`, `vendor/**`, `tests/**`.
- `next.config.ts` (security headers, CSP), `vercel.json`, `postcss.config.mjs`,
  `eslint.config.mjs`, `tsconfig.json`, `vitest.config.mts`, `package.json`, `package-lock.json`,
  `.env.example`.
- No middleware exists.
- Data: MongoDB collections via `models/*` (Capsule, DeviceSession, MutationReceipt, RateBucket,
  RelayDevice); seed in `scripts/seed.ts`. No capsule JSON files in the repo.
- What the HarmonyOS app (and the ESP32 board) calls: `GET /api/capsules?q=`,
  `GET /api/capsules/{id}`, `POST /api/capsules`, `DELETE /api/capsules/{id}`,
  `POST /api/capsules/{id}/install`, `POST /api/capsules/{id}/report`, all `/api/devices/**`,
  and the URLs it opens or encodes in QR codes: `/pair?code=…`, `/capsules/{id}`, `/device`.
- Marketplace curation/hide logic: `lib/list-query.ts` (`buildListFilter`), report-to-hide in
  `app/api/capsules/[id]/report/route.ts`. Lewis owns these.
- In TSX: every `onClick`, `onChange`, `onSubmit`, state hook, fetch call, `href`, `key`,
  `aria-*` value that carries state, `data-testid`, and all visible text.

## Dark mode

Supported by `@media (prefers-color-scheme: dark)` overriding `--h-*` on `:root`. No toggle,
no `data-theme` attribute anywhere. The virtual device screen is always dark (`#0b0f14`).

## Assets

- Logo: a CSS "H" in a 32px blue rounded square in `SiteHeader`. No SVG logo file.
- Favicon: `app/favicon.ico` (Next default).
- Images: `public/shots/home.jpg`, `consent.jpg`, `detail.jpg` (landing hero and marketplace
  section, via `next/image`), `public/shots/state.jpg` (unused in pages).

## Hard-coded values (pages + components, 2,211 lines of TSX/CSS)

- Hex colours in TSX: 2 (`VirtualDevice.tsx`: `#0b0f14` screen, `#ffb37a` "Time is up").
  Plus 23 `text-white` / `bg-white` / `white/NN` uses (buttons on brand, the device screen, the QR
  backing).
- Font sizes: 158 arbitrary `text-[NNpx]` and 16 named sizes (`text-3xl` etc). Clusters:
  capsule detail 34, publish 25, PairPanel 22, landing 15, VirtualDevice 13.
- Radii: 36 `rounded-full` (all buttons and chips are pills), 25 `rounded-card`, 8
  `rounded-input` (24px), 8 `rounded-2xl`, 2 `rounded-xl`, 1 `rounded-[44px]`, 1 `rounded-[10px]`.
- Shadows: 17 `shadow-[var(--h-shadow)]` on cards and secondary buttons.

## Baseline checks

| Check | Result |
| --- | --- |
| `npm ci` | ok (npm audit reports existing advisories, untouched) |
| `npm run lint` | pass, 0 warnings |
| `npm run typecheck` | fails on a clean checkout with `app/layout.tsx(38,50): Cannot find name 'LayoutProps'` because the type is generated by Next into `.next/types`; passes after `next build` (or `next typegen`). Treated as the baseline: pass after build |
| `npm test` | 21 files, 461 passed, 37 skipped |
| `npm run build` | pass, routes as listed above |

## Marketplace baseline

Source: `/capsules` calls `fetchCapsules` (`lib/client/api.ts`) → `GET /api/capsules` →
MongoDB `Capsule.find(buildListFilter(...))`, newest first, 20 per page, "Load more" with cursor.
Paging the production API (`https://harmoniser-web.vercel.app/api/capsules?limit=50`) on
2026-10-04 01:2x returned **115 items** (first page shows 20, then "Load more"). Ids saved in
`docs/web-redesign/before/marketplace-ids.txt`.

## Screenshots

Captured all page routes at 390px and 1280px, light mode, into `docs/web-redesign/before/`.
Method: `next start` of the baseline build on localhost with `DEVICE_RELAY_STORE=memory` (runtime
env only, no file change), driven by `playwright-core` installed in a scratch directory outside
the repo using the system Chrome. GET requests to `/api/capsules*` were answered from the
production API so the marketplace and detail pages show real data. No project dependency added.

The same script audits each page; `before/audit.json` holds the result. Baseline findings:

- At 390px every page scrolls sideways (document 477px wide): the header nav does not wrap.
- Header nav links are 33px tall, the logo link 32px, footer links 20px, tag chips 36px,
  several "Copy"/"Load an example" buttons 36px: below 44px.
