/**
 * Cached Mongoose connection for serverless (Vercel) + dev hot reload.
 * A rejected connection promise is cleared so the next request retries.
 * Only import this from Node-runtime route handlers and scripts.
 */

import mongoose from 'mongoose';

import { requireEnv } from './env';

declare global {
  var __harmoniserMongoose: Promise<typeof mongoose> | undefined;
}

export function connectDb(): Promise<typeof mongoose> {
  if (globalThis.__harmoniserMongoose === undefined) {
    const uri = requireEnv('MONGODB_URI');
    globalThis.__harmoniserMongoose = mongoose
      .connect(uri, {
        maxPoolSize: 5,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 20000,
      })
      .catch((err: unknown) => {
        globalThis.__harmoniserMongoose = undefined;
        throw err;
      });
  }
  return globalThis.__harmoniserMongoose;
}

export function isDuplicateKeyError(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code?: unknown }).code === 11000
  );
}
