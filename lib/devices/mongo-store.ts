/**
 * DeviceStore on MongoDB: the RelayDevice model, and the site's RateBucket for counters.
 *
 * Every write that decides something (claim, capsule, action, release, register) is one
 * findOneAndUpdate with the condition in its filter, so two requests at once cannot both win.
 */

import { createHmac } from 'node:crypto';

import { isDuplicateKeyError } from '@/lib/db';
import { requireEnv } from '@/lib/env';
import { RateBucket } from '@/models/RateBucket';
import { RelayDevice, type RelayDeviceDoc } from '@/models/RelayDevice';

import type { Action, Capsule, DeviceState } from './capsule';
import { CodeTakenError, type DeviceRecord, type DeviceStore, type Registration } from './store';

/** An unpaired device that has not been heard from for this long is deleted (TTL index). */
export const UNCLAIMED_RETENTION_MS = 24 * 60 * 60 * 1000;
/** Rate buckets outlive their window by this much, as in lib/rate-limit.ts. */
const BUCKET_CLEANUP_MS = 24 * 60 * 60 * 1000;

const AFTER = { returnDocument: 'after' } as const;

function duplicateOf(error: unknown, field: string): boolean {
  if (!isDuplicateKeyError(error)) {
    return false;
  }
  const pattern = (error as { keyPattern?: Record<string, unknown> }).keyPattern;
  return pattern !== undefined && Object.hasOwn(pattern, field);
}

export function toRecord(doc: RelayDeviceDoc): DeviceRecord {
  return {
    id: doc._id,
    hw: doc.hw,
    kind: doc.kind,
    fw: doc.fw,
    tokenHash: doc.tokenHash,
    code: doc.code ?? null,
    codeExpiresAt: doc.codeExpiresAt ?? null,
    ownerHash: doc.ownerHash ?? null,
    claimedAt: doc.claimedAt ?? null,
    version: doc.version,
    capsule: doc.capsule ?? null,
    actionSeq: doc.actionSeq,
    action: doc.action ?? null,
    state: doc.state ?? null,
    lastSeenAt: doc.lastSeenAt,
    createdAt: doc.createdAt,
  };
}

const purgeAt = (now: number): Date => new Date(now + UNCLAIMED_RETENTION_MS);

/** Same recipe as lib/rate-limit.ts: HMAC(secret, route + subject + window). No raw address is stored. */
export function relayBucketKey(key: string, windowStart: number): string {
  return createHmac('sha256', requireEnv('APP_HMAC_SECRET')).update(`${key}|${windowStart}`, 'utf8').digest('hex');
}

// The updates, as plain objects, so tests can cast them against the schema without a database.
export const updates = {
  register(r: Registration) {
    return {
      $set: {
        kind: r.kind,
        fw: r.fw,
        tokenHash: r.tokenHash,
        code: r.code,
        codeExpiresAt: r.codeExpiresAt,
        ownerHash: null,
        claimedAt: null,
        capsule: null,
        action: null,
        state: null,
        lastSeenAt: r.now,
        purgeAt: purgeAt(r.now),
      },
      $setOnInsert: { _id: r.newId, version: 0, actionSeq: 0, createdAt: r.now },
    };
  },
  renewCode: (code: string, codeExpiresAt: number) => ({ $set: { code, codeExpiresAt } }),
  touchUnclaimed: (now: number) => ({ $set: { lastSeenAt: now, purgeAt: purgeAt(now) } }),
  touchClaimed: (now: number) => ({ $set: { lastSeenAt: now } }),
  saveState: (state: DeviceState, now: number) => ({ $set: { state, lastSeenAt: now } }),
  claim: (owner: string, now: number) => ({
    $set: { ownerHash: owner, claimedAt: now },
    $unset: { code: '', codeExpiresAt: '', purgeAt: '' },
  }),
  // An action meant for the previous capsule must not hit the new one.
  setCapsule: (capsule: Capsule) => ({ $set: { capsule, action: null }, $inc: { version: 1 } }),
  setAction: (action: Action) => ({ $set: { action }, $inc: { actionSeq: 1 } }),
  release: (now: number) => ({
    $set: { ownerHash: null, claimedAt: null, capsule: null, action: null, state: null, purgeAt: purgeAt(now) },
    $unset: { code: '', codeExpiresAt: '' },
  }),
};

export function createMongoStore(): DeviceStore {
  return {
    async findDevice(id) {
      const doc = await RelayDevice.findById(id).lean<RelayDeviceDoc | null>();
      return doc === null ? null : toRecord(doc);
    },

    async registerDevice(registration) {
      try {
        const doc = await RelayDevice.findOneAndUpdate({ hw: registration.hw }, updates.register(registration), {
          ...AFTER,
          upsert: true,
        }).lean<RelayDeviceDoc | null>();
        if (doc === null) {
          throw new Error('device upsert returned no document');
        }
        return toRecord(doc);
      } catch (error) {
        if (duplicateOf(error, 'code')) {
          throw new CodeTakenError();
        }
        throw error;
      }
    },

    async renewCode(id, code, codeExpiresAt) {
      try {
        const doc = await RelayDevice.findOneAndUpdate(
          { _id: id, ownerHash: null },
          updates.renewCode(code, codeExpiresAt),
          AFTER,
        ).lean<RelayDeviceDoc | null>();
        return doc === null ? null : toRecord(doc);
      } catch (error) {
        if (duplicateOf(error, 'code')) {
          throw new CodeTakenError();
        }
        throw error;
      }
    },

    async touchDevice(device, now) {
      if (device.ownerHash === null) {
        // The filter keeps a claim that happens right now from being given a purge date.
        await RelayDevice.updateOne({ _id: device.id, ownerHash: null }, updates.touchUnclaimed(now));
      } else {
        await RelayDevice.updateOne({ _id: device.id }, updates.touchClaimed(now));
      }
    },

    async saveState(id, tokenHash, state, now) {
      await RelayDevice.updateOne({ _id: id, tokenHash }, updates.saveState(state, now));
    },

    async claimByCode(code, owner, now) {
      const doc = await RelayDevice.findOneAndUpdate(
        { code, ownerHash: null, codeExpiresAt: { $gt: now } },
        updates.claim(owner, now),
        AFTER,
      ).lean<RelayDeviceDoc | null>();
      return doc === null ? null : toRecord(doc);
    },

    async listByOwner(owner) {
      const docs = await RelayDevice.find({ ownerHash: owner }).sort({ claimedAt: 1 }).lean<RelayDeviceDoc[]>();
      return docs.map(toRecord);
    },

    async setCapsule(id, owner, capsule) {
      const doc = await RelayDevice.findOneAndUpdate(
        { _id: id, ownerHash: owner },
        updates.setCapsule(capsule),
        AFTER,
      ).lean<RelayDeviceDoc | null>();
      return doc === null ? null : doc.version;
    },

    async setAction(id, owner, action) {
      const doc = await RelayDevice.findOneAndUpdate(
        { _id: id, ownerHash: owner },
        updates.setAction(action),
        AFTER,
      ).lean<RelayDeviceDoc | null>();
      return doc === null ? null : doc.actionSeq;
    },

    async releaseDevice(id, owner, now) {
      const result = await RelayDevice.updateOne({ _id: id, ownerHash: owner }, updates.release(now));
      return result.matchedCount === 1;
    },

    async hit(key, windowMs, now) {
      const windowStart = Math.floor(now / windowMs) * windowMs;
      const bump = () =>
        RateBucket.findOneAndUpdate(
          { key: relayBucketKey(key, windowStart) },
          {
            $inc: { count: 1 },
            $setOnInsert: { expiresAt: new Date(windowStart + windowMs + BUCKET_CLEANUP_MS) },
          },
          { ...AFTER, upsert: true, setDefaultsOnInsert: true },
        ).lean<{ count: number } | null>();
      try {
        return (await bump())?.count ?? 1;
      } catch (error) {
        if (!isDuplicateKeyError(error)) {
          throw error;
        }
        return (await bump())?.count ?? 1; // two first hits at once: the second upsert finds the bucket
      }
    },
  };
}
