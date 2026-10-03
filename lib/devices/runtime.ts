/** Picks the store and builds the relay once per server instance. Server only. */

import { connectDb } from '@/lib/db';
import { envValue } from '@/lib/env';

import { createMemoryStore } from './memory-store';
import { createMongoStore } from './mongo-store';
import { createRelay, type Relay } from './relay';
import type { DeviceStore } from './store';

declare global {
  var __harmoniserRelayMemory: DeviceStore | undefined;
}

/**
 * DEVICE_RELAY_STORE=memory keeps devices in the server process instead of MongoDB: for the
 * tests and for running the firmware's test_relay.sh against `next dev` without a database.
 * It is ignored on Vercel, where every instance would have a store of its own.
 */
export function usesMemoryStore(): boolean {
  return envValue('DEVICE_RELAY_STORE') === 'memory' && envValue('VERCEL') === undefined;
}

export async function getRelay(): Promise<Relay> {
  if (usesMemoryStore()) {
    globalThis.__harmoniserRelayMemory ??= createMemoryStore();
    return createRelay(globalThis.__harmoniserRelayMemory);
  }
  await connectDb();
  return createRelay(createMongoStore());
}

/** For tests: forget the in-memory devices. */
export function resetMemoryRelay(): void {
  globalThis.__harmoniserRelayMemory = undefined;
}
