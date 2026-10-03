// The same cases against both DeviceStore implementations. The in-memory store always runs;
// the MongoDB store runs when MONGO_TEST_URI points at a local test database:
//
//   MONGO_TEST_URI=mongodb://127.0.0.1:27018/relaytest npx vitest run tests/devices/store-conformance.test.ts
//
// See docs/device-relay.md ("Testing the MongoDB store"). The suite empties the relay's
// collections, so it refuses any address that is not this machine.
import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createMemoryStore } from "@/lib/devices/memory-store";
import { createMongoStore, UNCLAIMED_RETENTION_MS } from "@/lib/devices/mongo-store";
import { CODE_PATTERN } from "@/lib/devices/phrase";
import { createRelay, type RelayOptions } from "@/lib/devices/relay";
import { CodeTakenError, type DeviceStore, type Registration } from "@/lib/devices/store";
import { RateBucket } from "@/models/RateBucket";
import { RelayDevice } from "@/models/RelayDevice";

import { BASE, clock, status, T0 } from "./helpers";

const MONGO_URI = process.env.MONGO_TEST_URI ?? "";
const MINUTE = 60_000;
const bearer = (token: string) => `Bearer ${token}`;

function assertLocal(uri: string): void {
  const host = new URL(uri.replace(/^mongodb:/, "http:")).hostname;
  if (!uri.startsWith("mongodb://") || !["127.0.0.1", "localhost", "[::1]"].includes(host)) {
    throw new Error("MONGO_TEST_URI must be a mongodb:// address on this machine");
  }
}

let n = 0;
const registration = (over: Partial<Registration> = {}): Registration => {
  n += 1;
  return {
    hw: `hw-${n}`,
    newId: `dev_${String(n).padStart(16, "0")}`,
    kind: "wrist",
    fw: "t",
    tokenHash: `${n}`.padStart(64, "a"),
    code: `aaa-bbb-${"abcdefghij"[n % 10]}${"abcdefghij"[Math.floor(n / 10) % 10]}${"abcdefghij"[Math.floor(n / 100) % 10]}`,
    codeExpiresAt: T0 + 10 * MINUTE,
    now: T0,
    ...over,
  };
};

interface Backend {
  name: string;
  enabled: boolean;
  open: () => Promise<void>;
  fresh: () => Promise<DeviceStore>;
  close: () => Promise<void>;
}

const backends: Backend[] = [
  {
    name: "in-memory store",
    enabled: true,
    open: async () => {},
    fresh: async () => createMemoryStore(),
    close: async () => {},
  },
  {
    name: "MongoDB store",
    enabled: MONGO_URI !== "",
    open: async () => {
      assertLocal(MONGO_URI);
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      await RelayDevice.syncIndexes();
      await RateBucket.syncIndexes();
    },
    fresh: async () => {
      await RelayDevice.deleteMany({});
      await RateBucket.deleteMany({});
      return createMongoStore();
    },
    close: async () => {
      await mongoose.disconnect();
    },
  },
];

describe.each(backends)("$name", (backend) => {
  describe.skipIf(!backend.enabled)("conformance", () => {
    let store: DeviceStore;

    beforeAll(backend.open, 30_000);
    afterAll(backend.close);
    beforeEach(async () => {
      store = await backend.fresh();
    });

    function relayWith(options: Omit<RelayOptions, "now"> = {}) {
      const time = clock();
      const relay = createRelay(store, { ...options, now: time.now });
      const register = (hw = "board-1", ip = "10.0.0.1") => relay.register({ hw, kind: "wrist", fw: "t" }, BASE, ip);
      const poll = async (id: string, token: string) =>
        relay.poll(await relay.authenticateDevice(id, bearer(token)), BASE);
      return { time, relay, register, poll };
    }

    describe("store contract", () => {
      it("creates a device, finds it, and returns null for an unknown id", async () => {
        const input = registration();
        const created = await store.registerDevice(input);
        expect(created).toEqual({
          id: input.newId,
          hw: input.hw,
          kind: "wrist",
          fw: "t",
          tokenHash: input.tokenHash,
          code: input.code,
          codeExpiresAt: input.codeExpiresAt,
          ownerHash: null,
          claimedAt: null,
          version: 0,
          capsule: null,
          actionSeq: 0,
          action: null,
          state: null,
          lastSeenAt: T0,
          createdAt: T0,
        });
        expect(await store.findDevice(input.newId)).toEqual(created);
        expect(await store.findDevice("dev_missing")).toBeNull();
      });

      it("registering the same hw again keeps the id and counters and resets the rest", async () => {
        const first = registration();
        await store.registerDevice(first);
        await store.claimByCode(first.code, "owner-a", T0);
        expect(await store.setCapsule(first.newId, "owner-a", { type: "counter", label: "x", count: 1 })).toBe(1);
        expect(await store.setAction(first.newId, "owner-a", "increment")).toBe(1);

        const second = registration({ hw: first.hw, now: T0 + 5000 });
        const again = await store.registerDevice(second);
        expect(again).toMatchObject({
          id: first.newId,
          tokenHash: second.tokenHash,
          code: second.code,
          ownerHash: null,
          claimedAt: null,
          capsule: null,
          action: null,
          state: null,
          version: 1,
          actionSeq: 1,
          createdAt: T0,
          lastSeenAt: T0 + 5000,
        });
        expect(await store.findDevice(second.newId)).toBeNull();
        expect(await store.listByOwner("owner-a")).toEqual([]);
      });

      it("makes one device when the same new hardware registers twice at once", async () => {
        const first = registration();
        const second = registration({ hw: first.hw });
        const results = await Promise.all([store.registerDevice(first), store.registerDevice(second)]);
        expect(results[0].id).toBe(results[1].id);
        const kept = await store.findDevice(results[0].id);
        expect([first.tokenHash, second.tokenHash]).toContain(kept?.tokenHash);
        const other = results[0].id === first.newId ? second.newId : first.newId;
        expect(await store.findDevice(other)).toBeNull();
      });

      it("refuses a code another unpaired device holds, on register and on renew", async () => {
        const a = await store.registerDevice(registration());
        const taken = a.code as string;
        await expect(store.registerDevice(registration({ code: taken }))).rejects.toBeInstanceOf(CodeTakenError);
        const b = await store.registerDevice(registration());
        await expect(store.renewCode(b.id, taken, T0 + MINUTE)).rejects.toBeInstanceOf(CodeTakenError);
        // The device's own code may be given to it again.
        expect((await store.renewCode(a.id, taken, T0 + 20 * MINUTE))?.codeExpiresAt).toBe(T0 + 20 * MINUTE);
      });

      it("frees a code for reuse once it was claimed", async () => {
        const a = await store.registerDevice(registration());
        const code = a.code as string;
        await store.claimByCode(code, "owner-a", T0);
        const b = await store.registerDevice(registration({ code }));
        expect(b.code).toBe(code);
      });

      it("renews a code only while the device is unpaired", async () => {
        const a = await store.registerDevice(registration());
        await store.claimByCode(a.code as string, "owner-a", T0);
        expect(await store.renewCode(a.id, "new-code-here", T0 + MINUTE)).toBeNull();
        expect(await store.renewCode("dev_missing", "new-code-here", T0 + MINUTE)).toBeNull();
        expect((await store.findDevice(a.id))?.code).toBeNull();
      });

      it("claims by code once: owner set, code gone", async () => {
        const a = await store.registerDevice(registration());
        const code = a.code as string;
        const claimed = await store.claimByCode(code, "owner-a", T0 + 1000);
        expect(claimed).toMatchObject({ id: a.id, ownerHash: "owner-a", claimedAt: T0 + 1000, code: null, codeExpiresAt: null });
        expect(await store.claimByCode(code, "owner-b", T0 + 2000)).toBeNull();
        expect(await store.claimByCode("not-the-code", "owner-b", T0)).toBeNull();
      });

      it("does not claim with a code that ran out, to the millisecond", async () => {
        const a = await store.registerDevice(registration());
        const code = a.code as string;
        expect(await store.claimByCode(code, "owner-a", T0 + 10 * MINUTE)).toBeNull();
        expect(await store.claimByCode(code, "owner-a", T0 + 10 * MINUTE - 1)).not.toBeNull();
      });

      it("lets exactly one of many concurrent claims win", async () => {
        const a = await store.registerDevice(registration());
        const code = a.code as string;
        const results = await Promise.all(
          Array.from({ length: 12 }, (_, i) => store.claimByCode(code, `owner-${i}`, T0)),
        );
        const winners = results.filter((result) => result !== null);
        expect(winners).toHaveLength(1);
        expect((await store.findDevice(a.id))?.ownerHash).toBe(winners[0]?.ownerHash);
      });

      it("counts versions and action numbers without losing concurrent writes", async () => {
        const a = await store.registerDevice(registration());
        await store.claimByCode(a.code as string, "owner-a", T0);
        const versions = await Promise.all(
          Array.from({ length: 8 }, (_, i) => store.setCapsule(a.id, "owner-a", { type: "counter", label: "", count: i })),
        );
        expect([...versions].sort((x, y) => (x ?? 0) - (y ?? 0))).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
        const seqs = await Promise.all(Array.from({ length: 8 }, () => store.setAction(a.id, "owner-a", "increment")));
        expect([...seqs].sort((x, y) => (x ?? 0) - (y ?? 0))).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      });

      it("a new capsule drops the pending action and keeps its number", async () => {
        const a = await store.registerDevice(registration());
        await store.claimByCode(a.code as string, "owner-a", T0);
        await store.setAction(a.id, "owner-a", "reset");
        await store.setCapsule(a.id, "owner-a", { type: "timer", label: "Pasta", seconds: 540, running: false });
        expect(await store.findDevice(a.id)).toMatchObject({
          capsule: { type: "timer", label: "Pasta", seconds: 540, running: false },
          version: 1,
          action: null,
          actionSeq: 1,
        });
      });

      it("acts only for the owner: capsule, action and release", async () => {
        const a = await store.registerDevice(registration());
        const unclaimed = await store.registerDevice(registration());
        await store.claimByCode(a.code as string, "owner-a", T0);
        for (const [id, owner] of [[a.id, "owner-b"], [unclaimed.id, "owner-a"], ["dev_missing", "owner-a"]] as const) {
          expect(await store.setCapsule(id, owner, { type: "counter", label: "", count: 0 })).toBeNull();
          expect(await store.setAction(id, owner, "reset")).toBeNull();
          expect(await store.releaseDevice(id, owner, T0)).toBe(false);
        }
        expect(await store.findDevice(a.id)).toMatchObject({ ownerHash: "owner-a", version: 0, actionSeq: 0 });
      });

      it("lists an owner's devices, oldest pairing first, and nobody else's", async () => {
        const a = await store.registerDevice(registration());
        const b = await store.registerDevice(registration());
        const c = await store.registerDevice(registration());
        await store.claimByCode(b.code as string, "owner-a", T0 + 1);
        await store.claimByCode(a.code as string, "owner-a", T0 + 2);
        await store.claimByCode(c.code as string, "owner-b", T0 + 3);
        expect((await store.listByOwner("owner-a")).map((device) => device.id)).toEqual([b.id, a.id]);
        expect((await store.listByOwner("owner-b")).map((device) => device.id)).toEqual([c.id]);
        expect(await store.listByOwner("owner-c")).toEqual([]);
      });

      it("saves a state report and the time, but not for a token hash that was replaced", async () => {
        const input = registration();
        const a = await store.registerDevice(input);
        await store.claimByCode(a.code as string, "owner-a", T0);
        const state = { type: "counter", label: "Squats", count: 4, seconds: 0, remaining_seconds: 0, running: false, done: false, motion: false, version: 1 } as const;
        await store.saveState(a.id, input.tokenHash, state, T0 + 700);
        expect(await store.findDevice(a.id)).toMatchObject({ state, lastSeenAt: T0 + 700 });
        await store.saveState(a.id, "f".repeat(64), { ...state, count: 99 }, T0 + 900);
        expect(await store.findDevice(a.id)).toMatchObject({ state, lastSeenAt: T0 + 700 });
      });

      it("keeps no state for an unpaired device, and a claim and a release both clear it", async () => {
        const input = registration();
        const a = await store.registerDevice(input);
        const state = { type: "counter", label: "Private", count: 4, seconds: 0, remaining_seconds: 0, running: false, done: false, motion: false, version: 1 } as const;
        await store.saveState(a.id, input.tokenHash, state, T0 + 100);
        expect(await store.findDevice(a.id)).toMatchObject({ state: null, lastSeenAt: T0 });

        expect((await store.claimByCode(a.code as string, "owner-a", T0))?.state).toBeNull();
        await store.saveState(a.id, input.tokenHash, state, T0 + 200);
        expect((await store.findDevice(a.id))?.state).toEqual(state);

        await store.releaseDevice(a.id, "owner-a", T0 + 300);
        expect((await store.findDevice(a.id))?.state).toBeNull();
        await store.saveState(a.id, input.tokenHash, state, T0 + 400); // a report that arrives late
        expect((await store.findDevice(a.id))?.state).toBeNull();

        await store.renewCode(a.id, "next-code-here", T0 + 10 * MINUTE);
        const next = await store.claimByCode("next-code-here", "owner-b", T0 + 500);
        expect(next).toMatchObject({ ownerHash: "owner-b", state: null });
      });

      it("counts an owner's devices", async () => {
        expect(await store.countByOwner("owner-a")).toBe(0);
        for (let i = 0; i < 3; i++) {
          const device = await store.registerDevice(registration());
          await store.claimByCode(device.code as string, i < 2 ? "owner-a" : "owner-b", T0);
        }
        await store.registerDevice(registration()); // unpaired: nobody's
        expect(await store.countByOwner("owner-a")).toBe(2);
        expect(await store.countByOwner("owner-b")).toBe(1);
      });

      it("touch moves lastSeenAt and nothing else", async () => {
        const a = await store.registerDevice(registration());
        await store.touchDevice(a, T0 + 4000);
        expect(await store.findDevice(a.id)).toEqual({ ...a, lastSeenAt: T0 + 4000 });
        await store.touchDevice({ ...a, id: "dev_missing" }, T0); // no error, no new device
        expect(await store.findDevice("dev_missing")).toBeNull();
      });

      it("release unpairs: no owner, no capsule, no code until the next poll", async () => {
        const a = await store.registerDevice(registration());
        await store.claimByCode(a.code as string, "owner-a", T0);
        await store.setCapsule(a.id, "owner-a", { type: "counter", label: "", count: 5 });
        await store.setAction(a.id, "owner-a", "increment");
        expect(await store.releaseDevice(a.id, "owner-a", T0 + 1000)).toBe(true);
        expect(await store.findDevice(a.id)).toMatchObject({
          ownerHash: null,
          claimedAt: null,
          code: null,
          codeExpiresAt: null,
          capsule: null,
          action: null,
          state: null,
          version: 1,
          actionSeq: 1,
          tokenHash: a.tokenHash,
        });
        expect(await store.releaseDevice(a.id, "owner-a", T0 + 2000)).toBe(false);
      });

      it("several unpaired devices may be without a code at the same time", async () => {
        for (let i = 0; i < 3; i++) {
          const device = await store.registerDevice(registration());
          await store.claimByCode(device.code as string, "owner-a", T0);
          expect(await store.releaseDevice(device.id, "owner-a", T0)).toBe(true);
        }
        expect(await store.listByOwner("owner-a")).toEqual([]);
      });

      it("counts hits per key and per window, also when they arrive together", async () => {
        const WINDOW = 5 * MINUTE;
        const start = Math.floor(T0 / WINDOW) * WINDOW;
        expect(await store.hit("route|a", WINDOW, start)).toBe(1);
        expect(await store.hit("route|a", WINDOW, start + WINDOW - 1)).toBe(2);
        expect(await store.hit("route|b", WINDOW, start)).toBe(1);
        expect(await store.hit("route|a", WINDOW, start + WINDOW)).toBe(1);
        const together = await Promise.all(Array.from({ length: 10 }, () => store.hit("route|c", WINDOW, start)));
        expect([...together].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      });
    });

    describe("relay on this store", () => {
      it("runs the whole flow: register, pair, capsule, action, state, list, unpair, pair again", async () => {
        const { relay, register, poll, time } = relayWith();
        const device = await register();
        expect(await poll(device.id, device.token)).toEqual({
          claimed: false,
          version: 0,
          capsule: null,
          action_seq: 0,
          action: null,
          code: device.code,
          pair_url: device.pair_url,
        });
        expect(await relay.claim("owner-a", "ip", { code: device.code })).toEqual({ id: device.id, kind: "wrist" });
        expect(await relay.putCapsule("owner-a", device.id, { type: "counter", label: "Squats", count: 3 })).toEqual({ version: 1 });
        expect(await relay.postAction("owner-a", device.id, { action: "increment" })).toEqual({ action_seq: 1 });
        expect(await poll(device.id, device.token)).toEqual({
          claimed: true,
          version: 1,
          capsule: { type: "counter", label: "Squats", count: 3 },
          action_seq: 1,
          action: "increment",
          code: null,
          pair_url: null,
        });
        const state = { type: "counter", label: "Squats", count: 4, seconds: 0, remaining_seconds: 0, running: false, done: false, motion: false, version: 1 };
        await relay.report(await relay.authenticateDevice(device.id, bearer(device.token)), state);
        time.advance(1200);
        expect(await relay.getState("owner-a", device.id)).toEqual({ ...state, last_seen_ms_ago: 1200 });
        expect(await status(relay.getState("owner-b", device.id))).toBe(404);
        expect((await relay.list("owner-a")).devices).toEqual([
          { id: device.id, kind: "wrist", fw: "t", version: 1, capsule: { type: "counter", label: "Squats", count: 3 }, last_seen_ms_ago: 1200 },
        ]);

        await relay.unpair("owner-a", device.id);
        expect((await relay.list("owner-a")).devices).toEqual([]);
        const freed = await poll(device.id, device.token);
        expect(freed).toMatchObject({ claimed: false, capsule: null, action: null, version: 1, action_seq: 1 });
        expect(freed.code).toMatch(CODE_PATTERN);
        expect(freed.code).not.toBe(device.code);
        expect(await relay.claim("owner-b", "ip", { code: freed.code })).toEqual({ id: device.id, kind: "wrist" });
      });

      it("ends the old token and code when the same hardware registers again", async () => {
        const { relay, register, poll } = relayWith();
        const first = await register();
        await relay.claim("owner-a", "ip", { code: first.code });
        const second = await register();
        expect(second.id).toBe(first.id);
        expect(await status(relay.authenticateDevice(first.id, bearer(first.token)))).toBe(401);
        expect(await status(relay.claim("owner-a", "ip", { code: first.code }))).toBe(404);
        expect(await poll(second.id, second.token)).toMatchObject({ claimed: false, code: second.code });
        expect(await status(relay.getState("owner-a", first.id))).toBe(404);
      });

      it("retries with a new code when the first is taken, and gives up after five", async () => {
        const codes = ["same-same-same", "same-same-same", "same-same-same", "other-code-here"];
        const { register } = relayWith({ newCode: () => codes.shift() ?? "same-same-same" });
        expect((await register("a")).code).toBe("same-same-same");
        expect((await register("b")).code).toBe("other-code-here");
        expect(await status(register("c"))).toBe(503);
      });

      it("expires a code after 10 minutes and hands out a fresh one with the next poll", async () => {
        const { relay, register, poll, time } = relayWith();
        const device = await register();
        time.advance(10 * MINUTE);
        expect(await status(relay.claim("owner-a", "ip", { code: device.code }))).toBe(404);
        const renewed = await poll(device.id, device.token);
        expect(renewed.code).toMatch(CODE_PATTERN);
        expect(renewed.code).not.toBe(device.code);
        expect(renewed.pair_url).toBe(`${BASE}/pair?code=${renewed.code}`);
        expect((await poll(device.id, device.token)).code).toBe(renewed.code);
        expect((await relay.claim("owner-a", "ip", { code: renewed.code })).id).toBe(device.id);
      });

      it("caps the devices one owner may pair", async () => {
        const { relay, register } = relayWith({ config: { devicesPerOwner: 2 } });
        const [a, b, c] = [await register("a"), await register("b"), await register("c")];
        await relay.claim("owner-a", "ip", { code: a.code });
        await relay.claim("owner-a", "ip", { code: b.code });
        await expect(relay.claim("owner-a", "ip", { code: c.code })).rejects.toMatchObject({ status: 409, code: "too_many_devices" });
        expect((await relay.claim("owner-b", "ip", { code: c.code })).id).toBe(c.id);
      });

      it("registers the same new hardware many times at once without an error", async () => {
        const { register } = relayWith();
        const answers = await Promise.all(Array.from({ length: 6 }, () => register("same-new-board")));
        expect(new Set(answers.map((answer) => answer.id)).size).toBe(1);
      });

      it("does not hand a new owner the previous owner's state", async () => {
        const { relay, register, poll } = relayWith();
        const device = await register();
        const auth = () => relay.authenticateDevice(device.id, bearer(device.token));
        const shown = { type: "counter", label: "Private", count: 4, version: 1 };
        await relay.claim("owner-a", "ip", { code: device.code });
        await relay.report(await auth(), shown);
        const stale = await auth();
        await relay.unpair("owner-a", device.id);
        await relay.report(stale, shown);
        await relay.report(await auth(), shown);
        const { code } = await poll(device.id, device.token);
        await relay.claim("owner-b", "ip", { code });
        expect(await relay.getState("owner-b", device.id)).toEqual({ last_seen_ms_ago: 0 });
      });

      it("lets one of two simultaneous claims through the relay win", async () => {
        const { relay, register } = relayWith();
        const { code } = await register();
        const results = await Promise.all([
          status(relay.claim("owner-a", "ip", { code })),
          status(relay.claim("owner-b", "ip", { code })),
        ]);
        expect(results.sort()).toEqual([404, "resolved"]);
      });

      it("enforces the claim limit per owner and the limits per address", async () => {
        const { relay, register } = relayWith({ config: { claimsPerOwner: 3, claimsPerIp: 5, registrationsPerIp: 2 } });
        const { code } = await register("a", "1.1.1.1");
        await register("b", "1.1.1.1");
        expect(await status(register("c", "1.1.1.1"))).toBe(429);
        for (let i = 0; i < 3; i++) {
          expect(await status(relay.claim("owner-a", "2.2.2.2", { code: "not-the-code" }))).toBe(404);
        }
        expect(await status(relay.claim("owner-a", "2.2.2.2", { code }))).toBe(429);
        expect(await status(relay.claim("owner-b", "2.2.2.2", { code: "not-the-code" }))).toBe(404);
        expect(await status(relay.claim("owner-c", "2.2.2.2", { code: "not-the-code" }))).toBe(404);
        expect(await status(relay.claim("owner-d", "2.2.2.2", { code }))).toBe(429);
        expect(await status(relay.claim("owner-d", "3.3.3.3", { code }))).toBe("resolved");
      });
    });
  });
});

// What only MongoDB has: the indexes, and the purge date that lets it delete abandoned devices.
describe.skipIf(MONGO_URI === "")("MongoDB store: indexes and purgeAt", () => {
  let store: DeviceStore;
  const raw = (id: string) => RelayDevice.findById(id).lean();

  beforeAll(async () => {
    assertLocal(MONGO_URI);
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    await RelayDevice.syncIndexes();
    await RateBucket.syncIndexes();
  }, 30_000);
  afterAll(() => mongoose.disconnect());
  beforeEach(async () => {
    await RelayDevice.deleteMany({});
    await RateBucket.deleteMany({});
    store = createMongoStore();
  });

  it("syncIndexes() creates the indexes the relay relies on", async () => {
    const indexes = await RelayDevice.collection.indexes();
    const byKey = (key: Record<string, number>) =>
      indexes.find((index) => JSON.stringify(index.key) === JSON.stringify(key));
    expect(byKey({ hw: 1 })).toMatchObject({ unique: true });
    expect(byKey({ tokenHash: 1 })).toMatchObject({ unique: true });
    expect(byKey({ ownerHash: 1 })).toBeDefined();
    expect(byKey({ code: 1 })).toMatchObject({ unique: true, partialFilterExpression: { code: { $type: "string" } } });
    expect(byKey({ purgeAt: 1 })).toMatchObject({ expireAfterSeconds: 0 });
    expect(indexes).toHaveLength(6); // the five above and _id

    const buckets = await RateBucket.collection.indexes();
    expect(buckets.find((index) => "key" in index.key)).toMatchObject({ unique: true });
    expect(buckets.find((index) => "expiresAt" in index.key)).toMatchObject({ expireAfterSeconds: 0 });
  });

  it("an unpaired device has a purge date a day after its last request", async () => {
    const a = await store.registerDevice(registration());
    expect((await raw(a.id))?.purgeAt?.getTime()).toBe(T0 + UNCLAIMED_RETENTION_MS);
    await store.touchDevice(a, T0 + 5000);
    expect((await raw(a.id))?.purgeAt?.getTime()).toBe(T0 + 5000 + UNCLAIMED_RETENTION_MS);
  });

  it("a paired device has no purge date and no code field, and polls do not bring one back", async () => {
    const a = await store.registerDevice(registration());
    const claimed = await store.claimByCode(a.code as string, "owner-a", T0);
    let doc = await raw(a.id);
    expect(doc).not.toHaveProperty("purgeAt");
    expect(doc).not.toHaveProperty("code");
    expect(doc).not.toHaveProperty("codeExpiresAt");

    await store.touchDevice(claimed!, T0 + 1000);
    await store.saveState(a.id, a.tokenHash, { type: "idle", label: "", count: 0, seconds: 0, remaining_seconds: 0, running: false, done: false, motion: false, version: 0 }, T0 + 2000);
    await store.setCapsule(a.id, "owner-a", { type: "counter", label: "", count: 0 });
    await store.setAction(a.id, "owner-a", "increment");
    await store.renewCode(a.id, "new-code-here", T0 + MINUTE);
    doc = await raw(a.id);
    expect(doc).not.toHaveProperty("purgeAt");
    expect(doc).not.toHaveProperty("code");
    expect(doc?.lastSeenAt).toBe(T0 + 2000);
  });

  it("a touch that read the device before it was paired does not give it a purge date", async () => {
    const before = await store.registerDevice(registration());
    await store.claimByCode(before.code as string, "owner-a", T0);
    await store.touchDevice(before, T0 + 3000); // `before` still says unpaired
    expect(await raw(before.id)).not.toHaveProperty("purgeAt");
  });

  it("unpairing and registering again put the purge date back", async () => {
    const a = await store.registerDevice(registration());
    await store.claimByCode(a.code as string, "owner-a", T0);
    await store.releaseDevice(a.id, "owner-a", T0 + 9000);
    expect((await raw(a.id))?.purgeAt?.getTime()).toBe(T0 + 9000 + UNCLAIMED_RETENTION_MS);

    const b = await store.registerDevice(registration());
    await store.claimByCode(b.code as string, "owner-a", T0);
    await store.registerDevice(registration({ hw: b.hw, now: T0 + 500 }));
    expect((await raw(b.id))?.purgeAt?.getTime()).toBe(T0 + 500 + UNCLAIMED_RETENTION_MS);
    expect((await raw(b.id))?.ownerHash).toBeNull();
  });

  it("keeps rate buckets under an HMAC key with a cleanup date", async () => {
    await store.hit("devices-claim|203.0.113.7", 300_000, T0);
    const buckets = await RateBucket.find({}).lean();
    expect(buckets).toHaveLength(1);
    expect(buckets[0]?.key).toMatch(/^[0-9a-f]{64}$/);
    expect(buckets[0]?.count).toBe(1);
    expect(buckets[0]?.expiresAt.getTime()).toBeGreaterThan(T0);
  });
});
