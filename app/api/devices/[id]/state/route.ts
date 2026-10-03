import type { NextResponse } from 'next/server';

import { getState, preflight, reportState } from '@/lib/devices/routes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export const OPTIONS = preflight;

/** The device reports its state (device token): 204. */
export async function POST(request: Request, ctx: Ctx): Promise<NextResponse> {
  return reportState(request, (await ctx.params).id);
}

/** The user reads the last report (X-Harmoniser-Token). */
export async function GET(request: Request, ctx: Ctx): Promise<NextResponse> {
  return getState(request, (await ctx.params).id);
}
