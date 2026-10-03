/** Tag and metadata normalisation shared by the publish route, the seed script and the UI. */

export const MAX_TAGS = 8;
export const MAX_TAG_LENGTH = 24;
export const MAX_NAME_LENGTH = 80;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_CAPSULE_BYTES = 8192;
export const MAX_ENVELOPE_BYTES = 12 * 1024;
export const MAX_QUERY_LENGTH = 100;

const TAG_RE = /^[a-z0-9][a-z0-9-]{0,23}$/;

export type TagResult = { ok: true; tags: string[] } | { ok: false; message: string };

export function normalizeTags(raw: unknown): TagResult {
  if (raw === undefined || raw === null) {
    return { ok: true, tags: [] };
  }
  if (!Array.isArray(raw)) {
    return { ok: false, message: 'tags must be an array of strings.' };
  }
  if (raw.length > MAX_TAGS) {
    return { ok: false, message: `At most ${MAX_TAGS} tags.` };
  }
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') {
      return { ok: false, message: 'Each tag must be a string.' };
    }
    const tag = item.trim().toLowerCase();
    if (tag.length === 0) {
      continue;
    }
    if (tag.length > MAX_TAG_LENGTH || !TAG_RE.test(tag)) {
      return {
        ok: false,
        message: `Tags are lowercase words of up to ${MAX_TAG_LENGTH} characters, with hyphens allowed.`,
      };
    }
    if (!out.includes(tag)) {
      out.push(tag);
    }
  }
  return { ok: true, tags: out };
}

export function normalizeDescription(raw: unknown): { ok: true; description: string } | { ok: false; message: string } {
  if (raw === undefined || raw === null) {
    return { ok: true, description: '' };
  }
  if (typeof raw !== 'string') {
    return { ok: false, message: 'description must be text.' };
  }
  const description = raw.trim();
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return { ok: false, message: `description must be at most ${MAX_DESCRIPTION_LENGTH} characters.` };
  }
  return { ok: true, description };
}
