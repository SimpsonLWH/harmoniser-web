import type { NextResponse } from 'next/server';

import { pollCapsule, preflight, putCapsule } from '@/lib/devices/routes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export const OPTIONS = preflight;

/** The device fetches its capsule (device token). */
export async function GET(request: Request, ctx: Ctx): Promise<NextResponse> {
  return pollCapsule(request, (await ctx.params).id);
}

/** The user sends a capsule (X-Harmoniser-Token): 200 {"version"}. */
export async function PUT(request: Request, ctx: Ctx): Promise<NextResponse> {
  return putCapsule(request, (await ctx.params).id);
}
