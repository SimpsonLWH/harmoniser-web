# Device relay

How a capsule gets from the phone to another device (the ESP32 wrist companion, or a browser tab
open at `/device`) and how that device's state gets back. The device only makes outbound requests:
it registers, shows a QR code and a three-word phrase, then polls. The phone and the device need no
shared Wi-Fi and no IP address.

Code: `app/api/devices/**`, `app/pair/`, `app/device/`, `lib/devices/`, `models/RelayDevice.ts`,
tests in `tests/devices/`. The firmware's side of the same contract is `RELAY.md` in
`esp32-companion`; its `test_relay.sh` checks any implementation from outside.

```
device                          relay                              user (app, or /pair in a browser)
  | POST /register {hw,kind,fw}   |                                   |
  |------------------------------>|                                   |
  |<-- 201 {id,token,code,pair_url}                                   |
  | shows pair_url as a QR code, and the code under it                |
  | GET /{id}/capsule  (every 2 s)|   scans the QR code -> /pair?code=…, presses the button,
  |------------------------------>|   or types the phrase: POST /claim {code}
  |<-- 200 {claimed:false,...}    |<----------------------------------|
  |<-- 200 {claimed:true,...}     |   PUT /{id}/capsule {...}         |
  |<-- 200 {version:1,capsule:{}} |<----------------------------------|
  | POST /{id}/state {...}        |   GET /{id}/state                 |
  |------------------------------>|<----------------------------------|
```

## Two callers, two credentials

| Caller | Header | What it is |
| --- | --- | --- |
| User: the app, or the `/pair` page | `X-Harmoniser-Token: <token>` | The site's one anonymous token (README, "API"): made by the client, 32–256 base64url characters. Whoever claims a device owns it; the owner is stored as `hashPrincipal(token)`, never the token. |
| Device: the board, or a `/device` tab | `Authorization: Bearer <device token>` | Issued by the relay at registration, 43 base64url characters. Stored as an HMAC under `APP_HMAC_SECRET` with its own label, so it can never match a user-token hash. Registering again replaces it. |

The two are not interchangeable: a device token in `X-Harmoniser-Token` owns nothing, and a user
token as a bearer token is a 401. `Authorization: Bearer` is used for devices because that is what
the firmware sends; nothing on the user side reads it.

Errors use the site's envelope, `{"error":{"code","message"}}`. A device only looks at the status.

Request bodies: JSON, at most 1024 bytes, nested at most 8 deep, no NUL (raw or `\u0000`), no lone
surrogate. These are the board's own limits (`main/validate.c`), checked on the raw bytes before
parsing. No `Content-Type` is required on these routes (the capsule routes do require one).

## Device side

### `POST /api/devices/register`

```json
{"hw":"3f9c2a7be01d4c55","kind":"wrist","fw":"8a14f2c"}
```

`hw`: 1–64 characters of `A-Z a-z 0-9 _ -`, the device's own stable id. That covers 16 to 64 hex
digits (the board's hashed id) and the `web-` plus 32 hex digits a `/device` tab makes. It should be
long and unguessable: whoever knows a device's `hw` can register it again, which unpairs it. `kind`: 1–32 characters (`wrist`, `web`). `fw`: 1–64 characters.

`201 {"id":"dev_4b1f…","token":"…","code":"brave-otter-lamp","pair_url":"https://<site>/pair?code=brave-otter-lamp"}`

The same `hw` again gives the same `id` with a new token, code and `pair_url`; the old token and
code stop working, the device is unpaired, and its capsule, pending action and last state are
dropped. `version` and `action_seq` keep counting.

A browser request from another site's origin is refused (`403 origin_not_allowed`); the board sends
no `Origin` and `/device` is same-origin. Two first registrations of one `hw` at the same moment
give one device.

`400 invalid_registration`, `413`, `429 rate_limited` (300 registrations per client address per
5 minutes), `503 rate_limit_unavailable` if the platform gave no client address.

### `GET /api/devices/{id}/capsule`

```json
{"claimed":true,"version":3,"capsule":{"type":"counter","label":"Squats","count":0},
 "action_seq":7,"action":"increment","code":null,"pair_url":null}
```

- `version` starts at 0 and goes up by one with every capsule. `capsule` is `null` until one is sent.
- `action_seq` goes up by one with every action; `action` is the latest, or `null` (a new capsule
  drops a pending action without changing `action_seq`).
- While unpaired, `code` and `pair_url` hold the current pairing code. If the code has run out, this
  request makes a new one: that is how a renewed code reaches the device.
- `401 unauthorized` for a wrong or missing token **and for an unknown id**; the device then
  registers again.

### `POST /api/devices/{id}/state`

```json
{"type":"counter","label":"Squats","count":4,"seconds":0,"remaining_seconds":0,
 "running":false,"done":false,"motion":false,"version":3}
```

`204`, no body. `type` (`idle`, `timer`, `counter`) and a numeric `version` are required; the other
fields default to empty and are refused (`400 invalid_state`) if they have the wrong kind or range.
Unknown fields are dropped. The token is checked before the body is read.

A report is stored only while the device is paired. From an unpaired device it counts as a sign of
life and nothing else, and both pairing and unpairing clear what was stored, so a new owner never
sees what the device showed to the previous one.

## User side

Every request carries `X-Harmoniser-Token`. Browser requests must also come from an allowed origin
(`ALLOWED_ORIGINS`, or the site itself), as on the capsule routes; native clients send no `Origin`.
Without a valid token: `401 unauthorized`.

| Route | Body | Answer |
| --- | --- | --- |
| `POST /api/devices/claim` | `{"code":"brave-otter-lamp"}` | `200 {"id","kind"}`. `400 invalid_code` if it is not three words. `404 code_not_found` if no unpaired device has that code (wrong, used or expired). `409 too_many_devices` if this token already has 20 paired devices (the code is not used up). `429 rate_limited` with `Retry-After`. |
| `GET /api/devices` | | `200 {"devices":[{"id","kind","fw","version","capsule","last_seen_ms_ago"}]}`, oldest pairing first. |
| `PUT /api/devices/{id}/capsule` | a capsule, below | `200 {"version":N}`. `400 invalid_capsule` (or `invalid_json`), and then nothing changes. |
| `POST /api/devices/{id}/action` | `{"action":"increment"}` | `200 {"action_seq":N}`. `400 invalid_action`. Actions: `start`, `pause`, `toggle`, `reset`, `increment`, `motion_on`, `motion_off`. |
| `GET /api/devices/{id}/state` | | `200`: the device's last report plus `last_seen_ms_ago` (time since its last poll or report). Before the first report, `last_seen_ms_ago` alone. |
| `DELETE /api/devices/{id}` | | `204`. The device keeps its token, is unpaired, and gets a fresh code with its next poll. |

A device that is not yours, not paired, or does not exist is the same `404 not_found` on the last
four routes: ids are not confirmed to anyone but the owner.

### Capsules

The rules are the board's own (`main/capsule_json.c`), so the relay never stores a capsule the
board would refuse:

| Field | Applies to | Rules |
| --- | --- | --- |
| `type` | both | Required. `"timer"` or `"counter"`. |
| `label` | both | String, default empty. **Cut** to 47 bytes of UTF-8, never inside a character (not refused). |
| `seconds` | timer | Required. A number from 1 to 359999; a fraction is cut off (`1.9` is 1, `0.5` is refused). |
| `count` | counter | A number from 0 to 999999, default 0; a fraction is cut off. |
| `running` | timer | Optional boolean. `false` loads the timer paused; otherwise it starts on arrival. |
| `motion` | counter | Optional boolean (rep counting; a browser tab ignores it). |

Unknown fields are dropped. The device gets the cleaned capsule, not the bytes that were sent.

## Pairing

- The code is three lower-case words of 3–5 letters joined by hyphens, from the EFF Short Wordlist #1
  (1,296 words; the one entry with a hyphen, `yo-yo`, is left out: 1,295 words, about 31 bits).
  Attribution: `NOTICE`, and a line on `/pair` and `/device`.
- `claim` takes it as a person types it: any case, hyphens or spaces (`Brave Otter Lamp`).
- A code works once, and for 10 minutes from when it was made. From that moment a claim is a 404,
  and the device's next poll gets a new code. A paired device has no code.
- No two unpaired devices hold the same code at once (unique index; a clash is retried with a new
  code, five times, then `503`).
- `pair_url` is `<base>/pair?code=<code>`. The base is `NEXT_PUBLIC_SITE_URL` when that is an
  `https` URL that is not localhost (the deployed site or a custom domain); otherwise the origin the
  device's request came in on, so local development and a deployment whose variable is unset or
  still says localhost hand out a QR code that opens. Keep it under 85
  bytes for the board's QR code: `https://harmoniser-web.vercel.app/pair?code=…` is at most 61.
- `GET /pair?code=…` shows the words and a "Pair this device" button. If the code turns out to be
  used or expired, a field appears for typing the words the device shows now. Opening the page pairs
  nothing; the button claims the device for this browser's own anonymous token (made on first use,
  `lib/client/token.ts`). After pairing, the page can send a timer or a counter and shows what the
  device reports. Without `?code=` it has a field for typing the phrase.
- The app's scanner reads the same QR code: if the scanned text is a URL whose path is `/pair` with
  a `code` parameter, call `claim` with that code. A device claimed in a phone's *browser* belongs
  to that browser's token, not to the app's.
- `GET /device` is a virtual device: it registers as `kind: "web"`, shows the QR code and phrase,
  then behaves like the board (`lib/devices/machine.ts` mirrors `main/capsule.c` and
  `main/relay_sync.c`). Its registration lives in `localStorage` and is shared by every tab of the browser: a tab
  whose token is refused first looks for a registration another tab has stored and only otherwise
  registers again, and it never retries at once (2 seconds, then 4, 8, 16, 30 after refusals or
  failures in a row). "New device" starts over.

## Limits

| What | Limit |
| --- | --- |
| Claim attempts | 10 per user token and 300 per client address, per 5 minutes; right or wrong, each counts. The per-token limit is what holds guessing back; the per-address one is a generous backstop, because a whole venue shares one NAT address. |
| Registrations | 300 per client address per 5 minutes. |
| Paired devices | 20 per user token (`409 too_many_devices`). Checked just before the claim, so two claims at the same instant could end one over. |
| Request body | 1024 bytes, 8 levels of nesting. |
| Unpaired devices | Deleted by MongoDB 24 hours after their last request (TTL index on `purgeAt`), so abandoned `/device` tabs do not pile up; one that comes back gets a 401 and registers again. Paired devices have no `purgeAt` and are never deleted automatically, however long they stay silent: an operator may want a cleanup job for those later. |

Counters are `RateBucket` documents keyed by an HMAC of route, subject and window, as in
`lib/rate-limit.ts`: no address and no token hash is stored in a key. Writes fail closed (`503`)
when the platform gives no client address. Device tokens are compared in constant time. Nothing
logs a token or a code; unexpected errors are logged with anything code- or token-shaped removed.

Known gaps, shared with the firmware's `RELAY.md`: the relay holds only the latest action (two
actions within one 2-second poll reach the device as one); the device does not acknowledge an
action or a capsule other than through its next state report; a running timer's
`remaining_seconds` is only reported every 10 seconds; every poll is one read and one write.

## Storage

`models/RelayDevice.ts`, one document per device. `models/DeviceSession.ts` (the placeholder) is
not used: it expires with its code and keeps only hashes, while a device and its token must outlive
the code, and the firmware contract returns the current code on every poll. Keeping the code on the
device document also makes a claim a single atomic update. The reasoning is in the model's header.

Local development and the tests can run without a database: `DEVICE_RELAY_STORE=memory` keeps
devices in the server process (`lib/devices/memory-store.ts`). It is ignored when `VERCEL` is set.

```sh
DEVICE_RELAY_STORE=memory APP_HMAC_SECRET=any-local-value NEXT_PUBLIC_SITE_URL= npm run dev
RELAY_USER_HEADER="X-Harmoniser-Token: $(openssl rand -base64 32 | tr '+/' '-_' | tr -d '=')" \
  ../esp32-companion/test_relay.sh http://localhost:3000
```

For a board on the same network, leave `NEXT_PUBLIC_SITE_URL` empty (so `pair_url` uses the
laptop's address as the board reached it) and start with `npm run dev -- -H 0.0.0.0`.

## Testing the MongoDB store

`npm test` needs no database: the conformance suite runs on the in-memory store and skips its
MongoDB half. To run that half, start a throwaway MongoDB on this machine and point
`MONGO_TEST_URI` at it. The suite empties the relay's collections, so it refuses any address that
is not `127.0.0.1` or `localhost`; never give it an Atlas URI.

```sh
# a throwaway mongod on 127.0.0.1:27018, without adding anything to this repo
mkdir /tmp/relay-mongo && cd /tmp/relay-mongo && npm init -y && npm i mongodb-memory-server
node -e 'require("mongodb-memory-server").MongoMemoryServer
  .create({instance:{ip:"127.0.0.1",port:27018}}).then(()=>console.log("ready"))' &
# or: podman run --rm -d -p 127.0.0.1:27018:27017 docker.io/library/mongo:7

MONGO_TEST_URI=mongodb://127.0.0.1:27018/relaytest npx vitest run tests/devices/store-conformance.test.ts

# the routes on that database, checked by the firmware's script
MONGODB_URI=mongodb://127.0.0.1:27018/relaydev APP_HMAC_SECRET=any-local-value NEXT_PUBLIC_SITE_URL= npm run dev
RELAY_USER_HEADER="X-Harmoniser-Token: $(openssl rand -base64 32 | tr '+/' '-_' | tr -d '=')" \
  ../esp32-companion/test_relay.sh http://localhost:3000
```

It covers: register and re-register, code uniqueness and the retry on a clash, one winner among
concurrent claims, expiry and the fresh code on poll, version and `action_seq` under concurrent
writes, state reports, owner scoping, unpair, rate buckets, the indexes `syncIndexes()` creates, and
that a paired device never has a `purgeAt`, that no state survives an unpair, the cap on devices per
owner, and simultaneous first registrations of one `hw`.

## What is verified

As of 2026-10-03.

| | State |
| --- | --- |
| Core rules (`tests/devices/`) | Unit tests on registration, code expiry, single use, re-registration, rate limits, ownership, unpair, capsule and state validation. The firmware's own vectors (`tests/devices/vectors/`, copied from `esp32-companion/tests/vectors/`) run against the ports of `json_scan`, `utf8_valid` and the label cut. |
| Route files | Tested through the real `route.ts` exports on the in-memory store: both credentials, origin guard, error envelope, body limits, `pair_url` base. |
| Firmware's `test_relay.sh` | Passes against `next dev` with the in-memory store (106 checks, 0 failed). |
| `/pair` and `/device` | Tried by hand in one desktop Chrome: register, QR and phrase shown, pair, counter and timer sent, `+` on the device and `+1` from the remote arrive on the other side. |
| MongoDB store | `tests/devices/store-conformance.test.ts` runs the same cases against the in-memory store and the MongoDB store: 64 of 64 pass on a local MongoDB 8.2.6 (see below). `test_relay.sh` also passes against `next dev` on that database (106 checks, 0 failed). Not tried on Atlas: the TTL monitor actually deleting a document was not waited for (the index definition and the field values are asserted instead). |
| A real board | Not tried against this implementation. |
| A phone camera on the QR code, real phones | Not tried. |
