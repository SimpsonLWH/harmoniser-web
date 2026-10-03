/**
 * Placeholder schema for Keanu's /api/devices/** relay: a short-lived word-phrase pairing
 * session. The marketplace ships the shape and the DB helper only; the relay routes, the
 * device token and any polling/acknowledgement flow stay in his workstream.
 */

import mongoose, { type Model } from 'mongoose';

export interface DeviceSessionDoc {
  codeHash: string;
  wordPhraseHash: string;
  status: 'pending' | 'claimed' | 'expired';
  deviceTokenHash?: string;
  deviceKind?: string;
  claimedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const DEVICE_SESSION_TTL_MS = 10 * 60 * 1000;

const DeviceSessionSchema = new mongoose.Schema<DeviceSessionDoc>(
  {
    codeHash: { type: String, required: true, unique: true },
    wordPhraseHash: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'claimed', 'expired'],
      default: 'pending',
    },
    deviceTokenHash: { type: String, required: false },
    deviceKind: { type: String, required: false },
    claimedAt: { type: Date, required: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, strict: 'throw', versionKey: false },
);

DeviceSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const DeviceSession: Model<DeviceSessionDoc> =
  (mongoose.models.DeviceSession as Model<DeviceSessionDoc> | undefined) ??
  mongoose.model<DeviceSessionDoc>('DeviceSession', DeviceSessionSchema);
