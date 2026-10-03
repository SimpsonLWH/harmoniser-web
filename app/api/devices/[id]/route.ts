import type { NextResponse } from 'next/server';

import { preflight, unpair } from '@/lib/devices/routes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export const OPTIONS = preflight;

/** Unpair: 204. */
export async function DELETE(request: Request, ctx: Ctx): Promise<NextResponse> {
  return unpair(request, (await ctx.params).id);
}
