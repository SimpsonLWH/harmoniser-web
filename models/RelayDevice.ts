/**
 * One device known to the relay (/api/devices/**): an ESP32 wrist board or a /device browser
 * tab. Long-lived: it holds the device-token hash, who paired it, the capsule waiting for it
 * and its last reported state. See docs/device-relay.md.
 *
 * Why not DeviceSession: that placeholder is a pairing session that MongoDB deletes when it
 * expires and that keeps only hashes. The relay needs the opposite on both counts: the device
 * and its token must outlive the 10-minute pairing code, and the contract with the firmware
 * hands the current code back to the device on every poll (so it can redraw it), which a hash
 * cannot do. Keeping the code on the device document also makes a claim one atomic update.
 */

import mongoose, { type Model } from 'mongoose';

import type { Action, Capsule, DeviceState } from '@/lib/devices/capsule';

export interface RelayDeviceDoc {
  _id: string; // "dev_" + 16 hex digits; goes into the URL path
  hw: string; // the device's own stable id (a hash on the board, random in a browser)
  kind: string; // "wrist" | "web"
  fw: string;
  tokenHash: string; // HMAC of the device token (lib/devices/tokens.ts)
  code?: string; // the live pairing code; absent once paired
  codeExpiresAt?: number; // ms since the epoch
  ownerHash: string | null; // hashPrincipal(X-Harmoniser-Token) of whoever paired it
  claimedAt: number | null;
  version: number; // goes up with every capsule
  capsule: Capsule | null;
  actionSeq: number; // goes up with every action
  action: Action | null;
  state: DeviceState | null; // the device's last report
  lastSeenAt: number;
  createdAt: number;
  purgeAt?: Date; // set only while unpaired: MongoDB deletes abandoned devices
}

const RelayDeviceSchema = new mongoose.Schema<RelayDeviceDoc>(
  {
    _id: { type: String, required: true },
    hw: { type: String, required: true, unique: true },
    kind: { type: String, required: true },
    fw: { type: String, required: true },
    tokenHash: { type: String, required: true, unique: true },
    code: { type: String, required: false },
    codeExpiresAt: { type: Number, required: false },
    ownerHash: { type: String, default: null, index: true },
    claimedAt: { type: Number, default: null },
    version: { type: Number, required: true, default: 0, min: 0 },
    capsule: { type: mongoose.Schema.Types.Mixed, default: null },
    actionSeq: { type: Number, required: true, default: 0, min: 0 },
    action: { type: String, default: null },
    state: { type: mongoose.Schema.Types.Mixed, default: null },
    lastSeenAt: { type: Number, required: true },
    createdAt: { type: Number, required: true },
    purgeAt: { type: Date, required: false },
  },
  { strict: 'throw', versionKey: false, minimize: false },
);

// One live code at a time across all devices. A claim removes the field, so paired devices
// are outside the index.
RelayDeviceSchema.index({ code: 1 }, { unique: true, partialFilterExpression: { code: { $type: 'string' } } });
// Cleanup only: an unpaired device not heard from for a day is deleted. Paired ones are kept.
RelayDeviceSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });

export const RelayDevice: Model<RelayDeviceDoc> =
  (mongoose.models.RelayDevice as Model<RelayDeviceDoc> | undefined) ??
  mongoose.model<RelayDeviceDoc>('RelayDevice', RelayDeviceSchema);
