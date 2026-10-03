// What the relay needs from a database. Two implementations: lib/devices/memory-store.ts and
// lib/devices/mongo-store.ts. Times are milliseconds since the epoch, given by the caller.
import type { Action, Capsule, DeviceState } from "./capsule";

export interface DeviceRecord {
  readonly id: string;
  readonly hw: string;
  readonly kind: string;
  readonly fw: string;
  readonly tokenHash: string;
  readonly code: string | null; // null once claimed
  readonly codeExpiresAt: number | null;
  readonly ownerHash: string | null; // hashPrincipal() of the owner's token; null while unclaimed
  readonly claimedAt: number | null;
  readonly version: number; // goes up with every capsule; 0: nothing was ever sent
  readonly capsule: Capsule | null;
  readonly actionSeq: number;
  readonly action: Action | null;
  readonly state: DeviceState | null;
  readonly lastSeenAt: number;
  readonly createdAt: number;
}

export interface Registration {
  readonly hw: string;
  readonly newId: string; // used only if `hw` is not registered yet
  readonly kind: string;
  readonly fw: string;
  readonly tokenHash: string;
  readonly code: string;
  readonly codeExpiresAt: number;
  readonly now: number;
}

// Thrown by registerDevice() and renewCode() when another unclaimed device holds the code.
export class CodeTakenError extends Error {
  constructor() {
    super("pairing code already in use");
    this.name = "CodeTakenError";
  }
}

export interface DeviceStore {
  findDevice(id: string): Promise<DeviceRecord | null>;

  // Creates the device for `hw`, or resets the one there is: new token hash and code,
  // unclaimed, capsule, action and state dropped. `version` and `actionSeq` are kept.
  registerDevice(registration: Registration): Promise<DeviceRecord>;

  // A new code for a device that is still unclaimed. Null if it is not (or is gone).
  renewCode(id: string, code: string, codeExpiresAt: number): Promise<DeviceRecord | null>;

  // Notes a request from the device.
  touchDevice(device: DeviceRecord, now: number): Promise<void>;

  // Stores a state report, if the token hash is still the device's and the device is
  // paired. An unpaired device's screen is nobody's business: nothing is kept for a later owner.
  saveState(id: string, tokenHash: string, state: DeviceState, now: number): Promise<void>;

  // Atomically gives the unclaimed device with this unexpired code to the owner, retires
  // the code and drops any stored state. Null if there is no such device.
  claimByCode(code: string, owner: string, now: number): Promise<DeviceRecord | null>;

  listByOwner(owner: string): Promise<DeviceRecord[]>;
  countByOwner(owner: string): Promise<number>;

  // The next three act only on a device this owner holds, and return null/false otherwise.
  setCapsule(id: string, owner: string, capsule: Capsule): Promise<number | null>; // the new version
  setAction(id: string, owner: string, action: Action): Promise<number | null>; // the new action_seq
  releaseDevice(id: string, owner: string, now: number): Promise<boolean>;

  // Counts one event under `key` in the fixed window `now` falls into; returns the count so far.
  hit(key: string, windowMs: number, now: number): Promise<number>;
}
