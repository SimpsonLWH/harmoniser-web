/** Public DTOs: an explicit allowlist. Tokens, hashes, reports and IPs never leave the server. */

import type { Capsule } from './validator';
import { routeCapsule } from './validator';
import type { CapsuleSummaryDto, CapsuleDetailDto } from './types';

export interface CapsuleDocLike {
  _id: unknown;
  name?: string;
  description?: string;
  tags?: string[];
  schemaVersion?: number;
  installs?: number;
  createdAt?: Date;
  updatedAt?: Date;
  capsule?: unknown;
}

function idString(doc: CapsuleDocLike): string {
  return String(doc._id);
}

export function toSummary(doc: CapsuleDocLike): CapsuleSummaryDto {
  const route = widgetRoute(doc.capsule);
  return {
    id: idString(doc),
    name: doc.name ?? '',
    description: doc.description ?? '',
    tags: doc.tags ?? [],
    schemaVersion: doc.schemaVersion === 1 ? 1 : 0,
    installs: doc.installs ?? 0,
    widget: route.widget,
    widgetReason: route.reason,
    createdAt: (doc.createdAt ?? new Date(0)).toISOString(),
    updatedAt: (doc.updatedAt ?? new Date(0)).toISOString(),
  };
}

export function toDetail(doc: CapsuleDocLike): CapsuleDetailDto {
  return { ...toSummary(doc), capsule: doc.capsule };
}

function widgetRoute(capsule: unknown): { widget: boolean; reason: string } {
  if (capsule === undefined || capsule === null || typeof capsule !== 'object') {
    return { widget: false, reason: 'App only: the capsule payload is not available.' };
  }
  try {
    return routeCapsule(capsule as Capsule);
  } catch {
    return { widget: false, reason: 'App only: the capsule could not be checked for widget support.' };
  }
}
