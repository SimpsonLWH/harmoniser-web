/**
 * Seeds a handful of clearly-labelled synthetic capsules so the marketplace is not empty.
 *
 *   npm run seed:dry   print what would change, write nothing
 *   npm run seed       validate, hash and upsert (idempotent by contentHash, insert-only)
 *
 * Every fixture is validated with the same ported validator the API uses. Nothing here claims
 * real usage: descriptions start with "Example" and every item carries the "example" tag.
 */

import mongoose from 'mongoose';

import { canonicalJson, contentHash, utf8Bytes } from '../lib/canonical';
import { connectDb } from '../lib/db';
import { hashToken, isValidTokenShape, newToken } from '../lib/ownership';
import { MAX_CAPSULE_BYTES, normalizeTags } from '../lib/tags';
import { validateCapsuleObject } from '../lib/validator';
import { Capsule } from '../models/Capsule';
import { DeviceSession } from '../models/DeviceSession';
import { MutationReceipt } from '../models/MutationReceipt';
import { RateBucket } from '../models/RateBucket';

const dryRun = process.argv.includes('--dry-run');

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

interface Fixture {
  description: string;
  tags: string[];
  capsule: unknown;
}

const FIXTURES: Fixture[] = [
  {
    description: 'Example — three timers for pasta night: pasta, sauce and bread.',
    tags: ['example', 'cooking', 'timer'],
    capsule: {
      schemaVersion: 0,
      id: 'pasta-night',
      name: 'Pasta night',
      permissions: ['reminders'],
      ui: [
        { type: 'text', text: 'Dinner timers' },
        { type: 'timer', id: 'pasta', label: 'Pasta', minutes: 9 },
        { type: 'timer', id: 'sauce', label: 'Sauce', minutes: 15 },
        { type: 'timer', id: 'bread', label: 'Bread', minutes: 6 },
        { type: 'button', label: 'Start all', action: 'startAllTimers' },
      ],
    },
  },
  {
    description: 'Example — an eight-glass water counter with one tap to add a glass.',
    tags: ['example', 'health', 'counter'],
    capsule: {
      schemaVersion: 0,
      id: 'water-goal',
      name: 'Water goal',
      permissions: [],
      ui: [
        { type: 'text', text: 'Eight glasses a day' },
        { type: 'counter', id: 'glasses', label: 'Glasses', source: 'manual' },
        { type: 'button', label: 'Add a glass', action: 'increment:glasses' },
        { type: 'button', label: 'Reset', action: 'reset:glasses' },
      ],
    },
  },
  {
    description: 'Example — a squat counter that counts from the phone’s motion sensor.',
    tags: ['example', 'fitness', 'counter'],
    capsule: {
      schemaVersion: 0,
      id: 'squats',
      name: 'Squat counter',
      permissions: ['motion'],
      ui: [
        { type: 'counter', id: 'squats', label: 'Squats', source: 'motion' },
        { type: 'button', label: 'Add one', action: 'increment:squats' },
        { type: 'button', label: 'Reset', action: 'reset:squats' },
      ],
    },
  },
  {
    description: 'Example — a live bill split: total, people and tip, with the share updating as you type.',
    tags: ['example', 'finance'],
    capsule: {
      schemaVersion: 1,
      id: 'bill-split',
      name: 'Bill split',
      permissions: [],
      state: {
        total: { type: 'number', initial: 0 },
        people: { type: 'number', initial: 2 },
        tip: { type: 'number', initial: 0 },
      },
      computed: { each: 'if(people > 0, round(total * (1 + tip / 100) / people, 2), 0)' },
      ui: [
        { type: 'input', bind: 'total', kind: 'number', label: 'Total' },
        { type: 'input', bind: 'people', kind: 'number', label: 'People' },
        { type: 'input', bind: 'tip', kind: 'number', label: 'Tip %' },
        { type: 'display', text: 'Each pays {each}' },
        { type: 'when', if: 'people <= 0', show: [{ type: 'text', text: 'Add at least one person.' }] },
      ],
    },
  },
  {
    description: 'Example — a shopping list you can add to and undo, with a live item count.',
    tags: ['example', 'home', 'checklist'],
    capsule: {
      schemaVersion: 1,
      id: 'shopping-list',
      name: 'Shopping list',
      permissions: [],
      state: {
        item: { type: 'text', initial: '' },
        items: { type: 'list', initial: [] },
      },
      ui: [
        { type: 'input', bind: 'item', kind: 'text', label: 'Item' },
        {
          type: 'button',
          label: 'Add',
          enabledIf: 'len(item) > 0',
          do: [
            { push: 'items', value: 'item' },
            { set: 'item', to: "''" },
          ],
        },
        { type: 'button', label: 'Undo', enabledIf: 'len(items) > 0', do: [{ pop: 'items' }] },
        { type: 'display', text: '{len(items)} items' },
        { type: 'list', source: 'items' },
      ],
    },
  },
];

async function main(): Promise<void> {
  loadEnv();
  if (!dryRun && process.env.MONGODB_URI === undefined) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.');
  }
  if (process.env.APP_HMAC_SECRET === undefined) {
    throw new Error('APP_HMAC_SECRET is not set. Copy .env.example to .env.local and fill it in.');
  }

  let ownerToken = process.env.SEED_OWNER_TOKEN?.trim() ?? '';
  let generated = false;
  if (!isValidTokenShape(ownerToken)) {
    ownerToken = newToken();
    generated = true;
  }
  const ownerTokenHash = hashToken(ownerToken);

  if (!dryRun) {
    await connectDb();
    await Promise.all([
      Capsule.syncIndexes(),
      RateBucket.syncIndexes(),
      MutationReceipt.syncIndexes(),
      DeviceSession.syncIndexes(),
    ]);
  }

  let created = 0;
  let skipped = 0;
  for (const fixture of FIXTURES) {
    const checked = validateCapsuleObject(fixture.capsule);
    if (!checked.ok || checked.capsule === undefined) {
      throw new Error(`Fixture failed validation: ${checked.errors.join('\n')}`);
    }
    const canonical = canonicalJson(checked.capsule);
    if (utf8Bytes(canonical) > MAX_CAPSULE_BYTES) {
      throw new Error(`Fixture is larger than ${MAX_CAPSULE_BYTES} bytes.`);
    }
    const tags = normalizeTags(fixture.tags);
    if (!tags.ok) {
      throw new Error(`Fixture tags are invalid: ${tags.message}`);
    }
    const hash = contentHash(checked.capsule);

    if (dryRun) {
      console.log(`[dry-run] ${checked.capsule.name}  ${hash.slice(0, 12)}…  tags=${tags.tags.join(',')}`);
      continue;
    }

    const existing = await Capsule.findOne({ contentHash: hash }).select('_id').lean();
    if (existing !== null) {
      skipped += 1;
      console.log(`skip ${checked.capsule.name} (already present)`);
      continue;
    }
    await Capsule.create({
      capsule: checked.capsule,
      name: checked.capsule.name,
      description: fixture.description,
      tags: tags.tags,
      schemaVersion: checked.capsule.schemaVersion === 1 ? 1 : 0,
      status: 'visible',
      contentHash: hash,
      ownerTokenHash,
      validatorRevision: 'seed-0.1.0',
    });
    created += 1;
    console.log(`add  ${checked.capsule.name}`);
  }

  if (dryRun) {
    console.log(`[dry-run] ${FIXTURES.length} fixtures checked; nothing written.`);
    return;
  }
  console.log(`Seeded ${created} capsule(s), skipped ${skipped}.`);
  if (generated) {
    console.log(`Generated seed owner token (keep it to delete examples later): ${ownerToken}`);
  }
  await mongoose.disconnect();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
