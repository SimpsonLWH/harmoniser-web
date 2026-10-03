/**
 * Deduplicates install intents and reports from the same anonymous principal in a window.
 * Anonymous tokens are cheap to rotate: counters and the three-report hide are demo heuristics,
 * not fraud-resistant moderation.
 */

import mongoose, { type Model } from 'mongoose';

export interface MutationReceiptDoc {
  key: string;
  capsuleId: string;
  operation: 'install' | 'report';
  principalHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export const MUTATION_WINDOW_MS = 24 * 60 * 60 * 1000;

const MutationReceiptSchema = new mongoose.Schema<MutationReceiptDoc>(
  {
    key: { type: String, required: true, unique: true },
    capsuleId: { type: String, required: true },
    operation: { type: String, required: true, enum: ['install', 'report'] },
    principalHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, strict: 'throw', versionKey: false },
);

MutationReceiptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
MutationReceiptSchema.index({ capsuleId: 1, operation: 1, principalHash: 1 });

export const MutationReceipt: Model<MutationReceiptDoc> =
  (mongoose.models.MutationReceipt as Model<MutationReceiptDoc> | undefined) ??
  mongoose.model<MutationReceiptDoc>('MutationReceipt', MutationReceiptSchema);
