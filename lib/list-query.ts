/**
 * Query parsing and pagination for GET /api/capsules.
 *
 * `limit` is validated as an entire integer string: "10" is ten, "10junk" and "1e2" are errors,
 * because Number.parseInt would quietly accept both. `include=capsule` is the only include value
 * the endpoint knows; anything else is a query error rather than a silently ignored parameter.
 */

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;

export type LimitResult = { ok: true; limit: number } | { ok: false; message: string };

export function parseLimit(raw: string | null): LimitResult {
  if (raw === null) {
    return { ok: true, limit: DEFAULT_LIMIT };
  }
  const value = raw.trim();
  if (!/^\d{1,3}$/.test(value)) {
    return { ok: false, message: `limit must be a whole number between 1 and ${MAX_LIMIT}.` };
  }
  const limit = Number(value);
  if (limit < 1 || limit > MAX_LIMIT) {
    return { ok: false, message: `limit must be between 1 and ${MAX_LIMIT}.` };
  }
  return { ok: true, limit };
}

export type IncludeResult = { ok: true; includeCapsule: boolean } | { ok: false; message: string };

export function parseInclude(raw: string | null): IncludeResult {
  if (raw === null || raw.trim() === '') {
    return { ok: true, includeCapsule: false };
  }
  if (raw.trim() === 'capsule') {
    return { ok: true, includeCapsule: true };
  }
  return { ok: false, message: "include must be 'capsule' when present." };
}

export interface Page<T> {
  items: T[];
  /** The cursor for the next page, or null when this is the last one. */
  nextCursorId: unknown | null;
}

/**
 * One page out of limit+1 fetched rows. The extra row is the look-ahead that decides whether a
 * next page exists; it is never returned, with or without include=capsule.
 */
export function pageOf<T extends { _id: unknown }>(docs: T[], limit: number): Page<T> {
  const hasMore = docs.length > limit;
  const items = hasMore ? docs.slice(0, limit) : docs;
  const last = items[items.length - 1];
  return { items, nextCursorId: hasMore && last !== undefined ? last._id : null };
}

export interface ListFilterInput {
  q: string;
  tag: string;
  cursorId: string | null;
}

/** Visible capsules only, newest first, with the same filters the endpoint has always had. */
export function buildListFilter({ q, tag, cursorId }: ListFilterInput): Record<string, unknown> {
  const filter: Record<string, unknown> = { status: 'visible' };
  if (tag.length > 0) {
    filter.tags = tag;
  }
  if (cursorId !== null) {
    filter._id = { $lt: cursorId };
  }
  if (q.length > 0) {
    // $text is the only search we accept: no caller regex, no query operators from input.
    filter.$text = { $search: q };
  }
  return filter;
}
