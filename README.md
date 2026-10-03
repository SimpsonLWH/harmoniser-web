# harmoniser-web

The web side of **Harmoniser**: the app landing page, the privacy/terms pages an app-store release
needs, and the anonymous capsule marketplace (public API + catalogue) for the HarmonyOS app in
[`Akshaz7/capsules-harmonyos`](https://github.com/Akshaz7/capsules-harmonyos).

The marketplace is a HackYeah 2026 prototype. Capsules are untrusted JSON, never code: the app
validates every capsule against its own schema and asks the user to allow each permission before
anything runs.

**Live:** <https://harmoniser-web.vercel.app> (Vercel project `harmoniser-web`, region `fra1`,
MongoDB Atlas in Frankfurt).

## Stack and versions

| Part | Version |
| --- | --- |
| Next.js (App Router, no `src/`, Turbopack) | 16.3.8 — the patched release from the September 2026 security bulletin |
| React / React DOM | 19.2.8 |
| TypeScript | strict, latest 5.x |
| Tailwind CSS | 4.x |
| Mongoose / MongoDB Atlas | 9.10.4 |
| Vitest | 5.x |
| Node.js | 22 LTS locally (`engines: >=22`); Vercel runs the project default 24.x |

`npm audit --omit=dev` reports 0 production vulnerabilities; the five high-severity advisories are
in the ESLint dev toolchain and are tracked, not shipped.

## Routes

| Page | What it is |
| --- | --- |
| `/` | Landing page for the app (advertisement page for store listings) |
| `/capsules` | Marketplace catalogue: search, tag chips, paged cards |
| `/capsules/[id]` | Capsule detail: permissions, widget suitability, JSON, install, report, owner delete |
| `/publish` | Paste/upload a capsule, validate it, choose the public metadata, publish |
| `/device` | Virtual device: a browser tab that pairs and shows a timer or counter like the ESP32 companion |
| `/pair` | Pairing page behind a device's QR code (`?code=three-word-phrase`) |
| `/privacy`, `/terms` | GDPR + Polish-law pages, no company named, contact via the issue tracker |

## Local development

```sh
nvm use 22            # or any Node >= 22
npm install
cp .env.example .env.local   # fill in MONGODB_URI and APP_HMAC_SECRET
npm run dev

npm run lint
npm run typecheck
npm test
npm run build
```

MongoDB is only needed for the API routes and the seed script; the landing and legal pages build and
run without it.

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | API + seed | Atlas connection string (Frankfurt, least-privilege user); must include the database name (`/harmoniser`) — a path-less URI silently targets MongoDB's default `test` database |
| `APP_HMAC_SECRET` | API + seed | HMAC key for owner-token hashes and rate-limit IP buckets |
| `ALLOWED_ORIGINS` | API | Exact browser origins allowed to mutate (comma-separated); native clients send no Origin |
| `NEXT_PUBLIC_SITE_URL` | recommended | Public base URL for metadata, sitemap and robots |
| `VALIDATOR_REVISION` | optional | Label stored on each published capsule (`web-0.1.0` by default) |
| `SEED_OWNER_TOKEN` | seed only | Owner token for the example capsules; generated and printed once if unset |

## API

All mutating routes require the anonymous device token in the `X-Harmoniser-Token` header
(32–256 base64url characters). The server stores only `HMAC-SHA-256(secret, token)`; the token is
never returned in any response. It is both the publisher credential and the install ID.

| Route | Method | Notes |
| --- | --- | --- |
| `/api/capsules` | `GET` | `q` (≤100 chars, `$text` search), `tag` (exact, lowercase), `limit` 1–50 (default 20), opaque `cursor`. Visible capsules only, deterministic `_id` order, `no-store` |
| `/api/capsules` | `POST` | `{capsule, name?, description?, tags?}`; envelope ≤12 KiB, capsule ≤8 KiB UTF-8 canonical; full recursive validation; 201 with `{id, contentHash}`; duplicates → 409 with the existing public id |
| `/api/capsules/[id]` | `GET` | 404 for hidden/deleted/unknown ids; `ETag: "<contentHash>"`; `If-None-Match` → 304 |
| `/api/capsules/[id]` | `DELETE` | Owner token required, constant-time hash comparison; soft-deletes and removes the public payload |
| `/api/capsules/[id]/install` | `POST` | Best-effort install intent, deduplicated per principal for 24 h; never runs anything |
| `/api/capsules/[id]/report` | `POST` | Fixed reason codes only; deduplicated; the third accepted report hides the capsule immediately |

Errors always use `{"error":{"code","message","details?"}}` with 400 (invalid), 401 (no token),
403 (forged token/origin), 404, 409 (duplicate), 413 (too large), 415 (content type),
429 (rate limit, with `Retry-After`), 503 (database unavailable). Reads are open CORS; browser
mutations are restricted to `ALLOWED_ORIGINS` and the request's own host; native clients (no
`Origin`) are gated by the token and rate limit instead. Every Mongoose route runs on the Node
runtime with one cached connection per instance and `regions: ["fra1"]`.

Rate limiting uses `RateBucket` documents keyed by `HMAC(secret, route + trusted IP + window)`,
incremented atomically; writes fail closed with 503 when the platform gives no client address.
Installs and reports use `MutationReceipt` documents with a 24 h TTL. These are demo-grade
heuristics, not fraud-resistant moderation.

## Validator parity

The marketplace must accept exactly what the app accepts. `lib/validator/` is a TypeScript port of
the app's ArkTS core:

- `lib/validator/validator.ts` ← `CapsuleValidator.ets` (+ `nameTypes` from `CapsuleProgram.ets`)
- `lib/validator/expr.ts` ← `Expr.ets` (lexer, parser, type checker, templates; capsule execution
  stays on the device and is intentionally not ported)
- `lib/validator/router.ts` ← `CapsuleRouter.ets`
- `lib/validator/types.ts` ← `CapsuleTypes.ets`

The upstream sources are vendored read-only in `vendor/upstream/<sha>/` with hashes in
`vendor/upstream/PIN.json`, and `npm run parity` re-fetches them at the pinned commit and fails if
anything changed (it also warns when upstream `main` has moved on). To re-vendor: copy the new
files, run `node scripts/update-parity-lock.mjs`, re-check the port against the diff, and update the
tests in `tests/`.

The port currently matches **`Akshaz7/capsules-harmonyos@452777e8ee51cf716101d15ce0202437a7497f2a`**
(schema v1.1: triggers, `pauseTimer`/`stopTimer`/`resetTimer`, literal-placeholder rejection).

## Seeding

`npm run seed:dry` validates and prints the five clearly-labelled example capsules without writing;
`npm run seed` upserts them by `contentHash` (insert-only, so re-running is safe) and creates the
indexes. The examples are synthetic: descriptions start with “Example”, every capsule carries the
`example` tag, and nothing implies real installs or real users.

## MongoDB indexes

`npm run indexes` reconciles every index the models declare (including the relay's unique
partial index on the live pairing code and its TTL cleanup index) and drops stray ones. Run it once
against a new database, after any model change, and after the first deploy: `autoIndex` is on, but
on Vercel every instance would otherwise build indexes on its own first request, and a request that
arrives while a unique index is still building can slip past it. `npm run indexes -- --dry` prints
what the collections hold today without writing.

## Deployment (Vercel `fra1` + Atlas Frankfurt)

1. Create the Vercel project from this repo and set the Node.js version to 22.x.
2. Add `MONGODB_URI`, `APP_HMAC_SECRET` (`openssl rand -base64 48`), `ALLOWED_ORIGINS`
   (the `*.vercel.app` origin plus any custom domain) and `NEXT_PUBLIC_SITE_URL` to Production.
3. Create the Atlas free cluster in Frankfurt with a least-privilege database user; Atlas must allow
   Vercel's dynamic addresses (strong generated password, TLS enforced).
4. Run `npm run seed` locally against the same `MONGODB_URI` to create indexes and examples.
5. Deploy and smoke-test: catalogue loads, publish → delete round-trip, `/privacy` and `/terms`
   reachable, `npm run parity` green.

## Security posture and known limits

- Capsule payloads are re-validated on publish; no `eval`, no raw HTML, metadata rendered as text.
- Tokens are hashed, IPs are hashed, DTOs are allowlists, and logs never include payloads or tokens.
- CSP currently allows Next's inline bootstrap (`'unsafe-inline'` for scripts); moving to per-request
  nonces via middleware is the next hardening step.
- The browser token lives in `localStorage` and is therefore XSS-exposed by nature; keep scripts
  minimal. Losing it means losing self-service delete — the UI says so.
- No accounts and no Huawei identity in v0. The identity phase is feature-flagged
  (`HUAWEI_AUTH_ENABLED`, `TEST_LOGIN_ENABLED`).
- The device relay (`/api/devices/**`, `/pair`, `/device`) is Keanu's workstream and is documented
  in `docs/device-relay.md`, including what has and has not been verified. Its MongoDB store has
  not yet run against a real database. `models/DeviceSession.ts` is an unused placeholder.
- Legal pages are hackathon-draft text written for GDPR + Polish law with no company named; review
  them with a qualified adviser before any commercial store release.

See [AI_WORKFLOW.md](./AI_WORKFLOW.md) for the AI-assisted work log and
[docs/native-integration.md](./docs/native-integration.md) for the app-side integration spec.
