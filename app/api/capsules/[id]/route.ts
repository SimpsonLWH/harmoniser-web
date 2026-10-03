import { NextResponse } from 'next/server';
import { Types } from 'mongoose';

import { guardOrigin, guardToken, notFound } from '@/lib/api-guards';
import { mutationCorsHeaders, readCorsHeaders } from '@/lib/cors';
import { connectDb } from '@/lib/db';
import { toDetail } from '@/lib/dto';
import { errorResponse, handleApiError, noStore } from '@/lib/http';
import { tokenMatches } from '@/lib/ownership';
import { Capsule } from '@/models/Capsule';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

function validId(id: string): boolean {
  return /^[0-9a-f]{24}$/i.test(id) && Types.ObjectId.isValid(id);
}

export async function OPTIONS(request: Request): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: mutationCorsHeaders(request) });
}

export async function GET(request: Request, ctx: Ctx): Promise<NextResponse> {
  try {
    const { id } = await ctx.params;
    if (!validId(id)) {
      return notFound(request);
    }
    await connectDb();
    const doc = await Capsule.findOne({ _id: id, status: 'visible' }).lean();
    if (doc === null) {
      return notFound(request);
    }
    const etag = `"${doc.contentHash}"`;
    const headers = noStore({ ...readCorsHeaders(), ETag: etag });
    if (request.headers.get('if-none-match') === etag) {
      return new NextResponse(null, { status: 304, headers });
    }
    return NextResponse.json(toDetail(doc), { status: 200, headers });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(request: Request, ctx: Ctx): Promise<NextResponse> {
  const blocked = guardOrigin(request);
  if (blocked !== null) {
    return blocked;
  }
  try {
    const { id } = await ctx.params;
    if (!validId(id)) {
      return notFound(request);
    }
    await connectDb();
    const token = guardToken(request);
    if (!token.ok) {
      return token.response;
    }
    const doc = await Capsule.findOne({ _id: id, status: 'visible' }).select('+ownerTokenHash').lean();
    if (doc === null) {
      return notFound(request);
    }
    if (!tokenMatches(token.value, doc.ownerTokenHash)) {
      return errorResponse(403, 'forbidden', 'This token does not own that capsule.', undefined, mutationCorsHeaders(request));
    }
    // Soft delete: the public payload and the owner hash go away, the audit row stays.
    await Capsule.updateOne(
      { _id: id },
      {
        $set: { status: 'deleted' },
        $unset: { capsule: 1, description: 1, tags: 1, ownerTokenHash: 1 },
      },
    );
    return NextResponse.json({ ok: true, id }, { status: 200, headers: mutationCorsHeaders(request) });
  } catch (e) {
    return handleApiError(e);
  }
}
