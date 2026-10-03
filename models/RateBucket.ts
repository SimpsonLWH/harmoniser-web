/**
 * Durable per-IP counter buckets. TTL is cleanup only; the route checks the count in logic.
 */

import mongoose, { type Model } from 'mongoose';

export interface RateBucketDoc {
  key: string;
  count: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RateBucketSchema = new mongoose.Schema<RateBucketDoc>(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true, default: 0, min: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, strict: 'throw', versionKey: false },
);

RateBucketSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateBucket: Model<RateBucketDoc> =
  (mongoose.models.RateBucket as Model<RateBucketDoc> | undefined) ??
  mongoose.model<RateBucketDoc>('RateBucket', RateBucketSchema);
