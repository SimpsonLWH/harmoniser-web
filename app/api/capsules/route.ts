import { NextResponse } from 'next/server';

import { guardIp, guardOrigin, guardToken } from '@/lib/api-guards';
import { canonicalJson, contentHash, utf8Bytes } from '@/lib/canonical';
import { connectDb, isDuplicateKeyError } from '@/lib/db';
import { readCorsHeaders, mutationCorsHeaders } from '@/lib/cors';
import { toSummary, toSummaryWithCapsule } from '@/lib/dto';
import { VALIDATOR_REVISION } from '@/lib/env';
import { errorResponse, handleApiError, noStore, readJsonBody } from '@/lib/http';
import { encodeCursor, parseCursor } from '@/lib/cursor';
import { buildListFilter, pageOf, parseInclude, parseLimit } from '@/lib/list-query';
import { hashToken } from '@/lib/ownership';
import { consumePublishLimit } from '@/lib/rate-limit';
import {
  MAX_CAPSULE_BYTES,
  MAX_ENVELOPE_BYTES,
  MAX_NAME_LENGTH,
  MAX_QUERY_LENGTH,
  normalizeDescription,
  normalizeTags,
} from '@/lib/tags';
import { validateCapsuleObject } from '@/lib/validator';
import { Capsule } from '@/models/Capsule';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ENVELOPE_KEYS = ['capsule', 'name', 'description', 'tags'];
export async function OPTIONS(request: Request): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: mutationCorsHeaders(request) });
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await connectDb();
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').trim();
    if (q.length > MAX_QUERY_LENGTH) {
      return errorResponse(400, 'invalid_query', `q must be at most ${MAX_QUERY_LENGTH} characters.`, undefined, readCorsHeaders());
    }
    const tagRaw = url.searchParams.get('tag');
    const tag = tagRaw === null ? '' : tagRaw.trim().toLowerCase();
    if (tag.length > 0 && !/^[a-z0-9][a-z0-9-]{0,23}$/.test(tag)) {
      return errorResponse(400, 'invalid_query', 'tag must be a lowercase word.', undefined, readCorsHeaders());
    }
    const limitResult = parseLimit(url.searchParams.get('limit'));
    if (!limitResult.ok) {
      return errorResponse(400, 'invalid_query', limitResult.message, undefined, readCorsHeaders());
    }
    const limit = limitResult.limit;
    const includeResult = parseInclude(url.searchParams.get('include'));
    if (!includeResult.ok) {
      return errorResponse(400, 'invalid_query', includeResult.message, undefined, readCorsHeaders());
    }
    const cursor = parseCursor(url.searchParams.get('cursor'));
    if (!cursor.ok) {
      return errorResponse(400, 'invalid_query', cursor.message, undefined, readCorsHeaders());
    }

    const filter = buildListFilter({ q, tag, cursorId: cursor.id });
    const docs = await Capsule.find(filter).sort({ _id: -1 }).limit(limit + 1).lean();
    const page = pageOf(docs, limit);
    const mapper = includeResult.includeCapsule ? toSummaryWithCapsule : toSummary;
    return NextResponse.json(
      {
        capsules: page.items.map(mapper),
        nextCursor: page.nextCursorId !== null ? encodeCursor(page.nextCursorId) : null,
      },
      { status: 200, headers: noStore(readCorsHeaders()) },
    );
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const blocked = guardOrigin(request);
  if (blocked !== null) {
    return blocked;
  }
  try {
    await connectDb();
    const ip = guardIp(request);
    if (!ip.ok) {
      return ip.response;
    }
    const rate = await consumePublishLimit('publish', ip.value);
    if (!rate.allowed) {
      return errorResponse(
        429,
        'rate_limited',
        'Too many publishes from this address; try again later.',
        undefined,
        { ...mutationCorsHeaders(request), 'Retry-After': String(rate.retryAfterSeconds) },
      );
    }
    const token = guardToken(request);
    if (!token.ok) {
      return token.response;
    }
    const body = await readJsonBody(request, MAX_ENVELOPE_BYTES);
    if (!body.ok) {
      return errorResponse(body.status, body.code, body.message, undefined, mutationCorsHeaders(request));
    }
    if (typeof body.value !== 'object' || body.value === null || Array.isArray(body.value)) {
      return errorResponse(400, 'invalid_body', 'Send a JSON object with a "capsule" field.', undefined, mutationCorsHeaders(request));
    }
    const envelope = body.value as Record<string, unknown>;
    for (const key of Object.keys(envelope)) {
      if (!ENVELOPE_KEYS.includes(key)) {
        return errorResponse(400, 'invalid_body', `Unknown field "${key}".`, undefined, mutationCorsHeaders(request));
      }
    }
    if (!('capsule' in envelope)) {
      return errorResponse(400, 'invalid_body', 'The "capsule" field is required.', undefined, mutationCorsHeaders(request));
    }

    const checked = validateCapsuleObject(envelope.capsule);
    if (!checked.ok || checked.capsule === undefined) {
      return errorResponse(400, 'invalid_capsule', 'The capsule did not pass validation.', checked.errors.slice(0, 20), mutationCorsHeaders(request));
    }
    const capsule = checked.capsule;
    const canonical = canonicalJson(capsule);
    if (utf8Bytes(canonical) > MAX_CAPSULE_BYTES) {
      return errorResponse(413, 'capsule_too_large', `The capsule is larger than ${MAX_CAPSULE_BYTES} UTF-8 bytes.`, undefined, mutationCorsHeaders(request));
    }

    const rawName = envelope.name;
    if (rawName !== undefined) {
      if (typeof rawName !== 'string' || rawName.trim() !== capsule.name) {
        return errorResponse(400, 'invalid_body', 'name must match the validated capsule name.', undefined, mutationCorsHeaders(request));
      }
      if (rawName.trim().length > MAX_NAME_LENGTH) {
        return errorResponse(400, 'invalid_body', `name must be at most ${MAX_NAME_LENGTH} characters.`, undefined, mutationCorsHeaders(request));
      }
    }
    const description = normalizeDescription(envelope.description);
    if (!description.ok) {
      return errorResponse(400, 'invalid_body', description.message, undefined, mutationCorsHeaders(request));
    }
    const tags = normalizeTags(envelope.tags);
    if (!tags.ok) {
      return errorResponse(400, 'invalid_body', tags.message, undefined, mutationCorsHeaders(request));
    }

    const hash = contentHash(capsule);
    try {
      const doc = await Capsule.create({
        capsule,
        name: capsule.name,
        description: description.description,
        tags: tags.tags,
        schemaVersion: capsule.schemaVersion === 1 ? 1 : 0,
        status: 'visible',
        contentHash: hash,
        ownerTokenHash: hashToken(token.value),
        validatorRevision: VALIDATOR_REVISION,
      });
      return NextResponse.json(
        { id: String(doc._id), contentHash: hash },
        { status: 201, headers: mutationCorsHeaders(request) },
      );
    } catch (e) {
      if (isDuplicateKeyError(e)) {
        const existing = await Capsule.findOne({ contentHash: hash, status: 'visible' }).select('_id name').lean();
        return errorResponse(
          409,
          'duplicate',
          'This capsule has already been published.',
          existing === null ? undefined : { id: String(existing._id), name: existing.name },
          mutationCorsHeaders(request),
        );
      }
      throw e;
    }
  } catch (e) {
    return handleApiError(e);
  }
}
