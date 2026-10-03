import { NextResponse } from 'next/server';
import { Types } from 'mongoose';

import { guardOrigin, guardToken, notFound } from '@/lib/api-guards';
import { mutationCorsHeaders } from '@/lib/cors';
import { connectDb, isDuplicateKeyError } from '@/lib/db';
import { handleApiError } from '@/lib/http';
import { hashPrincipal, mutationKey } from '@/lib/ownership';
import { Capsule } from '@/models/Capsule';
import { MUTATION_WINDOW_MS, MutationReceipt } from '@/models/MutationReceipt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    const visible = await Capsule.findOne({ _id: id, status: 'visible' }).select('_id').lean();
    if (visible === null) {
      return notFound(request);
    }

    const principal = hashPrincipal(token.value);
    const key = mutationKey('install', id, principal);
    let counted = false;
    try {
      await MutationReceipt.create({
        key,
        capsuleId: id,
        operation: 'install',
        principalHash: principal,
        expiresAt: new Date(Date.now() + MUTATION_WINDOW_MS),
      });
      counted = true;
    } catch (e) {
      if (!isDuplicateKeyError(e)) {
        throw e;
      }
    }

    const updated = counted
      ? await Capsule.findOneAndUpdate({ _id: id, status: 'visible' }, { $inc: { installs: 1 } }, { new: true })
          .select('installs')
          .lean()
      : await Capsule.findOne({ _id: id }).select('installs').lean();

    return NextResponse.json(
      { ok: true, counted, installs: updated?.installs ?? 0 },
      { status: 200, headers: mutationCorsHeaders(request) },
    );
  } catch (e) {
    return handleApiError(e);
  }
}
