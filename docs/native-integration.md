# Native integration spec — marketplace

For the Harmoniser app (`Akshaz7/capsules-harmonyos`). The marketplace itself lives in this
repository; nothing here requires editing the app's Web layer, and the marketplace never executes a
capsule.

## Goal

Search → detail → Install → existing validator/import preparation → “From the marketplace” consent
→ Run. Cancel saves nothing. The app remains the only place that decides what a capsule may do.

## API contract the app should use

Base URL: the deployed site (`NEXT_PUBLIC_SITE_URL`).

| Call | Purpose |
| --- | --- |
| `GET /api/capsules?q=&tag=&limit=&cursor=` | Search/list. Returns `capsules[]` with `id`, `name`, `description`, `tags`, `schemaVersion`, `installs`, `widget`, `widgetReason`, `createdAt`, `updatedAt`, and `nextCursor` |
| `GET /api/capsules/{id}` | Detail including the raw `capsule` payload and `ETag` (`contentHash`) |
| `POST /api/capsules/{id}/install` | Best-effort install intent after a deliberate import; deduplicated per device token for 24 h |
| `POST /api/capsules/{id}/report` | `{reason}` one of `spam`, `unsafe`, `broken`, `other` |

Headers: `X-Harmoniser-Token: <device token>` on install/report. The app should generate one random
token with at least 32 bytes of entropy on first run, store it in Preferences, and reuse it as both
the install ID and the publishing credential. It is the only owner credential; the server stores
just its HMAC hash.

Error shape: `{error:{code,message,details?}}`. Treat network failure as non-blocking: the capsule
import itself must never depend on the marketplace being reachable.

## Import rules (must keep holding)

- Download the capsule **only** into the existing import flow: size check (8 KiB), full validator
  pass, fresh local capsule id, and no inherited permission grants or runtime state.
- The consent sheet should say the capsule came **from the marketplace**, then behave exactly like a
  local one: per-permission allow/deny, denial logged and enforced by the gatekeeper.
- Save only after the user runs the capsule. Cancel must save nothing.
- Show the widget option only when `routeCapsule` returns `true` and the Form Kit flow exists; the
  marketplace labels capsules the same way, but the app decides.
- No auto-run on download or deep link. Deep links should only be added once the app's URL handlers
  are registered and tested; until then the browser ships a JSON download and Import instructions.

## “Show on another device”

Keep this as a note in the native gatekeeper, next to the permissions: a capsule sent to another
device still passes that device's own permission checks, and the phone's grants never travel. The
relay endpoints (`/api/devices/**`) are Keanu's workstream; this repo only reserves
`models/DeviceSession.ts` (a short-lived word-phrase pairing session keyed by hashes) and the shared
DB/env contract.

Relay constraints to keep in mind: Vercel cannot reach a device on a venue LAN, so the device must
poll outbound; sessions must expire (10 minutes is the placeholder); sends need an acknowledgement
before the UI can claim success; and no capsule may leave the phone without the gatekeeper.

## Capability matrix (be honest in the app and on the slide)

| Destination | State |
| --- | --- |
| Phone (API 20+) | Supported, tested on the HackYeah emulator |
| Home-screen widget (2×2 / 2×4) | Supported when the widget router allows the capsule |
| TV / HarmonyOS watch | Not implemented; show as “coming next” |
| ESP32 wrist prototype | Lab stand-in over the local network, not a Huawei device, not HarmonyOS |

## Suggested app-side ticket

1. Add a `MarketplaceClient` beside the existing sharing code: list/search, detail, install-intent.
2. Add a Marketplace screen: search box, tag chips, capsule cards (name, description, tags, widget
   badge), detail view with permissions and JSON download.
3. Wire Install to `ImportFlow`: validate → fresh id → “From the marketplace” consent → run.
4. Generate and persist the device token once; send it only on install/report.
5. Report failures without blocking: show the friendly offline state, keep the capsule JSON path
   available for manual import.
