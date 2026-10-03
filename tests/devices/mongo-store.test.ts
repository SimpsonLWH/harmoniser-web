// What can be checked of the MongoDB store without a database: the schema, its indexes, and
// that every update the store sends casts cleanly against the strict schema. The queries
// themselves have not run against a real MongoDB in these tests.
import { describe, expect, it } from "vitest";

import { relayBucketKey, toRecord, UNCLAIMED_RETENTION_MS, updates } from "@/lib/devices/mongo-store";
import { RateBucket } from "@/models/RateBucket";
import { RelayDevice } from "@/models/RelayDevice";

const NOW = 1_700_000_000_000;
const registration = {
  hw: "board-1",
  newId: "dev_0123456789abcdef",
  kind: "wrist",
  fw: "t",
  tokenHash: "a".repeat(64),
  code: "brave-otter-lamp",
  codeExpiresAt: NOW + 600_000,
  now: NOW,
};

// Mongoose casts an update when the query is built; strict: "throw" refuses unknown paths.
function cast(update: Record<string, unknown>): Record<string, unknown> {
  const query = RelayDevice.findOneAndUpdate({ _id: "dev_x" }, update);
  // @ts-expect-error _castUpdate is what exec() runs before sending; there is no public equivalent.
  return query._castUpdate(query.getUpdate()) as Record<string, unknown>;
}

describe("RelayDevice schema", () => {
  it("has the indexes the relay relies on", () => {
    const indexes = RelayDevice.schema.indexes();
    expect(indexes).toContainEqual([{ hw: 1 }, expect.objectContaining({ unique: true })]);
    expect(indexes).toContainEqual([{ tokenHash: 1 }, expect.objectContaining({ unique: true })]);
    expect(indexes).toContainEqual([{ ownerHash: 1 }, expect.anything()]);
    expect(indexes).toContainEqual([
      { code: 1 },
      expect.objectContaining({ unique: true, partialFilterExpression: { code: { $type: "string" } } }),
    ]);
    expect(indexes).toContainEqual([{ purgeAt: 1 }, expect.objectContaining({ expireAfterSeconds: 0 })]);
  });

  it("validates a freshly registered device and maps it to a record", async () => {
    const update = updates.register(registration);
    const doc = new RelayDevice({ ...update.$setOnInsert, ...update.$set, hw: registration.hw });
    await expect(doc.validate()).resolves.toBeUndefined();
    const record = toRecord(doc.toObject());
    expect(record).toMatchObject({
      id: "dev_0123456789abcdef",
      code: "brave-otter-lamp",
      ownerHash: null,
      version: 0,
      actionSeq: 0,
      capsule: null,
      state: null,
    });
    expect(doc.toObject().purgeAt?.getTime()).toBe(NOW + UNCLAIMED_RETENTION_MS);
  });

  it("refuses a field the schema does not know", () => {
    expect(() => new RelayDevice({ _id: "dev_x", token: "raw" })).toThrow();
  });
});

describe("updates", () => {
  it.each([
    ["register", updates.register(registration)],
    ["renewCode", updates.renewCode("calm-river-stone", NOW)],
    ["touchUnclaimed", updates.touchUnclaimed(NOW)],
    ["touchClaimed", updates.touchClaimed(NOW)],
    ["saveState", updates.saveState({ type: "idle", label: "", count: 0, seconds: 0, remaining_seconds: 0, running: false, done: false, motion: false, version: 0 }, NOW)],
    ["claim", updates.claim("b".repeat(64), NOW)],
    ["setCapsule", updates.setCapsule({ type: "timer", label: "Pasta", seconds: 540 })],
    ["setAction", updates.setAction("increment")],
    ["release", updates.release(NOW)],
  ])("%s casts against the strict schema", (_name, update) => {
    expect(() => cast(update)).not.toThrow();
  });

  it("would be refused if it named an unknown field (the check above is a real one)", () => {
    expect(() => cast({ $set: { token: "raw" } })).toThrow();
  });

  it("a claim sets the owner and removes the code and the purge date in one update", () => {
    expect(updates.claim("owner", NOW)).toEqual({
      $set: { ownerHash: "owner", claimedAt: NOW },
      $unset: { code: "", codeExpiresAt: "", purgeAt: "" },
    });
  });

  it("a new capsule raises the version and drops the pending action", () => {
    expect(updates.setCapsule({ type: "counter", label: "", count: 0 })).toEqual({
      $set: { capsule: { type: "counter", label: "", count: 0 }, action: null },
      $inc: { version: 1 },
    });
  });

  it("a release puts the purge date back and never leaves a code behind", () => {
    const update = updates.release(NOW);
    expect(update.$set).toMatchObject({ ownerHash: null, capsule: null, action: null, state: null });
    expect(update.$unset).toEqual({ code: "", codeExpiresAt: "" });
  });
});

describe("rate bucket keys", () => {
  it("are HMACs: no address or owner in the stored key, one key per window", () => {
    const key = relayBucketKey("devices-claim|203.0.113.7", 0);
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain("203.0.113.7");
    expect(relayBucketKey("devices-claim|203.0.113.7", 0)).toBe(key);
    expect(relayBucketKey("devices-claim|203.0.113.7", 300_000)).not.toBe(key);
    expect(relayBucketKey("devices-claim|203.0.113.8", 0)).not.toBe(key);
  });

  it("fit the site's RateBucket schema", async () => {
    const bucket = new RateBucket({ key: relayBucketKey("devices-claim|x", 0), count: 1, expiresAt: new Date(NOW) });
    await expect(bucket.validate()).resolves.toBeUndefined();
  });
});
