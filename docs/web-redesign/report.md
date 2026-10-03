# Web redesign: report (T8)

Branch `redesign-web`, rebased on `origin/main` at `ab3a8f4` (Merge PR #3) on 2026-10-04.
Not merged, nothing pushed to `main`. Over to Ash and Lewis.

**Preview:** https://harmoniser-ekdp2u3a4-lewis-simpsons-projects.vercel.app
(branch alias: https://harmoniser-web-git-redesign-web-lewis-simpsons-projects.vercel.app).
Vercel reported the build as successful. The preview has Vercel deployment protection on: without
a login it redirects (302) to Vercel sign-in, so I could not open it from here. Members of Lewis's
Vercel team can.

## Definition of done

- [x] `docs/web-redesign/recon.md` written before any code edit (commit `docs: web redesign recon…`
      is the first on the branch).
- [x] One tokens file added and used everywhere: `app/tokens.css`, imported by `app/globals.css`
      and mapped into Tailwind (`@theme inline`). The remaining raw values are listed under
      "Hard-coded values left" below, with reasons.
- [x] Every route from recon restyled, in light and dark mode (11 page states, see the audit).
- [x] Route list before and after is identical (`next build` route table diffed: no difference).
- [x] No changes to API routes, server code, data files, middleware, env or deploy config. Proof
      below.
- [x] Build, lint, type check and tests pass, same as the baseline.
- [x] Every route checked at 360, 390, 768 and 1280px, light and dark: 88 checks, 0 issues (no
      sideways scroll, no truncated buttons, tap targets at least 44px, focus ring on the first 15
      tab stops). The baseline failed at 390px on every page (sideways scroll to 477px).
- [x] Marketplace shows the same items as the baseline: 115 of 115 (20, then Load more), same ids.
      Lewis hid nothing in between.
- [x] Branch `redesign-web` pushed; Vercel preview link above (behind Vercel login).
- [x] Nothing merged or pushed to `main`.

## Checks

| Check | Baseline (main `f13b42d`) | After (rebased branch) |
| --- | --- | --- |
| `npm run lint` | pass, 0 warnings | pass, 0 warnings |
| `npm run typecheck` | pass after `next build` (fails before it on `LayoutProps`, a Next-generated type) | same |
| `npm test` | 461 passed, 37 skipped | 461 passed, 37 skipped |
| `npm run build` | pass | pass |
| Route table | 22 entries | identical |

## Proof that no logic, API, data or config files changed

```
$ git diff --stat origin/main -- app/api lib models scripts vendor tests middleware.ts \
    next.config.ts vercel.json package.json package-lock.json .env.example \
    postcss.config.mjs eslint.config.mjs tsconfig.json vitest.config.mts
(no output)

$ git diff --stat origin/main -- . ':(exclude)docs/web-redesign'
 AI_WORKFLOW.md               |  14 ++
 app/capsules/[id]/page.tsx   | 422 ++++++++++++++++++++++---------------------
 app/capsules/page.tsx        | 100 +++++-----
 app/device/VirtualDevice.tsx |  32 ++--
 app/device/page.tsx          |  16 +-
 app/favicon.ico              | Bin 25931 -> 1699 bytes
 app/globals.css              | 353 +++++++++++++++++++++++++++++-------
 app/layout.tsx               |   9 +-
 app/not-found.tsx            |  23 ++-
 app/page.tsx                 | 102 +++++------
 app/pair/PairPanel.tsx       |  53 +++---
 app/pair/page.tsx            |   6 +-
 app/privacy/page.tsx         |  26 +--
 app/publish/page.tsx         |  74 ++++----
 app/terms/page.tsx           |  28 +--
 app/tokens.css               |  82 +++++++++
 components/CapsuleCard.tsx   |  45 ++---
 components/Icons.tsx         |  87 +++++++++
 components/Logo.tsx          |  14 ++
 components/SiteFooter.tsx    |  29 ++-
 components/SiteHeader.tsx    |  35 ++--
 components/StatusBlock.tsx   |  30 +++
 22 files changed, 1025 insertions(+), 555 deletions(-)
```

In the changed TSX, every behaviour-bearing attribute (`onClick`, `onChange`, `onSubmit`, `href`,
`disabled`, `value`, `id`, `htmlFor`, `type`, `placeholder`, `maxLength`, `role`, `aria-*`,
`data-testid`) was extracted and compared with `main`, file by file: identical, except for
`aria-hidden="true"` moving from the old "H" logo span to the new decorative SVGs, and three
static React `key`s on the landing feature icons. Hooks, fetch calls, handlers and state are the
lines above `return (` in each page and were not edited. `app/layout.tsx` only swaps the Geist
sans font for Manrope (Geist Mono stays for code).

## Files changed, by phase

0. Recon: `docs/web-redesign/recon.md`, `docs/web-redesign/before/*` (22 PNGs, `audit.json`,
   `marketplace-ids.txt`).
1. Foundation: `app/tokens.css` (new), `app/globals.css`, `app/layout.tsx`.
2. Shared components: `components/Logo.tsx` (new), `components/SiteHeader.tsx`,
   `components/SiteFooter.tsx`, `components/Icons.tsx` (new), `components/CapsuleCard.tsx`,
   `components/StatusBlock.tsx` (new), `app/not-found.tsx`, `app/favicon.ico`.
3. Pages: `app/page.tsx`; `app/capsules/page.tsx`; `app/capsules/[id]/page.tsx`;
   `app/publish/page.tsx`; `app/device/page.tsx`, `app/device/VirtualDevice.tsx`;
   `app/pair/page.tsx`, `app/pair/PairPanel.tsx`; `app/privacy/page.tsx`, `app/terms/page.tsx`.
4. Verify: `docs/web-redesign/after/*` (22 PNGs at 390 and 1280 light, `audit.json` for all 88
   checks), `AI_WORKFLOW.md` entry, this report.

Each concern is its own commit (`git log --oneline origin/main..redesign-web`), so any page can
be reverted alone. The legacy colour aliases were kept during the page commits and removed in one
commit at the end; reverting a single page commit after that needs the alias commit reverted too.

## Design decisions to review

- **Cards on the page background use `--surface` with a 1px `--line-2` border**, not `--card`.
  `--card` (#F5F7FB) on `--bg` (#F2F4F9) is almost invisible; the spec allows "--surface on
  --card areas", and `--card` is used for inner blocks (install, permissions, code, skeletons).
  Same for the marketplace tile.
- Spec tokens kept exactly; additions in `tokens.css`, marked as such: `--on-blue`, `--r-input`
  (14px), `--header-bg`, `--frame-border`, `--backdrop`, `--shadow-soft`, `--focus-ring`, and
  `--device-*` for the always-dark virtual wrist screen on `/device`.
- No theme toggle existed, so dark mode is `prefers-color-scheme` only, using the spec's
  `:root:not([data-theme="light"])` selector. None added.
- Breakpoints `sm/md/lg` are redefined to 600/960/1280 (the spec's), so `sm:` means 600px now.
- Manrope is loaded with `next/font/google` (self-hosted at build time). A `<link>` to Google
  Fonts would be blocked by the site's CSP (`font-src 'self' data:`), which was not touched.
  The repo ships no HarmonyOS Sans files; the stack still lists "HarmonyOS Sans" first.
- Icons: there was no icon library. `components/Icons.tsx` adds six inline SVG glyphs (rounded
  stroke 1.8) for icon tiles and state circles. All decorative and `aria-hidden`.
- Favicon: `app/favicon.ico` replaced in place with the spec logo (16/32/48px). Using
  `app/icon.svg` would have added a route, so it was not used.

## Contrast (WCAG, 4.5:1 needed)

| Pair | Light | Dark |
| --- | --- | --- |
| `--text-2` on `--card` | 5.53 | 6.78 |
| `--text-2` on `--bg` | 5.39 | 8.28 |
| white on `--blue` | 5.17 | 5.17 |
| `--chip-text` on `--chip` | 6.65 | 7.27 to 9.12 (rgba chip over card/surface/bg) |
| `--orange-text` on `--orange-tint` | 5.38 | 8.19 |
| device `--device-text-2` on `--device-bg` | 8.28 | |
| device `--device-alert` on `--device-bg` (dark) | | 11.22 |

## Hard-coded values left

- `bg-white` behind the QR code on `/device`: phone cameras need a white quiet zone around a
  black-on-white code, in both themes.
- `text-[19px]` for the wordmark and the landing subline at 600px+: both sizes are given by the
  spec but are not tokens.
- `rounded-[14px]` (segmented track, code pills, permission rows, device rows) and
  `rounded-[11px]` (segments inside a 3px-padded 14px track) follow the spec's 14px input radius;
  `rounded-[44px]` keeps the virtual device's hardware shape.
- `tracking-[-1px]`, `tracking-[-0.5px]` on big numbers; `max-w-[420px]`, `[480px]`, `[760px]`
  column widths; `h-[168px]`/`h-[420px]` skeleton heights.
- No hex colours remain in TSX. All colours come from `tokens.css`.

## Could not be done without changing behaviour or text

- Marketplace tile "existing action as a full-width button": the tile is a single link with no
  button or button text. Adding one would add text and a second focus stop, so the whole tile
  stays the link.
- "Origin chip" (how a capsule was made): the site has no origin data. The existing
  "Widget-ready"/"In the app" and schema-version labels are shown as chips in that spot.
- Capsule frame "title bar actions as 44px icon buttons": the page's actions are text buttons
  (Download capsule, Copy JSON). They sit in the frame footer unchanged; no share/close/install
  icon actions exist.
- The capsule renderer patterns (one card per list item, big score numbers, blue result card,
  progress bar): the web site does not render capsule UI, only its JSON, so there is nothing to
  restyle. The big-number style is applied where the site does show numbers (virtual device timer
  and counter, the pairing page's remote state).
- The landing hero's optional CSS capsule-frame preview: skipped. The real app screenshots are
  content with alt text, not decoration; they now sit in the frame radius and shadow.
- Text: only decorative characters went: the "H" letter of the old logo (`aria-hidden`) and the
  `·` between install count and widget label on tiles (`aria-hidden`; the label is now a chip).
  Tag filter labels stay lowercase because that is their existing text.

## Missing states noticed, not added

- No `loading.tsx` or `error.tsx` route boundaries anywhere; no `global-error`.
- `/` and the legal pages have no states (static).
- `/publish` has no state for a clipboard failure on "Copy token"; the capsule page's "Copy JSON"
  and "Copy" likewise fail silently.
- The marketplace error state shows the API's message as its title and has no caption of its own.
- `/pair` shows nothing while the device list loads.

## Screenshots

- Before: `docs/web-redesign/before/<route>-<390|1280>-light.png` (baseline build, `main`
  `f13b42d`).
- After: `docs/web-redesign/after/<route>-<390|1280>-light.png`.
- Audit of all 88 width/theme/route combinations: `docs/web-redesign/after/audit.json`.
- Route keys: home, capsules, capsule-detail, capsule-missing, publish (after Load an example +
  Validate), device, pair, pair-scanned, privacy, terms, not-found.
- Method: local `next start` with `DEVICE_RELAY_STORE=memory` (runtime env only), `playwright-core`
  installed in a scratch folder outside the repo, the system Chrome, and GET `/api/capsules*`
  answered from the production API (read only). No project dependency added.

## Risks for whoever merges

- **Lewis's curation work** touches `lib/list-query.ts` and the API, which this branch does not
  touch. Conflicts are only likely if Lewis also edits `app/capsules/page.tsx` or
  `components/CapsuleCard.tsx` markup (for example a "hidden" badge); those files were rewritten
  for styling, so a conflict there would need manual merging of class names.
- Any open branch that edits page markup (the `codex/*` branches) will conflict on class names.
  Resolution is mechanical: keep its logic, apply this branch's classes.
- `sm:` now means 600px instead of 640px and `lg:` 1280px instead of 1024px. New code written
  against Tailwind defaults will break at slightly different widths.
- The favicon changed; browsers cache it, so the old one may linger.
- Manrope is fetched from Google at build time by `next/font`; a build without network access
  fails (as Geist already did before).
- The preview is behind Vercel login, so I have not seen it with production data; the local
  audit used the production API's data.
