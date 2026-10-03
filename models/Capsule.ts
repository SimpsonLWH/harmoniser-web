/**
 * Public marketplace metadata for one immutable, validated capsule payload.
 * The capsule itself is untrusted JSON: it is re-validated on every publish, and `strict:'throw'`
 * plus an explicit DTO allowlist keep everything else out of responses.
 */

import mongoose, { type Model, type Schema, type Types } from 'mongoose';

export interface CapsuleDoc {
  _id: Types.ObjectId;
  capsule: unknown;
  name: string;
  description: string;
  tags: string[];
  schemaVersion: 0 | 1;
  installs: number;
  reports: number;
  status: 'visible' | 'hidden' | 'deleted';
  contentHash: string;
  ownerTokenHash: string;
  ownerUserId?: string;
  validatorRevision: string;
  createdAt: Date;
  updatedAt: Date;
}

const CapsuleSchema = new mongoose.Schema<CapsuleDoc>(
  {
    capsule: { type: mongoose.Schema.Types.Mixed, required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: '', maxlength: 500 },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 8,
        message: 'at most 8 tags',
      },
    },
    schemaVersion: { type: Number, required: true, enum: [0, 1] },
    installs: { type: Number, default: 0, min: 0 },
    reports: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      required: true,
      enum: ['visible', 'hidden', 'deleted'],
      default: 'visible',
    },
    contentHash: { type: String, required: true, unique: true },
    ownerTokenHash: { type: String, required: true, select: false },
    ownerUserId: { type: String, required: false },
    validatorRevision: { type: String, required: true },
  },
  {
    timestamps: true,
    strict: 'throw',
    versionKey: false,
  },
);

// Browse order and tag filtering; the text index powers ?q= search.
CapsuleSchema.index({ status: 1, _id: -1 });
CapsuleSchema.index({ tags: 1, status: 1 });
CapsuleSchema.index({ name: 'text', description: 'text', tags: 'text' });

export const Capsule: Model<CapsuleDoc> =
  (mongoose.models.Capsule as Model<CapsuleDoc> | undefined) ??
  mongoose.model<CapsuleDoc>('Capsule', CapsuleSchema as unknown as Schema<CapsuleDoc>);
