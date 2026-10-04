# AI workflow log

This project is built with AI assistance during HackYeah 2026 (Kraków, 3-4 October 2026). This file
records what the agents did, what was verified, and what remains a human decision.

## Agents and tools used

| When | Agent / model | Role |
| --- | --- | --- |
| 2026-10-03 | OpenAI Codex (GPT-5.x, desktop app) | Repo setup, validator port, API, UI, tests, docs |
| 2026-10-03 | OpenAI Codex (GPT-5.x, desktop app) | Follow-up patch: ownerToken/installId split, `include=capsule`, strict `limit` parsing, built-in and privacy copy, read-only production/DB checks |
| 2026-10-03 | Instinct brief (“Build the capsule marketplace”, written 2026-10-03 20:12 CEST) | Source requirements for the marketplace: API contract, collections, ownership model, parity and UI rules |
| 2026-10-03 | Claude Code (Claude Opus, CLI agent) | Device relay: `/api/devices/**`, `/pair`, `/device`, `lib/devices/`, `models/RelayDevice.ts`, tests, `docs/device-relay.md` |
| 2026-10-04 | OpenAI Codex (GPT-5.x, desktop app) | Landing rebuild in the app's capsule-frame design: the eleven canvas frames as React components, the app icon layers as favicon and brand mark, light-only tokens, the copy sweep, and the copy guard test |
| 2026-10-04 | OpenAI Codex (GPT-5.x, desktop app) | SEO, AEO and GEO pass: per-page metadata and canonicals, a server-rendered first page of the catalogue, described-capsule sitemap entries, explicit AI crawler rules, `llms.txt` and `llms-full.txt`, JSON-LD (WebSite, SoftwareApplication, FAQPage, BreadcrumbList) and the landing FAQ |
| 2026-10-04 | Claude Code (Claude Opus, CLI agent) | Copy fix only: the cloud AI wording on the landing page, the privacy page, the FAQ and `llms.txt`, rewritten to match the app's `redesign/app` branch at `2a432f1` (providers outside the EU allowed by default), checked by reading the app source; `tests/seo.test.ts` updated to pin it |
| 2026-10-04 | Claude Code (Claude Opus, CLI agent) | Copy fix only: Claude by Anthropic (outside the EU) is the only cloud provider in the app's `redesign/app` branch at `78311ae`, so the Mistral, EU-only and non-EU switch wording is removed from the landing page, the privacy page, the FAQ, `llms.txt` and the cloud badge label, checked by reading the app source; `tests/seo.test.ts` pins the new wording and fails if the old claims return |

The device relay work also used the Chrome DevTools MCP server to try `/pair` and `/device` in a
browser. No other model, MCP server or skill was used to generate code in this repository.

## What was generated

- The Next.js 16.3.8 / React 19.2.8 / Tailwind 4 scaffold via `create-next-app`, then this repo's
  code: landing, legal pages, catalogue, publish flow, detail page, API routes, Mongoose models,
  rate limiting, anonymous ownership, seed script and tests.
- `lib/validator/*` is a TypeScript port of the app's ArkTS validator, expression parser/type
  checker and widget router, taken from the sources vendored at
  `vendor/upstream/452777e8ee51cf716101d15ce0202437a7497f2a/`. Capsule execution (the interpreter)
  was deliberately not ported: the marketplace never runs a capsule.
- Screenshots on the landing page come from the team's own emulator stress test
  (`Harmoniser-test-artifacts/test-1-20261003-1820`), resized to 900 px wide.
- The landing page no longer uses those screenshots. The eleven new capsule frames are drawn in
  React from the canvas files (`Converter`, `Habits`, `Main`, `Packing`, `Pomodoro`,
  `PomodoroDark`, `Quiz`, `Split`, `Tennis`, `TennisFold`, `Water`), so the site shows the new
  design before the app build ships it. Only `Main` is interactive; the rest are labelled images.
- `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png`, `public/icon-1024.png` and
  `public/brand-icon.png` are composited in Python (Pillow) from the app's own
  `AppScope/resources/base/media/background.png` and `foreground.png` layers: background first,
  then the mark group scaled to 84% and centred, so it reads at 16 px.
- Site copy is checked by `tests/no-ai-tells.test.ts`: no em dashes or en dashes anywhere in the
  repo (the generated Next.js block in `AGENTS.md` is exempt because `next dev` rewrites it), and a
  short list of marketing phrases is banned. The site is fixed to light mode on purpose; the app's
  own dark mode appears only inside the `PomodoroDark` frame.
- Pairing codes: a real registration drew "islam-goofy-evil" from the EFF list, which is a random
  draw and also not acceptable on someone's screen. `lib/devices/phrase.ts` now removes 77
  sensitive words (belief and identity, violence, drugs, sex, illness) from the draw instead of
  retrying after generation, leaving 1,218 words and about 31 bits. Tests assert the blocklist
  only names real EFF words and that no generated code can contain one.
- Crawling and AI files: `app/robots.ts` now lists the documented AI agents explicitly and
  disallows `/api/` and `/pair` in every group; `app/sitemap.ts` keeps the static routes and adds
  visible capsules that have a publisher description, revalidated hourly with a fail-soft database
  read; `app/llms.txt` and `app/llms-full.txt` serve the same facts as the site and say plainly that
  `llms.txt` is an emerging convention rather than a ranking factor. Capsule pages gained
  `generateMetadata` (index only with a description) and the catalogue's first page is server
  rendered so capsule links are crawlable. The landing gained six FAQ answers rendered from the same
  array as its `FAQPage` schema. Numbers and behaviour come from the app source at `b54cbfe`.

## Human review and verification

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` are run before each commit; the
  results belong in the commit message or the PR.
- The parity suite mirrors the app's own unit tests, and `npm run parity` fails when upstream
  changes at the pinned commit.
- Verified locally and on Vercel: the production build serves `/`, `/capsules`, `/publish`,
  `/device`, `/privacy`, `/terms`, `robots.txt` and `sitemap.xml` with 200s and applies the security
  headers; the API returns the shared error shape (503) before a database is configured.
- Deployed to production on 2026-10-03 at <https://harmoniser-web.vercel.app> (Vercel `fra1`,
  Atlas Frankfurt). Against that deployment: the catalogue listed the five seeded examples, a
  publish returned 201, the new capsule appeared in a tag-filtered list, the first install counted
  and the second de-duplicated, delete returned 401 without a token and 403 with a wrong token, the
  owner token deleted it, and the detail route 404s afterwards. The report path is covered by unit
  tests but was not exercised against the live database.
- Not yet verified by a human: the visual match against the native app on a device, the emulator
  import of a marketplace download, and the live deployment smoke test. These must be reported as
  unverified until Lewis or Ash confirms them.
- Legal text is draft material for the hackathon and needs review before any commercial release.

## Limits of the generated work

- No accounts or Huawei identity are implemented; they are documented as later phases. The device
  relay is implemented, see the section below and `docs/device-relay.md`.
- Moderation (reports, hiding) is a demo heuristic, not fraud-resistant.
- The CSP still allows Next's inline bootstrap.

## Device relay (2026-10-03, Claude Code)

- Generated: the relay core in `lib/devices/` (pairing codes, device tokens, capsule rules ported
  from the ESP32 firmware, in-memory and MongoDB stores), the route files, the `/pair` and `/device`
  pages and their tests. The firmware's test vectors were copied into `tests/devices/vectors/`.
- Verified by the agent: lint, typecheck, the vitest suite, one production build, the firmware's
  `test_relay.sh` against `next dev` on the in-memory store, and a manual pass through `/device` and
  `/pair` in desktop Chrome.
- Not verified, and to be treated as such until a human confirms: the MongoDB store against a real
  database, a real board against these routes, and the pages on a real phone.

## Phone link and publishing proposal (2026-10-03, OpenAI Codex)

- Generated: `docs/phone-link-and-publishing.md`, a design proposal for linking the HarmonyOS phone
  to the web (browser shows a QR, the phone scans it and registers a random token), metadata-only
  library sync, publishing from both the web and the app, and a publish-time safety review
  (deterministic identifier scan, permission audit, model review, `[removed]` redaction).
- Verified: both web PRs are merged and production answers on `/`, `/capsules`, `/publish`, `/pair`,
  `/device`, `/privacy`; a register → claim → push → poll → state → unpair loop was run against
  production.
- Nothing in the proposal is built yet; the app-side table names the files Ash would need to touch.

## Two credentials, inline payloads and privacy copy (2026-10-03, OpenAI Codex)

- Generated: the browser's ownerToken/installId split in `lib/client/token.ts` (with a migration
  that copies a legacy single token into both, so existing capsule ownership and relay pairings
  survive), the call-site changes on `/publish`, the capsule detail page and `/pair`, strict
  `limit`/`include=capsule` parsing in `lib/list-query.ts`, `CapsuleSummaryWithCapsuleDto` in
  `lib/dto.ts`, README/native-integration/device-relay/privacy/terms copy, and tests
  (`tests/client-tokens.test.ts`, `tests/list-query.test.ts`, `tests/dto.test.ts`,
  `tests/pair-url.test.ts`).
- Verified by the agent: lint, typecheck, `npm test` (461 passed, 37 skipped; the MongoDB half of
  the relay conformance suite), `npm run build`, `npm run parity`, and a read-only production
  check of the catalogue's default shape, cursor walk, `robots.txt`/`sitemap.xml` and
  `nextCursor`.
- Read-only data checks against production Atlas on 2026-10-03 (no writes): database `harmoniser`;
  116 documents = 113 visible (108 `template` built-ins + 5 examples) and 3 deleted; 0 duplicate
  `contentHash` groups; the 108 built-ins are owned by one owner-hash group that does not match the
  current `SEED_OWNER_TOKEN`; the legacy `test` database still holds 108 copies and was left
  untouched.
- Not verified: the new `include=capsule` and strict-limit behaviour against the deployed API (the
  branch is not deployed), and any real phone/board usage. The privacy and terms pages remain
  hackathon drafts; the controller identity, private privacy contact and Atlas password rotation
  are Lewis's review items.

## Final safe pass: light-only build claims and Snap egress (2026-10-04, OpenAI Codex)

- Reviewed and built on PR #8 (`2da9a1b`, "fix(copy): describe cloud AI as the shipped app does")
  rather than rewriting the same files. Removed the dark-mode and system-theme promises from
  `app/page.tsx`, `components/landing/FoldDark.tsx` and the `app/globals.css` comment, because the
  inspected app branch has `theme/Flags.ets` `NEW_THEME=true` and
  `entryability/EntryAbility.ets` sets `COLOR_MODE_LIGHT`. The fold section now renders the light
  `PomodoroScreen`, not `PomodoroDarkScreen`.
- Removed the unverified "Four capsule permissions are enforced end to end" count from
  `components/landing/Bento.tsx`. The app schema declares nine permissions, so the copy describes
  the check without a count. Scoped the `components/landing/Status.tsx` lists: dropped the
  unqualified motion reading and separated capsule vibration from notifications that fire after
  the app closes.
- Added the Snap photo disclosure to `app/privacy/page.tsx`, `lib/seo/faq.ts` and
  `lib/seo/ai-files.ts`: the photo is read on the phone first and reaches the configured provider
  only if that read fails and the user lets the cloud try (`pages/Index.ets` `createFromPhoto`,
  `core/providers/CloudVision.ets`). Also pinned the single-key routing and remembered-consent
  wording in the provider paragraphs.
- Added `tests/landing.test.ts` for the light-only claims and extended `tests/seo.test.ts` for the
  Snap wording. Inspected app branch: `origin/redesign/app` at `f693252`; the exact demo build SHA
  is still unconfirmed, so the site says "current hackathon build".
- Corrected the non-EU default after rechecking `pages/AppSettings.ets` at `origin/redesign/app`
  `f693252` and at the trailer's demo commit `70f67d4`: `allowNonEu` defaults false ("Off by
  default"), so the copy now says providers outside the EU are off until Allow non-EU providers is
  enabled. This supersedes the earlier "allowed by default" wording.
- Not done in this pass: marketplace validator parity, the MIT license decision and the 11-listing
  cleanup. See the handoff note; the validator step was left out rather than shipped untested.
