# AI workflow log

This project is built with AI assistance during HackYeah 2026 (Kraków, 3–4 October 2026). This file
records what the agents did, what was verified, and what remains a human decision.

## Agents and tools used

| When | Agent / model | Role |
| --- | --- | --- |
| 2026-10-03 | OpenAI Codex (GPT-5.x, desktop app) | Repo setup, validator port, API, UI, tests, docs |
| 2026-10-03 | Instinct brief (“Build the capsule marketplace”, written 2026-10-03 20:12 CEST) | Source requirements for the marketplace: API contract, collections, ownership model, parity and UI rules |

No other model, MCP server or skill was used to generate code in this repository.

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

## Human review and verification

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` are run before each commit; the
  results belong in the commit message or the PR.
- The parity suite mirrors the app's own unit tests, and `npm run parity` fails when upstream
  changes at the pinned commit.
- Verified locally and on Vercel: the production build serves `/`, `/capsules`, `/publish`,
  `/device`, `/privacy`, `/terms`, `robots.txt` and `sitemap.xml` with 200s, security headers are
  applied, and the API returns the shared error shape (503) before a database is configured. An
  anonymous temporary Vercel deployment (`vercel deploy --temporary`) built and served the same
  pages before the Vercel account/Atlas setup that only Lewis can perform.
- Not yet verified by a human: the visual match against the native app on a device, the emulator
  import of a marketplace download, and the live deployment smoke test. These must be reported as
  unverified until Lewis or Ash confirms them.
- Legal text is draft material for the hackathon and needs review before any commercial release.

## Limits of the generated work

- No accounts, Huawei identity or device relay are implemented; they are documented as later phases.
- Moderation (reports, hiding) is a demo heuristic, not fraud-resistant.
- The CSP still allows Next's inline bootstrap.
