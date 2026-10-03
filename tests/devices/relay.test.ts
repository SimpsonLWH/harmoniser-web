import { describe, expect, it } from "vitest";

import { CODE_PATTERN } from "@/lib/devices/phrase";
import { hashDeviceToken as hashToken } from "@/lib/devices/tokens";

import { BASE, setup, status } from "./helpers";

const MINUTE = 60_000;
const bearer = (token: string) => `Bearer ${token}`;

describe("register", () => {
  it("answers with an id, a token, a code and the pair URL", async () => {
    const { register } = setup();
    const answer = await register();
    expect(answer.id).toMatch(/^dev_[0-9a-f]{16}$/);
    expect(answer.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(answer.code).toMatch(CODE_PATTERN);
    expect(answer.pair_url).toBe(`${BASE}/pair?code=${answer.code}`);
  });

  it("keeps the pair URL short enough for a version 4 QR code on the planned host", async () => {
    const { relay } = setup({ newCode: () => "seven-eight-three" });
    const answer = await relay.register({ hw: "b", kind: "wrist", fw: "1" }, "https://harmoniser-web.vercel.app/", "ip");
    expect(answer.pair_url).toBe("https://harmoniser-web.vercel.app/pair?code=seven-eight-three");
    expect(answer.pair_url.length).toBeLessThanOrEqual(62);
  });

  it("stores the hash of the token, never the token", async () => {
    const { register, store } = setup();
    const answer = await register();
    const record = await store.findDevice(answer.id);
    expect(record?.tokenHash).toBe(hashToken(answer.token));
    expect(JSON.stringify(record)).not.toContain(answer.token);
  });

  it.each([
    [{ kind: "wrist", fw: "1" }, "hw"],
    [{ hw: "", kind: "wrist", fw: "1" }, "hw"],
    [{ hw: "has space", kind: "wrist", fw: "1" }, "hw"],
    [{ hw: "a".repeat(65), kind: "wrist", fw: "1" }, "hw"],
    [{ hw: 12, kind: "wrist", fw: "1" }, "hw"],
    [{ hw: "b", fw: "1" }, "kind"],
    [{ hw: "b", kind: "", fw: "1" }, "kind"],
    [{ hw: "b", kind: "k".repeat(33), fw: "1" }, "kind"],
    [{ hw: "b", kind: "wrist" }, "fw"],
    [{ hw: "b", kind: "wrist", fw: "f".repeat(65) }, "fw"],
  ])("refuses %j (%s)", async (body, name) => {
    const { relay } = setup();
    await expect(relay.register(body, BASE, "ip")).rejects.toMatchObject({ status: 400 });
    await expect(relay.register(body, BASE, "ip")).rejects.toThrow(name);
  });

  it.each(["3f9c2a7be01d4c55", "a".repeat(32), "0123456789abcdef".repeat(4), "test-relay-sh", "web-" + "f".repeat(32)])(
    "takes the hardware id %s",
    async (hw) => {
      const { register } = setup();
      expect((await register(hw)).id).toMatch(/^dev_/);
    },
  );

  it("gives the same hardware the same id with a new token and code, and ends the old ones", async () => {
    const { relay, register } = setup();
    const first = await register();
    await relay.claim("install-a", "ip", { code: first.code });
    await relay.putCapsule("install-a", first.id, { type: "counter", label: "Squats", count: 3 });
    await relay.postAction("install-a", first.id, { action: "increment" });
    const device = await relay.authenticateDevice(first.id, bearer(first.token));
    await relay.report(device, { type: "counter", version: 1, count: 3 });

    const second = await register();
    expect(second.id).toBe(first.id);
    expect(second.token).not.toBe(first.token);
    expect(second.code).not.toBe(first.code);
    expect(await status(relay.authenticateDevice(first.id, bearer(first.token)))).toBe(401);

    const again = await relay.authenticateDevice(second.id, bearer(second.token));
    const poll = await relay.poll(again, BASE);
    // Unclaimed, the previous owner's capsule and action dropped; the counters keep counting.
    expect(poll).toMatchObject({ claimed: false, capsule: null, action: null, version: 1, action_seq: 1, code: second.code });
    expect(await status(relay.getState("install-a", first.id))).toBe(404);
    expect(await status(relay.putCapsule("install-a", first.id, { type: "counter" }))).toBe(404);
    expect(await status(relay.claim("install-a", "ip", { code: first.code }))).toBe(404);
    expect((await relay.list("install-a")).devices).toEqual([]);
  });

  it("gives different hardware different ids", async () => {
    const { register } = setup();
    expect((await register("a")).id).not.toBe((await register("b")).id);
  });

  it("tries again when a code is already on another device, and gives up after five", async () => {
    const codes = ["same-same-same", "same-same-same", "same-same-same", "other-code-here"];
    const { register } = setup({ newCode: () => codes.shift() ?? "same-same-same" });
    expect((await register("a")).code).toBe("same-same-same");
    expect((await register("b")).code).toBe("other-code-here");
    expect(await status(register("c"))).toBe(503);
  });

  it("limits registrations per address", async () => {
    const { register, time, relay } = setup({ config: { registrationsPerIp: 3 } });
    for (const hw of ["a", "b", "c"]) {
      await register(hw, "1.1.1.1");
    }
    await expect(register("d", "1.1.1.1")).rejects.toMatchObject({ status: 429, code: "rate_limited" });
    expect((await register("d", "2.2.2.2")).id).toBeTruthy();
    time.advance(relay.config.rateWindowMs);
    expect((await register("d", "1.1.1.1")).id).toBeTruthy();
  });
});

describe("device authentication", () => {
  it("answers 401 for a wrong token, no token, another device's token and an unknown id", async () => {
    const { relay, register } = setup();
    const a = await register("a");
    const b = await register("b");
    expect(await status(relay.authenticateDevice(a.id, bearer("wrong-token")))).toBe(401);
    expect(await status(relay.authenticateDevice(a.id, null))).toBe(401);
    expect(await status(relay.authenticateDevice(a.id, ""))).toBe(401);
    expect(await status(relay.authenticateDevice(a.id, `Basic ${a.token}`))).toBe(401);
    expect(await status(relay.authenticateDevice(a.id, a.token))).toBe(401);
    expect(await status(relay.authenticateDevice(a.id, bearer(b.token)))).toBe(401);
    expect(await status(relay.authenticateDevice("no-such-device", bearer(a.token)))).toBe(401);
    expect((await relay.authenticateDevice(a.id, bearer(a.token))).id).toBe(a.id);
  });

  it("does not accept the stored hash as a token", async () => {
    const { relay, register } = setup();
    const a = await register();
    expect(await status(relay.authenticateDevice(a.id, bearer(hashToken(a.token))))).toBe(401);
  });
});

describe("pairing codes", () => {
  it("claims with the code as a person types it, once", async () => {
    const { relay, register } = setup();
    const { id, code } = await register();
    const typed = `  ${code.toUpperCase().replaceAll("-", " ")} `;
    expect(await relay.claim("install-a", "ip", { code: typed })).toEqual({ id, kind: "wrist" });
    expect(await status(relay.claim("install-a", "ip", { code }))).toBe(404);
    expect(await status(relay.claim("install-b", "ip", { code }))).toBe(404);
  });

  it.each([{ code: "123456" }, { code: "only-two" }, { code: 5 }, {}, { code: "a".repeat(65) }])(
    "answers 400 for %j",
    async (body) => {
      const { relay } = setup();
      expect(await status(relay.claim("install-a", "ip", body))).toBe(400);
    },
  );

  it("answers 404 for a code nobody has", async () => {
    const { relay, register } = setup();
    await register();
    expect(await status(relay.claim("install-a", "ip", { code: "not-the-code" }))).toBe(404);
  });

  it("works until 10 minutes are over, and not from that moment on", async () => {
    const early = setup();
    const first = await early.register();
    early.time.advance(10 * MINUTE - 1);
    expect((await early.relay.claim("install-a", "ip", { code: first.code })).id).toBe(first.id);

    const late = setup();
    const second = await late.register();
    late.time.advance(10 * MINUTE);
    // Expired from the 10 minutes on, not from the device's next poll on.
    expect(await status(late.relay.claim("install-a", "ip", { code: second.code }))).toBe(404);
  });

  it("gives the device a new code with its next poll after the old one ran out", async () => {
    const { relay, register, time } = setup();
    const { id, token, code } = await register();
    const device = () => relay.authenticateDevice(id, bearer(token));

    time.advance(10 * MINUTE - 1);
    expect((await relay.poll(await device(), BASE)).code).toBe(code);
    time.advance(1);
    const renewed = await relay.poll(await device(), BASE);
    expect(renewed.code).toMatch(CODE_PATTERN);
    expect(renewed.code).not.toBe(code);
    expect(renewed.pair_url).toBe(`${BASE}/pair?code=${renewed.code}`);
    expect(renewed.claimed).toBe(false);

    expect(await status(relay.claim("install-a", "ip", { code }))).toBe(404);
    // The new code has 10 minutes of its own.
    time.advance(10 * MINUTE - 1);
    expect((await relay.poll(await device(), BASE)).code).toBe(renewed.code);
    expect((await relay.claim("install-a", "ip", { code: renewed.code })).id).toBe(id);
  });

  it("shows no code once claimed, and does not renew one", async () => {
    const { relay, register, time } = setup();
    const { id, token, code } = await register();
    await relay.claim("install-a", "ip", { code });
    time.advance(30 * MINUTE);
    const poll = await relay.poll(await relay.authenticateDevice(id, bearer(token)), BASE);
    expect(poll).toMatchObject({ claimed: true, code: null, pair_url: null });
  });

  it("lets only one of two claims at the same moment win", async () => {
    const { relay, register } = setup();
    const { code } = await register();
    const results = await Promise.all([
      status(relay.claim("install-a", "ip", { code })),
      status(relay.claim("install-b", "ip", { code })),
    ]);
    expect(results.sort()).toEqual([404, "resolved"]);
  });

  it("does not let a second install take a claimed device by re-using its old code", async () => {
    const { relay, register } = setup();
    const { id, code } = await register();
    await relay.claim("install-a", "ip", { code });
    expect(await status(relay.claim("install-b", "ip", { code }))).toBe(404);
    expect((await relay.list("install-a")).devices.map((device) => device.id)).toEqual([id]);
    expect((await relay.list("install-b")).devices).toEqual([]);
  });
});

describe("devices per owner", () => {
  it("refuses a claim with 409 too_many_devices at the cap, without using up the code", async () => {
    const { relay, register } = setup({ config: { devicesPerOwner: 2 } });
    const [a, b, c] = [await register("a"), await register("b"), await register("c")];
    await relay.claim("owner-a", "ip", { code: a.code });
    await relay.claim("owner-a", "ip", { code: b.code });
    await expect(relay.claim("owner-a", "ip", { code: c.code })).rejects.toMatchObject({
      status: 409,
      code: "too_many_devices",
    });
    // Unpairing one makes room, and the code still works.
    await relay.unpair("owner-a", a.id);
    expect((await relay.claim("owner-a", "ip", { code: c.code })).id).toBe(c.id);
    expect((await relay.list("owner-a")).devices).toHaveLength(2);
  });

  it("allows 20 by default, and does not hold up another owner", async () => {
    const { relay, register } = setup({ config: { claimsPerOwner: 100 } });
    for (let i = 0; i < 20; i++) {
      await relay.claim("owner-a", "ip", { code: (await register(`hw-${i}`)).code });
    }
    const extra = await register("hw-extra");
    expect(await status(relay.claim("owner-a", "ip", { code: extra.code }))).toBe(409);
    expect(await status(relay.claim("owner-b", "ip", { code: extra.code }))).toBe("resolved");
  });
});

describe("state and ownership", () => {
  const shown = { type: "counter", label: "Private label", count: 4, version: 1 };

  it("keeps nothing an unpaired device reports, but notes that it is alive", async () => {
    const { relay, register, time, store } = setup();
    const device = await register();
    time.advance(5000);
    await relay.report(await relay.authenticateDevice(device.id, `Bearer ${device.token}`), shown);
    expect(await store.findDevice(device.id)).toMatchObject({ state: null, lastSeenAt: time.now() });
    await relay.claim("owner-a", "ip", { code: device.code });
    expect(await relay.getState("owner-a", device.id)).toEqual({ last_seen_ms_ago: 0 });
  });

  it("still refuses a malformed report from an unpaired device", async () => {
    const { relay, register } = setup();
    const device = await register();
    const record = await relay.authenticateDevice(device.id, `Bearer ${device.token}`);
    expect(await status(relay.report(record, { type: "idle" }))).toBe(400);
  });

  it("does not show a new owner what the device reported to the previous one", async () => {
    const { relay, register } = setup();
    const device = await register();
    const auth = () => relay.authenticateDevice(device.id, `Bearer ${device.token}`);
    await relay.claim("owner-a", "ip", { code: device.code });
    await relay.report(await auth(), shown);
    const stale = await auth(); // read while still paired with owner-a
    await relay.unpair("owner-a", device.id);
    await relay.report(stale, shown); // arrives after the unpair
    await relay.report(await auth(), shown); // and one more while unpaired
    const { code } = await relay.poll(await auth(), BASE);
    await relay.claim("owner-b", "ip", { code });
    expect(await relay.getState("owner-b", device.id)).toEqual({ last_seen_ms_ago: 0 });
  });
});

describe("claim rate limits", () => {
  it("limits attempts per install, right or wrong, and lets them through again after the window", async () => {
    const { relay, register, time } = setup({ config: { claimsPerOwner: 3, claimsPerIp: 100 } });
    const { code } = await register();
    for (let i = 0; i < 3; i++) {
      expect(await status(relay.claim("install-a", `ip-${i}`, { code: "not-the-code" }))).toBe(404);
    }
    // Even the right code is refused now, and the code is not used up by the refusal.
    await expect(relay.claim("install-a", "ip-9", { code })).rejects.toMatchObject({ status: 429, code: "rate_limited" });
    expect(await status(relay.claim("install-b", "ip-9", { code: "not-the-code" }))).toBe(404);
    time.advance(relay.config.rateWindowMs);
    expect(await status(relay.claim("install-a", "ip-9", { code }))).toBe("resolved");
  });

  it("limits attempts per address across installs", async () => {
    const { relay, register } = setup({ config: { claimsPerOwner: 100, claimsPerIp: 4 } });
    const { code } = await register();
    for (let i = 0; i < 4; i++) {
      expect(await status(relay.claim(`install-${i}`, "6.6.6.6", { code: "not-the-code" }))).toBe(404);
    }
    expect(await status(relay.claim("install-new", "6.6.6.6", { code }))).toBe(429);
    expect(await status(relay.claim("install-new", "7.7.7.7", { code }))).toBe("resolved");
  });

  it("counts malformed codes as attempts too", async () => {
    const { relay } = setup({ config: { claimsPerOwner: 2 } });
    expect(await status(relay.claim("install-a", "ip", { code: "x" }))).toBe(400);
    expect(await status(relay.claim("install-a", "ip", { code: "x" }))).toBe(400);
    expect(await status(relay.claim("install-a", "ip", { code: "x" }))).toBe(429);
  });

  it("counts under one key per owner and one per address", async () => {
    const { relay, store } = setup();
    const keys: string[] = [];
    const hit = store.hit.bind(store);
    store.hit = (key, windowMs, now) => {
      keys.push(key);
      return hit(key, windowMs, now);
    };
    await status(relay.claim("owner-hash", "203.0.113.7", { code: "not-the-code" }));
    // The core names the counters; hashing the key is the store's job (see mongo-store.test.ts).
    expect(keys).toEqual(["devices-claim-owner|owner-hash", "devices-claim|203.0.113.7"]);
  });
});

describe("capsules, actions and state", () => {
  async function paired() {
    const context = setup();
    const { id, token, code } = await context.register();
    await context.relay.claim("install-a", "ip", { code });
    const poll = async () => context.relay.poll(await context.relay.authenticateDevice(id, bearer(token)), BASE);
    return { ...context, id, token, poll };
  }

  it("starts at version 0 with nothing, and counts up from 1", async () => {
    const { relay, id, poll } = await paired();
    expect(await poll()).toEqual({
      claimed: true,
      version: 0,
      capsule: null,
      action_seq: 0,
      action: null,
      code: null,
      pair_url: null,
    });
    expect(await relay.putCapsule("install-a", id, { type: "counter", label: "Squats", count: 3 })).toEqual({ version: 1 });
    expect(await relay.putCapsule("install-a", id, { type: "timer", label: "Pasta", seconds: 540 })).toEqual({ version: 2 });
    expect(await poll()).toMatchObject({ version: 2, capsule: { type: "timer", label: "Pasta", seconds: 540 } });
  });

  it("changes nothing when the capsule is refused", async () => {
    const { relay, id, poll } = await paired();
    await relay.putCapsule("install-a", id, { type: "counter", label: "Squats", count: 3 });
    for (const body of [{ type: "timer", label: "No seconds" }, { type: "counter", count: -1 }, { type: "note" }]) {
      expect(await status(relay.putCapsule("install-a", id, body))).toBe(400);
    }
    expect(await poll()).toMatchObject({ version: 1, capsule: { type: "counter", label: "Squats", count: 3 } });
  });

  it("hands the board the cleaned capsule: label cut, number whole, unknown fields gone", async () => {
    const { relay, id, poll } = await paired();
    await relay.putCapsule("install-a", id, { type: "counter", label: "é".repeat(30), count: 7.9, secret: "x" });
    expect((await poll()).capsule).toEqual({ type: "counter", label: "é".repeat(23), count: 7 });
  });

  it("holds the latest action, and drops it when a new capsule arrives", async () => {
    const { relay, id, poll } = await paired();
    expect(await relay.postAction("install-a", id, { action: "increment" })).toEqual({ action_seq: 1 });
    expect(await relay.postAction("install-a", id, { action: "reset" })).toEqual({ action_seq: 2 });
    expect(await poll()).toMatchObject({ action_seq: 2, action: "reset" });
    expect(await status(relay.postAction("install-a", id, { action: "explode" }))).toBe(400);
    expect(await poll()).toMatchObject({ action_seq: 2, action: "reset" });
    await relay.putCapsule("install-a", id, { type: "counter" });
    expect(await poll()).toMatchObject({ action_seq: 2, action: null, version: 1 });
  });

  it("answers with only last_seen_ms_ago before the first report", async () => {
    const { relay, id, time } = await paired();
    time.advance(1500);
    expect(await relay.getState("install-a", id)).toEqual({ last_seen_ms_ago: 1500 });
  });

  it("returns the last report and the time since the device's last request", async () => {
    const { relay, id, token, time, poll } = await paired();
    const device = await relay.authenticateDevice(id, bearer(token));
    const state = {
      type: "counter",
      label: "Squats",
      count: 4,
      seconds: 0,
      remaining_seconds: 0,
      running: false,
      done: false,
      motion: false,
      version: 1,
    };
    await relay.report(device, state);
    time.advance(1200);
    expect(await relay.getState("install-a", id)).toEqual({ ...state, last_seen_ms_ago: 1200 });
    await poll(); // a poll counts as a sign of life too
    time.advance(300);
    expect(await relay.getState("install-a", id)).toEqual({ ...state, last_seen_ms_ago: 300 });
  });

  it("refuses a malformed report and keeps the previous one", async () => {
    const { relay, id, token } = await paired();
    const device = await relay.authenticateDevice(id, bearer(token));
    await relay.report(device, { type: "idle", version: 0 });
    expect(await status(relay.report(device, { type: "idle" }))).toBe(400);
    expect(await relay.getState("install-a", id)).toMatchObject({ type: "idle", version: 0 });
  });

  it("does not store a report from a token that was replaced meanwhile", async () => {
    const { relay, register, id, token } = await paired();
    const stale = await relay.authenticateDevice(id, bearer(token));
    const fresh = await register();
    await relay.report(stale, { type: "counter", version: 1, count: 99 });
    await relay.claim("install-b", "ip", { code: fresh.code });
    expect(await relay.getState("install-b", id)).toEqual({ last_seen_ms_ago: 0 });
  });
});

describe("ownership", () => {
  it("answers 404 to another install, to an unknown id and to an unclaimed device alike", async () => {
    const { relay, register } = setup();
    const mine = await register("a");
    const unclaimed = await register("b");
    await relay.claim("install-a", "ip", { code: mine.code });
    for (const id of [mine.id, unclaimed.id, "dev_missing"]) {
      const who = id === mine.id ? "install-b" : "install-a";
      expect(await status(relay.putCapsule(who, id, { type: "counter" }))).toBe(404);
      expect(await status(relay.postAction(who, id, { action: "increment" }))).toBe(404);
      expect(await status(relay.getState(who, id))).toBe(404);
      expect(await status(relay.unpair(who, id))).toBe(404);
    }
    const device = await relay.authenticateDevice(mine.id, bearer(mine.token));
    expect(await relay.poll(device, BASE)).toMatchObject({ claimed: true, version: 0, action_seq: 0 });
  });

  it("lists only the caller's devices, oldest pairing first", async () => {
    const { relay, register, time } = setup();
    const a = await register("a");
    const b = await register("b");
    const c = await register("c");
    await relay.claim("install-a", "ip", { code: b.code });
    time.advance(1000);
    await relay.claim("install-a", "ip", { code: a.code });
    await relay.claim("install-b", "ip", { code: c.code });
    await relay.putCapsule("install-a", a.id, { type: "timer", seconds: 60 });
    const { devices } = await relay.list("install-a");
    expect(devices).toEqual([
      { id: b.id, kind: "wrist", fw: "test", version: 0, capsule: null, last_seen_ms_ago: 1000 },
      { id: a.id, kind: "wrist", fw: "test", version: 1, capsule: { type: "timer", label: "", seconds: 60 }, last_seen_ms_ago: 1000 },
    ]);
    expect(JSON.stringify(devices)).not.toContain("tokenHash");
  });
});

describe("unpair", () => {
  it("frees the device: gone from the list, capsule dropped, and a fresh code with the next poll", async () => {
    const { relay, register } = setup();
    const { id, token, code } = await register();
    await relay.claim("install-a", "ip", { code });
    await relay.putCapsule("install-a", id, { type: "counter", count: 5 });
    await relay.unpair("install-a", id);

    expect((await relay.list("install-a")).devices).toEqual([]);
    expect(await status(relay.getState("install-a", id))).toBe(404);
    expect(await status(relay.unpair("install-a", id))).toBe(404);

    // The device keeps its token and is offered for pairing again.
    const poll = await relay.poll(await relay.authenticateDevice(id, bearer(token)), BASE);
    expect(poll).toMatchObject({ claimed: false, capsule: null, action: null, version: 1 });
    expect(poll.code).toMatch(CODE_PATTERN);
    expect(poll.code).not.toBe(code);
    expect(await relay.claim("install-b", "ip", { code: poll.code })).toEqual({ id, kind: "wrist" });
  });
});
