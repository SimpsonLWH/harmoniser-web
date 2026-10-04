/**
 * Creates and reconciles every MongoDB index the models declare, once, from a
 * script, instead of leaving it to `autoIndex` on a serverless cold start.
 *
 * Mongoose builds indexes on first use when `autoIndex` is on (the default),
 * but on Vercel each instance does that race independently, and a request
 * that arrives while a unique index is still building can slip past it. Run
 * this after the first deploy, after any model change, and whenever a new
 * database is created:
 *
 *   npm run indexes            # sync (drops stray indexes on these collections)
 *   npm run indexes -- --dry   # print what would change, write nothing
 *
 * `syncIndexes()` is the right operation here: it creates what the schema
 * declares and drops anything else on the same collection, so the database
 * cannot drift from the models. It never touches documents.
 */

import mongoose from 'mongoose';

import { connectDb } from '../lib/db';
import {
  Capsule,
  DeviceSession,
  MutationReceipt,
  RateBucket,
  RelayDevice,
} from '../models';

const dryRun = process.argv.includes('--dry');

function loadEnv(): void {
  for (const file of ['.env.local', '.env']) {
    try {
      process.loadEnvFile(file);
      return;
    } catch {
      // keep trying
    }
  }
}

interface ModelLike {
  readonly modelName: string;
  syncIndexes(): Promise<string[]>;
  collection: { indexes(): Promise<unknown[]> };
}

const MODELS: ModelLike[] = [Capsule, RateBucket, MutationReceipt, DeviceSession, RelayDevice];

async function main(): Promise<void> {
  loadEnv();
  if (process.env.MONGODB_URI === undefined) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.');
  }

  const conn = await connectDb();
  const database = conn.connection.db;
  if (database === undefined) {
    throw new Error('Connected, but the connection has no database handle.');
  }
  console.log(`database: ${database.databaseName}`);

  let droppedTotal = 0;
  for (const model of MODELS) {
    const before = await countIndexes(model);
    if (dryRun) {
      const declared = (model as unknown as { schema: { indexes(): [object, object?][] } }).schema
        .indexes()
        .map(([fields]) => Object.keys(fields as Record<string, unknown>).join('_'));
      console.log(`${model.modelName}: ${before} index(es) now; declares ${declared.join(', ') || 'none'}`);
      continue;
    }
    const dropped = await model.syncIndexes();
    droppedTotal += dropped.length;
    const after = await model.collection.indexes();
    console.log(`${model.modelName}: ${before} -> ${after.length} index(es)` +
      (dropped.length > 0 ? `, dropped ${dropped.join(', ')}` : ''));
    for (const index of after as IndexDescription[]) {
      const flags: string[] = [];
      if (index.unique === true) flags.push('unique');
      if (typeof index.expireAfterSeconds === 'number') flags.push(`ttl=${index.expireAfterSeconds}s`);
      if (index.partialFilterExpression !== undefined) flags.push('partial');
      console.log(`  ${index.name}: ${JSON.stringify(index.key)}${flags.length > 0 ? ` [${flags.join(', ')}]` : ''}`);
    }
  }
  console.log(dryRun ? 'dry run: nothing written' : `done; ${droppedTotal} stray index(es) dropped`);
  await mongoose.disconnect();
}

interface IndexDescription {
  name?: string;
  key: Record<string, unknown>;
  unique?: boolean;
  expireAfterSeconds?: number;
  partialFilterExpression?: Record<string, unknown>;
}

async function countIndexes(model: ModelLike): Promise<number> {
  try {
    return (await model.collection.indexes()).length;
  } catch (e) {
    // NamespaceNotFound (code 26): the collection does not exist yet; syncIndexes creates it.
    if (typeof e === 'object' && e !== null && (e as { code?: unknown }).code === 26) {
      return 0;
    }
    throw e;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
