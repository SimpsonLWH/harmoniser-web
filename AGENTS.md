# harmoniser-web — agent guide

Project-scoped rules for this repository.

## What this is

The web side of Harmoniser: landing, legal pages and the anonymous capsule marketplace. The
HarmonyOS app lives in `Akshaz7/capsules-harmonyos` and is not edited from here; app changes are
delivered as a spec in `docs/native-integration.md`.

## Hard rules

- Next.js App Router, no `src/` directory, TypeScript strict, Tailwind, latest stable versions.
  Node runtime for every route that imports Mongoose; never Edge.
- Capsules are untrusted JSON. Re-validate on every publish with `lib/validator`; never `eval`, never
  `dangerouslySetInnerHTML`, never render capsule text as HTML.
- `lib/validator/` must stay faithful to the pinned upstream sources in `vendor/upstream/<sha>/`.
  After any app-side change, re-vendor, run `node scripts/update-parity-lock.mjs`, re-check the port
  and update the tests.
- One token scheme only: the anonymous device/app token in `X-Harmoniser-Token`. Store only its
  HMAC hash; never return it, log it, or put it in a URL. It is the publisher credential and the
  install ID.
- Never commit secrets. `.env.local` is ignored; `.env.example` holds placeholders only.
- `vercel.json` keeps `regions: ["fra1"]`; Atlas lives in Frankfurt. Do not add paid dependencies.
- Do not claim live store availability, verified Huawei identity, TV/watch installs or real install
  counts that the code cannot support.

## Workflow

- `npm run lint && npm run typecheck && npm test && npm run build` before every commit.
- Commit in small, working steps with descriptive messages.
- Record material AI-assisted work in `AI_WORKFLOW.md` (one entry per coherent change).
- Keep public legal text honest and free of company names or personal data.
