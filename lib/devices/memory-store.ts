// DeviceStore in memory: for tests and for local development without a database. One
// process only, and a restart forgets everything, so it is refused on Vercel.
import type { Action, Capsule, DeviceState } from "./capsule";
import { CodeTakenError, type DeviceRecord, type DeviceStore, type Registration } from "./store";

export function createMemoryStore(): DeviceStore {
  // Records are never changed in place: an update puts a new object into the map.
  const devices = new Map<string, DeviceRecord>();
  const hits = new Map<string, { windowStart: number; count: number }>();

  function codeTaken(code: string, exceptId: string): boolean {
    return [...devices.values()].some((device) => device.code === code && device.id !== exceptId);
  }

  function update(id: string, owner: string, change: (device: DeviceRecord) => DeviceRecord): DeviceRecord | null {
    const device = devices.get(id);
    if (device === undefined || device.ownerHash !== owner) {
      return null;
    }
    const next = change(device);
    devices.set(id, next);
    return next;
  }

  return {
    async findDevice(id) {
      return devices.get(id) ?? null;
    },

    async registerDevice(registration: Registration) {
      const { hw, newId, kind, fw, tokenHash, code, codeExpiresAt, now } = registration;
      const existing = [...devices.values()].find((device) => device.hw === hw);
      const id = existing?.id ?? newId;
      if (codeTaken(code, id)) {
        throw new CodeTakenError();
      }
      const device: DeviceRecord = {
        id,
        hw,
        kind,
        fw,
        tokenHash,
        code,
        codeExpiresAt,
        ownerHash: null,
        claimedAt: null,
        version: existing?.version ?? 0,
        capsule: null,
        actionSeq: existing?.actionSeq ?? 0,
        action: null,
        state: null,
        lastSeenAt: now,
        createdAt: existing?.createdAt ?? now,
      };
      devices.set(id, device);
      return device;
    },

    async renewCode(id, code, codeExpiresAt) {
      const device = devices.get(id);
      if (device === undefined || device.ownerHash !== null) {
        return null;
      }
      if (codeTaken(code, id)) {
        throw new CodeTakenError();
      }
      const next = { ...device, code, codeExpiresAt };
      devices.set(id, next);
      return next;
    },

    async touchDevice(device, now) {
      const current = devices.get(device.id);
      if (current !== undefined) {
        devices.set(device.id, { ...current, lastSeenAt: now });
      }
    },

    async saveState(id, tokenHash, state: DeviceState, now) {
      const device = devices.get(id);
      if (device !== undefined && device.tokenHash === tokenHash && device.ownerHash !== null) {
        devices.set(id, { ...device, state, lastSeenAt: now });
      }
    },

    async claimByCode(code, owner, now) {
      const device = [...devices.values()].find(
        (candidate) =>
          candidate.ownerHash === null &&
          candidate.code === code &&
          candidate.codeExpiresAt !== null &&
          candidate.codeExpiresAt > now,
      );
      if (device === undefined) {
        return null;
      }
      const next = { ...device, ownerHash: owner, claimedAt: now, code: null, codeExpiresAt: null, state: null };
      devices.set(device.id, next);
      return next;
    },

    async listByOwner(owner) {
      return [...devices.values()]
        .filter((device) => device.ownerHash === owner)
        .sort((a, b) => (a.claimedAt ?? 0) - (b.claimedAt ?? 0));
    },

    async countByOwner(owner) {
      return [...devices.values()].filter((device) => device.ownerHash === owner).length;
    },

    async setCapsule(id, owner, capsule: Capsule) {
      // An action meant for the previous capsule must not hit the new one.
      const next = update(id, owner, (device) => ({
        ...device,
        capsule,
        version: device.version + 1,
        action: null,
      }));
      return next?.version ?? null;
    },

    async setAction(id, owner, action: Action) {
      const next = update(id, owner, (device) => ({ ...device, action, actionSeq: device.actionSeq + 1 }));
      return next?.actionSeq ?? null;
    },

    async releaseDevice(id, owner) {
      const next = update(id, owner, (device) => ({
        ...device,
        ownerHash: null,
        claimedAt: null,
        code: null,
        codeExpiresAt: null,
        capsule: null,
        action: null,
        state: null,
      }));
      return next !== null;
    },

    async hit(key, windowMs, now) {
      const windowStart = Math.floor(now / windowMs) * windowMs;
      const previous = hits.get(key);
      const count = previous !== undefined && previous.windowStart === windowStart ? previous.count + 1 : 1;
      hits.set(key, { windowStart, count });
      return count;
    },
  };
}
