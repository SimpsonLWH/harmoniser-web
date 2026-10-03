import { NextResponse } from 'next/server';
import { Types } from 'mongoose';

import { guardOrigin, guardToken, notFound } from '@/lib/api-guards';
import { mutationCorsHeaders } from '@/lib/cors';
import { connectDb, isDuplicateKeyError } from '@/lib/db';
import { errorResponse, handleApiError, readJsonBody } from '@/lib/http';
import { hashPrincipal, mutationKey } from '@/lib/ownership';
import { Capsule } from '@/models/Capsule';
import { MUTATION_WINDOW_MS, MutationReceipt } from '@/models/MutationReceipt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REASONS = ['spam', 'unsafe', 'broken', 'other'];
const HIDE_AT_REPORTS = 3;
const MAX_REPORT_BODY_BYTES = 512;

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function OPTIONS(request: Request): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: mutationCorsHeaders(request) });
}

export async function POST(request: Request, ctx: Ctx): Promise<NextResponse> {
  const blocked = guardOrigin(request);
  if (blocked !== null) {
    return blocked;
  }
  try {
    const { id } = await ctx.params;
    if (!/^[0-9a-f]{24}$/i.test(id) || !Types.ObjectId.isValid(id)) {
      return notFound(request);
    }
    await connectDb();
    const token = guardToken(request);
    if (!token.ok) {
      return token.response;
    }
    const body = await readJsonBody(request, MAX_REPORT_BODY_BYTES);
    if (!body.ok) {
      return errorResponse(body.status, body.code, body.message, undefined, mutationCorsHeaders(request));
    }
    const reason =
      body.value !== null && typeof body.value === 'object' && 'reason' in body.value
        ? (body.value as { reason?: unknown }).reason
        : undefined;
    if (typeof reason !== 'string' || !REASONS.includes(reason)) {
      return errorResponse(400, 'invalid_reason', `reason must be one of: ${REASONS.join(', ')}.`, undefined, mutationCorsHeaders(request));
    }
    const visible = await Capsule.findOne({ _id: id, status: 'visible' }).select('_id').lean();
    if (visible === null) {
      return notFound(request);
    }

    const principal = hashPrincipal(token.value);
    const key = mutationKey('report', id, principal);
    let counted = false;
    try {
      await MutationReceipt.create({
        key,
        capsuleId: id,
        operation: 'report',
        principalHash: principal,
        expiresAt: new Date(Date.now() + MUTATION_WINDOW_MS),
      });
      counted = true;
    } catch (e) {
      if (!isDuplicateKeyError(e)) {
        throw e;
      }
    }

    let hidden = false;
    if (counted) {
      const updated = await Capsule.findOneAndUpdate(
        { _id: id, status: 'visible' },
        { $inc: { reports: 1 } },
        { new: true },
      )
        .select('reports')
        .lean();
      if (updated !== null && updated.reports >= HIDE_AT_REPORTS) {
        await Capsule.updateOne({ _id: id }, { $set: { status: 'hidden' } });
        hidden = true;
      }
    }
    return NextResponse.json({ ok: true, counted, hidden }, { status: 200, headers: mutationCorsHeaders(request) });
  } catch (e) {
    return handleApiError(e);
  }
}
